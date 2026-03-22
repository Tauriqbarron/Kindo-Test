from django.contrib.auth.models import User
from django.test import TestCase

from accounts.serializers import ChildSerializer, SignupSerializer


class SignupSerializerTests(TestCase):
    def test_valid_data(self):
        serializer = SignupSerializer(data={
            'first_name': 'Sarah',
            'last_name': 'Wilson',
            'email': 'sarah@example.com',
            'password': 'SecurePass123!',
        })
        self.assertTrue(serializer.is_valid())

    def test_duplicate_email(self):
        User.objects.create_user(username='sarah@example.com', email='sarah@example.com', password='pass')
        serializer = SignupSerializer(data={
            'first_name': 'Sarah',
            'last_name': 'Wilson',
            'email': 'sarah@example.com',
            'password': 'SecurePass123!',
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_weak_password(self):
        serializer = SignupSerializer(data={
            'first_name': 'Sarah',
            'last_name': 'Wilson',
            'email': 'sarah@example.com',
            'password': '123',
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)


class ChildSerializerTests(TestCase):
    def test_valid_data(self):
        serializer = ChildSerializer(data={
            'name': 'Emma Wilson',
            'grade': 'Year 5',
        })
        self.assertTrue(serializer.is_valid())

    def test_name_required(self):
        serializer = ChildSerializer(data={'grade': 'Year 5'})
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_grade_optional(self):
        serializer = ChildSerializer(data={'name': 'Emma Wilson'})
        self.assertTrue(serializer.is_valid())
