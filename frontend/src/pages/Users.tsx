import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AgentsPage from './users/Agents';
import CustomerPage from './users/Customers';
import RolesPage from './users/Roles';

const Users: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-6">
      <Routes>
        <Route index element={<Navigate to="agents\" replace />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="customers" element={<CustomerPage />} />
        <Route path="roles" element={<RolesPage />} />
      </Routes>
    </div>
  );
};


export default Users