from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import Child


class SignupViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_signup_success(self):
        response = self.client.post('/api/auth/signup/', {
            'first_name': 'Sarah',
            'last_name': 'Wilson',
            'email': 'sarah@example.com',
            'password': 'SecurePass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], 'sarah@example.com')
        self.assertEqual(response.data['user']['first_name'], 'Sarah')
        self.assertTrue(User.objects.filter(email='sarah@example.com').exists())

    def test_signup_duplicate_email(self):
        User.objects.create_user(username='existing@example.com', email='existing@example.com', password='pass')
        response = self.client.post('/api/auth/signup/', {
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'existing@example.com',
            'password': 'SecurePass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_weak_password(self):
        response = self.client.post('/api/auth/signup/', {
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'test@example.com',
            'password': '123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_missing_fields(self):
        response = self.client.post('/api/auth/signup/', {
            'email': 'test@example.com',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='sarah@example.com',
            email='sarah@example.com',
            password='SecurePass123!',
            first_name='Sarah',
            last_name='Wilson',
        )

    def test_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'sarah@example.com',
            'password': 'SecurePass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], 'sarah@example.com')

    def test_login_wrong_password(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'sarah@example.com',
            'password': 'WrongPassword',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_nonexistent_user(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'nobody@example.com',
            'password': 'SomePassword123!',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='sarah@example.com',
            email='sarah@example.com',
            password='SecurePass123!',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_logout_success(self):
        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_logout_unauthenticated(self):
        self.client.credentials()
        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MeViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='sarah@example.com',
            email='sarah@example.com',
            password='SecurePass123!',
            first_name='Sarah',
            last_name='Wilson',
        )
        self.token = Token.objects.create(user=self.user)

    def test_me_authenticated(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'sarah@example.com')
        self.assertEqual(response.data['first_name'], 'Sarah')

    def test_me_unauthenticated(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ChildViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='sarah@example.com',
            email='sarah@example.com',
            password='SecurePass123!',
        )
        self.other_user = User.objects.create_user(
            username='other@example.com',
            email='other@example.com',
            password='SecurePass123!',
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_create_child(self):
        response = self.client.post('/api/children/', {
            'name': 'Emma Wilson',
            'grade': 'Year 5',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Emma Wilson')
        self.assertEqual(Child.objects.count(), 1)
        self.assertEqual(Child.objects.first().parent, self.user)

    def test_list_children_only_own(self):
        Child.objects.create(parent=self.user, name='Emma Wilson')
        Child.objects.create(parent=self.other_user, name='Other Child')

        response = self.client.get('/api/children/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Emma Wilson')

    def test_update_child(self):
        child = Child.objects.create(parent=self.user, name='Emma Wilson')
        response = self.client.put(f'/api/children/{child.id}/', {
            'name': 'Emma W.',
            'grade': 'Year 6',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        child.refresh_from_db()
        self.assertEqual(child.name, 'Emma W.')

    def test_delete_child(self):
        child = Child.objects.create(parent=self.user, name='Emma Wilson')
        response = self.client.delete(f'/api/children/{child.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Child.objects.count(), 0)

    def test_cannot_access_other_users_child(self):
        other_child = Child.objects.create(parent=self.other_user, name='Other Child')
        response = self.client.get(f'/api/children/{other_child.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_update_other_users_child(self):
        other_child = Child.objects.create(parent=self.other_user, name='Other Child')
        response = self.client.put(f'/api/children/{other_child.id}/', {
            'name': 'Hacked Name',
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_cannot_list(self):
        self.client.credentials()
        response = self.client.get('/api/children/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
