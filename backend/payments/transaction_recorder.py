"""
TransactionRecorder — creates/updates Transaction records (SRP).
"""

from django.utils import timezone

from .models import Transaction


class TransactionRecorder:
    def record(self, registration, amount, card_last_four, gateway_result):
        if gateway_result.success:
            return Transaction.objects.create(
                registration=registration,
                amount=amount,
                status='success',
                transaction_ref=gateway_result.transaction_ref,
                card_last_four=card_last_four,
                processed_at=timezone.now(),
            )
        else:
            return Transaction.objects.create(
                registration=registration,
                amount=amount,
                status='failed',
                error_message=gateway_result.error_message or '',
                card_last_four=card_last_four,
                processed_at=timezone.now(),
            )
