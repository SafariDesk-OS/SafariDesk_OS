import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ConfigLayout from '../components/config/ConfigLayout';
import SettingsComponent from '../components/config/Gen';
import { EmailSettings } from '../components/settings/EmailSettings';
import { DepartmentsPage } from '../components/settings/Departments';
import { TicketCategories } from '../components/settings/TicketCategories';
import { SlaPage } from './sla/main';
import { HelpCenter } from '../components/config/HelpCenter';
import { CustomDomainsSettings } from '../components/settings/CustomDomains';
import { useAuthStore } from '../stores/authStore';

const ConfigPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <ConfigLayout>
      <Routes>
        {/* Default route - redirect to general */}
        <Route index element={<Navigate to="/config/general" replace />} />

        {/* Configuration routes */}
        <Route path="general" element={<SettingsComponent user={user} />} />
        <Route path="sla" element={<SlaPage />} />
        <Route path="categories" element={<TicketCategories />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="email" element={<EmailSettings />} />
        <Route path="help-center" element={<HelpCenter />} />
        <Route path="domains" element={<CustomDomainsSettings />} />

        {/* Catch all - redirect to general */}
        <Route path="*" element={<Navigate to="/config/general" replace />} />
      </Routes>
    </ConfigLayout>
  );
};

export default ConfigPage;
