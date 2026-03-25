"""
WithdrawalService — orchestrates the withdrawal flow (SRP: orchestration only).
"""

import logging

from django.db import transaction
from django.utils import timezone

from .legacy_adapter import LegacyPaymentAdapter
from .models import AccountCredit, Withdrawal

logger = logging.getLogger('payments')


class WithdrawalService:
    def __init__(self, gateway=None):
        self.gateway = gateway or LegacyPaymentAdapter()

    def process_withdrawal(self, registration, resolution, user):
        """
        Withdraw a child from a trip.

        Args:
            registration: confirmed Registration instance
            resolution: 'credit' or 'refund'
            user: the parent User

        Returns:
            (withdrawal, success) tuple
        """
        trip = registration.trip
        amount = trip.cost

        logger.info(
            'Processing withdrawal for registration %s, resolution=%s, amount=%s',
            registration.id, resolution, amount,
        )

        with transaction.atomic():
            if resolution == 'credit':
                withdrawal = self._process_credit(registration, amount, user)
            else:
                withdrawal = self._process_refund(registration, amount, user)

            if withdrawal.status == 'completed':
                registration.status = 'cancelled'
                registration.save(update_fields=['status', 'updated_at'])

        success = withdrawal.status == 'completed'

        if success:
            logger.info(
                'Withdrawal completed: registration=%s, resolution=%s',
                registration.id, resolution,
            )
        else:
            logger.warning(
                'Withdrawal failed: registration=%s, resolution=%s',
                registration.id, resolution,
            )

        return withdrawal, success

    def _process_credit(self, registration, amount, user):
        AccountCredit.objects.create(
            user=user,
            amount=amount,
            reason='withdrawal',
            registration=registration,
            note=f"Withdrawal from {registration.trip.title}",
        )

        return Withdrawal.objects.create(
            registration=registration,
            amount=amount,
            resolution='credit',
            status='completed',
            processed_at=timezone.now(),
        )

    def _process_refund(self, registration, amount, user):
        transaction_obj = getattr(registration, 'transaction', None)
        transaction_ref = transaction_obj.transaction_ref if transaction_obj else ''

        refund_result = self.gateway.refund({
            'transaction_ref': transaction_ref,
            'amount': float(amount),
        })

        if refund_result.success:
            return Withdrawal.objects.create(
                registration=registration,
                amount=amount,
                resolution='refund',
                status='completed',
                processed_at=timezone.now(),
            )
        else:
            return Withdrawal.objects.create(
                registration=registration,
                amount=amount,
                resolution='refund',
                status='failed',
            )
