from datetime import date
from decimal import Decimal

from django.test import TestCase

from payments.models import Registration, Transaction, Trip


class TripModelTest(TestCase):
    def setUp(self):
        self.trip = Trip.objects.create(
            title='Museum Visit',
            description='A day at the museum',
            destination='Te Papa Museum',
            date=date(2026, 6, 15),
            cost=Decimal('45.00'),
            school_id='SCH001',
            activity_id='ACT001',
            capacity=3,
        )

    def test_str(self):
        self.assertEqual(str(self.trip), 'Museum Visit')

    def test_spots_remaining_no_registrations(self):
        self.assertEqual(self.trip.spots_remaining, 3)

    def test_spots_remaining_with_confirmed(self):
        Registration.objects.create(
            trip=self.trip,
            student_name='Alice',
            parent_name='Bob',
            parent_email='bob@example.com',
            status='confirmed',
        )
        self.assertEqual(self.trip.spots_remaining, 2)

    def test_spots_remaining_with_pending(self):
        Registration.objects.create(
            trip=self.trip,
            student_name='Alice',
            parent_name='Bob',
            parent_email='bob@example.com',
            status='pending',
        )
        self.assertEqual(self.trip.spots_remaining, 2)

    def test_spots_remaining_ignores_failed_and_cancelled(self):
        Registration.objects.create(
            trip=self.trip, student_name='A', parent_name='B',
            parent_email='a@b.com', status='failed',
        )
        Registration.objects.create(
            trip=self.trip, student_name='C', parent_name='D',
            parent_email='c@d.com', status='cancelled',
        )
        self.assertEqual(self.trip.spots_remaining, 3)

    def test_is_full_false(self):
        self.assertFalse(self.trip.is_full)

    def test_is_full_true(self):
        for i in range(3):
            Registration.objects.create(
                trip=self.trip, student_name=f'S{i}', parent_name=f'P{i}',
                parent_email=f's{i}@example.com', status='confirmed',
            )
        self.assertTrue(self.trip.is_full)

    def test_ordering_by_date(self):
        trip2 = Trip.objects.create(
            title='Earlier Trip', description='x', destination='x',
            date=date(2026, 1, 1), cost=Decimal('10.00'),
            school_id='SCH001', activity_id='ACT002', capacity=30,
        )
        trips = list(Trip.objects.all())
        self.assertEqual(trips[0], trip2)
        self.assertEqual(trips[1], self.trip)


class RegistrationModelTest(TestCase):
    def setUp(self):
        self.trip = Trip.objects.create(
            title='Zoo Trip', description='x', destination='Zoo',
            date=date(2026, 7, 1), cost=Decimal('30.00'),
            school_id='SCH001', activity_id='ACT001', capacity=30,
        )
        self.registration = Registration.objects.create(
            trip=self.trip,
            student_name='Emma Wilson',
            parent_name='Sarah Wilson',
            parent_email='sarah@example.com',
        )

    def test_str(self):
        self.assertEqual(str(self.registration), 'Emma Wilson - Zoo Trip')

    def test_default_status_is_pending(self):
        self.assertEqual(self.registration.status, 'pending')

    def test_default_phone_is_blank(self):
        self.assertEqual(self.registration.parent_phone, '')


class TransactionModelTest(TestCase):
    def setUp(self):
        trip = Trip.objects.create(
            title='Beach Trip', description='x', destination='Beach',
            date=date(2026, 8, 1), cost=Decimal('25.00'),
            school_id='SCH001', activity_id='ACT001', capacity=30,
        )
        registration = Registration.objects.create(
            trip=trip, student_name='Tom', parent_name='Jane',
            parent_email='jane@example.com',
        )
        self.transaction = Transaction.objects.create(
            registration=registration,
            amount=Decimal('25.00'),
            status='success',
            transaction_ref='TX-123-ABC',
            card_last_four='1111',
        )

    def test_str(self):
        self.assertEqual(str(self.transaction), 'TX TX-123-ABC - success')

    def test_default_status_is_pending(self):
        trip = Trip.objects.create(
            title='T2', description='x', destination='x',
            date=date(2026, 9, 1), cost=Decimal('10.00'),
            school_id='SCH001', activity_id='ACT002', capacity=30,
        )
        reg = Registration.objects.create(
            trip=trip, student_name='X', parent_name='Y',
            parent_email='x@y.com',
        )
        tx = Transaction.objects.create(
            registration=reg, amount=Decimal('10.00'),
            card_last_four='2222',
        )
        self.assertEqual(tx.status, 'pending')
