import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { MailIntegrationWizard } from './MailIntegrationWizard';
import { MailIntegrationDrawer } from './MailIntegrationDrawer';
import ConfirmDialog from '../ui/ConfirmDialog';
import {
  fetchMailIntegrations,
  startGoogleMailIntegration,
  startMicrosoftMailIntegration,
  createMailIntegration,
  deleteMailIntegration,
  MailIntegration,
  MailIntegrationDirection,
  MailIntegrationPayload,
} from '../../services/settings';
import { formatDate } from '../../utils/date';
import { Loader } from '../loader/loader';

const statusColors: Record<string, string> = {
  connected: 'text-green-600 bg-green-50',
  connecting: 'text-yellow-700 bg-yellow-50',
  error: 'text-red-600 bg-red-50',
  disconnected: 'text-gray-600 bg-gray-100',
};

export const MailIntegrations: React.FC = () => {
  const queryClient = useQueryClient();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDirection, setWizardDirection] = useState<MailIntegrationDirection>('both');
  const [selectedDirection, setSelectedDirection] = useState<MailIntegrationDirection>('both');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeIntegrationId, setActiveIntegrationId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; integration: MailIntegration | null }>({ show: false, integration: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const refreshIntegrations = useCallback(() => {
    queryClient.invalidateQueries('mailIntegrations');
  }, [queryClient]);

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== 'mailIntegrationOauth') return;
      if (data.status === 'success') {
        toast.success('Mailbox connected');
        refreshIntegrations();
      } else {
        const reason = data.error ? ` (${data.error})` : '';
        toast.error(`Mailbox connection failed${reason}`);
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [refreshIntegrations]);

  const openOAuthPopup = (url: string) => {
    const popup = window.open(url, 'mailIntegrationOAuth', 'width=520,height=720');
    if (!popup) {
      toast.error('Popup blocked. Please allow popups and try again.');
    }
  };

  const getReturnUrl = () => window.location.href;

  const { data: integrations, isLoading } = useQuery<MailIntegration[]>('mailIntegrations', fetchMailIntegrations);
  const activeIntegration = useMemo(() => {
    if (!integrations || activeIntegrationId === null) {
      return null;
    }
    return integrations.find((integration) => integration.id === activeIntegrationId) ?? null;
  }, [integrations, activeIntegrationId]);

  const openSettingsDrawer = (integration: MailIntegration) => {
    setActiveIntegrationId(integration.id);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setActiveIntegrationId(null);
  };
  const handleOAuthStart = async (integration: MailIntegration) => {
    try {
      const payload = { return_url: getReturnUrl() };
      const response =
        integration.provider === 'gmail'
          ? await startGoogleMailIntegration(integration.id, payload)
          : await startMicrosoftMailIntegration(integration.id, payload);
      if (response.authorization_url) {
        openOAuthPopup(response.authorization_url);
      } else {
        toast.error('Authorization URL missing from response');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to start OAuth flow');
    }
  };



  const createStubIntegration = async (provider: MailIntegration['provider']) => {
    const payload: MailIntegrationPayload = {
      provider,
      direction: selectedDirection,
    };
    return createMailIntegration(payload);
  };

  const handleGmailConnect = async () => {
    try {
      const integration = await createStubIntegration('gmail');
      const response = await startGoogleMailIntegration(integration.id, { return_url: getReturnUrl() });
      if (response.authorization_url) {
        openOAuthPopup(response.authorization_url);
        toast('Complete Google sign-in in the popup window.');
        refreshIntegrations();
      } else {
        toast.error('Authorization URL missing from response');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to start Google OAuth flow');
    }
  };

  const handleMicrosoftConnect = async () => {
    try {
      const integration = await createStubIntegration('office365');
      const response = await startMicrosoftMailIntegration(integration.id, { return_url: getReturnUrl() });
      if (response.authorization_url) {
        openOAuthPopup(response.authorization_url);
        toast('Complete Microsoft sign-in in the popup window.');
        refreshIntegrations();
      } else {
        toast.error('Authorization URL missing from response');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to start Microsoft OAuth flow');
    }
  };



  const handleDeleteClick = (integration: MailIntegration) => {
    setConfirmDelete({ show: true, integration });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete.integration) return;
    setIsDeleting(true);
    try {
      await deleteMailIntegration(confirmDelete.integration.id);
      toast.success('Mailbox deleted');
      refreshIntegrations();
      setConfirmDelete({ show: false, integration: null });
    } catch (error) {
      console.error(error);
      toast.error('Unable to delete mailbox');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  const renderConnectPanel = () => (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Connect a new mailbox</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose a provider to start the connection flow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Direction</label>
          <select
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300"
            value={selectedDirection}
            onChange={(e) => setSelectedDirection(e.target.value as MailIntegrationDirection)}
          >
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
            <option value="both">Incoming & Outgoing</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={handleGmailConnect}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 text-left transition"
        >
          <div className="font-semibold text-gray-900 dark:text-gray-100">Gmail</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Use Google OAuth.</p>
          <div className="mt-4">
            <Button size="sm" variant="secondary">
              Sign in
            </Button>
          </div>
        </button>

        <button
          type="button"
          onClick={handleMicrosoftConnect}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 text-left transition"
        >
          <div className="font-semibold text-gray-900 dark:text-gray-100">Microsoft 365</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Use Microsoft Graph OAuth.</p>
          <div className="mt-4">
            <Button size="sm" variant="secondary">
              Sign in
            </Button>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setWizardDirection(selectedDirection);
            setIsWizardOpen(true);
          }}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 text-left transition"
        >
          <div className="font-semibold text-gray-900 dark:text-gray-100">Custom mail server</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure IMAP/SMTP manually.</p>
          <div className="mt-4">
            <Button size="sm" variant="secondary">
              Configure
            </Button>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      {renderConnectPanel()}

      {(!integrations || integrations.length === 0) && (
        <p className="text-gray-600 dark:text-gray-400">No mailboxes connected yet.</p>
      )}

      {integrations && integrations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Email</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Provider</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Direction</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Department</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Last Sync</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {integrations.map((integration) => (
                <tr key={integration.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      <span>{integration.email_address || 'Pending'}</span>
                    </div>
                    {integration.display_name && <div className="text-sm text-gray-500 dark:text-gray-400">{integration.display_name}</div>}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-900 dark:text-gray-300">{integration.provider}</td>
                  <td className="px-4 py-3 capitalize text-gray-900 dark:text-gray-300">{integration.direction}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">{integration.department_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[integration.connection_status] ?? 'text-gray-600 bg-gray-100'
                        }`}
                      title={integration.connection_status_detail || undefined}
                    >
                      {integration.connection_status}
                    </span>
                    {integration.connection_status_detail && (
                      <p className="text-xs text-gray-500 mt-1">{integration.connection_status_detail}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {integration.last_success_at ? formatDate(integration.last_success_at) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        title="Mailbox settings"
                        onClick={() => openSettingsDrawer(integration)}
                      >
                        <SettingsIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        title="Delete mailbox"
                        onClick={() => handleDeleteClick(integration)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {(integration.provider === 'gmail' || integration.provider === 'office365') && (
                        <Button
                          size="sm"
                          onClick={() => handleOAuthStart(integration)}
                        >
                          {integration.connection_status === 'connected' ? 'Reconnect' : 'Connect'}
                        </Button>
                      )}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MailIntegrationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCompleted={() => {
          refreshIntegrations();
          toast.success('Mailbox added');
        }}
        presetProvider="custom"
        presetDirection={wizardDirection}
      />
      <MailIntegrationDrawer
        integration={activeIntegration}
        isOpen={Boolean(isDrawerOpen && activeIntegration)}
        onClose={closeDrawer}
        onUpdated={refreshIntegrations}
        onStartOAuth={handleOAuthStart}
      />

      <ConfirmDialog
        show={confirmDelete.show}
        message={`Are you sure you want to delete mailbox ${confirmDelete.integration?.email_address || confirmDelete.integration?.provider || ''}?`}
        variant="danger"
        state={isDeleting}
        onConfirm={handleDeleteConfirm}
        cancel={() => setConfirmDelete({ show: false, integration: null })}
      />
    </div>
  );
};
