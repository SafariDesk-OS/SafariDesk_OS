# app/email_templates.py


class SystemTemplate:
    """
    Wrapper class for system email templates that mimics the DB EmailTemplate model interface.
    Allows direct use of EMAIL_TEMPLATES dict with Mailer.send_templated_email().
    """
    def __init__(self, name: str, data: dict):
        self.name = name
        self.subject = data.get("subject", "")
        self.body = data.get("body", "")
        self.description = data.get("description", "")
        self.type = data.get("type", "")


def get_system_template(template_name: str):
    """
    Get a system template by name directly from EMAIL_TEMPLATES.
    Returns a SystemTemplate object compatible with Mailer.send_templated_email().
    
    Usage:
        template = get_system_template("NEW_TICKET_AUTO_REPLY")
        mailer.send_templated_email(template=template, ...)
    """
    if template_name not in EMAIL_TEMPLATES:
        return None
    return SystemTemplate(template_name, EMAIL_TEMPLATES[template_name])


EMAIL_TEMPLATES = {
    # =========================
    # Ticket End-User Templates
    # =========================
    "NEW_ACTIVITY_NOTICE": {
        "type": "ticket",
        "description": "Notifies a user when there is new activity on their ticket.",
        "subject": "New Activity on Ticket #{{ticket_id}}",
        "body": """
Hello {{creator_name}},

There has been a new activity on your ticket #{{ticket_id}}: {{title}}.

You can view the ticket activity here: {{url}}

You can reply directly to this email to add more information.

Regards,
Support Team
"""
    },

    "NEW_MESSAGE_AUTO_RESPONSE": {
        "type": "ticket",
        "description": "Confirms to the user that their new message has been received.",
        "subject": "Re: Your Message Regarding Ticket #{{ticket_id}}",
        "body": """
Hello {{creator_name}},

We have received your message regarding ticket #{{ticket_id}}: {{title}}.
This is an automated confirmation that your message has been appended.

Regards,
Support Team
"""
    },

    "NEW_TICKET_AUTO_REPLY": {
        "type": "ticket",
        "description": "Sends an auto-reply to the user when a new ticket is created.",
        "subject": "Ticket #{{ticket_id}} Created Successfully",
        "body": """
Hello <strong>{{creator_name}}</strong>,

Thank you for contacting support. A new ticket has been created for you:

<strong>Ticket ID:</strong> {{ticket_id}}
<strong>Subject:</strong> {{title}}

Our support team will get back to you shortly.
"""
    },


    "NEW_TICKET_NOTICE": {
        "type": "ticket",
        "description": "Notifies agents when a new ticket is created by a user or on their behalf.",
        "subject": "New Ticket Created: #{{ticket_id}} - {{title}}",
        "body": """
Hello {{agent_name}},

A new ticket has been created on behalf of {{creator_name}}.
Ticket ID: {{ticket_id}}
Subject: {{title}}
Description: {{description}}
Priority: {{priority}}
Status: {{status}}
"""
    },

    "OVERLIMIT_NOTICE": {
        "type": "ticket",
        "description": "Informs the user they have reached the maximum allowed open tickets.",
        "subject": "Ticket Creation Limit Reached",
        "body": """
Hello {{creator_name}},

You have reached the maximum allowed open tickets ({{ticket_limit}}).
Please resolve or close an existing ticket before creating a new one.

Regards,
Support Team
"""
    },

    "RESPONSE_REPLY_TEMPLATE": {
        "type": "ticket",
        "description": "Sends a reply from an agent to the user for a ticket.",
        "subject": "Re: Ticket #{{ticket_id}} - {{title}}",
        "body": """
Hello {{creator_name}},

This is a response to your ticket #{{ticket_id}}: {{title}}.

Response from {{agent_name}}:
{{agent_response}}

Regards,
Support Team
"""
    },

    # =========================
    # Ticket Agent Templates
    # =========================
    "INTERNAL_ACTIVITY_ALERT": {
        "type": "ticket",
        "description": "Alerts agents when an internal activity (note or reply) is added to a ticket.",
        "subject": "Internal Activity on Ticket #{{ticket_id}}",
        "body": """
Hello {{agent_name}},

An internal activity has been added to ticket #{{ticket_id}}: {{title}}.
Activity: {{internal_note}}

Please review the update in the system: {{url}}
"""
    },

    "NEW_MESSAGE_ALERT": {
        "type": "ticket",
        "description": "Notifies agents when a user replies to an existing ticket.",
        "subject": "New Message on Ticket #{{ticket_id}}: {{title}}",
        "body": """
Hello {{agent_name}},

User {{creator_name}} has replied to ticket #{{ticket_id}}.
Message: {{user_message}}

You can view the ticket and reply here: {{url}}
"""
    },

    "NEW_TICKET_ALERT": {
        "type": "ticket",
        "description": "Notifies agents when a new ticket is created.",
        "subject": "New Ticket Alert: #{{ticket_id}} - {{title}}",
        "body": """
Hello {{agent_name}},

A new ticket has been created.
Ticket ID: {{ticket_id}}
Subject: {{title}}
Description: {{description}}
Creator: {{creator_name}} ({{creator_email}})
Priority: {{priority}}
Department: {{department_name}}


"""
    },

    "OVERDUE_TICKET_ALERT": {
        "type": "ticket",
        "description": "Alerts agents when a ticket becomes overdue.",
        "subject": "Overdue Ticket Alert: #{{ticket_id}} - {{title}}",
        "body": """
Hello {{agent_name}},

Ticket #{{ticket_id}} is overdue.
Subject: {{title}}
Due date: {{due_date}}
Priority: {{priority}}

Please take necessary action: {{url}}
"""
    },

    "TICKET_ASSIGNMENT_ALERT": {
        "type": "ticket",
        "description": "Notifies an agent when they are assigned to a ticket.",
        "subject": "You have been assigned to Ticket #{{ticket_id}}",
        "body": """
Hello {{agent_name}},

You have been assigned to ticket #{{ticket_id}}: {{title}}.
Priority: {{priority}}
Status: {{status}}
"""
    },

    "TICKET_TRANSFER_ALERT": {
        "type": "ticket",
        "description": "Notifies an agent when a ticket has been transferred to them.",
        "subject": "Ticket #{{ticket_id}} has been transferred to you",
        "body": """
Hello {{agent_name}},

Ticket #{{ticket_id}}: {{title}} has been transferred to you.
Previous agent: {{previous_agent}}
Priority: {{priority}}
Status: {{status}}
"""
    },

    # =========================
    # Task Templates
    # =========================
    "TASK_NEW_ACTIVITY_ALERT": {
        "type": "task",
        "description": "Alerts an agent when a new activity is added to a task.",
        "subject": "New Activity on Task #{{track_id}}",
        "body": """
Hello {{agent_name}},

A new activity has been added to task #{{track_id}}: {{title}}.
Activity: {{task_activity}}
"""
    },

    "TASK_NEW_ACTIVITY_NOTICE": {
        "type": "task",
        "description": "Notifies a user when there is an update on their task.",
        "subject": "Update on Task #{{track_id}}",
        "body": """
Hello {{user_name}},

There has been an update on task #{{track_id}}: {{title}}.
Update details: {{task_update}}
"""
    },

    "NEW_TASK_ALERT": {
        "type": "task",
        "description": "Notifies an agent when a new task is created.",
        "subject": "New Task Created: #{{track_id}} - {{title}}",
        "body": """
Hello {{agent_name}},

A new task has been created.
Task ID: {{track_id}}
Title: {{title}}
Description: {{description}}
Priority: {{priority}}
Due Date: {{due_date}}
"""
    },

    "OVERDUE_TASK_ALERT": {
        "type": "task",
        "description": "Alerts an agent when a task becomes overdue.",
        "subject": "Overdue Task Alert: #{{track_id}} - {{title}}",
        "body": """
Hello {{agent_name}},

Task #{{track_id}}: {{title}} is overdue.
Due date: {{due_date}}
Priority: {{priority}}
"""
    },

    "TASK_ASSIGNMENT_ALERT": {
        "type": "task",
        "description": "Notifies an agent when they are assigned to a task.",
        "subject": "You have been assigned to Task #{{track_id}}",
        "body": """
Hello {{agent_name}},

You have been assigned to task #{{track_id}}: {{title}}.
Description: {{description}}
Priority: {{priority}}
Due Date: {{due_date}}
"""
    },

    "TASK_TRANSFER_ALERT": {
        "type": "task",
        "description": "Notifies an agent when a task is transferred to them.",
        "subject": "Task #{{track_id}} has been transferred to you",
        "body": """
Hello {{agent_name}},

Task #{{track_id}}: {{title}} has been transferred to you.
Previous assignee: {{previous_agent}}
"""
    },

    # =========================
    # SLA Templates
    # =========================
    "SLA_REMINDER_TASK": {
        "type": "sla",
        "description": "Reminds agents of an approaching SLA deadline for a task.",
        "subject": "SLA Reminder for Task #{{track_id}}: {{title}}",
        "body": """
Hello {{agent_name}},

This is a reminder for task #{{track_id}}.
Subject: {{title}}

The SLA resolution time is approaching.
SLA Name: {{sla_name}}
Remaining time: {{remaining_time}}

Please ensure timely action to avoid escalation: {{url}}
"""
    },

    "SLA_ESCALATION_NOTICE_TASK": {
        "type": "sla",
        "description": "Notifies a manager that a task has been escalated due to SLA breach.",
        "subject": "SLA Escalation Notice for Task #{{track_id}}: {{title}}",
        "body": """
Hello {{escalation_manager}},

Task #{{track_id}} has been escalated due to SLA breach.
Subject: {{title}}
Assigned agent: {{assigned_to_name}}
SLA Name: {{sla_name}}

Escalation reason: {{escalation_reason}}

Please review the task: {{url}}
"""
    },

    "SLA_REMINDER": {
        "type": "sla",
        "description": "Reminds agents of an approaching SLA deadline.",
        "subject": "SLA Reminder for Ticket #{{ticket_id}}: {{title}}",
        "body": """
Hello {{agent_name}},

This is a reminder for ticket #{{ticket_id}}.
Subject: {{title}}

The SLA response time is approaching.
SLA Name: {{sla_name}}
Remaining time: {{remaining_time}}

Please ensure timely action to avoid escalation: {{url}}
"""
    },

    "SLA_ESCALATION_NOTICE": {
        "type": "sla",
        "description": "Notifies a manager that a ticket has been escalated due to SLA breach.",
        "subject": "SLA Escalation Notice for Ticket #{{ticket_id}}: {{title}}",
        "body": """
Hello {{escalation_manager}},

Ticket #{{ticket_id}} has been escalated due to SLA breach.
Subject: {{title}}
Assigned agent: {{assigned_to_name}}
User: {{creator_name}}
SLA Name: {{sla_name}}

Escalation reason: {{escalation_reason}}

Please review the ticket: {{url}}
"""
    },

    "SLA_FIRST_RESPONSE_BREACH": {
        "type": "sla",
        "description": "Notifies agents when a ticket breaches the first response SLA.",
        "subject": "First Response SLA Breach on Ticket #{{ticket_id}}: {{title}}",
        "body": """
Hello {{agent_name}},

Ticket #{{ticket_id}} has breached the **first response SLA**.
Subject: {{title}}
User: {{creator_name}}
SLA Name: {{sla_name}}

Please respond immediately to avoid further escalation: {{url}}
"""
    },

    "SLA_FIRST_RESPONSE_NOTIFICATION_ESCALATION": {
        "type": "sla",
        "description": "Notifies agents when first response time has elapsed for tickets not on hold.",
        "subject": "First Response Time Elapsed - Ticket #{{ticket_id}}: {{title}}",
        "body": """
Hello {{agent_name}},

The first response time has elapsed for ticket #{{ticket_id}}: {{title}}.

Ticket Details:
- Subject: {{title}}
- User: {{creator_name}}
- Priority: {{priority}}
- SLA Name: {{sla_name}}
- Status: {{status}}This ticket requires immediate attention. Please provide a first response as soon as possible.


"""
    },

    "SLA_RESOLUTION_BREACH": {
        "type": "sla",
        "description": "Notifies agents when a ticket breaches the resolution SLA.",
        "subject": "Resolution SLA Breach on Ticket #{{ticket_id}}: {{title}}",
        "body": """
Hello {{agent_name}},

Ticket #{{ticket_id}} has breached the **resolution SLA**.
Subject: {{title}}
User: {{creator_name}}
SLA Name: {{sla_name}}
Due date: {{due_date}}

Please take action on the ticket: {{url}}
"""
    },

    "SLA_ESCALATION_TO_USER": {
        "type": "sla",
        "description": "Notifies the user when their ticket has been escalated due to SLA breach.",
        "subject": "Update on your Ticket #{{ticket_id}}",
        "body": """
Hello {{creator_name}},

We’re sorry to inform you that your ticket #{{ticket_id}}: {{title}}
has not been resolved within the agreed SLA.

The case has been escalated to our senior support team.
We’ll keep you updated. You can view your ticket here: {{url}}

Regards,
Support Team
"""
    },

    "SLA_WARNING_NOTICE": {
        "type": "sla",
        "description": "Warns agents that a ticket is at risk of breaching SLA.",
        "subject": "SLA Warning for Ticket #{{ticket_id}}: {{title}}",
        "body": """
Hello {{agent_name}},

Ticket #{{ticket_id}} is at risk of breaching SLA.
Subject: {{title}}
SLA Name: {{sla_name}}
Time left: {{time_left}}
Action required: {{required_action}}

Please review the ticket: {{url}}
"""
    },

    "SLA_RESOLVED_NOTICE": {
        "type": "sla",
        "description": "Notifies the user when their ticket is resolved within SLA.",
        "subject": "Ticket #{{ticket_id}} Resolved within SLA",
        "body": """
Hello {{creator_name}},

Good news! Your ticket #{{ticket_id}}: {{title}} has been resolved
within the SLA time frame.

Resolution details: {{resolution_summary}}

Thank you for your patience.
"""
    },

    "SLA_ESCALATION_RESOLVED": {
        "type": "sla",
        "description": "Notifies a manager that an escalated ticket has been resolved.",
        "subject": "Escalated Ticket #{{ticket_id}} Resolved",
        "body": """
Hello {{manager_name}},

Escalated ticket #{{ticket_id}}: {{title}} has been resolved.
Agent: {{assigned_to_name}}
User: {{creator_name}}
Resolution details: {{resolution_summary}}


"""
    },

    # =========================
    # Request Templates
    # =========================
    "NEW_REQUEST_ACKNOWLEDGMENT": {
        "type": "request",
        "description": "Sends acknowledgment email to the request creator when their request is received.",
        "subject": "Request #{{ref_number}} Received - Acknowledgment",
        "body": """
Hello {{creator_name}},

We have received your request (Reference: {{ref_number}}): {{title}}.

Request Details:
Subject: {{title}}
Description: {{description}}
Type: {{type}}
Created: {{created_at}}

Our team will review your request and get back to you shortly.

You can track your request here: {{url}}

Regards,
Support Team
"""
    },

    "NEW_REQUEST_ADMIN_ALERT": {
        "type": "request",
        "description": "Notifies admin users when a new request is created.",
        "subject": "New Request Alert: #{{ref_number}} - {{title}}",
        "body": """
Hello Admin,

A new request has been submitted requiring your attention.

Request Details:
Reference ID: {{ref_number}}
Subject: {{title}}
Description: {{description}}
Type: {{type}}
Creator: {{creator_name}} ({{creator_email}})
Phone: {{creator_phone}}
Created: {{created_at}}

Please review and process this request: {{url}}

Regards,
Support Team
"""
    },

    "REQUEST_CONVERTED_TO_TICKET": {
        "type": "request",
        "description": "Notifies about request conversion to ticket.",
        "subject": "Your Request #{{ref_number}} has been converted to a Ticket",
        "body": """
Hello {{creator_name}},

Your request (ID: {{ref_number}}): {{title}} has been processed and converted to a support ticket.

New Ticket Details:
Ticket ID: {{ticket_id}}
Subject: {{title}}
Description: {{description}}
Priority: {{priority}}
Department: {{department_name}}

Our support team will now handle this ticket according to standard procedures.

Regards,
Support Team
"""
    },

    "REQUEST_CONVERTED_TO_TASK": {
        "type": "request",
        "description": "Notifies about request conversion to task.",
        "subject": "Your Request #{{ref_number}} has been converted to a Task",
        "body": """
Hello {{creator_name}},

Your request (ID: {{ref_number}}): {{title}} has been processed and converted to an internal task.

Task Details:
Task ID: {{task_id}}
Subject: {{title}}
Description: {{description}}
Due Date: {{due_date}}
Department: {{department_name}}

The assigned team will work on this task and complete it by the due date.

You can track progress here: {{url}}

Regards,
Support Team
"""
    },

    "REQUEST_APPROVED": {
        "type": "request",
        "description": "Notifies the user when their request is approved.",
        "subject": "Request #{{ref_number}} Approved",
        "body": """
Hello {{creator_name}},

Your request (ID: {{ref_number}}): {{title}} has been **approved**.

Approval Details:
Request Type: {{type}}
Approved At: {{approved_at}}
Approved By: {{approver_name}}

Your request is now ready for implementation.

Regards,
Support Team
"""
    },

    "REQUEST_SUBMITTED": {
        "type": "request",
        "description": "Notifies the user that their request has been submitted.",
        "subject": "Your Request #{{ref_number}} has been submitted",
        "body": """
Hello {{creator_name}},

Your request (ID: {{ref_number}}) has been submitted successfully.
Subject: {{title}}
Description: {{description}}

You can view your request here: {{url}}
You will be notified as soon as it is reviewed.

Regards,
Support Team
"""
    },

    "REQUEST_ACKNOWLEDGEMENT": {
        "type": "request",
        "description": "Acknowledges that the request has been received and is being reviewed.",
        "subject": "Acknowledgement of your Request #{{ref_number}}",
        "body": """
Hello {{creator_name}},

We have received your request (ID: {{ref_number}}): {{title}}.
Our team is reviewing it and will update you shortly.

You can view your request here: {{url}}

Regards,
Support Team
"""
    },

    "REQUEST_APPROVAL_NOTICE": {
        "type": "request",
        "description": "Notifies the user when their request is approved.",
        "subject": "Your Request #{{ref_number}} has been Approved",
        "body": """
Hello {{creator_name}},

Your request (ID: {{ref_number}}): {{title}} has been **approved**.

Approved by: {{approver_name}}
Remarks: {{approval_remarks}}

You can view your request here: {{url}}

Regards,
Support Team
"""
    },

    "REQUEST_REJECTION_NOTICE": {
        "type": "request",
        "description": "Notifies the user when their request is rejected.",
        "subject": "Your Request #{{ref_number}} has been Rejected",
        "body": """
Hello {{creator_name}},

Your request (ID: {{ref_number}}): {{title}} has been **rejected**.

Rejected by: {{approver_name}}
Reason: {{rejection_reason}}

You can view your request here: {{url}}

Regards,
Support Team
"""
    },

    "REQUEST_PENDING_APPROVAL": {
        "type": "request",
        "description": "Notifies an approver that a new request is waiting for their approval.",
        "subject": "Pending Approval for Request #{{ref_number}}",
        "body": """
Hello {{approver_name}},

A new request (ID: {{ref_number}}) from {{creator_name}}
is pending your approval.

Subject: {{title}}
Description: {{description}}

Please review the request: {{url}}
"""
    },

    "REQUEST_ESCALATION_NOTICE": {
        "type": "request",
        "description": "Notifies a manager that a request has been escalated due to pending action.",
        "subject": "Request #{{ref_number}} Escalated",
        "body": """
Hello {{manager_name}},

Request (ID: {{ref_number}}): {{title}} submitted by {{creator_name}}
has been escalated due to pending action.

Escalation reason: {{escalation_reason}}

Please review the request: {{url}}
"""
    },

    "REQUEST_STATUS_UPDATE": {
        "type": "request",
        "description": "Notifies the user when the status of their request changes.",
        "subject": "Status Update for Request #{{ref_number}}",
        "body": """
Hello {{creator_name}},

The status of your request (ID: {{ref_number}}): {{title}} has changed.
New status: {{status}}
Updated by: {{updated_by}}

You can view your request here: {{url}}

Regards,
Support Team
"""
    },

    "REQUEST_COMPLETION_NOTICE": {
        "type": "request",
        "description": "Notifies the user when their request is completed.",
        "subject": "Your Request #{{ref_number}} is Complete",
        "body": """
Hello {{creator_name}},

Your request (ID: {{ref_number}}): {{title}} has been successfully completed.

Completion details: {{completion_notes}}

You can view your request here: {{url}}

Thank you for your patience.
Regards,
Support Team
"""
    },

    "REQUEST_REMINDER": {
        "type": "request",
        "description": "Sends a reminder to an approver for a pending request.",
        "subject": "Reminder: Pending Request #{{ref_number}}",
        "body": """
Hello {{approver_name}},

This is a reminder for pending request (ID: {{ref_number}}): {{title}}.
Submitted by: {{creator_name}}

Please take action to avoid escalation: {{url}}
"""
    },

    # =========================
    # Comment Interaction Templates
    # =========================
    "COMMENT_LIKED_NOTICE": {
        "type": "comment",
        "description": "Notifies a user when their comment is liked.",
        "subject": "Your comment was liked on Ticket #{{ticket_id}}",
        "body": """
Hello {{comment_author_name}},

Your comment on ticket #{{ticket_id}}: {{ticket_title}} has been liked by {{liker_name}}.

Comment: {{comment_content}}
Liked by: {{liker_name}}

Regards,
Support Team
"""
    },

    "COMMENT_FLAGGED_NOTICE": {
        "type": "comment",
        "description": "Notifies relevant users when a comment is flagged.",
        "subject": "Comment flagged on Ticket #{{ticket_id}}",
        "body": """
Hello {{agent_name}},

A comment has been flagged on ticket #{{ticket_id}}: {{ticket_title}}.

Comment author: {{comment_author_name}}
Comment: {{comment_content}}
Flagged by: {{flagger_name}}

Please review the flagged comment: {{url}}

Regards,
Support Team
"""
    },

    "COMMENT_REPLY_NOTICE": {
        "type": "comment",
        "description": "Notifies users when someone replies to a comment.",
        "subject": "New reply on Ticket #{{ticket_id}}",
        "body": """
Hello {{recipient_name}},

{{replier_name}} has replied to a comment on ticket #{{ticket_id}}: {{ticket_title}}.

Original comment by {{comment_author_name}}: {{original_comment_content}}

Reply by {{replier_name}}: {{reply_content}}

You can view the ticket and reply here: {{url}}

Regards,
Support Team
"""
    },

    "COMMENT_ACTIVITY_NOTICE": {
        "type": "comment",
        "description": "General notification for comment activity on tickets.",
        "subject": "New comment activity on Ticket #{{ticket_id}}",
        "body": """
Hello {{recipient_name}},

There is new comment activity on ticket #{{ticket_id}}: {{ticket_title}}.

{{activity_description}}

Regards,
Support Team
"""
    },
}
