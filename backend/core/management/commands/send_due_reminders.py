from django.core.management.base import BaseCommand

from core.services.due_reminders import send_due_reminders


class Command(BaseCommand):
    help = 'Send due-date reminder emails for cards with reminder settings.'

    def handle(self, *args, **options):
        sent = send_due_reminders()
        self.stdout.write(self.style.SUCCESS(f'Sent reminders: {sent}'))
