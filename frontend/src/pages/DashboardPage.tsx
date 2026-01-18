import React, { useEffect } from 'react';
import { 
  Ticket, 
  Users, 
  ListTodo,
  Calendar,
  Plus,
  Filter,
  UserCheck,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import Button from '../components/ui/Button'; // Add this line
import { GraphComponent } from './dashboard/Graphs';
import { useAuthStore } from '../stores/authStore';
import http from '../services/http';
import { APIS } from '../services/apis';
import { errorNotification } from '../components/ui/Toast';
import HomeLoadingSkeleton from '../components/ui/DashSkeleton';
import { DashboardStats, TaskItem, TicketItem } from '../types';
import { StatCard } from './dashboard/StatCard';
import { RecentTaskItemCard, RecentTicketItemCard } from './dashboard/RecentItems';
import { useNavigate, useLocation } from 'react-router-dom';
import { GetStarted } from './dashboard/GetStarted';

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const FilterButton: React.FC<FilterButtonProps> = ({ active, onClick, children }) => (
  <button
    className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
      active 
        ? 'bg-green-600 text-white shadow-lg shadow-green-200 dark:shadow-green-900/50 scale-105' 
        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = React.useState<DashboardStats | null>(null);
  const [getStartedData, setGetStartedData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const {user} = useAuthStore();
  const [filter, setFilter] = React.useState('week');
  const [dateRange, setDateRange] = React.useState({
    start: new Date().toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardResponse, getStartedResponse] = await Promise.all([
        http.get(`${APIS.LOAD_DASHBOARD}/?q=${filter}${filter === 'range' ? `&start=${dateRange.start}&end=${dateRange.end}` : ''}`),
        http.get(APIS.GET_STARTED)
      ]);
      setData(dashboardResponse.data);
      setGetStartedData(getStartedResponse.data);
    } catch (error: any) {
      console.log("Error loading dashboard data:", error);
      errorNotification(error?.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Refresh onboarding data only (lightweight)
  const refreshOnboardingData = async () => {
    try {
      const getStartedResponse = await http.get(APIS.GET_STARTED);
      setGetStartedData(getStartedResponse.data);
    } catch (error: any) {
      console.log("Error refreshing onboarding data:", error);
    }
  };

  useEffect(() => {
    // Only reload when filter changes (not dateRange - user must click Apply)
    if (filter !== 'range') {
      loadData();
    }
  }, [filter]);

  // Refresh data when window/tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshOnboardingData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Refresh onboarding data when navigating to dashboard
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      refreshOnboardingData();
    }
  }, [location.pathname]);

  // Get the display title for the current filter
  const getDisplayTitle = () => {
    switch (filter) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'range':
        return `${dateRange.start} to ${dateRange.end}`;
      default:
        return 'Today';
    }
  };

  if (loading) {
    return <HomeLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 ">
      <div className="w-full ">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome, {user?.first_name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Welcome back! Here's your workspace overview for {getDisplayTitle().toLowerCase()}.
              </p>
            </div>
          </div>

          {/* Get Started */}
          {getStartedData && 
           sessionStorage.getItem('onboardingSkipped') !== 'true' && 
           localStorage.getItem('onboardingCompleted') !== 'true' && (
            <GetStarted 
              agents={getStartedData.agents_count}
              departments={getStartedData.departments_count}
              articles={getStartedData.articles_count}
              all_tickets={getStartedData.all_tickets}
              unassigned_tickets={getStartedData.unassigned_tickets_count}
              all_tasks={getStartedData.all_tasks}
              unassigned_tasks={getStartedData.unassigned_tasks_count}
            />
          )}

          {/* Filter Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2">
              <div className="flex items-center gap-2 mr-4">
                <Filter size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Time Period:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterButton active={filter === 'today'} onClick={() => setFilter('today')}>
                  Today
                </FilterButton>
                <FilterButton active={filter === 'week'} onClick={() => setFilter('week')}>
                  This Week
                </FilterButton>
                <FilterButton active={filter === 'month'} onClick={() => setFilter('month')}>
                  This Month
                </FilterButton>
                <FilterButton active={filter === 'range'} onClick={() => setFilter('range')}>
                  Custom Range
                </FilterButton>
              </div>
              
              {filter === 'range' && (
                <div className="flex flex-wrap items-center gap-3 ml-0 lg:ml-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-4 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <Calendar className="text-gray-500 dark:text-gray-300 transition-colors" size={16} />
                  <input
                    className=" text-gray-700 dark:text-gray-200 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange({...dateRange, start: e.target.value})}
                  />
                  <span className="text-gray-400 font-medium">to</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange({...dateRange, end: e.target.value})}
                    className=" text-gray-700 dark:text-gray-200 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    onClick={() => loadData()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Charts and Recent Items */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Tickets Chart */}
            <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Tickets Analytics
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {getDisplayTitle()}
                  </span>
                  <ArrowUpRight className="text-gray-400" size={16} />
                </div>
              </div>
              {/* Ticket Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
                <StatCard
                  title="All"
                  value={data?.ticket.all ?? 0}
                  icon={Ticket}
                  color="blue"
                  onClick={() => navigate('/tickets?status=all_tickets')}
                />
                <StatCard
                  title="Assigned"
                  value={data?.ticket.assigned ?? 0}
                  icon={UserCheck}
                  color="green"
                  onClick={() => navigate('/tickets?status=all_tickets')}
                />
                <StatCard
                  title="Unassigned"
                  value={data?.ticket.unassigned ?? 0}
                  icon={Users}
                  color="orange"
                  onClick={() => navigate('/tickets?status=all_unassigned_tickets')}
                />
                <StatCard
                  title="Reopened"
                  value={data?.ticket.reopened ?? 0}
                  icon={RotateCcw}
                  color="yellow"
                  onClick={() => navigate('/tickets?status=reopened_tickets')}
                />
                <StatCard
                  title="Resolved"
                  value={data?.ticket.closed ?? 0}
                  icon={CheckCircle}
                  color="gray"
                  onClick={() => navigate('/tickets?status=all_resolved_tickets')}
                />
                <StatCard
                  title="Breached"
                  value={data?.ticket.breached ?? 0}
                  icon={AlertCircle}
                  color="red"
                  onClick={() => navigate('/tickets?status=sla_breached_tickets')}
                />

              </div>
              <GraphComponent
                type="tickets" 
                data={data}
                filter={filter}
              />
            </div>

            {/* Recent Tickets */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Recent Tickets
                </h2>
                <button 
                  onClick={() => navigate(`/tickets`)} 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {data && data.ticket.recent.length > 0 ? (
                  data.ticket.recent.map((item: TicketItem) => (
                    <RecentTicketItemCard key={item.id} item={item} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <svg 
                        className="w-12 h-12 mb-3 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
                        />
                      </svg>
                      <p className="text-sm font-medium">No Tickets found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* Tasks Chart and Recent Tasks */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Tasks Chart */}
            <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Task Analytics
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {getDisplayTitle()}
                  </span>
                  <ArrowUpRight className="text-gray-400" size={16} />
                </div>
              </div>
              {/* Task Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                <StatCard
                  title="All"
                  value={data?.task.all ?? 0}
                  icon={ListTodo}
                  color="green"
                  onClick={() => navigate('/tasks?view=all_tasks')}
                />
                <StatCard
                  title="Assigned"
                  value={data?.task.assigned ?? 0}
                  icon={UserCheck}
                  color="blue"
                  onClick={() => navigate('/tasks?view=all_tasks')}
                />
                <StatCard
                  title="Unassigned"
                  value={data?.task.unassigned ?? 0}
                  icon={Users}
                  color="orange"
                  onClick={() => navigate('/tasks?view=open_tasks')}
                />
                <StatCard
                  title="Unresolved"
                  value={data?.task.open ?? 0}
                  icon={AlertCircle}
                  color="lime"
                  onClick={() => navigate('/tasks?view=open_tasks')}
                />
                <StatCard
                  title="Overdue"
                  value={data?.task.breached ?? 0}
                  icon={AlertCircle}
                  color="red"
                  onClick={() => navigate('/tasks?view=overdue_tasks')}
                />
                <StatCard
                  title="Resolved"
                  value={data?.task.closed ?? 0}
                  icon={CheckCircle}
                  color="gray"
                  onClick={() => navigate('/tasks?view=completed_tasks')}
                />
              </div>
              <GraphComponent
                type="tasks" 
                data={data}
                filter={filter}
              />
            </div>

            {/* Recent Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Recent Tasks
                </h2>
                <button 
                  onClick={() => navigate(`/tasks`)} 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {data && data.task.recent.length > 0 ? (
                  data.task.recent.map((item: TaskItem) => (
                    <RecentTaskItemCard key={item.id} item={item} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <svg 
                        className="w-12 h-12 mb-3 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
                        />
                      </svg>
                      <p className="text-sm font-medium">No tasks found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <button 
                onClick={() => navigate('/tickets')}
                className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all duration-300 border border-blue-200 dark:border-blue-800 hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 text-white rounded-xl group-hover:scale-110 transition-transform">
                    <Ticket size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Create Ticket</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Report a new issue or request</p>
                  </div>
                  <Plus className="text-blue-600 dark:text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/tasks')}
                className="group p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30 transition-all duration-300 border border-green-200 dark:border-green-800 hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-600 text-white rounded-xl group-hover:scale-110 transition-transform">
                    <ListTodo size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Add Task</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Create a new task or project</p>
                  </div>
                  <Plus className="text-green-600 dark:text-green-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/users/agents')}
                className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 transition-all duration-300 border border-purple-200 dark:border-purple-800 hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-600 text-white rounded-xl group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Invite Member</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add a new team member</p>
                  </div>
                  <Plus className="text-purple-600 dark:text-purple-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

