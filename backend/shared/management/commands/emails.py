# management/commands/emails.py
from django.core.management.base import BaseCommand
from shared.workers.Email import process_emails_for_all_businesses


class Command(BaseCommand):
    help = 'Process incoming emails and convert them to tickets for all businesses and departments'

    def add_arguments(self, parser):
        """Add command line arguments"""
        parser.add_argument(
            '--sync',
            action='store_true',
            help='Process emails synchronously (for testing)',
        )

    def handle(self, *args, **options):
        self.stdout.write('Processing emails...')
        if options.get('sync'):
            # Run synchronously for testing
            self._process_emails_sync()
        else:
            # Run asynchronously
            self._process_emails_async()

    def _process_emails_sync(self):
        """Process emails synchronously"""
        # Process global emails first
        self.stdout.write('Step 1: Processing global/organization emails...')
        global_stats = self._process_global_emails()

        # Then process department emails
        self.stdout.write('Step 2: Processing department emails...')
        dept_stats = self._process_department_emails()

        # Combine results
        final_result = {
            'global_processed': global_stats['processed'],
            'global_tickets_created': global_stats['tickets_created'],
            'global_comments_added': global_stats['comments_added'],
            'global_errors': global_stats['errors'],
            'departments_found': dept_stats['total_departments'],
            'dept_processed': dept_stats['processed'],
            'dept_tickets_created': dept_stats['tickets_created'],
            'dept_comments_added': dept_stats['comments_added'],
            'dept_errors': dept_stats['errors'],
            'total_processed': global_stats['processed'] + dept_stats['processed'],
            'total_tickets_created': global_stats['tickets_created'] + dept_stats['tickets_created'],
            'total_comments_added': global_stats['comments_added'] + dept_stats['comments_added'],
            'total_errors': global_stats['errors'] + dept_stats['errors'],
        }
        self._display_results(final_result)

    def _process_emails_async(self):
        """Process emails asynchronously"""
        task = process_emails_for_all_businesses.apply_async()
        self.stdout.write(f'Scheduled email processing (task: {task.id})')



    def _process_global_emails(self):
        """Process global/organization emails using SMTP settings"""
        from util.EmailTicketService import EmailTicketService
        from django.conf import settings

        # Check if SMTP settings configured
        smtp_settings = None
        try:
            from tenant.models import SettingSMTP
            smtp_settings = SettingSMTP.objects.first()
        except:
            pass

        # Skip if no SMTP settings configured
        if not smtp_settings:
            self.stdout.write('  Skipping global emails - no SMTP settings configured')
            return {
                'processed': 0,
                'tickets_created': 0,
                'comments_added': 0,
                'errors': 0,
            }

        # Temporarily override Django email settings with SMTP settings
        original_host = getattr(settings, 'EMAIL_HOST', None)
        original_user = getattr(settings, 'EMAIL_HOST_USER', None)
        original_pass = getattr(settings, 'EMAIL_HOST_PASSWORD', None)

        try:
            # Override settings with SMTP
            settings.EMAIL_HOST = smtp_settings.host
            settings.EMAIL_PORT = smtp_settings.port
            settings.EMAIL_HOST_USER = smtp_settings.username
            settings.EMAIL_HOST_PASSWORD = smtp_settings.password
            settings.EMAIL_USE_TLS = smtp_settings.use_tls
            settings.EMAIL_USE_SSL = smtp_settings.use_ssl

            # Process emails using the global service
            service = EmailTicketService()
            service.process_emails()

            # For now, return basic stats (the EmailTicketService doesn't return detailed stats)
            return {
                'processed': 0,  # Would need to modify EmailTicketService to return stats
                'tickets_created': 0,
                'comments_added': 0,
                'errors': 0,
            }

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing global emails: {str(e)}'))
            return {
                'processed': 0,
                'tickets_created': 0,
                'comments_added': 0,
                'errors': 1,
            }
        finally:
            # Restore original settings
            if original_host:
                settings.EMAIL_HOST = original_host
            if original_user:
                settings.EMAIL_HOST_USER = original_user
            if original_pass:
                settings.EMAIL_HOST_PASSWORD = original_pass

    def _process_department_emails(self):
        """Process department emails"""
        from tenant.models import DepartmentEmails, SettingSMTP
        from shared.workers.Email import EmailProcessor

        department_emails = DepartmentEmails.objects.filter(
            is_active=True
        ).select_related('department')

        # Get the global email to avoid duplicate processing
        global_email = None
        try:
            smtp_settings = SettingSMTP.objects.first()
            if smtp_settings:
                global_email = smtp_settings.username  # This is typically the email address
        except:
            pass

        # Filter out department emails that match the global email
        filtered_department_emails = []
        skipped_duplicates = 0

        for dept_email in department_emails:
            if global_email and dept_email.email.lower() == global_email.lower():
                self.stdout.write(f'  Skipping department: {dept_email.department.name} ({dept_email.email}) - duplicate of organization email')
                skipped_duplicates += 1
                continue
            filtered_department_emails.append(dept_email)

        total_stats = {
            'total_departments': len(filtered_department_emails),
            'skipped_duplicates': skipped_duplicates,
            'processed': 0,
            'tickets_created': 0,
            'comments_added': 0,
            'errors': 0,
        }

        for dept_email in filtered_department_emails:
            self.stdout.write(f'  Processing department: {dept_email.department.name} ({dept_email.email})')
            processor = EmailProcessor(dept_email)
            stats = processor.process_unread_emails()
            total_stats['processed'] += stats['processed']
            total_stats['tickets_created'] += stats['tickets_created']
            total_stats['comments_added'] += stats['comments_added']
            total_stats['errors'] += stats['errors']

        return total_stats

    def _display_results(self, results):
        """Display results"""
        self.stdout.write(self.style.SUCCESS('\nEmail processing completed!'))

        self.stdout.write('\n📧 Global Emails:')
        self.stdout.write(f'  Processed: {results["global_processed"]}')
        self.stdout.write(f'  Tickets Created: {results["global_tickets_created"]}')
        self.stdout.write(f'  Comments Added: {results["global_comments_added"]}')
        self.stdout.write(f'  Errors: {results["global_errors"]}')

        self.stdout.write('\n🏢 Department Emails:')
        self.stdout.write(f'  Departments Found: {results["departments_found"]}')
        self.stdout.write(f'  Processed: {results["dept_processed"]}')
        self.stdout.write(f'  Tickets Created: {results["dept_tickets_created"]}')
        self.stdout.write(f'  Comments Added: {results["dept_comments_added"]}')
        self.stdout.write(f'  Errors: {results["dept_errors"]}')

        self.stdout.write('\n📊 Totals:')
        self.stdout.write(f'  Total Processed: {results["total_processed"]}')
        self.stdout.write(f'  Total Tickets Created: {results["total_tickets_created"]}')
        self.stdout.write(f'  Total Comments Added: {results["total_comments_added"]}')
        self.stdout.write(f'  Total Errors: {results["total_errors"]}')

