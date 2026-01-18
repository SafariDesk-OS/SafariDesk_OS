import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, CheckCircle, Circle, AlertCircle, FileText, Settings, KeyRound, AlertTriangle, Lightbulb, BookOpen, MessageCircle, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import http from '../../services/http';
import { APIS } from '../../services/apis';
import { errorNotification } from '../../components/ui/Toast';
import Spinner from '../../components/ui/DataLoader';
import { CustomerLayout } from './layout/CustomerLayout';
import { KBArticle } from '../../types/knowledge';
import ChatbotWidget from '../../components/chatbot/ChatbotWidget';
import { Modal } from '../../components/ui/Modal';
import { CreateTicketModal } from '../../components/tickets/CreateTicketModal';

// Service Portal Content for Non-Authenticated Users
const ServicePortalContent: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [latestArticles, setLatestArticles] = useState<KBArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        const response = await http.get(APIS.PUBLIC_KB_ARTICLES, {
          params: { page_size: 5 }, // Fetch 5 latest articles
        });
        setLatestArticles(response.data.results);
      } catch (error) {
        console.error("Failed to load latest articles", error);
      } finally {
        setArticlesLoading(false);
      }
    };
    fetchLatestArticles();
  }, []);

  const openChat = () => setChatOpen(true);

  return (
    <div className="max-w-6xl mx-auto">
      {/* System Status */}
      <div className="mb-8 flex items-center justify-center">
        <div className="flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full">
          <CheckCircle className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">No Outages</span>
          <span className="mx-2">•</span>
          <span className="text-sm">All systems are operational</span>
        </div>
      </div>

      {/* Get Quick Help Section */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Get Quick help</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create a ticket or chat with us. Incidents, service requests, and ideas are all routed through the same form.
        </p>
      </div>

      {/* Primary actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <PlusCircle className="w-5 h-5" />
          Create Ticket
        </button>
        <button
          onClick={openChat}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition"
        >
          <MessageCircle className="w-5 h-5" />
          Chat with Support
        </button>
      </div>

      {/* Quick Help Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Report an Issue */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 bg-white dark:bg-gray-800">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Report an Issue</h3>
            </div>
          </div>
          <p className="text-xs font-semibold text-green-600 mb-1">Incidents</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Something broken or down? Open an incident and we’ll triage it.
          </p>
        </div>

        {/* Request Service */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 bg-white dark:bg-gray-800">
                <Settings className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Request Service</h3>
            </div>
          </div>
          <p className="text-xs font-semibold text-green-600 mb-1">Requests</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need access, a change, or something set up? Submit a service request.
          </p>
        </div>

        {/* Suggest an Idea */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 bg-white dark:bg-gray-800">
                <Lightbulb className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Suggest an Idea</h3>
            </div>
          </div>
          <p className="text-xs font-semibold text-green-600 mb-1">Ideas</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Share feedback or improvements—we’re listening.
          </p>
        </div>
      </div>
      {/* Popular Knowledge Base Articles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">Latest Articles</h2>
          <a href="/helpcenter/kb" className="text-sm font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
            View All →
          </a>
        </div>
        <div className="space-y-4">
          {articlesLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))
          ) : (
            latestArticles.map(article => (
              <a href={`/helpcenter/kb/${article.slug}`} key={article.id} className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">{article.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{article.excerpt}</p>
              </a>
            ))
          )}
        </div>
      </div>
      {/* Chatbot Widget */}
      <ChatbotWidget mode="customer" open={chatOpen} onOpenChange={setChatOpen} />

      {/* Create Ticket Modal */}
      <Modal
        size="4xl"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Ticket"
        closeOnBackdropClick={false}
      >
        {isModalOpen && (
          <CreateTicketModal
            onclose={() => setIsModalOpen(false)}
            loadFromApi={false}
            categories={categories}
            departments={departments}
            variant="customer"
          />
        )}
      </Modal>
    </div>
  );
};

const calculateMonthsAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30); // Approximation

    if (diffMonths === 0) {
        return "less than a month ago";
    } else if (diffMonths === 1) {
        return "1 month ago";
    } else {
        return `${diffMonths} months ago`;
    }
};

interface Category {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
}

interface AssignedTo {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
}

import { TicketData } from '../../types'; // Import TicketData type

interface TicketSummary { // Renamed to avoid conflict and represent summary data
    id: number;
    title: string;
    creator_name: string;
    creator_phone: string;
    creator_email: string;
    ticket_id: string;
    description: string;
    category: Category;
    department: Department;
    priority: string;
    priority_display: string;
    is_public: boolean;
    status: string;
    status_display: string;
    created_at: string;
    assigned_to: AssignedTo | null;
}


const CustomerIndex: React.FC = () => {
    const navigate = useNavigate();
  
  const { user, isAuthenticated } = useAuthStore(); // Get isAuthenticated
  const [loading, setLoading] = useState(false);
  const [reloader, setReloader ] = useState<number>(0); // Add reloader state
  const [tickets, setTickets] = useState<TicketSummary[]>([]); // Use TicketSummary

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await http.get(APIS.LOAD_CUSTOMER_TICKETS);
      console.log(response);
      setTickets(response.data.results);
    } catch (error) {
      errorNotification("Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadTickets();
    }
  }, [isAuthenticated, reloader]); // Add reloader to dependency array

  const handleViewTicket = (ticketId: string) => {
    navigate(`/helpcenter/tk/${ticketId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'assigned':
        return <Circle className="w-4 h-4 text-blue-600" />;
      case 'hold':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'unassigned':
      default:
        return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <CustomerLayout>
      {isAuthenticated ? (
        <>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-8">Your cases</h1>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-gray-700 p-6">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">ALL CASES</h2>
            <div className="divide-y divide-green-100 dark:divide-gray-700">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Spinner />
                </div>
              ) : (
                tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={() => handleViewTicket(ticket.ticket_id)}
                    >
                      <div>
                        <a className="text-blue-700 dark:text-blue-400 hover:underline text-lg font-medium">
                          {ticket.title}
                        </a>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="font-semibold">Ticket Ref:</span> {ticket.ticket_id} |
                          <span className="font-semibold ml-2">Department:</span> {ticket.department?.name || 'Not assigned'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Created {calculateMonthsAgo(ticket.created_at)}, last modified {calculateMonthsAgo(ticket.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(ticket.status)}
                          <span className="text-sm text-gray-900 dark:text-gray-100 capitalize">{ticket.status_display}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No cases to display
                  </div>
                )
              )}
            </div>
          </div>




        </>
      ) : (
        <ServicePortalContent />
      )}
    </CustomerLayout>
  );
};

export default CustomerIndex;
