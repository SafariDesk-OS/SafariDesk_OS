import React, { useState, useEffect } from 'react';
import http from '../../../services/http';
import { APIS } from '../../../services/apis';
import { errorNotification, successNotification } from '../../../components/ui/Toast';
import { ActivityStream, ActivityItem, ActivityAuthor } from '../../../components/ActivityStream';
import { useAuthStore } from '../../../stores/authStore';

interface Mailbox {
  id: number;
  email_address: string;
  provider: string;
  display_name?: string;
}

interface TicketInfo {
  id: number;
  creator_email: string;
  creator_name: string;
  source: 'email' | 'portal' | 'api' | 'phone' | 'chat' | 'web';
}

interface TicketActivityStreamProps {
  ticketId: number;
  ticket?: TicketInfo;
  reloader: number;
  isCustomerView?: boolean;
  onClose?: () => void;
  onStatusChange?: () => void;  // Callback to refresh ticket after status change
}

export const TicketActivityStream: React.FC<TicketActivityStreamProps> = ({
  ticketId,
  ticket,
  reloader,
  isCustomerView = false,
  onClose,
  onStatusChange,
}) => {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);

  const currentUser: ActivityAuthor = {
    id: user?.id || 0,
    name: user?.full_name || `${user?.first_name} ${user?.last_name}`,
    email: user?.email || '',
    avatar: user?.avatar_url,
  };

  // Fetch mailboxes for email reply
  useEffect(() => {
    const fetchMailboxes = async () => {
      if (isCustomerView) return; // Don't fetch for customer view
      try {
        const response = await http.get(APIS.MAIL_INTEGRATIONS);
        const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
        // Filter active mailboxes that can send outgoing emails
        const activeMailboxes = data.filter((m: any) =>
          m.is_active &&
          m.connection_status === 'connected' &&
          ['both', 'outgoing'].includes(m.direction)
        );
        setMailboxes(activeMailboxes);
      } catch (error) {
        console.error('Failed to fetch mailboxes:', error);
      }
    };
    fetchMailboxes();
  }, [isCustomerView]);

  // Fetch activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await http.get(`${APIS.LOAD_TICKET_COMMENTS}/${ticketId}`);

      // Filter internal comments for customer view
      let activitiesData = response.data;
      if (isCustomerView) {
        activitiesData = activitiesData.filter((activity: ActivityItem) => {
          if (activity.type === 'comment' && 'is_internal' in activity) {
            return !activity.is_internal;
          }
          return true;
        });
      }

      setActivities(activitiesData);
    } catch (error: any) {
      console.error('Failed to load activities:', error);
      errorNotification(error?.response?.data?.message || 'Failed to load activity stream');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchActivities();
    }
  }, [ticketId, reloader]);

  // Handle adding a comment
  const handleAddComment = async (content: string, isInternal: boolean, attachments?: File[]) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('comment', content);
      formData.append('is_internal', isCustomerView ? 'false' : String(isInternal));

      if (attachments && attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append('files', file);
        });
      }

      await http.post(`${APIS.TICKET_COMMENT}${ticketId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      successNotification('Comment added successfully');
      fetchActivities();
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      errorNotification(error?.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle sending email reply
  const handleSendEmail = async (data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    content: string;
    mailboxId?: number;
    closeTicket?: boolean;
  }) => {
    setSubmitting(true);
    try {
      await http.post(`${APIS.SEND_EMAIL_REPLY}${ticketId}/email-reply/`, {
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        content: data.content,
        mailbox_id: data.mailboxId,
        close_ticket: data.closeTicket || false,
      });

      successNotification(data.closeTicket ? 'Email sent and ticket closed' : 'Email reply sent');
      fetchActivities();

      if (data.closeTicket && onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to send email:', error);
      errorNotification(error?.response?.data?.message || 'Failed to send email');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle editing a comment
  const handleEditComment = async (commentId: number, content: string) => {
    try {
      await http.patch(`${APIS.TICKET_COMMENT}${ticketId}/comment/${commentId}`, {
        content,
      });

      successNotification('Comment updated successfully');
      fetchActivities();
    } catch (error: any) {
      console.error('Failed to update comment:', error);
      errorNotification(error?.response?.data?.message || 'Failed to update comment');
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId: number) => {
    try {
      await http.delete(`${APIS.TICKET_COMMENT}${ticketId}/comment/${commentId}`);

      successNotification('Comment deleted successfully');
      fetchActivities();
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      errorNotification(error?.response?.data?.message || 'Failed to delete comment');
    }
  };

  // Handle marking ticket status (for dropdown options)
  const handleMarkStatus = async (status: 'pending' | 'resolved') => {
    if (isCustomerView) return;
    try {
      await http.put(`${APIS.TICKET_UPDATE_STATUS}/${ticketId}`, {
        status: status
      });
      successNotification(`Ticket marked as ${status}`);
      if (onStatusChange) {
        onStatusChange();  // Refresh ticket data
      }
      await fetchActivities();  // Refresh activity stream
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || `Failed to update ticket status`;
      errorNotification(errorMessage);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <ActivityStream
      activities={activities}
      currentUser={currentUser}
      onAddComment={handleAddComment}
      onSendEmail={!isCustomerView ? handleSendEmail : undefined}
      onMarkStatus={!isCustomerView ? handleMarkStatus : undefined}
      onEditComment={handleEditComment}
      onDeleteComment={handleDeleteComment}
      onCloseItem={onClose}
      closeButtonText="Close Ticket"
      loading={submitting}
      isPublic={!isCustomerView}
      ticket={ticket}
      mailboxes={mailboxes}
    />
  );
};
