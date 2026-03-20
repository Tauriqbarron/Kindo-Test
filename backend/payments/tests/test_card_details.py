from unittest import TestCase

from payments.card_details import CardDetails, CardValidationError


class CardDetailsValidCardTest(TestCase):
    """Test with a known-valid Luhn card number."""

    def test_valid_card(self):
        card = CardDetails('4111111111111111', '12/28', '123')
        self.assertEqual(card.card_number, '4111111111111111')
        self.assertEqual(card.last_four, '1111')

    def test_strips_spaces_and_dashes(self):
        card = CardDetails('4111 1111 1111 1111', '12/28', '123')
        self.assertEqual(card.card_number, '4111111111111111')

        card2 = CardDetails('4111-1111-1111-1111', '12/28', '123')
        self.assertEqual(card2.card_number, '4111111111111111')

    def test_four_digit_cvv(self):
        card = CardDetails('4111111111111111', '12/28', '1234')
        self.assertEqual(card.cvv, '1234')


class CardNumberValidationTest(TestCase):
    def test_non_digit_raises(self):
        with self.assertRaises(CardValidationError) as ctx:
            CardDetails('41111111111111ab', '12/28', '123')
        self.assertIn('digits', ctx.exception.message)

    def test_wrong_length_raises(self):
        with self.assertRaises(CardValidationError) as ctx:
            CardDetails('411111111111', '12/28', '123')
        self.assertIn('16 digits', ctx.exception.message)

    def test_luhn_failure_raises(self):
        with self.assertRaises(CardValidationError) as ctx:
            CardDetails('4111111111111112', '12/28', '123')
        self.assertIn('Invalid card number', ctx.exception.message)


class ExpiryDateValidationTest(TestCase):
    def test_no_slash_raises(self):
        with self.assertRaises(CardValidationError) as ctx:
            CardDetails('4111111111111111', '1228', '123')
        self.assertIn('MM/YY', ctx.exception.message)

    def test_non_digit_raises(self):
        with self.assertRaises(CardValidationError) as ctx:
            CardDetails('4111111111111111', 'ab/cd', '123')
        self.assertIn('MM/YY', ctx.exception.message)

    def test_invalid_month_raises(self):
        with self.assertRaises(CardValidationError) as ctx:
            CardDetails('4111111111111111', '13/28', '123')
        self.assertIn('month', ctx.exception.message)

    def test_zero_month_raises(self):
        with self.assertRaises(CardValidationError) as ctx:
            CardDetails('4111111111111111', '00/28', '123')
        self.assertIn('month', ctx.exception.message)

    def test_expired_card_raises(self):
        with self.assertRaises(CardValidationError) as ctx:
            CardDetails('4111111111111111', '01/20', '123')
        self.assertIn('expired', ctx.exception.message)


class CVVValidationTest(TestCase):
    def test_non_digit_raises(self):
        with self.assertRaises(CardValidationError) as ctx:
            CardDetails('4111111111111111', '12/28', 'abc')
        self.assertIn('digits', ctx.exception.message)

    def test_too_short_raises(self):
        with self.assertRaises(CardValidationError) as ctx:
            CardDetails('4111111111111111', '12/28', '12')
        self.assertIn('3 or 4', ctx.exception.message)

    def test_too_long_raises(self):
        with self.assertRaises(CardValidationError) as ctx:
            CardDetails('4111111111111111', '12/28', '12345')
        self.assertIn('3 or 4', ctx.exception.message)


class LuhnCheckTest(TestCase):
    def test_known_valid_numbers(self):
        valid_numbers = [
            '4111111111111111',
            '5500000000000004',
            '340000000000009',   # 15-digit — but Luhn itself is length-agnostic
        ]
        for num in valid_numbers:
            self.assertTrue(CardDetails._luhn_check(num), f'{num} should pass Luhn')

    def test_known_invalid_numbers(self):
        invalid_numbers = [
            '4111111111111112',
            '1234567890123456',
        ]
        for num in invalid_numbers:
            self.assertFalse(CardDetails._luhn_check(num), f'{num} should fail Luhn')
