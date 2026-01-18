from django.core.management.base import BaseCommand
from util.BusinessSetup import BusinessSetup


class Command(BaseCommand):
    help = 'Initialize Safari Desk single-tenant setup (runs initial setup without business)'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting Safari Desk single-tenant initialization...")

        # Run the business setup without business (single tenant)
        setup = BusinessSetup(None, None)
        setup.run_setup()

        self.stdout.write(self.style.SUCCESS("Safari Desk single-tenant initialization complete!"))
