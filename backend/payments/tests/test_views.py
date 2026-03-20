from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from payments.models import Registration, Trip


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


FAKE_GATEWAY_SUCCESS = {
    'success': True,
    'transaction_ref': 'TX-TEST-123',
    'error_message': None,
    'amount_charged': 45.00,
}

FAKE_GATEWAY_FAILURE = {
    'success': False,
    'transaction_ref': None,
    'error_message': 'Declined by issuing bank',
    'amount_charged': None,
}


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
