import React, { useState } from 'react';
import { CustomerHeader } from './Header';
import { CustomerMain } from './Main';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <CustomerHeader  />
      <CustomerMain>
        {children}
      </CustomerMain>
      {/* <CustomerFooter /> */}
      {/* Global Chatbot Widget on all customer pages */}
    </div>
  );
};
