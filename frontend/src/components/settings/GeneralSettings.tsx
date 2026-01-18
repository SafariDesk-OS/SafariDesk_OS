import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import { Input } from "../ui/Input";
import { APIS } from "../../services/apis";
import http from "../../services/http";
import { successNotification, errorNotification } from "../../components/ui/Toast";
import { Upload } from "lucide-react";

interface BusinessSettings {
  id: number;
  name: string;
  domain: string;
  email: string;
  phone: string;
  timezone: string;
  logo_url: string;
  favicon_url: string;
}

export const GeneralSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await http.get(APIS.GET_GENERAL_SETTINGS);
      setSettings(response.data);
      if (response.data.logo_url) setLogoPreview(response.data.logo_url);
      if (response.data.favicon_url) setFaviconPreview(response.data.favicon_url);
    } catch (error) {
      errorNotification("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else {
        setFaviconFile(file);
        setFaviconPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', settings.name);
      formData.append('email', settings.email || '');
      formData.append('phone', settings.phone || '');
      formData.append('timezone', settings.timezone || 'UTC');

      if (logoFile) {
        formData.append('logo', logoFile);
      }
      if (faviconFile) {
        formData.append('favicon', faviconFile);
      }

      const response = await http.put(APIS.UPDATE_GENERAL_SETTINGS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSettings(response.data.business);
      successNotification("Settings updated successfully");

      // Update local storage or global state if needed for immediate header update
      // Logic for that would go here if you have a global store for business info

    } catch (error: any) {
      errorNotification(error?.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        General Settings
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Workspace Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Workspace Name"
              value={settings?.name || ''}
              onChange={(e) => setSettings(prev => prev ? { ...prev, name: e.target.value } : null)}
            />
            <Input
              label="Workspace Domain"
              value={settings?.domain || ''}
              disabled
              className="bg-gray-50 dark:bg-gray-900"
            />
            <Input
              label="Contact Email"
              value={settings?.email || ''}
              onChange={(e) => setSettings(prev => prev ? { ...prev, email: e.target.value } : null)}
            />
            <Input
              label="Contact Phone"
              value={settings?.phone || ''}
              onChange={(e) => setSettings(prev => prev ? { ...prev, phone: e.target.value } : null)}
            />
          </div>
        </div>

        {/* Branding Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Branding
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xs text-gray-400">No Logo</span>
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2">
                  <Upload size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Upload New</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                </label>
              </div>
            </div>

            {/* Favicon Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Favicon
              </label>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                  {faviconPreview ? (
                    <img src={faviconPreview} alt="Favicon" className="h-8 w-8 object-contain" />
                  ) : (
                    <span className="text-xs text-gray-400">No Icon</span>
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2">
                  <Upload size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Upload New</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'favicon')} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Preferences
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timezone
              </label>
              <select
                value={settings?.timezone || 'UTC'}
                onChange={(e) => setSettings(prev => prev ? { ...prev, timezone: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Africa/Nairobi">Nairobi</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} isLoading={saving}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

