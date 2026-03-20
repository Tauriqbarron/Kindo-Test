"""
CardDetails value object — owns all card validation logic (Information Expert).
"""

from datetime import datetime


class CardValidationError(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)


class CardDetails:
    def __init__(self, card_number: str, expiry_date: str, cvv: str):
        self.card_number = card_number.replace(' ', '').replace('-', '')
        self.expiry_date = expiry_date.strip()
        self.cvv = cvv.strip()
        self.validate()

    def validate(self):
        self._validate_card_number()
        self._validate_expiry_date()
        self._validate_cvv()

    def _validate_card_number(self):
        if not self.card_number.isdigit():
            raise CardValidationError('Card number must contain only digits.')
        if len(self.card_number) != 16:
            raise CardValidationError('Card number must be 16 digits.')
        if not self._luhn_check(self.card_number):
            raise CardValidationError('Invalid card number.')

    def _validate_expiry_date(self):
        if '/' not in self.expiry_date:
            raise CardValidationError('Expiry date must be in MM/YY format.')
        parts = self.expiry_date.split('/')
        if len(parts) != 2:
            raise CardValidationError('Expiry date must be in MM/YY format.')
        month_str, year_str = parts
        if not month_str.isdigit() or not year_str.isdigit():
            raise CardValidationError('Expiry date must be in MM/YY format.')
        month = int(month_str)
        year = int(year_str)
        if month < 1 or month > 12:
            raise CardValidationError('Invalid expiry month.')
        now = datetime.now()
        expiry_year = 2000 + year
        if expiry_year < now.year or (expiry_year == now.year and month < now.month):
            raise CardValidationError('Card has expired.')

    def _validate_cvv(self):
        if not self.cvv.isdigit():
            raise CardValidationError('CVV must contain only digits.')
        if len(self.cvv) not in (3, 4):
            raise CardValidationError('CVV must be 3 or 4 digits.')

    @staticmethod
    def _luhn_check(number: str) -> bool:
        digits = [int(d) for d in number]
        digits.reverse()
        total = 0
        for i, d in enumerate(digits):
            if i % 2 == 1:
                d *= 2
                if d > 9:
                    d -= 9
            total += d
        return total % 10 == 0

    @property
    def last_four(self) -> str:
        return self.card_number[-4:]
