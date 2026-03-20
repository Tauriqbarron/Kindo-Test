from datetime import date
from decimal import Decimal

from django.test import TestCase

from payments.card_details import CardDetails
from payments.models import Registration, Transaction, Trip
from payments.payment_gateway import PaymentGateway
from payments.services import PaymentService


class FakePaymentGateway(PaymentGateway):
    """Test double — returns a canned response without touching the legacy processor."""

    def __init__(self, success=True, transaction_ref='TX-FAKE-123'):
        self._success = success
        self._transaction_ref = transaction_ref

    def process(self, payment_data: dict) -> dict:
        if self._success:
            return {
                'success': True,
                'transaction_ref': self._transaction_ref,
                'error_message': None,
                'amount_charged': payment_data['amount'],
            }
        return {
            'success': False,
            'transaction_ref': None,
            'error_message': 'Declined by test gateway',
            'amount_charged': None,
        }


def make_registration():
    trip = Trip.objects.create(
        title='Zoo Trip', description='x', destination='Zoo',
        date=date(2026, 7, 1), cost=Decimal('30.00'),
        school_id='SCH001', activity_id='ACT001', capacity=30,
    )
    return Registration.objects.create(
        trip=trip, student_name='Emma', parent_name='Sarah',
        parent_email='sarah@example.com',
    )


class PaymentServiceSuccessTest(TestCase):
    def test_successful_payment_creates_transaction(self):
        registration = make_registration()
        card = CardDetails('4111111111111111', '12/28', '123')
        gateway = FakePaymentGateway(success=True)

        service = PaymentService(gateway=gateway)
        transaction, success = service.process_payment(registration, card)

        self.assertTrue(success)
        self.assertEqual(transaction.status, 'success')
        self.assertEqual(transaction.transaction_ref, 'TX-FAKE-123')
        self.assertEqual(transaction.card_last_four, '1111')
        self.assertEqual(transaction.amount, Decimal('30.00'))
        self.assertIsNotNone(transaction.processed_at)

    def test_successful_payment_confirms_registration(self):
        registration = make_registration()
        card = CardDetails('4111111111111111', '12/28', '123')
        gateway = FakePaymentGateway(success=True)

        service = PaymentService(gateway=gateway)
        service.process_payment(registration, card)

        registration.refresh_from_db()
        self.assertEqual(registration.status, 'confirmed')

    def test_transaction_persisted_to_db(self):
        registration = make_registration()
        card = CardDetails('4111111111111111', '12/28', '123')
        gateway = FakePaymentGateway(success=True)

        service = PaymentService(gateway=gateway)
        service.process_payment(registration, card)

        self.assertEqual(Transaction.objects.count(), 1)


class PaymentServiceFailureTest(TestCase):
    def test_failed_payment_creates_failed_transaction(self):
        registration = make_registration()
        card = CardDetails('4111111111111111', '12/28', '123')
        gateway = FakePaymentGateway(success=False)

        service = PaymentService(gateway=gateway)
        transaction, success = service.process_payment(registration, card)

        self.assertFalse(success)
        self.assertEqual(transaction.status, 'failed')
        self.assertEqual(transaction.error_message, 'Declined by test gateway')

    def test_failed_payment_marks_registration_failed(self):
        registration = make_registration()
        card = CardDetails('4111111111111111', '12/28', '123')
        gateway = FakePaymentGateway(success=False)

        service = PaymentService(gateway=gateway)
        service.process_payment(registration, card)

        registration.refresh_from_db()
        self.assertEqual(registration.status, 'failed')
