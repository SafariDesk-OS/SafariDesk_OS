import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Drawer from '../ui/Drawer';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import {
  MailIntegration,
  MailIntegrationDirection,
  MailIntegrationProvider,
  MailCredentialValidationPayload,
  fetchAllDepartments,
  updateMailIntegrationRouting,
  changeMailIntegrationProvider,
  updateMailIntegration,
  validateMailCredentials,
} from '../../services/settings';

interface Props {
  integration: MailIntegration | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onStartOAuth: (integration: MailIntegration) => Promise<void>;
}

interface RoutingFormValues extends MailCredentialValidationPayload {
  display_name: string;
  department: string;
  direction: MailIntegrationDirection;
}

const providerLabels: Partial<Record<MailIntegrationProvider, string>> = {
  gmail: 'Gmail (OAuth)',
  office365: 'Microsoft 365 (OAuth)',
  custom: 'Custom IMAP/SMTP',
};

export const MailIntegrationDrawer: React.FC<Props> = ({ integration, isOpen, onClose, onUpdated, onStartOAuth }) => {
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [providerState, setProviderState] = useState<MailIntegrationProvider>('gmail');
  const [showProviderSelect, setShowProviderSelect] = useState(false);
  const [customResult, setCustomResult] = useState<{ imap?: { status: string; message: string }; smtp?: { status: string; message: string } } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<RoutingFormValues>({
    defaultValues: {
      display_name: '',
      department: '',
      direction: 'both',
      imap_host: '',
      imap_port: undefined,
      imap_username: '',
      imap_password: '',
      imap_use_ssl: true,
      smtp_host: '',
      smtp_port: undefined,
      smtp_username: '',
      smtp_password: '',
      smtp_use_ssl: true,
      smtp_use_tls: false,
    },
  });

  const currentProvider = useMemo(() => providerState, [providerState]);
  const watchedDirection = watch('direction') as MailIntegrationDirection | undefined;

  useEffect(() => {
    if (!isOpen) return;
    fetchAllDepartments()
      .then((response) => {
        if (Array.isArray(response?.results)) {
          setDepartments(response.results);
        } else if (Array.isArray(response)) {
          setDepartments(response);
        }
      })
      .catch((error) => console.error('Failed to load departments', error));
  }, [isOpen]);

  useEffect(() => {
    if (integration) {
      reset({
        display_name: integration.display_name ?? '',
        department: integration.department ? String(integration.department) : '',
        direction: integration.direction ?? 'both',
        imap_host: integration.imap_host ?? '',
        imap_port: integration.imap_port ?? undefined,
        imap_use_ssl: typeof integration.imap_use_ssl === 'boolean' ? integration.imap_use_ssl : true,
        smtp_host: integration.smtp_host ?? '',
        smtp_port: integration.smtp_port ?? undefined,
        smtp_use_ssl: typeof integration.smtp_use_ssl === 'boolean' ? integration.smtp_use_ssl : true,
        smtp_use_tls: typeof integration.smtp_use_tls === 'boolean' ? integration.smtp_use_tls : false,
        imap_username: '',
        imap_password: '',
        smtp_username: '',
        smtp_password: '',
      });
      setCustomResult(null);
      setProviderState(integration.provider);
      setShowProviderSelect(false);
    }
  }, [integration, reset]);

  if (!integration) {
    return null;
  }

  const effectiveDirection = watchedDirection || integration.direction || 'both';
  const isCustom = currentProvider === 'custom';

  const handleRoutingSave = async (values: RoutingFormValues) => {
    setLoading(true);
    try {
      await updateMailIntegrationRouting(integration.id, {
        display_name: values.display_name,
        direction: values.direction,
        department: values.department ? Number(values.department) : null,
      });

      if (isCustom) {
        const serverPayload: Partial<MailIntegration> & MailCredentialValidationPayload = {
          imap_host: values.imap_host,
          imap_port: values.imap_port,
          imap_use_ssl: values.imap_use_ssl,
          smtp_host: values.smtp_host,
          smtp_port: values.smtp_port,
          smtp_use_ssl: values.smtp_use_ssl,
          smtp_use_tls: values.smtp_use_tls,
        };
        if (values.imap_username) {
          serverPayload.imap_username = values.imap_username;
        }
        if (values.imap_password) {
          serverPayload.imap_password = values.imap_password;
        }
        if (values.smtp_username) {
          serverPayload.smtp_username = values.smtp_username;
        }
        if (values.smtp_password) {
          serverPayload.smtp_password = values.smtp_password;
        }

        await updateMailIntegration({
          id: integration.id,
          data: serverPayload,
        });
      }

      toast.success('Mailbox settings updated');
      onUpdated();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update mailbox');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = async (provider: MailIntegrationProvider) => {
    if (provider === currentProvider) {
      setShowProviderSelect(false);
      return;
    }
    try {
      await changeMailIntegrationProvider(integration.id, { provider, direction: effectiveDirection });
      setProviderState(provider);
      setCustomResult(null);
      if (provider !== 'custom') {
        toast.success('Provider updated. Complete the connection flow in the new tab.');
        await onStartOAuth({ ...integration, provider });
        onUpdated();
      } else {
        toast.success('Switched to custom server. Enter the IMAP/SMTP settings below, then save.');
        onUpdated();
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to change provider');
    } finally {
      setShowProviderSelect(false);
    }
  };

  const runCustomValidation = async (values: MailCredentialValidationPayload) => {
    try {
      const result = await validateMailCredentials(values);
      setCustomResult(result);

      // Check if any validation failed
      const imapFailed = result.imap?.status === 'error';
      const smtpFailed = result.smtp?.status === 'error';

      if (imapFailed || smtpFailed) {
        const failedServices = [imapFailed && 'IMAP', smtpFailed && 'SMTP'].filter(Boolean).join(' and ');
        toast.error(`${failedServices} connection failed. Check credentials and try again.`);
      } else {
        toast.success('Connection test successful');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to validate credentials');
    }
  };

  return (
    <Drawer
      title={`Mailbox settings - ${integration.email_address || integration.provider}`}
      isOpen={isOpen}
      close={() => {
        onClose();
        setShowProviderSelect(false);
        setCustomResult(null);
      }}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleRoutingSave)} className="space-y-8 max-w-4xl mx-auto">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            Support email
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Support email name</label>
              <Input {...register('display_name')} placeholder="Support Team" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Assign to department</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
                {...register('department')}
              >
                <option value="">Unassigned</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Direction</label>
            <select
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              {...register('direction')}
            >
              <option value="incoming">Incoming only</option>
              <option value="outgoing">Outgoing only</option>
              <option value="both">Incoming & Outgoing</option>
            </select>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                Email server
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{providerLabels[currentProvider]}</p>
            </div>
            <div className="flex items-center gap-2">
              {(currentProvider === 'gmail' || currentProvider === 'office365') && (
                <Button size="sm" type="button" variant="secondary" onClick={() => onStartOAuth(integration)}>
                  Reconnect
                </Button>
              )}
              <Button size="sm" type="button" variant="secondary" onClick={() => setShowProviderSelect((prev) => !prev)}>
                {showProviderSelect ? 'Cancel' : 'Change server'}
              </Button>
            </div>
          </div>

          {showProviderSelect && (
            <div className="flex flex-wrap gap-2">
              {(['gmail', 'office365', 'custom'] as MailIntegrationProvider[]).map((provider) => (
                <Button
                  key={provider}
                  size="sm"
                  variant={provider === currentProvider ? 'primary' : 'secondary'}
                  type="button"
                  onClick={() => handleProviderChange(provider)}
                >
                  {providerLabels[provider]}
                </Button>
              ))}
            </div>
          )}



          {isCustom && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">IMAP host</label>
                  <Input {...register('imap_host')} placeholder="imap.mailprovider.com" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">IMAP port</label>
                  <Input type="number" {...register('imap_port', { valueAsNumber: true })} placeholder="993" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">IMAP username</label>
                  <Input {...register('imap_username')} placeholder="user@example.com" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">IMAP password</label>
                  <Input type="password" {...register('imap_password')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">SMTP host</label>
                  <Input {...register('smtp_host')} placeholder="smtp.mailprovider.com" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">SMTP port</label>
                  <Input type="number" {...register('smtp_port', { valueAsNumber: true })} placeholder="465" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">SMTP username</label>
                  <Input {...register('smtp_username')} placeholder="user@example.com" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">SMTP password</label>
                  <Input type="password" {...register('smtp_password')} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" {...register('imap_use_ssl')} />
                  Use SSL for IMAP
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" {...register('smtp_use_ssl')} />
                  Use SSL for SMTP
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" {...register('smtp_use_tls')} />
                  Use TLS (STARTTLS)
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => runCustomValidation(watch())}
                >
                  Test connection
                </Button>
              </div>
              {customResult && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm">
                  {customResult.imap && (
                    <p className={customResult.imap.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                      IMAP: {customResult.imap.status} - {customResult.imap.message}
                    </p>
                  )}
                  {customResult.smtp && (
                    <p className={`mt-2 ${customResult.smtp.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      SMTP: {customResult.smtp.status} - {customResult.smtp.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || isSubmitting}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
