import React, { useState } from 'react';
import { ActivityComment } from './ActivityComment';
import { ActivitySystemEvent } from './ActivitySystemEvent';
import { ActivityCommentInput } from './ActivityCommentInput';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';

export interface ActivityAuthor {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface ActivityCommentData {
  id: number;
  type: 'comment';
  content: string;
  author: ActivityAuthor;
  created_at: string;
  updated_at: string;
  is_internal?: boolean;
  is_solution?: boolean;
  attachments?: Array<{
    id: number;
    file_url: string;
    filename?: string;  // Original filename from backend
  }>;
  replies?: ActivityCommentData[];
  likes_count?: number;
  source_ticket?: {
    id: number | string;
    ticket_id: string;
    title?: string;
  };
  // Email recipient fields (for email replies)
  email_to?: string[];
  email_cc?: string[];
  email_bcc?: string[];
}

export interface ActivitySystemEventData {
  id: number;
  type: 'system_event';
  activity_type: 'created' | 'updated' | 'commented' | 'assigned' | 'status_changed' | 'priority_changed' | 'label_added' | 'attachment_added' | 'resolved' | 'closed' | 'task_linked' | 'attached_to_ticket';
  user: ActivityAuthor;
  timestamp: string;
  description: string;
  old_value?: string;
  new_value?: string;
  source_ticket?: {
    id: number | string;
    ticket_id: string;
    title?: string;
  };
}

export type ActivityItem = ActivityCommentData | ActivitySystemEventData;

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

interface ActivityStreamProps {
  activities: ActivityItem[];
  currentUser: ActivityAuthor;
  onAddComment: (content: string, isInternal: boolean, attachments?: File[]) => Promise<void>;
  onSendEmail?: (data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    content: string;
    mailboxId?: number;
    closeTicket?: boolean;
  }) => Promise<void>;
  onMarkStatus?: (status: 'pending' | 'resolved') => Promise<void>;
  onEditComment?: (commentId: number, content: string) => Promise<void>;
  onDeleteComment?: (commentId: number) => Promise<void>;
  onCloseItem?: () => void;
  closeButtonText?: string;
  loading?: boolean;
  isPublic?: boolean;
  ticket?: TicketInfo;
  mailboxes?: Mailbox[];
}

export const ActivityStream: React.FC<ActivityStreamProps> = ({
  activities,
  currentUser,
  onAddComment,
  onSendEmail,
  onMarkStatus,
  onEditComment,
  onDeleteComment,
  onCloseItem: _onCloseItem,
  closeButtonText: _closeButtonText = 'Close Ticket',
  loading = false,
  isPublic = false,
  ticket,
  mailboxes = [],
}) => {
  const [allCollapsed, setAllCollapsed] = useState(false);

  // Count comment activities for toggle button visibility
  const commentCount = activities.filter(a => a.type === 'comment').length;

  return (
    <div className="space-y-6">
      {/* Header with title and collapse toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity</h3>
        {commentCount > 1 && (
          <button
            onClick={() => setAllCollapsed(!allCollapsed)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title={allCollapsed ? 'Expand All' : 'Collapse All'}
          >
            {allCollapsed ? (
              <>
                <ChevronsUpDown size={14} />
                <span>Expand All</span>
              </>
            ) : (
              <>
                <ChevronsDownUp size={14} />
                <span>Collapse All</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Activity Stream Grid */}
      <div className="space-y-4">
        {/* Timeline with Activities */}
        <div className="grid grid-cols-[auto,1fr] gap-x-4">
          {/* Timeline Connector */}
          <div className="relative col-start-1 w-8 flex justify-center">
            <div className="absolute h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
          </div>

          {/* Activity Items */}
          <div className="col-start-2 space-y-4">
            {activities.map((activity) => (
              <div key={`activity-${activity.id}-${activity.type}`}>
                {activity.type === 'comment' ? (
                  <ActivityComment
                    comment={activity}
                    onEdit={onEditComment}
                    onDelete={onDeleteComment}
                    currentUser={currentUser}
                    defaultCollapsed={allCollapsed}
                  />
                ) : (
                  <ActivitySystemEvent event={activity} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Comment Component - Outside grid to avoid row constraints */}
        <div className="grid grid-cols-[auto,1fr] gap-x-4">
          <div className="col-start-1 w-8 flex justify-start pt-1">
            {/* Empty column to align with timeline */}
          </div>
          <div className="col-start-2">
            <ActivityCommentInput
              currentUser={currentUser}
              onSubmit={onAddComment}
              onSendEmail={onSendEmail}
              onMarkStatus={onMarkStatus}
              loading={loading}
              isPublic={isPublic}
              ticket={ticket}
              mailboxes={mailboxes}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
