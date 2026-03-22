"""
PaymentService — orchestrates the payment flow (SRP: orchestration only).
Dependencies are injected for testability.
"""

import logging
from decimal import Decimal

from django.db import transaction as db_transaction

from .legacy_adapter import LegacyPaymentAdapter
from .models import AccountCredit
from .registration_updater import RegistrationUpdater
from .transaction_recorder import TransactionRecorder

logger = logging.getLogger('payments')


class PaymentService:
    def __init__(self, gateway=None, recorder=None, updater=None):
        self.gateway = gateway or LegacyPaymentAdapter()
        self.recorder = recorder or TransactionRecorder()
        self.updater = updater or RegistrationUpdater()

    def process_payment(self, registration, card_details, use_credit=False, user=None):
        trip = registration.trip
        amount_due = trip.cost
        credit_applied = Decimal('0.00')

        with db_transaction.atomic():
            if use_credit and user:
                balance = AccountCredit.balance_for_user(user)
                credit_applied = min(balance, amount_due)
                amount_due = amount_due - credit_applied

            if amount_due > 0:
                transaction_obj, success = self._charge_card(
                    registration, card_details, amount_due,
                )
            else:
                transaction_obj = self._record_credit_only_transaction(
                    registration, trip.cost,
                )
                success = True

            if success and credit_applied > 0:
                AccountCredit.objects.create(
                    user=user,
                    amount=-credit_applied,
                    reason='payment',
                    registration=registration,
                    note=f"Applied to {trip.title}",
                )

            self.updater.update(registration, success)

        return transaction_obj, success

    def _charge_card(self, registration, card_details, amount):
        trip = registration.trip

        payment_data = {
            'card_number': card_details.card_number,
            'expiry_date': card_details.expiry_date,
            'cvv': card_details.cvv,
            'amount': float(amount),
            'school_id': trip.school_id,
            'activity_id': trip.activity_id,
        }

        logger.info(
            'Processing payment for registration %s, trip %s, amount %s',
            registration.id, trip.id, amount,
        )

        gateway_result = self.gateway.process(payment_data)

        transaction_obj = self.recorder.record(
            registration=registration,
            amount=amount,
            card_last_four=card_details.last_four,
            gateway_result=gateway_result,
        )

        if gateway_result['success']:
            logger.info(
                'Payment successful: ref=%s, registration=%s',
                transaction_obj.transaction_ref, registration.id,
            )
        else:
            logger.warning(
                'Payment failed: registration=%s, error=%s',
                registration.id, gateway_result.get('error_message'),
            )

        return transaction_obj, gateway_result['success']

    def _record_credit_only_transaction(self, registration, amount):
        from django.utils import timezone
        from .models import Transaction

        return Transaction.objects.create(
            registration=registration,
            amount=Decimal('0.00'),
            status='success',
            transaction_ref=f"CREDIT-{registration.id.hex[:8].upper()}",
            card_last_four='0000',
            processed_at=timezone.now(),
        )
