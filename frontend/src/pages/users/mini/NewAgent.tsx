
import z from "zod";
import Button from "../../../components/ui/Button"
import { Input } from "../../../components/ui/Input"
import { X } from "lucide-react";

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone_number: z.string().min(1, 'Phone number is required'),
  departments: z.array(z.number()).min(1, 'Please select at least one department'),
});

type CreateAgentFormData = z.infer<typeof createAgentSchema>;

type AgentFormProps = {
  formData: CreateAgentFormData,
  handleInputChange: (field: keyof CreateAgentFormData, value: string | number | number[]) => void,
  formErrors: Record<string, string>,
  departments: Array<{ id: number; name: string }>,
  isLoadingDepartments: boolean,
  isSubmitting: boolean,
  handleModalClose: () => void,
  handleSubmit: () => void
}

const AgentForm: React.FC<AgentFormProps> = ({
    formData,
    handleInputChange,
    formErrors,
    departments,
    isLoadingDepartments,
    isSubmitting,
    handleModalClose,
    handleSubmit,
}) => {

    const handleDepartmentToggle = (departmentId: number) => {
        const currentDepartments = formData.departments || [];
        const isSelected = currentDepartments.includes(departmentId);
        
        let updatedDepartments: number[];
        if (isSelected) {
            // Remove department
            updatedDepartments = currentDepartments.filter(id => id !== departmentId);
        } else {
            // Add department
            updatedDepartments = [...currentDepartments, departmentId];
        }
        
        handleInputChange('departments', updatedDepartments);
    };

    const getSelectedDepartmentNames = () => {
        return departments
            .filter(dept => formData.departments?.includes(dept.id))
            .map(dept => dept.name);
    };

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
            
            {/* Selected departments display */}
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

            {/* Department selection */}
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
            <Button onClick={handleSubmit} disabled={isSubmitting || isLoadingDepartments}>
              {isSubmitting ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </div>
    )
}

export default AgentForm
