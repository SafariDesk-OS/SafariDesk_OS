from datetime import timedelta

from django.db.models import Min, Max, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from tenant.models import Department, Ticket, Task, BusinessHoursx, Holidays, TicketCategories, \
    EmailTemplate, SettingSMTP, KnowledgeBase, TicketReopen
from tenant.models.KnowledgeBase import KBArticle
from tenant.serializers.AgentSerializer import AgentSerializer
from users.models import Users


class DashView(viewsets.ModelViewSet):

    serializer_class = AgentSerializer
    queryset = Users.objects.all()
    permission_classes = [IsAuthenticated]


    def get_started(self, request):
        user = request.user
        

        # Step 1: Initial Configurations
        has_business_hours = BusinessHoursx.objects.for_business().exists()
        has_holidays = Holidays.objects.for_business().exists()
        has_ticket_categories = TicketCategories.objects.for_business().exists()
        has_departments = Department.objects.for_business().exists()
        has_email_templates = EmailTemplate.objects.for_business().exists()
        has_email_smtp = SettingSMTP.objects.for_business().exists()

        # Simplified: Only require departments and ticket categories for initial config
        initial_config_complete = has_departments and has_ticket_categories

        # Step 2: Add Agents
        agents_count = Users.objects.filter(role__name='agent').count()
        has_agents = agents_count > 0  # Any agents including admin

        # Step 3 & 4: Tickets and Tasks
        all_tickets = Ticket.objects.for_business().count()
        unassigned_tickets = Ticket.objects.for_business().filter(assigned_to__isnull=True).count()
        all_tasks = Task.objects.for_business().count()
        unassigned_tasks = Task.objects.for_business().filter(assigned_to__isnull=True).count()

        # Step 5: Assign Tasks & Tickets
        has_assigned_items = (all_tickets > 0 and unassigned_tickets < all_tickets) or \
                             (all_tasks > 0 and unassigned_tasks < all_tasks)

        # Step 6: Set Up Knowledge Base (SLA step removed)
        articles_count = KBArticle.objects.all().count()
        has_kb = articles_count > 0

        data = {
            "initial_config_complete": initial_config_complete,
            "has_agents": has_agents,
            "all_tickets": all_tickets,
            "all_tasks": all_tasks,
            "has_assigned_items": has_assigned_items,
            "has_reviewed_slas": False,  # SLA step removed, always false
            "has_kb": has_kb,
            "agents_count": agents_count,
            "departments_count": Department.objects.for_business().count(),
            "articles_count": articles_count,
            "unassigned_tickets_count": unassigned_tickets,
            "unassigned_tasks_count": unassigned_tasks
        }
        return Response(data)

    def load(self, request):
        param = request.GET.get("q", "today")  # Default to "today" if no param
        

        # Get base queries
        tk_query = Ticket.objects.for_business()
        task_query = Task.objects.for_business()

        # Get current time
        now = timezone.now()

        # Filter queries based on time period
        if param == "today":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
            tk_filtered = tk_query.filter(created_at__gte=start_date, created_at__lt=end_date)
            task_filtered = task_query.filter(created_at__gte=start_date, created_at__lt=end_date)
        elif param == "week":
            # Get start of current week (Monday)
            start_date = now - timedelta(days=now.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=7)
            tk_filtered = tk_query.filter(created_at__gte=start_date, created_at__lt=end_date)
            task_filtered = task_query.filter(created_at__gte=start_date, created_at__lt=end_date)
        elif param == "month":
            # Get start of current month
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # Get start of next month
            if now.month == 12:
                end_date = start_date.replace(year=now.year + 1, month=1)
            else:
                end_date = start_date.replace(month=now.month + 1)
            tk_filtered = tk_query.filter(created_at__gte=start_date, created_at__lt=end_date)
            task_filtered = task_query.filter(created_at__gte=start_date, created_at__lt=end_date)
        elif param == "range":
            # Custom date range
            start_str = request.GET.get("start")
            end_str = request.GET.get("end")
            
            if start_str and end_str:
                from datetime import datetime
                # Parse dates and set to start/end of day
                start_date = datetime.strptime(start_str, "%Y-%m-%d").replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.get_current_timezone())
                end_date = datetime.strptime(end_str, "%Y-%m-%d").replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.get_current_timezone())
                tk_filtered = tk_query.filter(created_at__gte=start_date, created_at__lte=end_date)
                task_filtered = task_query.filter(created_at__gte=start_date, created_at__lte=end_date)
            else:
                # Fallback to today if dates not provided
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date + timedelta(days=1)
                tk_filtered = tk_query.filter(created_at__gte=start_date, created_at__lt=end_date)
                task_filtered = task_query.filter(created_at__gte=start_date, created_at__lt=end_date)
        else:
            # Default to today if invalid param
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
            tk_filtered = tk_query.filter(created_at__gte=start_date, created_at__lt=end_date)
            task_filtered = task_query.filter(created_at__gte=start_date, created_at__lt=end_date)

        # Generate graph data based on param
        def generate_graph_data(query_set, param, start_date):
            if param == "today":
                return [{
                    "period": "today",
                    "all": query_set.count(),
                    "open": query_set.exclude(
                        Q(status="closed") if hasattr(query_set.model, 'status')
                        else Q(task_status="completed")
                    ).count(),
                    "unassigned": query_set.filter(assigned_to__isnull=True).count(),
                    "closed": query_set.filter(
                        Q(status="closed") if hasattr(query_set.model, 'status')
                        else Q(task_status="completed")
                    ).count(),
                    "breached": sum(1 for ticket in list(query_set) if ticket.is_sla_breached) if query_set.model == Ticket
                                else sum(1 for task in list(query_set) if task.is_overdue),
                }]

            elif param == "week":
                graph_data = []
                days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

                for i in range(7):
                    day_start = start_date + timedelta(days=i)
                    day_end = day_start + timedelta(days=1)
                    day_query = query_set.filter(created_at__gte=day_start, created_at__lt=day_end)

                    graph_data.append({
                        "period": days[i],
                        "date": day_start.strftime("%Y-%m-%d"),
                        "all": day_query.count(),
                        "open": day_query.exclude(
                            Q(status="closed") if hasattr(query_set.model, 'status')
                            else Q(task_status="completed")
                        ).count(),
                        "unassigned": day_query.filter(assigned_to__isnull=True).count(),
                        "closed": day_query.filter(
                            Q(status="closed") if hasattr(query_set.model, 'status')
                            else Q(task_status="completed")
                        ).count(),
                        "breached": sum(1 for ticket in list(day_query) if ticket.is_sla_breached) if day_query.model == Ticket
                                    else sum(1 for task in list(day_query) if task.is_overdue),
                    })

                return graph_data

            elif param == "month":
                graph_data = []

                # Calculate weeks in the month
                month_start = start_date
                month_end = start_date.replace(
                    month=start_date.month + 1) if start_date.month < 12 else start_date.replace(
                    year=start_date.year + 1, month=1)

                current_week_start = month_start
                week_num = 1

                while current_week_start < month_end:
                    # Calculate week end (either 7 days later or end of month)
                    week_end = min(current_week_start + timedelta(days=7), month_end)

                    # Filter data for this week
                    week_query = query_set.filter(created_at__gte=current_week_start, created_at__lt=week_end)

                    graph_data.append({
                        "period": f"Week {week_num}",
                        "start_date": current_week_start.strftime("%Y-%m-%d"),
                        "end_date": (week_end - timedelta(days=1)).strftime("%Y-%m-%d"),
                        "all": week_query.count(),
                        "open": week_query.exclude(
                            Q(status="closed") if hasattr(query_set.model, 'status')
                            else Q(task_status="completed")
                        ).count(),
                        "unassigned": week_query.filter(assigned_to__isnull=True).count(),
                        "closed": week_query.filter(
                            Q(status="closed") if hasattr(query_set.model, 'status')
                            else Q(task_status="completed")
                        ).count(),
                        "breached": sum(1 for ticket in list(week_query) if week_query.model == Ticket
                                    and ticket.is_sla_breached) if week_query.model == Ticket
                                    else sum(1 for task in list(week_query) if task.is_overdue),
                    })

                    current_week_start = week_end
                    week_num += 1

                return graph_data

            elif param == "range":
                # Custom date range - generate daily data points
                from datetime import datetime as dt
                current_date = start_date
                graph_data = []

                while current_date < end_date:
                    day_end = current_date + timedelta(days=1)
                    day_query = query_set.filter(created_at__gte=current_date, created_at__lt=day_end)

                    graph_data.append({
                        "period": current_date.strftime("%a"),  # Mon, Tue, etc.
                        "date": current_date.strftime("%Y-%m-%d"),
                        "all": day_query.count(),
                        "open": day_query.exclude(
                            Q(status="closed") if hasattr(query_set.model, 'status')
                            else Q(task_status="completed")
                        ).count(),
                        "unassigned": day_query.filter(assigned_to__isnull=True).count(),
                        "closed": day_query.filter(
                            Q(status="closed") if hasattr(query_set.model, 'status')
                            else Q(task_status="completed")
                        ).count(),
                        "breached": sum(1 for ticket in list(day_query) if query_set.model == Ticket
                                    and ticket.is_sla_breached) if query_set.model == Ticket
                                    else sum(1 for task in list(day_query) if task.is_overdue),
                    })

                    current_date = day_end

                return graph_data

            return []

        # Generate recent data (always use the filtered queries)
        recent_tickets = tk_filtered.order_by('-created_at')[:3]

        recent_tickets_data = []
        for ticket in recent_tickets:
            recent_tickets_data.append({
                'id': ticket.id,
                'ticket_id': ticket.ticket_id,
                'title': ticket.title,
                'status': ticket.status,
                'description': ticket.description,
                'priority': ticket.priority,
                'creator_name': ticket.creator_name,
                'creator_email': ticket.creator_email,
                'assigned_to': ticket.assigned_to.full_name() if ticket.assigned_to else None,
                'department': ticket.department.name if ticket.department else None,
                'category': ticket.category.name if ticket.category else None,
                'created_at': ticket.created_at,
            })

        recent_tasks = task_filtered.order_by('-created_at')[:3]
        recent_tasks_data = []
        for task in recent_tasks:
            recent_tasks_data.append({
                'id': task.id,
                'task_id': task.task_trackid,
                'title': task.title,
                'description': task.description,
                'status': task.task_status,
                'creator_name': task.created_by.full_name() if task.created_by else None,  # Fixed: was task.assigned_to
                'assigned_to': task.assigned_to.full_name() if task.assigned_to else None,
                'department': task.department.name if task.department else None,
                'created_at': task.created_at,
            })

        # Generate graph data
        ticket_graph = generate_graph_data(tk_filtered, param, start_date if 'start_date' in locals() else now)
        task_graph = generate_graph_data(task_filtered, param, start_date if 'start_date' in locals() else now)

        # Count reopened tickets in the filtered period
        # Get ticket IDs that have been reopened
        reopened_ticket_ids = TicketReopen.objects.filter(
            created_at__gte=start_date if 'start_date' in locals() else now.replace(hour=0, minute=0, second=0, microsecond=0),
            created_at__lt=end_date if 'end_date' in locals() else (now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1))
        ).values_list('ticket_id', flat=True).distinct()
        reopened_count = len(reopened_ticket_ids)

        data = {
            "period": param,
            "cards": {
                "agents": Users.objects.filter(role__name='agent').count(),
                "departments": Department.objects.for_business().count(),
                "assets": 0,
                "articles": 0,
            },
            "ticket": {
                "all": tk_filtered.count(),
                "open": tk_filtered.exclude(status="closed").count(),
                "unassigned": tk_filtered.filter(assigned_to__isnull=True).count(),
                "closed": tk_filtered.filter(status="closed").count(),
                "breached": sum(1 for ticket in list(tk_filtered) if ticket.is_sla_breached),
                "assigned": tk_filtered.filter(status="assigned").count(),
                "reopened": reopened_count,
                "recent": recent_tickets_data,
                "graph": ticket_graph,
            },
            "task": {
                "all": task_filtered.count(),
                "open": task_filtered.exclude(task_status="completed").count(),
                "unassigned": task_filtered.filter(assigned_to__isnull=True).count(),
                "closed": task_filtered.filter(task_status="completed").count(),
                "breached": sum(1 for task in list(task_filtered) if task.is_overdue),
                "assigned": task_filtered.filter(task_status="assigned").count(),
                "recent": recent_tasks_data,
                "graph": task_graph
            }
        }

        return Response(data)
