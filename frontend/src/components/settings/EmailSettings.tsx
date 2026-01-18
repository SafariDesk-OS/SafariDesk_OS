import React, { useState } from 'react';
import { Settings } from './Settings';
import { EmailTemplates } from './EmailTemplates';
import { MailIntegrations } from './MailIntegrations';

export const EmailSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Mailboxes');

  const tabs = [
    { name: 'Mailboxes', component: <MailIntegrations /> },
    { name: 'Settings', component: <Settings /> },
    { name: 'Templates', component: <EmailTemplates /> },
  ];

  return (
    <div>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`${activeTab === tab.name
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-8">
        {tabs.find((tab) => tab.name === activeTab)?.component}
      </div>
    </div>
  );
};
