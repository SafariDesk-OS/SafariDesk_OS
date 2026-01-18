import React, { useState, useRef, useEffect } from 'react';
import { 
  Edit3, 
  Save, 
  X, 
  User, 
  Mail, 
  Shield, 
  Bell, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Upload, 
  Building2, 
  Briefcase,
  Settings
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import http from '../../services/http';
import { APIS } from '../../services/apis';
import { errorNotification, successNotification } from '../../components/ui/Toast';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPE_META,
  NotificationChannel,
  NotificationTypeKey,
  UserNotificationPreference,
  defaultNotificationChannels,
  defaultNotificationMatrix,
} from '../../types/notification';
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from '../../services/notifications/settings';

// Tab types
type TabType = 'profile' | 'security' | 'settings' | 'notifications';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

const TABS: TabConfig[] = [
  { id: 'profile', label: 'Profile information', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  // { id: 'settings', label: 'Settings', icon: Settings },
  // { id: 'notifications', label: 'Notifications', icon: Bell },
  // Commented out - tabs without functionality
  // { id: 'theme', label: 'Theme', icon: Palette },
  // { id: 'background', label: 'Background Settings', icon: Image },
  // { id: 'tokens', label: 'Personal Access Tokens', icon: Key },
];

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer group">
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
      {label}
    </span>
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className={`w-11 h-6 rounded-full transition-all duration-200 ${checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </div>
    </div>
  </label>
);

type StatCardColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  trend?: string;
  color?: StatCardColor;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, trend, color = 'blue' }) => {
  const colors: Record<StatCardColor, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
  };

  return (
    <div className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color]} ring-1 ring-black/5 dark:ring-white/10`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className="flex items-center space-x-1 text-xs font-medium text-green-600 dark:text-green-400">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{title}</p>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, updateUserProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingProfileUpdate, setLoadingProfileUpdate] = useState(false);
  const [loadingPasswordChange, setLoadingPasswordChange] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name,
    lastName: user?.last_name,
    email: user?.email,
    phone: user?.phone_number,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [cardData, setCardData] = useState({
    assigned_tickets: 0,
    resolved_tickets: 0,
    assigned_tasks: 0,
    completed_tasks: 0,
  });

  const [settingsDraft, setSettingsDraft] = useState({
    compactMode: false,
    showTips: true,
    weeklyDigest: true,
    autoAssign: false,
  });
  
  const [notificationPrefs, setNotificationPrefs] = useState<UserNotificationPreference | null>(null);
  const [loadingNotificationPrefs, setLoadingNotificationPrefs] = useState(true);
  const [savingNotificationPrefs, setSavingNotificationPrefs] = useState(false);

  useEffect(() => {
    const fetchCardData = async () => {
      try {
        const response = await http.get(APIS.PROFILE_ANALYSIS);
        setCardData({
          assigned_tickets: 0,
          resolved_tickets: 0,
          assigned_tasks: 0,
          completed_tasks: 0,
          ...response.data,
        });
      } catch {
        errorNotification('Failed to load card data');
      }
    };

    fetchCardData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSetting = (key: keyof typeof settingsDraft) => {
    setSettingsDraft(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const prefs = await getUserNotificationPreferences();
        setNotificationPrefs(prefs);
      } catch {
        errorNotification('Failed to load notification preferences');
      } finally {
        setLoadingNotificationPrefs(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleDeliveryChannelToggle = (channel: NotificationChannel) => {
    setNotificationPrefs(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        delivery_channels: {
          ...prev.delivery_channels,
          [channel]: !prev.delivery_channels[channel],
        },
      };
    });
  };

  const handleMatrixToggle = (type: NotificationTypeKey, channel: NotificationChannel) => {
    setNotificationPrefs(prev => {
      if (!prev) return prev;
      const nextMatrix = { ...prev.notification_matrix };
      const row = nextMatrix[type] ? { ...nextMatrix[type] } : defaultNotificationChannels();
      row[channel] = !row[channel];
      nextMatrix[type] = row;
      return {
        ...prev,
        notification_matrix: nextMatrix,
      };
    });
  };

  const handleQuietHoursToggle = () => {
    setNotificationPrefs(prev => {
      if (!prev) return prev;
      const quietHours = prev.quiet_hours || { enabled: false, start: '22:00', end: '06:00' };
      return {
        ...prev,
        quiet_hours: {
          ...quietHours,
          enabled: !quietHours.enabled,
        },
      };
    });
  };

  const handleQuietHoursTimeChange = (field: 'start' | 'end', value: string) => {
    setNotificationPrefs(prev => {
      if (!prev) return prev;
      const quietHours = prev.quiet_hours || { enabled: false, start: '22:00', end: '06:00' };
      return {
        ...prev,
        quiet_hours: {
          ...quietHours,
          [field]: value,
        },
      };
    });
  };

  const handleDigestToggle = () => {
    setNotificationPrefs(prev => (prev ? { ...prev, email_digest_enabled: !prev.email_digest_enabled } : prev));
  };

  const handleDigestFrequencyChange = (value: 'daily' | 'weekly' | 'off') => {
    setNotificationPrefs(prev => (prev ? { ...prev, digest_frequency: value } : prev));
  };

  const handleBrowserPushToggle = () => {
    setNotificationPrefs(prev => (prev ? { ...prev, browser_push_enabled: !prev.browser_push_enabled } : prev));
  };

  const handleMute = (minutes: number) => {
    const muteUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setNotificationPrefs(prev => (prev ? { ...prev, mute_until: muteUntil } : prev));
  };

  const clearMute = () => {
    setNotificationPrefs(prev => (prev ? { ...prev, mute_until: null } : prev));
  };

  const handleResetNotificationPrefs = () => {
    setNotificationPrefs(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        delivery_channels: defaultNotificationChannels(),
        notification_matrix: defaultNotificationMatrix(),
      };
    });
  };

  const handleSaveNotificationPreferences = async () => {
    if (!notificationPrefs) return;
    setSavingNotificationPrefs(true);
    try {
      const quietHours = notificationPrefs.quiet_hours || { enabled: false, start: '22:00', end: '06:00' };
      const payload = {
        delivery_channels: notificationPrefs.delivery_channels,
        notification_matrix: notificationPrefs.notification_matrix,
        quiet_hours: quietHours,
        browser_push_enabled: notificationPrefs.browser_push_enabled,
        email_digest_enabled: notificationPrefs.email_digest_enabled,
        digest_frequency: notificationPrefs.digest_frequency,
        mute_until: notificationPrefs.mute_until,
      };
      const updated = await updateUserNotificationPreferences(payload);
      setNotificationPrefs(updated);
      successNotification('Notification preferences saved');
    } catch {
      errorNotification('Failed to update notification preferences');
    } finally {
      setSavingNotificationPrefs(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfileUpdate(true);
    const profileData = new FormData();
    profileData.append('first_name', formData.firstName || '');
    profileData.append('last_name', formData.lastName || '');
    profileData.append('email', formData.email || '');
    profileData.append('phone_number', formData.phone || '');
    if (fileInputRef.current?.files?.[0]) {
      profileData.append('avatar', fileInputRef.current.files[0]);
    }

    try {
      const response = await http.put(APIS.UPDATE_PROFILE, profileData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      updateUserProfile(response.data.user);
      successNotification('Profile updated successfully');
      setIsEditing(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; detail?: string } }; message?: string };
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.detail ||
                          err?.message ||
                          'Failed to update profile';
      errorNotification(errorMessage);
    } finally {
      setLoadingProfileUpdate(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPasswordChange(true);
    if (formData.newPassword !== formData.confirmPassword) {
      errorNotification('New passwords do not match');
      setLoadingPasswordChange(false);
      return;
    }
    try {
      await http.put(APIS.CHANGE_PASSWORD, {
        old_password: formData.currentPassword,
        new_password: formData.newPassword,
      });
      successNotification('Password changed successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch {
      errorNotification('Failed to change password');
    } finally {
      setLoadingPasswordChange(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: user?.first_name,
      lastName: user?.last_name,
      email: user?.email,
      phone: user?.phone_number,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  // Tab Content Renderers
  const renderProfileTab = () => {
    const accountStatus = user ? (user.is_active ? 'Active' : 'Inactive') : 'N/A';
    const systemDetails = [
      { label: 'User ID', value: user?.user_id ? user.user_id.toString() : 'N/A' },
      { label: 'Account Status', value: accountStatus },
      { label: 'Category', value: user?.category || 'N/A' },
      { label: 'Staff Access', value: user ? (user.is_staff ? 'Yes' : 'No') : 'N/A' },
      { label: 'Business', value: user?.business?.name || 'N/A' },
      { label: 'Workspace Domain', value: user?.business?.domain_url || 'N/A' },
      { label: 'Timezone', value: user?.business?.timezone || 'N/A' },
    ];

    return (
      <div className="space-y-6">
      {/* Work Overview Stats */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            My Work Overview
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-3">Tickets</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={Clock}
                title="Assigned to Me"
                value={cardData.assigned_tickets.toString()}
                color="blue"
              />
              <StatCard
                icon={CheckCircle}
                title="Resolved"
                value={cardData.resolved_tickets.toString()}
                color="green"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-3">Tasks</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={Clock}
                title="Assigned to Me"
                value={cardData.assigned_tasks.toString()}
                color="purple"
              />
              <StatCard
                icon={CheckCircle}
                title="Completed"
                value={cardData.completed_tasks.toString()}
                color="green"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile Information
          </h2>
          <div className="flex space-x-2">
            {isEditing ? (
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleProfileUpdate}>
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="relative">
                <img
                  src={imagePreview || user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}`}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-gray-900"
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formData.firstName} {formData.lastName}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{formData.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user?.role && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                      <Briefcase className="w-3 h-3 mr-1" />
                      {user.role}
                    </span>
                  )}
                  {user?.departments && user.departments.length > 0 ? (
                    user.departments.map((dept) => (
                      <span key={dept.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <Building2 className="w-3 h-3 mr-1" />
                        {dept.name}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      <Building2 className="w-3 h-3 mr-1" />
                      No department assigned
                    </span>
                  )}
                </div>
                {isEditing && (
                  <div className="mt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Change Avatar
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Account Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemDetails.map((detail) => (
                  <div
                    key={detail.label}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {detail.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {detail.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {isEditing && (
              <div className="flex justify-end">
                <Button type="submit" loading={loadingProfileUpdate} disabled={loadingProfileUpdate}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
    );
  };

  const renderSecurityTab = () => (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        Change Password
      </h2>
      <form onSubmit={handlePasswordChange}>
        <div className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={(e) => handleInputChange('currentPassword', e.target.value)}
            placeholder="Enter current password"
          />
          <Input
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
            placeholder="Enter new password"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Confirm new password"
          />
          <div className="pt-4">
            <Button type="submit" loading={loadingPasswordChange} disabled={loadingPasswordChange}>
              <Shield className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>
        </div>
      </form>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            General Settings
          </h2>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-2.5 py-1 rounded-full">
            Preview
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Tailor the way SafariDesk looks and behaves for your account.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Workspace Preferences
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Adjust your workspace density and helper prompts.
          </p>
          <div className="mt-4 space-y-4">
            <Switch
              checked={settingsDraft.compactMode}
              onChange={() => toggleSetting('compactMode')}
              label="Compact spacing"
            />
            <Switch
              checked={settingsDraft.showTips}
              onChange={() => toggleSetting('showTips')}
              label="Show in-app tips"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Automation & Digest
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Lightweight automations for your daily flow.
          </p>
          <div className="mt-4 space-y-4">
            <Switch
              checked={settingsDraft.weeklyDigest}
              onChange={() => toggleSetting('weeklyDigest')}
              label="Weekly productivity digest"
            />
            <Switch
              checked={settingsDraft.autoAssign}
              onChange={() => toggleSetting('autoAssign')}
              label="Auto-assign new tickets to me"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
        <Bell className="w-5 h-5 mr-2" />
        Notification Settings
      </h2>

      {loadingNotificationPrefs ? (
        <div className="h-40 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/40" />
      ) : !notificationPrefs ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-200">
          We could not load your notification preferences. Please refresh to try again.
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Delivery Channels
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Toggle the channels SafariDesk can use when sending updates.
              </p>
              <div className="space-y-3">
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <Switch
                    key={channel}
                    checked={notificationPrefs.delivery_channels?.[channel]}
                    onChange={() => handleDeliveryChannelToggle(channel)}
                    label={{
                      in_app: 'In-app feed & bell menu',
                      email: 'Email alerts',
                      push: 'Browser push (beta)',
                      sms: 'SMS (beta)',
                    }[channel]}
                  />
                ))}
                <div className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 mt-2">
                  <Switch
                    checked={notificationPrefs.browser_push_enabled}
                    onChange={handleBrowserPushToggle}
                    label="Enable browser permission prompt"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Quiet Hours
                </h3>
                <Switch
                  checked={notificationPrefs.quiet_hours?.enabled}
                  onChange={handleQuietHoursToggle}
                  label="Silence email/push at night"
                />
                {notificationPrefs.quiet_hours?.enabled && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                        Start
                      </label>
                      <input
                        type="time"
                        value={notificationPrefs.quiet_hours?.start || '22:00'}
                        onChange={(e) => handleQuietHoursTimeChange('start', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                        End
                      </label>
                      <input
                        type="time"
                        value={notificationPrefs.quiet_hours?.end || '06:00'}
                        onChange={(e) => handleQuietHoursTimeChange('end', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Temporary Snooze
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[30, 60, 120].map((minutes) => (
                    <Button
                      key={minutes}
                      variant="outline"
                      size="sm"
                      onClick={() => handleMute(minutes)}
                    >
                      Snooze {minutes}m
                    </Button>
                  ))}
                  {notificationPrefs.mute_until && (
                    <Button variant="outline" size="sm" onClick={clearMute}>
                      Clear snooze
                    </Button>
                  )}
                </div>
                {notificationPrefs.mute_until && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Snoozed until{' '}
                    {new Date(notificationPrefs.mute_until).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </div>

              <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Email digests
                </h4>
                <div className="flex items-center justify-between">
                  <Switch
                    checked={notificationPrefs.email_digest_enabled}
                    onChange={handleDigestToggle}
                    label="Send me summary emails"
                  />
                  <select
                    value={notificationPrefs.digest_frequency}
                    onChange={(e) => handleDigestFrequencyChange(e.target.value as 'daily' | 'weekly' | 'off')}
                    disabled={!notificationPrefs.email_digest_enabled}
                    className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="off">Off</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Notification Categories
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="py-2">Event</th>
                    {NOTIFICATION_CHANNELS.map((channel) => (
                      <th key={channel} className="py-2 text-center">
                        {
                          {
                            in_app: 'In-app',
                            email: 'Email',
                            push: 'Push',
                            sms: 'SMS',
                          }[channel]
                        }
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NOTIFICATION_TYPE_META.map((meta) => {
                    const row = notificationPrefs.notification_matrix?.[meta.id] || defaultNotificationChannels();
                    return (
                      <tr key={meta.id} className="border-t border-gray-100 dark:border-gray-700/60">
                        <td className="py-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{meta.label}</div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{meta.description}</p>
                        </td>
                        {NOTIFICATION_CHANNELS.map((channel) => (
                          <td key={`${meta.id}-${channel}`} className="text-center">
                            <input
                              type="checkbox"
                              checked={row[channel]}
                              onChange={() => handleMatrixToggle(meta.id, channel)}
                              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated {new Date(notificationPrefs.updated_at).toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleResetNotificationPrefs} disabled={savingNotificationPrefs}>
                Reset to defaults
              </Button>
              <Button onClick={handleSaveNotificationPreferences} loading={savingNotificationPrefs}>
                Save preferences
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // const renderThemeTab = () => (
  //   <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
  //     <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
  //       <Palette className="w-5 h-5 mr-2" />
  //       Theme Settings
  //     </h2>
  //     <div className="space-y-6">
  //       <p className="text-sm text-gray-600 dark:text-gray-400">
  //         Theme customization options will be available here. You can toggle between light and dark mode using the theme button in the header.
  //       </p>
  //     </div>
  //   </div>
  // );

  // const renderBackgroundTab = () => (
  //   <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
  //     <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
  //       <Image className="w-5 h-5 mr-2" />
  //       Background Settings
  //     </h2>
  //     <div className="space-y-6">
  //       <p className="text-sm text-gray-600 dark:text-gray-400">
  //         Background customization options will be available here.
  //       </p>
  //     </div>
  //   </div>
  // );

  // const renderTokensTab = () => (
  //   <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
  //     <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
  //       <Key className="w-5 h-5 mr-2" />
  //       Personal Access Tokens
  //     </h2>
  //     <div className="space-y-6">
  //       <p className="text-sm text-gray-600 dark:text-gray-400">
  //         Personal access tokens allow you to authenticate with the API. Token management functionality will be available here.
  //       </p>
  //     </div>
  //   </div>
  // );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'security':
        return renderSecurityTab();
      // case 'settings':
      //   return renderSettingsTab();
      // case 'notifications':
      //   return renderNotificationsTab();
      // Commented out - tabs without functionality
      // case 'theme':
      //   return renderThemeTab();
      // case 'background':
      //   return renderBackgroundTab();
      // case 'tokens':
      //   return renderTokensTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2">
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 dark:from-gray-800 dark:to-gray-900 px-6 py-5">
          <h1 className="text-xl font-semibold text-white flex items-center">
            <User className="w-5 h-5 mr-2" />
            Account Settings
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pb-5">
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <nav className="flex min-w-max items-center gap-6 px-4" aria-label="Tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                      ${isActive 
                        ? 'border-primary-600 text-primary-700 dark:text-primary-200' 
                        : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-[500px]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;
