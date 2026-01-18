import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { TicketPageLayout } from './components/layout/TicketPageLayout';
import { TaskPageLayout } from './components/layout/TaskPageLayout';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { Loader } from './components/loader/loader';
import { PasswordUpdateModal } from './components/auth/PasswordUpdateModal';
import ConfigPage from './pages/config';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import { SessionTimeoutDialog } from './components/ui/SessionTimeoutDialog';
import TicketManagementSystem from './pages/ticket/all';
import { EXEMPTED_DOMAIN_URLS } from './routes/config';

// Component that conditionally renders SessionTimeoutDialog
const SessionTimeoutWrapper: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const { showWarning, countdown, resetInactivityTimerAndHideWarning } = useInactivityLogout();

  // Show SessionTimeoutDialog only if user is authenticated AND not on exempted routes
  const currentPath = location.pathname;
  const isOnPublicRoute = EXEMPTED_DOMAIN_URLS.some(route =>
    currentPath.startsWith(route)
  );

  if (isOnPublicRoute) {
    return null;
  }

  return (
    <SessionTimeoutDialog
      isOpen={showWarning}
      countdown={countdown}
      onClose={resetInactivityTimerAndHideWarning}
    />
  );
};

// Lazy load pages
const IndexPage = lazy(() => import('./pages/index'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TasksPage = lazy(() => import('./pages/task/TasksPage'));

const KnowledgePage = lazy(() => import('./pages/KnowledgePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const Register = lazy(() => import('./pages/auth/Register'));
const Login = lazy(() => import('./pages/auth/Login'));
const OTPVerification = lazy(() => import('./pages/auth/Otp'));
const Users = lazy(() => import('./pages/Users'));
const TicketInfo = lazy(() => import('./pages/ticket/mini/ViewTicket'));
const TaskInfo = lazy(() => import('./pages/task/mini/ViewTask'));
// REMOVED: Request workflow has been removed from the system
// const RequestsPage = lazy(() => import('./pages/RequestsPage'));

const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const NewPassword = lazy(() => import('./pages/auth/NewPassword'));
const Profile = lazy(() => import('./pages/users/Profile'));
const Support = lazy(() => import('./pages/customer/support'));

const CustomerIndex = lazy(() => import('./pages/customer'));
const CustomerTicketViewPage = lazy(() => import('./pages/customer/CustomerTicketViewPage'));
const TicketViewPage = lazy(() => import('./pages/customer/tk/TicketView'));
const KnowledgeBasePage = lazy(() => import('./pages/customer/kb'));
const ArticleView = lazy(() => import('./pages/customer/ArticleView'));

// // Public Knowledge Base components
// const PublicKBInterface = lazy(() => import('./pages/knowledge/public/PublicKBInterface'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage')); // Import NotFoundPage

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

const LegacySupportRedirect: React.FC = () => {
  const location = useLocation();
  const updatedPath = location.pathname.replace('/support', '/helpcenter');
  return <Navigate to={`${updatedPath}${location.search}`} replace />;
};

function App() {
  const { user } = useAuthStore();
  const { setTheme, theme } = useUIStore();

  React.useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public Knowledge Base Routes */}
            {/* <Route path="/knowledge-base" element={<PublicKBInterface />} /> */}
            {/* <Route path="/knowledge-base/categories/:slug" element={<PublicKBInterface />} /> */}
            {/* <Route path="/knowledge-base/articles/:slug" element={<ArticleDetail />} />  */}
            {/* <Route path="/knowledge-base/articles/:slug" element={<ArticleView />} /> */}

            {/* Landing Page - redirect to auth */}
            <Route path="/site" element={<Navigate to="/auth" replace />} />

            {/* Auth Routes */}
            <Route path="/auth" element={<Login />} />
            <Route path="/join" element={<Register />} />
            <Route path="/otp-verify" element={<OTPVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/new-password" element={<NewPassword />} />

            {/* Customer page */}
            <Route path="/helpcenter" element={<CustomerIndex />} />
            <Route path="/helpcenter/:ticketId" element={<CustomerTicketViewPage />} />
            <Route path="/helpcenter/new" element={<Support />} />
            <Route path="/helpcenter/tk/:ticket_id" element={<TicketViewPage />} />
            <Route path="/helpcenter/kb" element={<KnowledgeBasePage />} />
            <Route path="/helpcenter/kb/:slug" element={<ArticleView />} />
            <Route path="/support/*" element={<LegacySupportRedirect />} />




            {/* Protected Routes */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Ticket routes with PersistentNav */}
              <Route path="tickets" element={<TicketPageLayout />}>
                <Route index element={<TicketManagementSystem />} />
              </Route>
              <Route path="ticket/:ticketId" element={<TicketPageLayout />}>
                <Route index element={<TicketInfo />} />
              </Route>

              {/* Task routes with PersistentNav */}
              <Route path="tasks" element={<TaskPageLayout />}>
                <Route index element={<TasksPage />} />
              </Route>
              <Route path="task/:taskId" element={<TaskPageLayout />}>
                <Route index element={<TaskInfo />} />
              </Route>

              {/* Non-ticket/task routes without PersistentNav */}
              {/* REMOVED: Request workflow route has been disabled */}
              {/* <Route path="requests" element={<RequestsPage />} /> */}
              <Route path="knowledge/*" element={<KnowledgePage />} />
              <Route path="settings/*" element={<SettingsPage />} />
              <Route path="users/*" element={<Users />} />
              <Route path="profile/" element={<Profile />} />
              <Route path="notifications" element={<NotificationsPage />} />

              <Route path="config/*" element={<ConfigPage />} />

            </Route>
            {/* Catch-all route for 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
            },
          }}
        />
        <SessionTimeoutWrapper />
        {user?.first_login && <PasswordUpdateModal />}
      </div>
    </Router>
  );
}

export default App;
