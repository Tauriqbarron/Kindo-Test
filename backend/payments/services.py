"""
PaymentService — orchestrates the payment flow (SRP: orchestration only).
Dependencies are injected for testability.
"""

import logging

from .legacy_adapter import LegacyPaymentAdapter
from .registration_updater import RegistrationUpdater
from .transaction_recorder import TransactionRecorder

logger = logging.getLogger('payments')


class PaymentService:
    def __init__(self, gateway=None, recorder=None, updater=None):
        self.gateway = gateway or LegacyPaymentAdapter()
        self.recorder = recorder or TransactionRecorder()
        self.updater = updater or RegistrationUpdater()

    def process_payment(self, registration, card_details):
        trip = registration.trip

        payment_data = {
            'card_number': card_details.card_number,
            'expiry_date': card_details.expiry_date,
            'cvv': card_details.cvv,
            'amount': float(trip.cost),
            'school_id': trip.school_id,
            'activity_id': trip.activity_id,
        }

        logger.info(
            'Processing payment for registration %s, trip %s, amount %s',
            registration.id, trip.id, trip.cost,
        )

        gateway_result = self.gateway.process(payment_data)

        transaction = self.recorder.record(
            registration=registration,
            amount=trip.cost,
            card_last_four=card_details.last_four,
            gateway_result=gateway_result,
        )

        self.updater.update(registration, gateway_result['success'])

        if gateway_result['success']:
            logger.info(
                'Payment successful: ref=%s, registration=%s',
                transaction.transaction_ref, registration.id,
            )
        else:
            logger.warning(
                'Payment failed: registration=%s, error=%s',
                registration.id, gateway_result.get('error_message'),
            )

        return transaction, gateway_result['success']
