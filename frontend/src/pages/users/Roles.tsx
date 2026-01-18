import React, { useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserPlus } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { APIS } from '../../services/apis';
import http from '../../services/http';
import { errorNotification, successNotification } from '../../components/ui/Toast';

interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;  // Combined name field from API
  email: string;
  role?: {
    id: number;
    name: string;
  } | string;  // Role can be string from API response
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  username?: string;
  phone_number?: string;
  department?: Array<{ id: number; name: string }>;  // Departments with id and name
}

const RolesPage: React.FC = () => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<keyof User>('first_name');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [newRole, setNewRole] = React.useState('');

  // Fetch agents from API
  const fetchAgents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await http.get(APIS.LIST_AGENTS, {
        params: { pagination: 'no' }
      });
      const agentsData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setUsers(agentsData);
    } catch (error) {
      errorNotification('Failed to fetch agents');
      console.error('Error fetching agents:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const filteredUsers = React.useMemo(() => {
    return users.filter(user =>
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
      return 0;
    });
  }, [users, searchTerm, sortBy, sortDirection]);

  const handleSort = (key: keyof User) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    const roleName = typeof user.role === 'string' ? user.role : user.role?.name || 'agent';
    setNewRole(roleName);
    setShowEditModal(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !newRole) {
      errorNotification('Please select a role');
      return;
    }

    try {
      // Backend expects a combined 'name' field, not separate first_name/last_name
      const name = selectedUser.name || `${selectedUser.first_name} ${selectedUser.last_name}`.trim();
      
      // Extract department IDs from the user's current departments
      const departmentIds = selectedUser.department?.map(dept => dept.id) || [];
      
      await http.put(`${APIS.UPDATE_AGENT}${selectedUser.id}`, {
        name: name,
        email: selectedUser.email,
        phone_number: selectedUser.phone_number || '',
        gender: 'other',
        departments: departmentIds,  // Send actual department IDs
        role: newRole
      });

      successNotification('Role updated successfully');
      setShowEditModal(false);
      fetchAgents();
    } catch (error) {
      errorNotification('Failed to update role');
      console.error('Error updating role:', error);
    }
  };

  const columns = [
    {
      key: 'name' as keyof User,
      header: 'Name',
      sortable: true,
      render: (value: string, row: User) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm font-medium">
              {value && value.charAt(0)}{value && value.split(' ')[1] && value.split(' ')[1].charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{value || 'N/A'}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role' as keyof User,
      header: 'Role',
      sortable: true,
      render: (value: any) => {
        const roleName = typeof value === 'string' ? value : value?.name || 'N/A';
        return <Badge variant="primary">{roleName}</Badge>;
      },
    },
    {
      key: 'is_active' as keyof User,
      header: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'default'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'last_login' as keyof User,
      header: 'Last Login',
      sortable: true,
      render: (value: string | undefined) => value ? new Date(value).toLocaleString() : 'Never',
    },
    {
      key: 'created_at' as keyof User,
      header: 'Created',
      sortable: true,
      render: (value: string | undefined) => value ? new Date(value).toLocaleDateString() : 'N/A',
    },
    {
      key: 'id' as keyof User,
      header: 'Actions',
      render: (value: any, row: User) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={Edit}
            onClick={() => handleEditRole(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 lg:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Roles & Permissions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage workspace roles and permissions</p>
        </div>
        
        <Button
          icon={UserPlus}
          onClick={() => setShowCreateModal(true)}
        >
          Invite User
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <Input
          icon={Search}
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading agents...</div>
        ) : (
          <Table
            data={filteredUsers}
            columns={columns}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </div>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Role - ${selectedUser?.name || 'User'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input 
              type="email" 
              value={selectedUser?.email || ''} 
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select 
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole}>
              Save Role
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Invite New User"
      >
        <div className="space-y-4">
          <Input label="Email" type="email" placeholder="user@example.com" fullWidth />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="staff">Staff</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateModal(false)}>
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RolesPage