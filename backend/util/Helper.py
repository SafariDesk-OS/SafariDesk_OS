import os
import random
import re
import string

from datetime import timedelta, datetime

import uuid

from RNSafarideskBack.settings import BASE_DIR
from users.models import Users


class Helper:

    def log(self, request):
        current_date = datetime.now().strftime('%Y.%m.%d')
        log_file_name = f"{current_date}-request.log"
        log_file_path = os.path.join(BASE_DIR, f'utils/logs/{log_file_name}')
        log_string = f"[{datetime.now().strftime('%Y.%m.%d %I.%M.%S %p')}] => method: {request.method} uri: {request.path} queryString: {request.GET.urlencode()} protocol: {request.scheme} remoteAddr: {request.META.get('REMOTE_ADDR')} remotePort: {request.META.get('REMOTE_PORT')} userAgent: {request.META.get('HTTP_USER_AGENT')}"
        if os.path.exists(log_file_path):
            mode = 'a'
        else:
            mode = 'w'
        with open(log_file_path, mode) as log_file:
            log_file.write(log_string + '\n')

    def generate_random_password(self, length=15):
        """Generate a random strong password with only letters and digits."""
        characters = string.ascii_letters + string.digits  # Excludes punctuation
        return ''.join(random.choices(characters, k=length))

    def generate_incident_code(self, format_template=None):
        """
        Generate ticket ID based on config format or fallback to default.
        Format examples:
        - INC-{YYYY}-{####} -> INC-2025-0001
        - #{####} -> #0001
        - TICKET-{YY}{MM}-{####} -> TICKET-2512-0001
        """
        if not format_template:
            # Try to get from config
            try:
                from tenant.models.ConfigModel import TicketConfig
                config = TicketConfig.objects.first()
                if config:
                    format_template = config.id_format
            except:
                pass

            # Fallback to default format
            if not format_template:
                format_template = "ITK-{YYYY}-{####}"
        
        return self._generate_id_from_format(format_template, 'ticket')
    
    def generate_task_code(self, format_template=None):
        """
        Generate task ID based on config format or fallback to default.
        """
        if not format_template:
            # Try to get from config
            try:
                from tenant.models.ConfigModel import TaskConfig
                config = TaskConfig.objects.first()
                if config:
                    format_template = config.id_format
            except:
                pass

            # Fallback to default format
            if not format_template:
                format_template = "TSK-{YYYY}-{####}"
        
        return self._generate_id_from_format(format_template, 'task')
    
    def _generate_id_from_format(self, format_template, entity_type):
        """
        Generate ID from format template.
        Supports: {YYYY}, {YY}, {MM}, {DD}, {####}, {###}, etc.
        """
        now = datetime.now()
        result = format_template
        
        # Replace date tokens
        result = result.replace('{YYYY}', str(now.year))
        result = result.replace('{YY}', str(now.year)[2:])
        result = result.replace('{MM}', f"{now.month:02d}")
        result = result.replace('{DD}', f"{now.day:02d}")
        
        # Handle sequence numbers (####, ###, etc.)
        import re
        sequence_pattern = r'\{(#+)\}'
        matches = re.findall(sequence_pattern, result)
        
        if matches:
            # Get the number of digits needed
            num_digits = len(matches[0])
            
            # Get next sequence number for this business/year
            sequence = self._get_next_sequence(entity_type, now.year)
            sequence_str = str(sequence).zfill(num_digits)
            
            # Replace the first match
            result = re.sub(sequence_pattern, sequence_str, result, count=1)
        
        return result
    
    def _get_next_sequence(self, entity_type, year):
        """
        Get the next sequence number for an entity/year combination.
        """
        try:
            if entity_type == 'ticket':
                from tenant.models.TicketModel import Ticket
                # Count tickets created this year
                count = Ticket.objects.filter(
                    created_at__year=year
                ).count()
            else:  # task
                from tenant.models.TaskModel import Task
                count = Task.objects.filter(
                    created_at__year=year
                ).count()
            
            return count + 1
        except:
            return random.randint(1, 9999)

    def generate_unique_username(self, first_name, last_name):
        parts = [first_name.lower()] if first_name else []
        if last_name:
            parts.append(last_name.lower())
        base_username = ".".join(parts) if parts else "user"
        username = base_username
        counter = 1

        while Users.objects.filter(username=username, ).exists():
            suffix = f"{counter:02d}"
            username = f"{base_username}{suffix}"
            counter += 1

        return username

    from datetime import datetime

    def format_datetime(self, date_str):
        """
        Converts a datetime string 'YYYY-MM-DD HH:MM:SS.micro'
        to 'DD/MM/YYYY H:M' format.
        """
        try:
            # Parse the input string into a datetime object
            dt = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S.%f')
            # Format it as 'dd/mm/yyyy H:M'
            return dt.strftime('%d/%m/%Y %H:%M')
        except ValueError as e:
            return f"Invalid date format: {e}"










