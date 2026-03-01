from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from core.models import Card


def _card_recipients(card: Card) -> list[str]:
    recipients: set[str] = set()

    for member in card.members.select_related('profile').all():
        profile = getattr(member, 'profile', None)
        if member.email and (profile is None or profile.notify_email):
            recipients.add(member.email)

    board_owner = getattr(card.list.board, 'owner', None)
    if board_owner and board_owner.email:
        owner_profile = getattr(board_owner, 'profile', None)
        if owner_profile is None or owner_profile.notify_email:
            recipients.add(board_owner.email)

    return sorted(recipients)


def get_cards_due_for_reminder(now=None):
    now = now or timezone.now()
    candidates = (
        Card.objects.select_related('list__board__owner')
        .prefetch_related('members__profile')
        .filter(
            is_archived=False,
            is_completed=False,
            due_date__isnull=False,
            reminder_minutes_before__isnull=False,
        )
    )

    due_cards = []
    for card in candidates:
        if not card.due_date:
            continue
        reminder_minutes = card.reminder_minutes_before or 0
        reminder_at = card.due_date - timedelta(minutes=reminder_minutes)
        if reminder_at > now:
            continue
        if card.last_reminder_sent_at and card.last_reminder_sent_at >= reminder_at:
            continue
        due_cards.append(card)

    return due_cards


def send_due_reminders(now=None) -> int:
    now = now or timezone.now()
    sent = 0
    cards = get_cards_due_for_reminder(now=now)

    for card in cards:
        recipients = _card_recipients(card)
        if not recipients:
            continue

        subject = f'Boardly reminder: "{card.title}" is due soon'
        due = card.due_date.astimezone().strftime('%Y-%m-%d %H:%M')
        board_title = card.list.board.title if card.list_id else 'Board'
        list_title = card.list.title if card.list_id else 'List'
        message = (
            "This is an automatic reminder from Boardly.\n\n"
            f"Card: {card.title}\n"
            f"Board: {board_title}\n"
            f"List: {list_title}\n"
            f"Due date: {due}\n\n"
            "Open your board to review and update the task."
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=False,
        )

        card.last_reminder_sent_at = now
        card.save(update_fields=['last_reminder_sent_at'])
        sent += 1

    return sent
