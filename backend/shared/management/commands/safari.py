from django.core.management.base import BaseCommand
from django.core.management import call_command
from tenant.models import EmailConfig, EmailTemplateCategory


class Command(BaseCommand):
    help = 'Initialize Safari Desk core setup'

    def handle(self, *args, **kwargs):
        self.stdout.write("Initializing safari desk core...")
        call_command('datasync')
        self.stdout.write("Setup complete")

