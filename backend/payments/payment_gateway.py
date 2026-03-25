"""
PaymentGateway ABC — decouples business logic from payment infrastructure (DIP).
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class ProcessResult:
    success: bool
    transaction_ref: Optional[str] = None
    error_message: Optional[str] = None
    amount_charged: Optional[float] = None


@dataclass
class RefundResult:
    success: bool
    refund_ref: Optional[str] = None
    error_message: Optional[str] = None


class PaymentGateway(ABC):
    @abstractmethod
    def process(self, payment_data: dict) -> ProcessResult:
        """
        Process a payment.

        Args:
            payment_data: dict with card_number, expiry_date, cvv, amount,
                          school_id, activity_id, student_name, parent_name
        """
        ...

    @abstractmethod
    def refund(self, refund_data: dict) -> RefundResult:
        """
        Process a refund.

        Args:
            refund_data: dict with transaction_ref, amount
        """
        ...
