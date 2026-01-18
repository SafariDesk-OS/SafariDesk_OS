import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Home,
  FileText,
  CheckCircle,
  MessageSquare,
  Paperclip,
  AlertTriangle,
  X,
  RotateCcw,
  List,
} from 'lucide-react';
import { APIS } from '../../services/apis';
import { successNotification, errorNotification } from '../../components/ui/Toast';
import { TicketData } from '../../types';
import { formatRelativeTime } from '../../utils/helper';
import TicketViewSkeleton from '../../components/loader/TicketViewSkeleton';
import TicketAttachments from '../../pages/ticket/mini/TicketAttachments';
import { TicketActivityStream } from '../../pages/ticket/mini/TicketActivityStream';
import http from '../../services/http'; // Import the http instance
import { Modal } from '../../components/ui/Modal'; // Import Modal component

interface CustomerTicketViewProps {
  ticketData: TicketData;
  onClose: () => void;
}

const CustomerTicketView: React.FC<CustomerTicketViewProps> = ({ ticketData }) => {
  const [reloader, setReloader] = useState<number>(0)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('activity');
  const [ticketStatus, setTicketStatus] = useState(ticketData.ticket.status);
  const [closingReason, setClosingReason] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const { ticket } = ticketData;

  const handleCloseTicket = async () => {
    try {
      const response = await http.put(`${APIS.TICKET_UPDATE_STATUS}/${ticket.id}`, {
        status: 'closed',
        notes: closingReason || 'Customer closed the ticket'
      });
      successNotification('Ticket closed successfully');
      setTicketStatus('closed');
      setShowCloseModal(false);
      setClosingReason('');
      setReloader(prev => prev + 1);
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || 'Failed to close ticket');
    }
  };

  const handleReopenTicket = async () => {
    try {
      const response = await http.post(`${APIS.TICKET_BASE}/${ticket.id}/reopen/`, {
        reason: reopenReason || 'Customer reopened the ticket'
      });
      successNotification('Ticket reopened successfully');
      setTicketStatus('open');
      setShowReopenModal(false);
      setReopenReason('');
      setReloader(prev => prev + 1);
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || 'Failed to reopen ticket');
    }
  };

  if (loading) {
    return <TicketViewSkeleton />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <div className="flex">
            <div className="py-1"><AlertTriangle className="h-6 w-6 text-red-500 mr-4" /></div>
            <div>
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Removed back button as modal has its own close */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {ticket.ticket_id}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              More info about ticket
            </p>
          </div>
        </div>
      </div>


      {/* Header and Summary Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex gap-6">
          {/* Header Section - 70% width */}
          <div className="flex-1" style={{ flexBasis: '70%' }}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-1xl font-bold text-gray-600 dark:text-gray-100 mb-2">
                  {`${ticket.title}`}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {ticket.ticket_id} • Created {formatRelativeTime(ticket.created_at)}
                </p>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticketStatus)}`}>
                    {ticketStatus.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority.toUpperCase()}
                  </span>
                  {ticket.is_overdue && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                      OVERDUE
                    </span>
                  )}
                  {/* Close/Reopen Buttons */}
                  {ticketStatus !== 'closed' ? (
                    <button
                      onClick={() => setShowCloseModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
                    >
                      <X size={16} />
                      <span>Close Ticket</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowReopenModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-900/40 transition-colors text-sm font-medium"
                    >
                      <RotateCcw size={16} />
                      <span>Reopen Ticket</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Ticket Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Creator Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Creator</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4 mr-2" />
                    {ticket.creator_name}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4 mr-2" />
                    {ticket.creator_email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 mr-2" />
                    {ticket.creator_phone}
                  </div>
                </div>
              </div>

              {/* Assignment Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Assignment</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4 mr-2" />
                    {ticket.assigned_to ? ticket.assigned_to.name : 'Unassigned'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Home className="w-4 h-4 mr-2" />
                    {ticket.department?.name || 'Not assigned'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FileText className="w-4 h-4 mr-2" />
                    {ticket.category?.name || 'Uncategorized'}
                  </div>
                </div>
              </div>

              {/* Timeline Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    Created: {formatDate(ticket.created_at)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-2" />
                    Due: {ticket.due_date ? formatDate(ticket.due_date) : 'N/A'}
                  </div>
                  {ticket.resolved_at && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolved: {formatDate(ticket.resolved_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Description</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div
                  className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: ticket.description }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'activity'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <List className="w-4 h-4" />
              <span>Activity Stream</span>
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'attachments'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <Paperclip className="w-4 h-4" />
              <span>Attachments</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'activity' && (
            <TicketActivityStream
              ticketId={ticket.id}
              reloader={reloader}
              isCustomerView={true}
            />
          )}

          {activeTab === 'attachments' && (
            <TicketAttachments ticketId={ticket.id} />
          )}
        </div>
      </div>

      {/* Close Ticket Modal - Using reusable Modal component */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => {
          setShowCloseModal(false);
          setClosingReason('');
        }}
        title="Close Ticket"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to close this ticket? You can reopen it later if needed.
          </p>
          <textarea
            value={closingReason}
            onChange={(e) => setClosingReason(e.target.value)}
            placeholder="Enter reason for closing (optional)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            rows={3}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowCloseModal(false);
                setClosingReason('');
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCloseTicket}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              Close Ticket
            </button>
          </div>
        </div>
      </Modal>

      {/* Reopen Ticket Modal - Using reusable Modal component */}
      <Modal
        isOpen={showReopenModal}
        onClose={() => {
          setShowReopenModal(false);
          setReopenReason('');
        }}
        title="Reopen Ticket"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to reopen this ticket? It will be available for further updates.
          </p>
          <textarea
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="Enter reason for reopening"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={3}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowReopenModal(false);
                setReopenReason('');
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReopenTicket}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Reopen Ticket
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );

};

export default CustomerTicketView;
