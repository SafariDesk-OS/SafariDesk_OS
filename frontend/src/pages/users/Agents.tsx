import React from 'react';
import { Search, Edit, Trash2, UserPlus, Power } from 'lucide-react';
import { z } from 'zod';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import http from '../../services/http';
import { APIS } from '../../services/apis';
import { errorNotification, successNotification } from '../../components/ui/Toast';
import AgentForm from './mini/NewAgent';
import { Loader } from '../../components/loader/loader';
import { Agent } from '../../types';
import AgentEditForm from './mini/EditAgent';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

// Updated Zod validation schema
const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone_number: z.string().min(1, 'Phone number is required'),
  departments: z.array(z.number()).min(1, 'Please select at least one department'),
});

type CreateAgentFormData = z.infer<typeof createAgentSchema>;



interface Department {
  id: number;
  name: string;
  slag: string;
  created_at: string;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Agent[];
}

const AgentsPage: React.FC = () => {
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<keyof Agent>('name');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [isDeactivatig, setIsDeactivating] = React.useState(false);
  const [selectedAgent, setSelectedAgent] = React.useState<number | null>(null);
  const [action, setAction] = React.useState<String>("create");
  const [reload, setReload] = React.useState<number>(0);
  
  // Updated form state
  const [formData, setFormData] = React.useState<CreateAgentFormData>({
    name: '',
    email: '',
    phone_number: '',
    departments: [],
  });
  const [formErrors, setFormErrors] = React.useState<Partial<Record<keyof CreateAgentFormData, string>>>({});

  // Load agents on component mount
  React.useEffect(() => {
    loadAgents();
  }, [reload]);

  // Load departments when modal opens
  React.useEffect(() => {
    if (showModal && departments.length === 0) {
      loadDepartments();
    }
  }, [showModal]);

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    try {
      const response = await http.get<ApiResponse>(APIS.LIST_AGENTS);
      console.log(response.data)
      setAgents(response.data.results || []);
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || "An error occurred")
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const loadDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const response = await http.get(`${APIS.LIST_DEPARTMENTS}?pagination=no`);
      setDepartments(response.data || []);
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || "An error occurred")
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const handleInputChange = (field: keyof CreateAgentFormData, value: string | number | number[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    try {
      createAgentSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof CreateAgentFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0] as keyof CreateAgentFormData] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await http.post(APIS.CREATE_AGENT, formData);
      successNotification(response.data.message);

      // Success - close modal, reset form, and reload agents
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        departments: [],
      });
      setFormErrors({});
      // Reload the agents list to show the new agent
      loadAgents();
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || "An error occurred")
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      departments: [],
    });
    setFormErrors({});
  };

  const filteredAgents = React.useMemo(() => {
    return agents.filter(agent => {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = agent.name.toLowerCase().includes(searchLower);
      const emailMatch = agent.email.toLowerCase().includes(searchLower);
      const deptMatch = agent.department.some(dept => 
        dept.name.toLowerCase().includes(searchLower)
      );
      
      return nameMatch || emailMatch || deptMatch;
    }).sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [agents, searchTerm, sortBy, sortDirection]);

  const handleSort = (key: keyof Agent) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'A' && isActive) {
      return <Badge variant="success">Active</Badge>;
    }
    return <Badge variant="default">Inactive</Badge>;
  };

  // Helper function to render departments
  const renderDepartments = (agent: Agent) => {
    if (agent.department && agent.department.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {agent.department.map((dept) => (
            <Badge key={dept.id} variant="primary" className="text-xs">
              {dept.name}
            </Badge>
          ))}
        </div>
      );
    }
    return <span className="text-gray-500 dark:text-gray-400 text-sm">No department</span>;
  };




  const handleEdit = (agent: number) => {
  setAction("edit");
  setSelectedAgent(agent);
  setShowModal(true);
};

const handleDeactivate = (agent: number) => {
  setSelectedAgent(agent);
  setConfirm(true);
};


const handleDeactivateAgent = async () => {
  try{
    setIsDeactivating(true)
    const response = await http.put(`${APIS.UPDATE_AGENT_STATUS}${selectedAgent}`)
    await loadAgents()
    setConfirm(false)
    successNotification(response.data.message)
  }catch(error: any){
    errorNotification(error?.response?.data?.message || "An error occurred")
  }finally{
    setTimeout(() => setIsDeactivating(false), 0)

  }
};




  const columns = [
    {
      key: 'name' as keyof Agent,
      header: 'Name',
      sortable: true,
      render: (value: string, row: Agent) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center mr-3 bg-primary-600 text-white text-sm font-medium">
            {row.avatar_url ? (
              <img
                src={row.avatar_url}
                alt={value}
                className="w-full h-full object-cover"
              />
            ) : (
              value
                .split(' ')
                .filter(Boolean)
                .map(n => n[0].toUpperCase())
                .slice(0, 2)
                .join('')
            )}
          </div>

          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'department' as keyof Agent,
      header: 'Departments',
      sortable: false, // Disable sorting for complex department object
      render: (value: any, row: Agent) => renderDepartments(row),
    },
    {
      key: 'phone_number' as keyof Agent,
      header: 'Phone',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-900 dark:text-gray-100">{value}</span>
      ),
    },
    {
      key: 'status' as keyof Agent,
      header: 'Status',
      sortable: true,
      render: (value: string, row: Agent) => getStatusBadge(value, row.is_active),
    },
    {
      key: 'date_joined' as keyof Agent,
      header: 'Date Joined',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
  key: 'id' as keyof Agent,
  header: 'Actions',
  render: (agentId: number) => (
    <div className="flex space-x-2">
      <Button
        onClick={() => handleEdit(agentId)}
        variant="ghost"
        size="sm"
        icon={Edit}
        title='Edit'
      />
      <Button
        onClick={() => handleDeactivate(agentId)}
        variant="ghost"
        size="sm"
        icon={Power}
      />
    </div>
  ),
}

  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 lg:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agents</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage agents and their information
          </p>
        </div>
        
        <Button
          icon={UserPlus}
          onClick={() => {
            setAction("create");
            setShowModal(true)
          }}
        >
          Create Agent
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <Input
          icon={Search}
          placeholder="Search agents by name, email, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Agents Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {filteredAgents.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No agents found matching your search.' : 'No agents found.'}
            </div>
          </div>
        ) : (
          <Table
            data={filteredAgents}
            columns={columns}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </div>

      {/* Create Agent Modal */}
      <Modal
      isOpen={showModal}
      onClose={handleModalClose}
      title={action === 'edit' ? "Edit Agent" : "Create New Agent"}
    >
      {showModal && action === 'create' && (
        <AgentForm 
          departments={departments} 
          formData={formData} 
          formErrors={formErrors} 
          handleInputChange={handleInputChange} 
          handleModalClose={handleModalClose} 
          handleSubmit={handleSubmit} 
          isLoadingDepartments={isLoadingDepartments} 
          isSubmitting={isSubmitting}
        />
      )}

      {showModal && action === 'edit' && selectedAgent && (
        <AgentEditForm 
          selectedAgentId={selectedAgent}
          departments={departments} 
          handleModalClose={handleModalClose} 
          isLoadingDepartments={isLoadingDepartments} 
          onError={(error: string) => errorNotification(error)}
          onSuccess={() => setReload(prev => prev + 1)}
        />
      )}
    </Modal>

    <ConfirmDialog state={isDeactivatig} cancel={() => setConfirm(false)} message={`Are you sure to deactivate agent?`} show={confirm} onConfirm={handleDeactivateAgent} variant='danger'/>


      {/* Loader */}
      { isLoadingAgents && <Loader/>}
    </div>
  );
};

export default AgentsPage;