"""
LegacyPaymentAdapter — wraps the provided LegacyPaymentProcessor behind the
PaymentGateway interface (Adapter pattern).
"""

from .legacy_payment import LegacyPaymentProcessor
from .payment_gateway import PaymentGateway


class LegacyPaymentAdapter(PaymentGateway):
    def __init__(self):
        self._processor = LegacyPaymentProcessor()

    def process(self, payment_data: dict) -> dict:
        return self._processor.process_payment(payment_data)
