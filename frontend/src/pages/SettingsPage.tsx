
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { BusinessSettings } from '../components/settings/BusinessSettings';
import { EmailSettings } from '../components/settings/EmailSettings';
import { DepartmentsPage } from '../components/settings/Departments';
import { TicketCategories } from '../components/settings/TicketCategories';
import { SlaPage } from './sla/main';

const pageMeta: Record<string, { title: string; description: string }> = {
  general: {
    title: 'General Settings',
    description: 'Manage your basic workspace settings like name and logo.',
  },
  business: {
    title: 'Business Settings',
    description: 'Update your business profile and contact information.',
  },
  smtp: {
    title: 'SMTP Settings',
    description: 'Configure email notifications and SMTP settings.',
  },
  profile: {
    title: 'Profile Settings',
    description: 'Manage your personal profile and security settings.',
  },
  departments: {
    title: 'Departments',
    description: 'Create and manage departments within your organization.',
  },
  'ticket-categories': {
    title: 'Ticket Categories',
    description: 'Define ticket categories for better ticket classification.',
  },
  sla: {
    title: 'Service Level Agreements',
    description: 'Set up and manage SLAs for your support tickets.',
  },
  organization: {
    title: 'Organization Settings',
    description: 'Configure organizational preferences including theme and branding.',
  },
};

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.split('/').pop() || '';
  const meta = pageMeta[path] || {
    title: 'Settings',
    description: 'Manage workspace and account settings',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{meta.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{meta.description}</p>
      </div>

      <Routes>
        <Route index element={<Navigate to="general" replace />} />
        <Route path="general" element={<GeneralSettings />} />
        <Route path="business" element={<BusinessSettings />} />
        <Route path="smtp" element={<EmailSettings />} />
        {/* <Route path="profile" element={<ProfileSettings />} /> */}
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="sla" element={<SlaPage />} />
        <Route path="ticket-categories" element={<TicketCategories />} />
      </Routes>
    </div>
  );
};

export default SettingsPage;
