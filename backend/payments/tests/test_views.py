from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import Child
from payments.models import Registration, Transaction, Trip
from payments.payment_gateway import ProcessResult


def make_trip(**overrides):
    defaults = dict(
        title='Museum Visit', description='A day at the museum',
        destination='Te Papa', date=date(2026, 6, 15),
        cost=Decimal('45.00'), school_id='SCH001',
        activity_id='ACT001', capacity=30,
    )
    defaults.update(overrides)
    return Trip.objects.create(**defaults)


class TripListViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_list_trips(self):
        make_trip()
        make_trip(title='Beach Trip', activity_id='ACT002')
        response = self.client.get('/api/trips/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_empty_list(self):
        response = self.client.get('/api/trips/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])


class TripDetailViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_trip(self):
        trip = make_trip()
        response = self.client.get(f'/api/trips/{trip.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Museum Visit')

    def test_404_for_nonexistent(self):
        response = self.client.get('/api/trips/00000000-0000-0000-0000-000000000000/')
        self.assertEqual(response.status_code, 404)


class RegistrationCreateViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.trip = make_trip()

    def test_create_registration(self):
        data = {
            'trip': str(self.trip.id),
            'student_name': 'Emma Wilson',
            'parent_name': 'Sarah Wilson',
            'parent_email': 'sarah@example.com',
        }
        response = self.client.post('/api/registrations/', data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['student_name'], 'Emma Wilson')
        self.assertEqual(response.data['status'], 'pending')

    def test_missing_required_fields(self):
        response = self.client.post('/api/registrations/', {}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_rejects_full_trip(self):
        trip = make_trip(capacity=1, activity_id='ACT_FULL')
        Registration.objects.create(
            trip=trip, student_name='First', parent_name='P',
            parent_email='a@b.com', status='confirmed',
        )
        data = {
            'trip': str(trip.id),
            'student_name': 'Late',
            'parent_name': 'Parent',
            'parent_email': 'late@example.com',
        }
        response = self.client.post('/api/registrations/', data, format='json')
        self.assertEqual(response.status_code, 400)


class RegistrationDetailViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_registration_with_nested_trip(self):
        trip = make_trip()
        reg = Registration.objects.create(
            trip=trip, student_name='Emma', parent_name='Sarah',
            parent_email='sarah@example.com',
        )
        response = self.client.get(f'/api/registrations/{reg.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data['trip'], dict)
        self.assertEqual(response.data['trip']['title'], 'Museum Visit')

    def test_404_for_nonexistent(self):
        response = self.client.get('/api/registrations/00000000-0000-0000-0000-000000000000/')
        self.assertEqual(response.status_code, 404)


FAKE_GATEWAY_SUCCESS = ProcessResult(
    success=True,
    transaction_ref='TX-TEST-123',
    error_message=None,
    amount_charged=45.00,
)

FAKE_GATEWAY_FAILURE = ProcessResult(
    success=False,
    transaction_ref=None,
    error_message='Declined by issuing bank',
    amount_charged=None,
)


class PaymentViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.trip = make_trip()
        self.registration = Registration.objects.create(
            trip=self.trip, student_name='Emma', parent_name='Sarah',
            parent_email='sarah@example.com',
        )

    @patch('payments.services.LegacyPaymentAdapter.process', return_value=FAKE_GATEWAY_SUCCESS)
    def test_successful_payment(self, mock_process):
        data = {
            'registration_id': str(self.registration.id),
            'card_number': '4111111111111111',
            'expiry_date': '12/28',
            'cvv': '123',
        }
        response = self.client.post('/api/payments/', data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['transaction']['transaction_ref'], 'TX-TEST-123')
        self.assertEqual(response.data['registration']['status'], 'confirmed')

    @patch('payments.services.LegacyPaymentAdapter.process', return_value=FAKE_GATEWAY_FAILURE)
    def test_failed_payment(self, mock_process):
        data = {
            'registration_id': str(self.registration.id),
            'card_number': '4111111111111111',
            'expiry_date': '12/28',
            'cvv': '123',
        }
        response = self.client.post('/api/payments/', data, format='json')
        self.assertEqual(response.status_code, 402)
        self.assertFalse(response.data['success'])
        self.assertIn('Declined', response.data['error'])

    def test_invalid_card_rejected(self):
        data = {
            'registration_id': str(self.registration.id),
            'card_number': '1234567890123456',
            'expiry_date': '12/28',
            'cvv': '123',
        }
        response = self.client.post('/api/payments/', data, format='json')
        self.assertEqual(response.status_code, 400)

    def test_nonexistent_registration_rejected(self):
        data = {
            'registration_id': '00000000-0000-0000-0000-000000000000',
            'card_number': '4111111111111111',
            'expiry_date': '12/28',
            'cvv': '123',
        }
        response = self.client.post('/api/payments/', data, format='json')
        self.assertEqual(response.status_code, 400)

    @patch('payments.services.LegacyPaymentAdapter.process', return_value=FAKE_GATEWAY_SUCCESS)
    def test_duplicate_payment_rejected(self, mock_process):
        data = {
            'registration_id': str(self.registration.id),
            'card_number': '4111111111111111',
            'expiry_date': '12/28',
            'cvv': '123',
        }
        self.client.post('/api/payments/', data, format='json')
        # Second payment for same registration should be rejected
        response = self.client.post('/api/payments/', data, format='json')
        self.assertEqual(response.status_code, 400)


class AuthenticatedRegistrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.trip = make_trip()
        self.user = User.objects.create_user(
            username='sarah@example.com',
            email='sarah@example.com',
            password='SecurePass123!',
            first_name='Sarah',
            last_name='Wilson',
        )
        self.token = Token.objects.create(user=self.user)
        self.child = Child.objects.create(parent=self.user, name='Emma Wilson', grade='Year 5')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_register_with_child_id(self):
        response = self.client.post('/api/registrations/', {
            'trip': str(self.trip.id),
            'child_id': str(self.child.id),
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['student_name'], 'Emma Wilson')

        reg = Registration.objects.get(id=response.data['id'])
        self.assertEqual(reg.parent, self.user)
        self.assertEqual(reg.child, self.child)
        self.assertEqual(reg.parent_name, 'Sarah Wilson')
        self.assertEqual(reg.parent_email, 'sarah@example.com')

    def test_register_with_invalid_child_id(self):
        other_user = User.objects.create_user(
            username='other@example.com', email='other@example.com', password='pass',
        )
        other_child = Child.objects.create(parent=other_user, name='Other Child')
        response = self.client.post('/api/registrations/', {
            'trip': str(self.trip.id),
            'child_id': str(other_child.id),
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_anonymous_registration_still_works(self):
        self.client.credentials()
        response = self.client.post('/api/registrations/', {
            'trip': str(self.trip.id),
            'student_name': 'Manual Child',
            'parent_name': 'Manual Parent',
            'parent_email': 'manual@example.com',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['student_name'], 'Manual Child')
        reg = Registration.objects.get(id=response.data['id'])
        self.assertIsNone(reg.parent)
        self.assertIsNone(reg.child)


class DashboardViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='sarah@example.com',
            email='sarah@example.com',
            password='SecurePass123!',
            first_name='Sarah',
            last_name='Wilson',
        )
        self.token = Token.objects.create(user=self.user)
        self.trip = make_trip()
        self.child = Child.objects.create(parent=self.user, name='Emma Wilson')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_dashboard_returns_own_registrations(self):
        reg = Registration.objects.create(
            trip=self.trip, parent=self.user, child=self.child,
            student_name='Emma Wilson', parent_name='Sarah Wilson',
            parent_email='sarah@example.com', status='confirmed',
        )
        Transaction.objects.create(
            registration=reg, amount=self.trip.cost,
            status='success', transaction_ref='TX-123',
            card_last_four='1111',
        )

        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['student_name'], 'Emma Wilson')
        self.assertEqual(response.data[0]['child_name'], 'Emma Wilson')
        self.assertEqual(response.data[0]['status'], 'confirmed')
        self.assertEqual(response.data[0]['payment_status'], 'success')
        self.assertEqual(response.data[0]['trip']['title'], 'Museum Visit')

    def test_dashboard_excludes_other_users(self):
        other_user = User.objects.create_user(
            username='other@example.com', email='other@example.com', password='pass',
        )
        Registration.objects.create(
            trip=self.trip, parent=other_user,
            student_name='Other Child', parent_name='Other Parent',
            parent_email='other@example.com',
        )

        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

    def test_dashboard_unauthenticated(self):
        self.client.credentials()
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, 401)

    def test_dashboard_no_registrations(self):
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)
