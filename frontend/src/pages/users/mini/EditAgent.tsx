import React from "react";
import z from "zod";
import Button from "../../../components/ui/Button"
import { Input } from "../../../components/ui/Input"
import { X } from "lucide-react";
import http from "../../../services/http";
import { APIS } from "../../../services/apis";
import { successNotification } from "../../../components/ui/Toast";
import Spinner from "../../../components/ui/DataLoader";

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone_number: z.string().min(1, 'Phone number is required'),
  departments: z.array(z.number()).min(1, 'Please select at least one department'),
});

type CreateAgentFormData = z.infer<typeof createAgentSchema>;

type Agent = {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  department: { id: number; name: string }[];
  role: string;
  status: string;
  is_active: boolean;
  date_joined: string;
};

type AgentEditFormProps = {
  selectedAgentId: number,
  departments: Array<{ id: number; name: string }>,
  isLoadingDepartments: boolean,
  handleModalClose: () => void,
  onSuccess?: () => void,
  onError?: (error: string) => void
}


const AgentEditForm: React.FC<AgentEditFormProps> = ({
    selectedAgentId,
    departments,
    isLoadingDepartments,
    handleModalClose,
    onSuccess,
    onError,
}) => {
    const [agent, setAgent] = React.useState<Agent | null>(null);
    const [isLoadingAgent, setIsLoadingAgent] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [loadError, setLoadError] = React.useState<string | null>(null);

    // Fetch agent data from API
    const getAgentById = async (): Promise<Agent> => {
        try {
            const response = await http.get(`${APIS.GET_AGENT}/${selectedAgentId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching agent data:", error);
            throw error;
        }
    };

    // Load agent data on component mount
    React.useEffect(() => {
        const loadAgent = async () => {
            try {
                setIsLoadingAgent(true);
                setLoadError(null);
                const agentData = await getAgentById();
                setAgent(agentData);
            } catch (error) {
                setLoadError('Failed to load agent data. Please try again.');
                console.error('Error loading agent:', error);
            } finally {
                setIsLoadingAgent(false);
            }
        };

        if (selectedAgentId) {
            loadAgent();
        }
    }, [selectedAgentId]);

    // Internal form state initialized with agent data
    const [formData, setFormData] = React.useState<CreateAgentFormData>({
        name: '',
        email: '',
        phone_number: '',
        departments: [],
    });

    const [formErrors, setFormErrors] = React.useState<Partial<Record<keyof CreateAgentFormData, string>>>({});

    // Update form data when agent data is loaded
    React.useEffect(() => {
        if (agent) {
            setFormData({
                name: agent.name,
                email: agent.email,
                phone_number: agent.phone_number,
                departments: Array.isArray(agent.department) ? agent.department.map(dep => dep.id) : [],
            });
            setFormErrors({});
        }
    }, [agent]);

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

    const handleFormSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await http.put(`${APIS.UPDATE_AGENT}${selectedAgentId}`, formData);
            handleModalClose();

            successNotification(response.data.message || 'Agent updated successfully!');
            
            // Success callback
            if (onSuccess) {
                onSuccess();
            }
            
        } catch (error) {
            console.error('Error updating agent:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update agent. Please try again.';
            
            // Error callback
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDepartmentToggle = (departmentId: number) => {
        const currentDepartments = formData.departments || [];
        const isSelected = currentDepartments.includes(departmentId);
        
        let updatedDepartments: number[];
        if (isSelected) {
            updatedDepartments = currentDepartments.filter(id => id !== departmentId);
        } else {
            updatedDepartments = [...currentDepartments, departmentId];
        }
        
        handleInputChange('departments', updatedDepartments);
    };

    const getSelectedDepartmentNames = () => {
        return departments
            .filter(dept => formData.departments?.includes(dept.id))
            .map(dept => dept.name);
    };

    // Show loading spinner while fetching agent data
    if (isLoadingAgent) {
        return <Spinner />;
    }

    // Show error message if failed to load agent data
    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <p className="text-red-600 dark:text-red-400 mb-4">{loadError}</p>
                <div className="flex space-x-3">
                    <Button variant="ghost" onClick={handleModalClose}>
                        Cancel
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    // Show message if agent data is not available
    if (!agent) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">Agent data not found.</p>
                <Button variant="ghost" onClick={handleModalClose}>
                    Close
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
          <div>
            <Input 
              label="Full name" 
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              fullWidth 
              error={formErrors.name}
            />
          </div>

          <div>
            <Input 
              label="Email" 
              type="email" 
              placeholder="agent@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              fullWidth 
              error={formErrors.email}
            />
          </div>

          <div>
            <Input 
              label="Phone Number" 
              placeholder="Enter phone number"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              fullWidth 
              error={formErrors.phone_number}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Departments
            </label>
            
            {formData.departments && formData.departments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {getSelectedDepartmentNames().map((deptName, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                  >
                    {deptName}
                    <button
                      type="button"
                      onClick={() => {
                        const deptId = departments.find(d => d.name === deptName)?.id;
                        if (deptId) handleDepartmentToggle(deptId);
                      }}
                      className="ml-1 inline-flex items-center p-0.5 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className={`border rounded-lg p-3 max-h-40 overflow-y-auto bg-white dark:bg-gray-800 ${
              formErrors.departments ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}>
              {isLoadingDepartments ? (
                <div className="text-gray-500 dark:text-gray-400 text-sm">Loading departments...</div>
              ) : departments.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-sm">No departments available</div>
              ) : (
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <label 
                      key={dept.id} 
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.departments?.includes(dept.id) || false}
                        onChange={() => handleDepartmentToggle(dept.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{dept.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            {formErrors.departments && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.departments}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting || isLoadingDepartments}>
              {isSubmitting ? 'Updating...' : 'Update Agent'}
            </Button>
          </div>
        </div>
    );
};

export default AgentEditForm;
