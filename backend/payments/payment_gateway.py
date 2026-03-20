"""
PaymentGateway ABC — decouples business logic from payment infrastructure (DIP).
"""

from abc import ABC, abstractmethod


class PaymentGateway(ABC):
    @abstractmethod
    def process(self, payment_data: dict) -> dict:
        """
        Process a payment.

        Args:
            payment_data: dict with card_number, expiry_date, cvv, amount,
                          school_id, activity_id

        Returns:
            dict with keys: success, transaction_ref, error_message, amount_charged
        """
        ...
