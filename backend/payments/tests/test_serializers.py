from datetime import date
from decimal import Decimal

from django.test import TestCase

from payments.models import Registration, Trip
from payments.serializers import (
    PaymentRequestSerializer,
    RegistrationSerializer,
    TripSerializer,
)


def make_trip(**overrides):
    defaults = dict(
        title='Museum Visit', description='A day at the museum',
        destination='Te Papa', date=date(2026, 6, 15),
        cost=Decimal('45.00'), school_id='SCH001',
        activity_id='ACT001', capacity=30,
    )
    defaults.update(overrides)
    return Trip.objects.create(**defaults)


class TripSerializerTest(TestCase):
    def test_includes_computed_fields(self):
        trip = make_trip()
        data = TripSerializer(trip).data
        self.assertIn('spots_remaining', data)
        self.assertIn('is_full', data)
        self.assertEqual(data['spots_remaining'], 30)
        self.assertFalse(data['is_full'])


class RegistrationSerializerTest(TestCase):
    def setUp(self):
        self.trip = make_trip()

    def test_valid_registration(self):
        data = {
            'trip': str(self.trip.id),
            'student_name': 'Emma Wilson',
            'parent_name': 'Sarah Wilson',
            'parent_email': 'sarah@example.com',
            'parent_phone': '021-555-0123',
        }
        serializer = RegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_required_fields(self):
        serializer = RegistrationSerializer(data={})
        self.assertFalse(serializer.is_valid())
        for field in ('trip', 'student_name', 'parent_name', 'parent_email'):
            self.assertIn(field, serializer.errors)

    def test_rejects_full_trip(self):
        trip = make_trip(capacity=1, activity_id='ACT_FULL')
        Registration.objects.create(
            trip=trip, student_name='X', parent_name='Y',
            parent_email='x@y.com', status='confirmed',
        )
        data = {
            'trip': str(trip.id),
            'student_name': 'Late',
            'parent_name': 'Parent',
            'parent_email': 'late@example.com',
        }
        serializer = RegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('trip', serializer.errors)


class PaymentRequestSerializerTest(TestCase):
    def setUp(self):
        self.trip = make_trip()
        self.registration = Registration.objects.create(
            trip=self.trip, student_name='Emma', parent_name='Sarah',
            parent_email='sarah@example.com',
        )

    def test_valid_payment(self):
        data = {
            'registration_id': str(self.registration.id),
            'card_number': '4111111111111111',
            'expiry_date': '12/28',
            'cvv': '123',
        }
        serializer = PaymentRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIn('card_details', serializer.validated_data)
        self.assertIn('registration', serializer.validated_data)

    def test_invalid_card_number(self):
        data = {
            'registration_id': str(self.registration.id),
            'card_number': '1234567890123456',
            'expiry_date': '12/28',
            'cvv': '123',
        }
        serializer = PaymentRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('card', serializer.errors)

    def test_nonexistent_registration(self):
        data = {
            'registration_id': '00000000-0000-0000-0000-000000000000',
            'card_number': '4111111111111111',
            'expiry_date': '12/28',
            'cvv': '123',
        }
        serializer = PaymentRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('registration_id', serializer.errors)

    def test_already_confirmed_registration(self):
        self.registration.status = 'confirmed'
        self.registration.save()
        data = {
            'registration_id': str(self.registration.id),
            'card_number': '4111111111111111',
            'expiry_date': '12/28',
            'cvv': '123',
        }
        serializer = PaymentRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('registration_id', serializer.errors)
