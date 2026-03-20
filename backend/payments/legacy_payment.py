"""
Legacy Payment Processor Simulator

This simulates an external payment API that processes school-related payments.
In a real-world scenario, this would be an external service/API call.

DO NOT MODIFY THIS FILE - This simulates a legacy system you must integrate with.
"""

import random
import time
import uuid


class LegacyPaymentProcessor:
    """
    Simulates a legacy payment processing system.

    This processor has the following characteristics:
    - Random processing delays (1-3 seconds)
    - ~80% success rate (simulates real-world payment failures)
    - Returns transaction references on success
    - Returns error messages on failure
    """

    SCHOOL_PAYMENT_CODES = {
        "SCH001": "Wellington Primary",
        "SCH002": "Auckland Grammar",
        "SCH003": "Christchurch East",
    }

    def process_payment(self, payment_data):
        """
        Process a payment through the legacy system.

        Args:
            payment_data (dict): Must contain:
                - card_number (str): 16-digit card number
                - expiry_date (str): MM/YY format
                - cvv (str): 3-digit CVV
                - amount (float): Payment amount
                - school_id (str): School identifier
                - activity_id (str): Activity/trip identifier

        Returns:
            dict: Payment result with keys:
                - success (bool): Whether payment was successful
                - transaction_ref (str|None): Reference number if successful
                - error_message (str|None): Error description if failed
                - amount_charged (float|None): Amount charged if successful
        """
        # Simulate processing delay
        processing_time = random.uniform(1, 3)
        time.sleep(processing_time)

        # Validate required fields
        required_fields = ['card_number', 'expiry_date', 'cvv', 'amount',
                           'school_id', 'activity_id']
        for field in required_fields:
            if field not in payment_data:
                return {
                    'success': False,
                    'transaction_ref': None,
                    'error_message': f'Missing required field: {field}',
                    'amount_charged': None
                }

        # Validate card number (basic check)
        card_number = str(payment_data['card_number']).replace(' ', '')
        if len(card_number) != 16 or not card_number.isdigit():
            return {
                'success': False,
                'transaction_ref': None,
                'error_message': 'Invalid card number format',
                'amount_charged': None
            }

        # Validate amount
        try:
            amount = float(payment_data['amount'])
            if amount <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            return {
                'success': False,
                'transaction_ref': None,
                'error_message': 'Invalid payment amount',
                'amount_charged': None
            }

        # Simulate ~80% success rate
        if random.random() < 0.8:
            transaction_ref = f"TX-{int(time.time())}-{uuid.uuid4().hex[:8].upper()}"
            return {
                'success': True,
                'transaction_ref': transaction_ref,
                'error_message': None,
                'amount_charged': amount
            }
        else:
            failure_reasons = [
                'Payment declined by issuing bank',
                'Insufficient funds',
                'Card network timeout',
                'Risk assessment failed',
            ]
            return {
                'success': False,
                'transaction_ref': None,
                'error_message': random.choice(failure_reasons),
                'amount_charged': None
            }
