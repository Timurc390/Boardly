from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from core.models import Board, Membership


class ApiSmokeTests(APITestCase):
    def setUp(self):
        self.password = 'SmokePass123!'
        self.user = User.objects.create_user(
            username='smoke_user',
            email='smoke@example.com',
            password=self.password,
            first_name='Smoke',
            last_name='Tester',
        )

    def _login_and_authenticate(self, username_or_email: str) -> str:
        response = self.client.post(
            '/api/auth/token/login/',
            {'username': username_or_email, 'password': self.password},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data.get('auth_token')
        self.assertTrue(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return token

    def test_users_me_requires_auth(self):
        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_login_with_username_and_fetch_profile(self):
        self._login_and_authenticate(self.user.username)

        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user.username)
        self.assertEqual(response.data['email'], self.user.email)
        self.assertIn('profile', response.data)

    def test_token_login_with_email_alias(self):
        response = self.client.post(
            '/api/auth/token/login/',
            {'username': self.user.email, 'password': self.password},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('auth_token'))

    def test_token_logout_revokes_token(self):
        token = self._login_and_authenticate(self.user.username)

        response = self.client.post('/api/auth/token/logout/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Token.objects.filter(key=token).exists())

    def test_board_create_bootstraps_membership_and_default_lists(self):
        self._login_and_authenticate(self.user.username)

        response = self.client.post(
            '/api/boards/',
            {'title': 'Smoke Board', 'description': 'Board smoke test'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        board = Board.objects.get(pk=response.data['id'])
        self.assertEqual(board.owner_id, self.user.id)
        self.assertTrue(
            Membership.objects.filter(board=board, user=self.user, role='admin').exists()
        )

        default_titles = list(board.lists.order_by('order').values_list('title', flat=True))
        self.assertEqual(default_titles, ['To Do', 'In Progress', 'Done'])
