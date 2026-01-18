import React, { useEffect, useState } from 'react';
import { Lock, Save } from 'lucide-react';
import { useKnowledgeStore } from '../../../stores/knowledgeStore';
import { useAuthStore } from '../../../stores/authStore';
import { successNotification, errorNotification } from '../../../components/ui/Toast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { KBSettingsService } from '../../../services/kb';

interface KBSettingsData {
  kb_title: string;
  kb_description: string;
  allow_public_access: boolean;
  enable_comments: boolean;
  enable_ratings: boolean;
  enable_search: boolean;
  articles_per_page: number;
  default_article_status: 'draft' | 'published';
  require_approval: boolean;
  seo_enabled: boolean;
  analytics_enabled: boolean;
}

const KBSettings: React.FC = () => {
  const { user } = useAuthStore();
  const { publicSettings, fetchPublicSettings } = useKnowledgeStore();
  const [settings, setSettings] = useState<KBSettingsData>({
    kb_title: 'SafariDesk Knowledge Base',
    kb_description: 'Find answers to your questions',
    allow_public_access: true,
    enable_comments: true,
    enable_ratings: true,
    enable_search: true,
    articles_per_page: 12,
    default_article_status: 'draft',
    require_approval: true,
    seo_enabled: true,
    analytics_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const canManageSettings = user?.role === 'admin';

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        await fetchPublicSettings();
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (canManageSettings) {
      loadSettings();
    }
  }, [canManageSettings, fetchPublicSettings]);

  useEffect(() => {
    if (publicSettings) {
      // Map public settings to form data
      setSettings(prev => ({
        ...prev,
        kb_title: publicSettings.kb_title || prev.kb_title,
        kb_description: publicSettings.kb_description || prev.kb_description,
        allow_public_access: publicSettings.allow_public_access ?? prev.allow_public_access,
        enable_comments: publicSettings.enable_comments ?? prev.enable_comments,
        enable_ratings: publicSettings.enable_ratings ?? prev.enable_ratings,
        enable_search: publicSettings.enable_search ?? prev.enable_search,
        articles_per_page: publicSettings.articles_per_page || prev.articles_per_page,
        seo_enabled: publicSettings.seo_enabled ?? prev.seo_enabled,
      }));
    }
  }, [publicSettings]);

  const handleInputChange = <K extends keyof KBSettingsData>(
    field: K,
    value: KBSettingsData[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!canManageSettings) return;

    try {
      setIsSaving(true);
      
      // Save each setting to the backend
      const settingsToSave = [
        { key: 'kb_title', value: settings.kb_title },
        { key: 'kb_description', value: settings.kb_description },
        { key: 'allow_public_access', value: settings.allow_public_access },
        { key: 'enable_comments', value: settings.enable_comments },
        { key: 'enable_ratings', value: settings.enable_ratings },
        { key: 'enable_search', value: settings.enable_search },
        { key: 'articles_per_page', value: settings.articles_per_page },
        { key: 'default_article_status', value: settings.default_article_status },
        { key: 'require_approval', value: settings.require_approval },
        { key: 'seo_enabled', value: settings.seo_enabled },
        { key: 'analytics_enabled', value: settings.analytics_enabled }
      ];

      // Save settings using the KB Settings API
      for (const setting of settingsToSave) {
        try {
          // Try to update existing setting first
          await KBSettingsService.updateSetting(setting.key, setting.value);
        } catch {
          // If update fails, try to create new setting
          try {
            await KBSettingsService.createSetting({
              key: setting.key,
              value: typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value),
              value_type: typeof setting.value === 'boolean' ? 'boolean' : 
                         typeof setting.value === 'number' ? 'number' : 'string',
              category: setting.key.includes('approval') ? 'approval' :
                       setting.key.includes('enable') ? 'features' :
                       setting.key.includes('seo') ? 'seo' :
                       setting.key.includes('analytics') ? 'analytics' : 'general',
              label: setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              is_public: true,
              is_editable: true
            });
          } catch (createError) {
            console.error(`Failed to save setting ${setting.key}:`, createError);
          }
        }
      }

      successNotification('Settings saved successfully!');
      
      // Refresh the settings from the backend
      await fetchPublicSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      errorNotification('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setSettings({
        kb_title: 'SafariDesk Knowledge Base',
        kb_description: 'Find answers to your questions',
        allow_public_access: true,
        enable_comments: true,
        enable_ratings: true,
        enable_search: true,
        articles_per_page: 12,
        default_article_status: 'draft',
        require_approval: true,
        seo_enabled: true,
        analytics_enabled: true,
      });
      setShowResetConfirm(false);
    };

  if (!canManageSettings) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Lock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            You don't have permission to manage knowledge base settings.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Knowledge Base Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your knowledge base appearance and functionality
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          General Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Knowledge Base Title
            </label>
            <input
              type="text"
              value={settings.kb_title}
              onChange={(e) => handleInputChange('kb_title', e.target.value)}
              placeholder="Knowledge Base Title"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={settings.kb_description}
              onChange={(e) => handleInputChange('kb_description', e.target.value)}
              placeholder="Brief description of your knowledge base"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Articles per Page
            </label>
            <select
              value={settings.articles_per_page}
              onChange={(e) => handleInputChange('articles_per_page', parseInt(e.target.value))}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value={6}>6 articles</option>
              <option value={12}>12 articles</option>
              <option value={24}>24 articles</option>
              <option value={48}>48 articles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Access & Permissions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Access & Permissions
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Allow Public Access
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Allow non-authenticated users to view published articles
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allow_public_access}
                onChange={(e) => handleInputChange('allow_public_access', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Article Status
            </label>
            <select
              value={settings.default_article_status}
              onChange={(e) => handleInputChange('default_article_status', e.target.value as 'draft' | 'published')}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Require Approval
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Require admin approval before publishing articles
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.require_approval}
                onChange={(e) => handleInputChange('require_approval', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Features
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Enable Search
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Allow users to search through articles
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_search}
                onChange={(e) => handleInputChange('enable_search', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Enable Comments
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Allow users to comment on articles
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_comments}
                onChange={(e) => handleInputChange('enable_comments', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Enable Ratings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Allow users to rate articles as helpful or not helpful
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_ratings}
                onChange={(e) => handleInputChange('enable_ratings', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* SEO & Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          SEO & Analytics
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                SEO Optimization
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enable SEO meta tags and structured data
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.seo_enabled}
                onChange={(e) => handleInputChange('seo_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Analytics Tracking
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track article views and user interactions
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.analytics_enabled}
                onChange={(e) => handleInputChange('analytics_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>

      <ConfirmDialog
        show={showResetConfirm}
        cancel={() => setShowResetConfirm(false)}
        onConfirm={confirmReset}
        title="Reset Settings"
        message="Are you sure you want to reset all settings to default values? This action cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        variant="warning"
      />
    </>
  );
};

export default KBSettings;
