import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit, Trash2, Timer, CheckCircle, Settings, X, Play, Pause, Eye } from 'lucide-react';
import { APIS } from '../../../services/apis';
import http from '../../../services/http';
import { errorNotification, successNotification } from '../../../components/ui/Toast';
import Drawer from '../../../components/ui/Drawer';
import { EmptyState, NoItemsFound } from '../../../components/ui/NoItems';
import Spinner from '../../../components/ui/DataLoader';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';


// New Target type
type Target = {
  id: number;
  priority: string;
  resolution_time: number;
  resolution_unit: string;
  operational_hours: string;
};

// Updated Policy type
type Policy = {
  id: number; // Changed from string to number
  name: string;
  description: string;
  operational_hours: string;
  evaluation_method: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  conditions: any[];
  targets: Target[];
};

type EditPolicyForm = {
  name: string;
  description: string;
  operational_hours: string;
  evaluation_method: string;
  is_active: boolean;
};

const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'normal': // Added normal priority
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'low': // Added low priority
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

type Props = {
  reload: number;
  setPoliciesCount: React.Dispatch<React.SetStateAction<number>>;
};

// Removed getTierStyle as customer_tier is not in the API response for Policy

const formatTime = (time: number, unit: string) => {
  return `${time} ${unit}${time !== 1 ? 's' : ''}`;
};

const PolicyComponent: React.FC<Props> = ({
  reload,
  setPoliciesCount
}) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTargetsModalOpen, setEditTargetsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState<EditPolicyForm>({
    name: '',
    description: '',
    operational_hours: '',
    evaluation_method: 'ticket_creation',
    is_active: true,
  });
  const [targetsFormData, setTargetsFormData] = useState<Target[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [choices, setChoices] = useState<any>({});

  const fetchPolicies = async (pageNumber = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await http.get(`${APIS.POLICIES}/?page=${pageNumber}`);
      setPolicies(response.data.results); // Set policies to response.data.results
      setCount(response.data.count);
      setPoliciesCount(response.data.count); // Update the policies count in the parent component
    } catch (err) {
      console.error(error)
      errorNotification('Failed to load policies');
    } finally {
      setTimeout(() =>setLoading(false), 100)
    }
  };

  useEffect(() => {
    fetchPolicies(page);
    fetchChoices();
  }, [page, reload]);

  const fetchChoices = async () => {
    try {
      const response = await http.get(`${APIS.POLICIES}/choices`);
      setChoices(response.data);
    } catch (error) {
      console.error('Failed to fetch choices:', error);
    }
  };

  const handleEditClick = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description,
      operational_hours: policy.operational_hours,
      evaluation_method: policy.evaluation_method,
      is_active: policy.is_active,
    });
    setEditModalOpen(true);
  };

  const handleEditTargetsClick = (policy: Policy) => {
    setEditingPolicy(policy);
    setTargetsFormData([...policy.targets]);
    setEditTargetsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setEditingPolicy(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'first_response_time' || name === 'resolution_time') { // Removed category
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;

    setSubmitting(true);

    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        operational_hours: formData.operational_hours,
        evaluation_method: formData.evaluation_method,
        is_active: formData.is_active,
        // Keep existing conditions and targets unchanged
        conditions: editingPolicy.conditions,
        targets: editingPolicy.targets,
      };

      await http.put(`${APIS.POLICIES}/${editingPolicy.id}/`, updateData);
      successNotification('Policy updated successfully');
      handleCloseModal();
      fetchPolicies(page);
    } catch (err) {
      errorNotification('Failed to update policy');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(count / 10);

  const handleActivateDeactivate = async (policy: Policy, activate: boolean) => {
    try {
      const endpoint = activate ? `${APIS.POLICIES}/${policy.id}/activate/` : `${APIS.POLICIES}/${policy.id}/deactivate/`;
      await http.post(endpoint);
      successNotification(`Policy ${activate ? 'activated' : 'deactivated'} successfully`);
      fetchPolicies(page);
    } catch (error) {
      errorNotification(`Failed to ${activate ? 'activate' : 'deactivate'} policy`);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Policy Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Targets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Conditions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {policies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {policy.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {policy.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          policy.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {policy.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="space-y-1">
                          {policy.targets.slice(0, 2).map((target, index) => (
                            <div key={target.id} className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyle(target.priority)}`}>
                                {target.priority}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(target.resolution_time, target.resolution_unit)}
                              </span>
                            </div>
                          ))}
                          {policy.targets.length > 2 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{policy.targets.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {policy.conditions.length > 0 ? (
                          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                            {policy.conditions.length} condition{policy.conditions.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(policy.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setViewingPolicy(policy);
                              setViewModalOpen(true);
                            }}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            title="View Policy Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditClick(policy)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit Policy Details"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleEditTargetsClick(policy)}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            title="Edit Targets"
                          >
                            <Settings size={16} />
                          </button>
                          {policy.is_active ? (
                            <button
                              onClick={() => handleActivateDeactivate(policy, false)}
                              className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                              title="Deactivate Policy"
                            >
                              <Pause size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateDeactivate(policy, true)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Activate Policy"
                            >
                              <Play size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {policies.length === 0 && (
              <div className="text-center py-12">
                <EmptyState title="No SLA policies found" />
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {policies.length > 0 && (
            <div className="flex justify-center items-center gap-4 pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

       <Drawer
        isOpen={editModalOpen}
        close={() => setEditModalOpen(false)}
        title="Edit Policy Details"
        size="sm"
        content={
          <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Policy Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter policy name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Policy description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Operational Hours *
                  </label>
                  <select
                    name="operational_hours"
                    value={formData.operational_hours}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select operational hours</option>
                    {choices.operational_hours?.map((option: any) => (
                      <option key={option[0]} value={option[0]}>
                        {option[1]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Evaluation Method *
                  </label>
                  <select
                    name="evaluation_method"
                    value={formData.evaluation_method}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    {choices.evaluation_methods?.map((option: any) => (
                      <option key={option[0]} value={option[0]}>
                        {option[1]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update Policy'}
                  </button>
                </div>
              </form>
        }
       />

      {/* Edit Targets Drawer */}
      <Drawer
        isOpen={editTargetsModalOpen}
        close={() => setEditTargetsModalOpen(false)}
        title="Edit Policy Targets"
        size='md'
        content={
          <div className="space-y-6">
            {targetsFormData.map((target, index) => (
              <div key={target.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Target {index + 1}: {target.priority.charAt(0).toUpperCase() + target.priority.slice(1)} Priority
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority *
                    </label>
                    <select
                      value={target.priority}
                      onChange={(e) => {
                        const newTargets = [...targetsFormData];
                        newTargets[index].priority = e.target.value;
                        setTargetsFormData(newTargets);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    >
                      {choices.priorities?.map((option: any) => (
                        <option key={option[0]} value={option[0]}>
                          {option[1]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Operational Hours *
                    </label>
                    <select
                      value={target.operational_hours}
                      onChange={(e) => {
                        const newTargets = [...targetsFormData];
                        newTargets[index].operational_hours = e.target.value;
                        setTargetsFormData(newTargets);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select operational hours</option>
                      {choices.operational_hours?.map((option: any) => (
                        <option key={option[0]} value={option[0]}>
                          {option[1]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Resolution Time *
                    </label>
                    <input
                      type="number"
                      value={target.resolution_time}
                      onChange={(e) => {
                        const newTargets = [...targetsFormData];
                        newTargets[index].resolution_time = parseInt(e.target.value) || 1;
                        setTargetsFormData(newTargets);
                      }}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unit *
                    </label>
                    <select
                      value={target.resolution_unit}
                      onChange={(e) => {
                        const newTargets = [...targetsFormData];
                        newTargets[index].resolution_unit = e.target.value;
                        setTargetsFormData(newTargets);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    >
                      {choices.time_units?.map((option: any) => (
                        <option key={option[0]} value={option[0]}>
                          {option[1]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={async () => {
                  if (!editingPolicy) return;

                  setSubmitting(true);
                  try {
                    const updateData = {
                      name: editingPolicy.name,
                      description: editingPolicy.description,
                      operational_hours: editingPolicy.operational_hours,
                      evaluation_method: editingPolicy.evaluation_method,
                      is_active: editingPolicy.is_active,
                      conditions: editingPolicy.conditions,
                      targets: targetsFormData,
                    };

                    await http.put(`${APIS.POLICIES}/${editingPolicy.id}/`, updateData);
                    successNotification('Policy targets updated successfully');
                    setEditTargetsModalOpen(false);
                    fetchPolicies(page);
                  } catch (err) {
                    errorNotification('Failed to update policy targets');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update Targets'}
              </button>
            </div>
          </div>
        }
      />

      {/* View Policy Drawer */}
      <Drawer
        isOpen={viewModalOpen}
        close={() => setViewModalOpen(false)}
        title={`Policy Details: ${viewingPolicy?.name}`}
        size="md"
        content={
          <div className="space-y-6">
            {viewingPolicy && (
              <>
                {/* Basic Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Policy Name</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingPolicy.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <p className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          viewingPolicy.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {viewingPolicy.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Operational Hours</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {choices.operational_hours?.find((option: any) => option[0] === viewingPolicy.operational_hours)?.[1] || viewingPolicy.operational_hours}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Evaluation Method</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {choices.evaluation_methods?.find((option: any) => option[0] === viewingPolicy.evaluation_method)?.[1] || viewingPolicy.evaluation_method}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingPolicy.description}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(viewingPolicy.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(viewingPolicy.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Conditions ({viewingPolicy.conditions.length})</h3>
                  {viewingPolicy.conditions.length > 0 ? (
                    <div className="space-y-3">
                      {viewingPolicy.conditions.map((condition: any, index: number) => (
                        <div key={index} className="bg-white dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-500">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Condition Type</label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {choices.condition_types?.find((option: any) => option[0] === condition.condition_type)?.[1] || condition.condition_type}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Operator</label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {choices.operators?.find((option: any) => option[0] === condition.operator)?.[1] || condition.operator}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Value</label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-white">{condition.value}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              condition.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {condition.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No conditions defined for this policy.</p>
                  )}
                </div>

                {/* Targets */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Targets ({viewingPolicy.targets.length})</h3>
                  {viewingPolicy.targets.length > 0 ? (
                    <div className="space-y-4">
                      {viewingPolicy.targets.map((target, index) => (
                        <div key={target.id} className="bg-white dark:bg-gray-600 rounded-lg p-4 border border-gray-200 dark:border-gray-500">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-md font-medium text-gray-900 dark:text-white">
                              Target {index + 1}: {target.priority.charAt(0).toUpperCase() + target.priority.slice(1)} Priority
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyle(target.priority)}`}>
                              {target.priority}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Operational Hours</label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {choices.operational_hours?.find((option: any) => option[0] === target.operational_hours)?.[1] || target.operational_hours}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resolution Time</label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {formatTime(target.resolution_time, target.resolution_unit)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                              <label className="block text-sm font-medium text-green-700 dark:text-green-300">Resolution Target</label>
                              <p className="mt-1 text-xl font-semibold text-green-900 dark:text-green-100">
                                {formatTime(target.resolution_time, target.resolution_unit)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No targets defined for this policy.</p>
                  )}
                </div>
              </>
            )}
          </div>
        }
      />

    </div>
  );
};

export default PolicyComponent;
