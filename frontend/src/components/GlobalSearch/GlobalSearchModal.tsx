import React, { useState, useEffect, useRef } from 'react';
import { Search, Ticket, BookOpen, CheckSquare, Loader } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useNavigate } from 'react-router-dom';
import http from '../../services/http';
import { APIS } from '../../services/apis';

interface SearchResult {
  id: number;
  type: 'ticket' | 'user' | 'kb' | 'task';
  title: string;
  description?: string;
  icon: React.ReactNode;
  path: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle search
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const allResults: SearchResult[] = [];

    try {
      // Search Tickets
      try {
        const ticketRes = await http.get(`${APIS.LIST_TICKETS}?search=${query}`, {
          timeout: 5000,
        });
        if (ticketRes.data?.results) {
          allResults.push(
            ...ticketRes.data.results.slice(0, 5).map((ticket: any) => ({
              id: ticket.id,
              type: 'ticket' as const,
              title: `#${ticket.ticket_id} - ${ticket.title}`,
              description: ticket.description?.substring(0, 100),
              icon: <Ticket size={16} />,
              path: `/ticket/${ticket.ticket_id}`,  // Fixed: Use ticket_id instead of numeric id
            }))
          );
        }
      } catch (e) {
        console.error('Ticket search error:', e);
      }

      // Search Agents
      // try {
      //   const agentsRes = await http.get(`${APIS.LIST_AGENTS}?search=${query}`, {
      //     timeout: 5000,
      //   });
      //   if (agentsRes.data?.results) {
      //     allResults.push(
      //       ...agentsRes.data.results.slice(0, 3).map((user: any) => ({
      //         id: `agent-${user.id}`,  // Fixed: unique ID for agents
      //         type: 'user' as const,
      //         title: user.full_name || `${user.first_name} ${user.last_name}`,
      //         description: `${user.email} • Agent`,
      //         icon: <Users size={16} />,
      //         path: `/users/agents`,
      //       }))
      //     );
      //   }
      // } catch (e) {
      //   console.error('Agent search error:', e);
      // }

      // // Search Customers
      // try {
      //   const customersRes = await http.get(`${APIS.LOAD_CUSTOMERS}?search=${query}`, {
      //     timeout: 5000,
      //   });
      //   if (customersRes.data?.results) {
      //     allResults.push(
      //       ...customersRes.data.results.slice(0, 3).map((user: any) => ({
      //         id: `customer-${user.id}`,  // Fixed: unique ID for customers
      //         type: 'user' as const,
      //         title: user.full_name || `${user.first_name} ${user.last_name}`,
      //         description: `${user.email} • Customer`,
      //         icon: <Users size={16} />,
      //         path: `/users/customers`,
      //       }))
      //     );
      //   }
      // } catch (e) {
      //   console.error('Customer search error:', e);
      // }

      // Search Knowledge Base
      try {
        const kbRes = await http.get(`${APIS.KB_ARTICLES}?search=${query}`, {
          timeout: 5000,
        });
        if (kbRes.data?.results) {
          allResults.push(
            ...kbRes.data.results.slice(0, 5).map((article: any) => ({
              id: article.id,
              type: 'kb' as const,
              title: article.title,
              description: article.excerpt || article.content?.substring(0, 100),
              icon: <BookOpen size={16} />,
              path: `/knowledge/${article.slug}`,
            }))
          );
        }
      } catch (e) {
        console.error('KB search error:', e);
      }

      // Search Tasks
      try {
        const tasksRes = await http.get(`${APIS.LOAD_TASKS}?search=${query}`, {
          timeout: 5000,
        });
        if (tasksRes.data?.results) {
          allResults.push(
            ...tasksRes.data.results.slice(0, 5).map((task: any) => ({
              id: task.id,
              type: 'task' as const,
              title: task.title,
              description: task.description?.substring(0, 100),
              icon: <CheckSquare size={16} />,
              path: `/task/${task.task_trackid}`,  // Fixed: Use task_trackid instead of numeric id
            }))
          );
        }
      } catch (e) {
        console.error('Task search error:', e);
      }

      // Search Departments
      // try {
      //   const deptRes = await http.get(`${APIS.LIST_DEPARTMENTS}?search=${query}`, {
      //     timeout: 5000,
      //   });
      //   if (deptRes.data?.results) {
      //     allResults.push(
      //       ...deptRes.data.results.slice(0, 3).map((dept: any) => ({
      //         id: dept.id,
      //         type: 'user' as const,
      //         title: dept.name,
      //         description: `Department • ${dept.members_count || 0} members`,
      //         icon: <Users size={16} />,
      //         path: `/config/departments`,
      //       }))
      //     );
      //   }
      // } catch (e) {
      //   console.error('Department search error:', e);
      // }

      setResults(allResults);
      setSelectedIndex(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.path);
    setSearchQuery('');
    setResults([]);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ticket':
        return 'text-blue-600 dark:text-blue-400';
      case 'user':
        return 'text-purple-600 dark:text-purple-400';
      case 'kb':
        return 'text-green-600 dark:text-green-400';
      case 'task':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      ticket: 'Ticket',
      user: 'User',
      kb: 'Article',
      task: 'Task',
    };
    return badges[type] || type;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      showCloseButton={false}
      size="lg"
      closeOnEscape={true}
      closeOnBackdropClick={true}
      marginTop="-15vh"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tickets, tasks, knowledge base..."
            value={searchQuery}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
            autoComplete="off"
          />
        </div>

        {/* Results */}
        <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="animate-spin text-primary-600 dark:text-primary-400" size={24} />
            </div>
          )}

          {!loading && searchQuery && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search size={32} className="text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">No results found for "{searchQuery}"</p>
            </div>
          )}

          {!loading && !searchQuery && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search size={32} className="text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">Start typing to search...</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelectResult(result)}
                  className={`w-full px-4 py-3 text-left rounded-lg transition-colors flex items-start gap-3 ${
                    index === selectedIndex
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 ${getTypeColor(result.type)}`}>
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {result.title}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 ${getTypeColor(result.type)}`}>
                        {getTypeBadge(result.type)}
                      </span>
                    </div>
                    {result.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                        {result.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
            <span>↑↓ Navigate • ↵ Select • Esc Close</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
