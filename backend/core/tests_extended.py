from datetime import timedelta

from django.contrib.auth.models import User
from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Board, Card, CardMember, List, Membership, Profile


class PasswordFlowTests(APITestCase):
    def setUp(self):
        self.password = 'CurrentPass123!'
        self.user = User.objects.create_user(
            username='password_user',
            email='password_user@example.com',
            password=self.password,
        )

    def _login(self):
        response = self.client.post(
            '/api/auth/token/login/',
            {'username': self.user.username, 'password': self.password},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['auth_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

    @override_settings(
        EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
        DEFAULT_FROM_EMAIL='noreply@example.com',
    )
    def test_request_and_confirm_password_change(self):
        self._login()
        new_password = 'BrandNewPass456!'

        request_response = self.client.post(
            '/api/users/me/password/request-change/',
            {
                'current_password': self.password,
                'new_password': new_password,
                're_new_password': new_password,
            },
            format='json',
        )
        self.assertEqual(request_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

        body = mail.outbox[0].body
        link = next((line.strip() for line in body.splitlines() if '/password-change-confirm/' in line), '')
        self.assertTrue(link)
        parts = link.rstrip('/').split('/')
        uid, token = parts[-2], parts[-1]

        confirm_response = self.client.post(
            '/api/users/password/confirm-change/',
            {'uid': uid, 'token': token},
            format='json',
        )
        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK, confirm_response.data)

        self.user.refresh_from_db()
        profile = Profile.objects.get(user=self.user)
        self.assertTrue(self.user.check_password(new_password))
        self.assertEqual(profile.pending_password_hash, '')
        self.assertIsNone(profile.pending_password_requested_at)


class BoardPermissionMatrixTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user('owner', 'owner@example.com', 'OwnerPass123!')
        self.developer = User.objects.create_user('developer', 'developer@example.com', 'DeveloperPass123!')
        self.viewer = User.objects.create_user('viewer', 'viewer@example.com', 'ViewerPass123!')

        self.board = Board.objects.create(title='Permission Board', owner=self.owner)
        Membership.objects.create(user=self.owner, board=self.board, role='admin')
        Membership.objects.create(user=self.developer, board=self.board, role='developer')
        Membership.objects.create(user=self.viewer, board=self.board, role='viewer')
        self.list = List.objects.create(board=self.board, title='To Do', order=1)
        self.card = Card.objects.create(list=self.list, title='Test card', order=1)
        CardMember.objects.create(card=self.card, user=self.developer)

    def _login(self, username: str, password: str):
        response = self.client.post(
            '/api/auth/token/login/',
            {'username': username, 'password': password},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['auth_token']}")

    def test_viewer_cannot_create_card(self):
        self._login('viewer', 'ViewerPass123!')
        response = self.client.post(
            '/api/cards/',
            {'list': self.list.id, 'title': 'Viewer card', 'order': 2},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_developer_can_create_card_when_board_allows_it(self):
        self._login('developer', 'DeveloperPass123!')
        response = self.client.post(
            '/api/cards/',
            {'list': self.list.id, 'title': 'Developer card', 'order': 2},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_developer_cannot_create_list_when_forbidden(self):
        self.board.dev_can_create_lists = False
        self.board.save(update_fields=['dev_can_create_lists'])
        self._login('developer', 'DeveloperPass123!')
        response = self.client.post(
            '/api/lists/',
            {'board': self.board.id, 'title': 'New list', 'order': 2},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_developer_archive_permission_respects_flag(self):
        self._login('developer', 'DeveloperPass123!')
        response_allowed = self.client.patch(
            f'/api/cards/{self.card.id}/',
            {'is_archived': True},
            format='json',
        )
        self.assertEqual(response_allowed.status_code, status.HTTP_200_OK)

        self.card.refresh_from_db()
        self.card.is_archived = False
        self.card.save(update_fields=['is_archived'])
        self.board.dev_can_archive_assigned_cards = False
        self.board.save(update_fields=['dev_can_archive_assigned_cards'])

        response_forbidden = self.client.patch(
            f'/api/cards/{self.card.id}/',
            {'is_archived': True},
            format='json',
        )
        self.assertEqual(response_forbidden.status_code, status.HTTP_403_FORBIDDEN)


class BoardTemplateAndRecurrenceTests(APITestCase):
    def setUp(self):
        self.password = 'OwnerPass123!'
        self.owner = User.objects.create_user('template_owner', 'template@example.com', self.password)

    def _login(self):
        response = self.client.post(
            '/api/auth/token/login/',
            {'username': self.owner.username, 'password': self.password},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['auth_token']}")

    def test_create_board_with_template(self):
        self._login()
        response = self.client.post(
            '/api/boards/',
            {'title': 'Roadmap Board', 'template_key': 'product_roadmap'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        board = Board.objects.get(id=response.data['id'])
        titles = list(board.lists.order_by('order').values_list('title', flat=True))
        self.assertEqual(titles, ['Ideas', 'Planned', 'In Progress', 'Released'])
        self.assertGreater(board.labels.count(), 0)

    def test_health_endpoint_is_public(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['services']['database'], 'ok')

    def test_complete_recurring_card_reschedules_due_date(self):
        self._login()
        board = Board.objects.create(title='Recurring Board', owner=self.owner)
        Membership.objects.create(user=self.owner, board=board, role='admin')
        list_obj = List.objects.create(board=board, title='To Do', order=1)
        due = timezone.now() + timedelta(days=1)
        card = Card.objects.create(
            list=list_obj,
            title='Recurring card',
            order=1,
            due_date=due,
            recurrence='daily',
        )

        response = self.client.patch(
            f'/api/cards/{card.id}/',
            {'is_completed': True},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        card.refresh_from_db()
        self.assertFalse(card.is_completed)
        self.assertEqual(card.recurrence, 'daily')
        self.assertIsNotNone(card.due_date)
        self.assertGreater(card.due_date, due)
