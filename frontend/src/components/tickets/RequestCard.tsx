import React, { useState } from 'react';
import { MoreVertical, Check, Clock, User, Ticket, Zap, ArrowRight, AlertTriangle, Eye } from 'lucide-react';
import { DropdownMenu, DropdownItem } from '../ui/Dropdown';
import ConfirmDialog from '../ui/ConfirmDialog';
import { RequestViewModal } from './RequestViewModal';
import { useNavigate } from 'react-router-dom';

interface Request {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  creator_name: string;
  creator_email: string;
  creator_phone: string;
  ref_number: string;
  created_at: string;
  updated_at: string;
  converted_to_ticket: boolean;
  converted_to_task: boolean;
  attached_to?: string;
}

interface RequestCardProps {
  request: Request;
  onAction: (action: string, request: Request) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, onAction }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    action: string;
    message: string;
    variant: 'warning' | 'info';
  }>({ show: false, action: '', message: '', variant: 'warning' });

  const handleNavigateToTicket = () => {
    if (request.attached_to) {
      navigate(`/ticket/${request.attached_to}`);
    } else {
      // Fallback - navigate to tickets list
      navigate('/tickets');
    }
  };

  const handleNavigateToTask = () => {
    if (request.attached_to) {
      navigate(`/task/${request.attached_to}`);
    } else {
      // Fallback - navigate to tasks list
      navigate('/tasks');
    }
  };

  const handleViewClick = () => {
    setShowViewModal(true);
    setIsDropdownOpen(false);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
  };

  const handleActionClick = (action: string) => {
    if (action === 'view') {
      handleViewClick();
      return;
    }

    if (action === 'make_ticket') {
      setConfirmDialog({
        show: true,
        action: 'make_ticket',
        message: `Are you sure you want to convert this request to a support ticket? This will create a new ticket with SLA rules and assign it to the appropriate department.`,
        variant: 'info'
      });
    } else if (action === 'make_task') {
      setConfirmDialog({
        show: true,
        action: 'make_task',
        message: `Are you sure you want to convert this request to an internal task? This will create a task for department members to work on.`,
        variant: 'warning'
      });
    } else {
      onAction(action, request);
    }
    setIsDropdownOpen(false);
  };

  const handleConfirm = () => {
    onAction(confirmDialog.action, request);
    setConfirmDialog({ show: false, action: '', message: '', variant: 'warning' });
  };

  const handleCancel = () => {
    setConfirmDialog({ show: false, action: '', message: '', variant: 'warning' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 group p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{request.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{request.ref_number}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <MoreVertical size={14} className="text-gray-400 dark:text-gray-500" />
          </button>
          {isDropdownOpen && (
            <DropdownMenu isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)}>
              <div data-dropdown className="dropdown-menu">
                {/* View action always available */}
                <DropdownItem icon={Eye} onClick={() => handleActionClick('view')}>
                  View Details
                </DropdownItem>

                {(!request.converted_to_task  &&  !request.converted_to_ticket) && (
                  <DropdownItem icon={ArrowRight} onClick={() => handleActionClick('make_ticket')}>
                    Make Ticket
                  </DropdownItem>
                )}
                {(!request.converted_to_task  &&  !request.converted_to_ticket) && (
                  <DropdownItem icon={Zap} onClick={() => handleActionClick('make_task')}>
                    Make Task
                  </DropdownItem>
                )}
                {/* {request.status !== 'approved' && (
                  <DropdownItem icon={Check} onClick={() => handleActionClick('approve')}>
                    Approve
                  </DropdownItem>
                )} */}
              </div>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div
        className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2"
        dangerouslySetInnerHTML={{ __html: request.description }}
      />
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <User size={12} className="mr-1" />
            {request.creator_name}
          </div>
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            {new Date(request.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Converted Status Indicators */}
        {(request.converted_to_ticket || request.converted_to_task || request.status === 'approved') && (
          <div className="mt-2 flex flex-wrap gap-1">
            {request.converted_to_ticket && (
              <div
                onClick={handleNavigateToTicket}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer transition-colors duration-200"
                title="Click to view ticket"
              >
                <Ticket size={10} className="mr-1" />
                Ticket: {request.attached_to || "Created"}
              </div>
            )}
            {request.converted_to_task && (
              <div
                onClick={handleNavigateToTask}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 cursor-pointer transition-colors duration-200"
                title="Click to view task"
              >
                <Zap size={10} className="mr-1" />
                Task: {request.attached_to || "Created"}
              </div>
            )}
            {request.status === 'approved' && (
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Check size={10} className="mr-1" />
                Approved
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        message={confirmDialog.message}
        show={confirmDialog.show}
        onConfirm={handleConfirm}
        cancel={handleCancel}
        variant={confirmDialog.variant}
        title="Confirm Action"
        confirmText="Yes, Proceed"
        cancelText="Cancel"
      />

      {/* Request View Modal */}
      <RequestViewModal
        request={showViewModal ? request : null}
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
      />
    </div>
  );
};
