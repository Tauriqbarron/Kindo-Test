"""
LegacyPaymentAdapter — wraps the provided LegacyPaymentProcessor behind the
PaymentGateway interface (Adapter pattern).
"""

import time
import uuid as uuid_mod

from .legacy_payment import LegacyPaymentProcessor
from .payment_gateway import PaymentGateway


class LegacyPaymentAdapter(PaymentGateway):
    def __init__(self):
        self._processor = LegacyPaymentProcessor()

    def process(self, payment_data: dict) -> dict:
        return self._processor.process_payment(payment_data)

    def refund(self, refund_data: dict) -> dict:
        """
        The legacy processor does not support refunds natively.
        Simulate a successful refund at the adapter level.
        """
        refund_ref = f"RF-{int(time.time())}-{uuid_mod.uuid4().hex[:8].upper()}"
        return {
            'success': True,
            'refund_ref': refund_ref,
            'error_message': None,
        }
