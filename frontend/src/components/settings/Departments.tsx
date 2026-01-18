import React from "react";
import { useQuery, useQueryClient } from "react-query";
import {
  Plus,
  Search,
  Home,
  Power,
  Settings as SettingsIcon,
  Users,
  UserPlus,
} from "lucide-react";
import axios from "axios";
import http from "../../services/http";
import Button from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import { Table } from "../ui/Table";
import { TableSkeleton } from "../ui/TableSkeleton";
import {
  errorNotification,
  successNotification,
} from "../ui/Toast";
import { APIS } from "../../services/apis";
import { useFetchAgents } from "../../services/agents";
import { AgentType } from "../../types/agents";
import {
  MailIntegration,
  fetchMailIntegrations,
  updateMailIntegrationRouting,
} from "../../services/settings";

interface Department {
  id: number;
  name: string;
  slag: string;
  created_at: string;
  support_email: string;
  status: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Department[];
}

interface DepartmentTableRow extends Department {
  activeAgents: number;
  supportEmail: string;
}

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newDepartmentName, setNewDepartmentName] = React.useState("");
  const [sortBy, setSortBy] = React.useState<keyof Department>("name");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "asc",
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] =
    React.useState<number | null>(null);
  const [isDeactivating, setIsDeactivating] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);

  const [drawerDepartment, setDrawerDepartment] =
    React.useState<Department | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [generalSaving, setGeneralSaving] = React.useState(false);
  const [statusUpdating, setStatusUpdating] = React.useState(false);
  const [generalForm, setGeneralForm] = React.useState({
    name: "",
    supportEmail: "",
  });

  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = React.useState(false);
  const [selectedAgentIds, setSelectedAgentIds] = React.useState<number[]>([]);
  const [isAssigningAgents, setIsAssigningAgents] = React.useState(false);
  const [activeDrawerTab, setActiveDrawerTab] =
    React.useState<"general" | "agents">("general");
  const [agentSearch, setAgentSearch] = React.useState("");
  const [addAgentSearch, setAddAgentSearch] = React.useState("");

  const { data: agentResponse, refetch: refetchAgents } = useFetchAgents();
  const agents: AgentType[] = agentResponse?.results ?? [];

  const { data: integrations } = useQuery<MailIntegration[]>(
    "mailIntegrations",
    fetchMailIntegrations,
  );
  const connectedIntegrations = React.useMemo(
    () =>
      integrations?.filter(
        (integration) => integration.connection_status === "connected",
      ) ?? [],
    [integrations],
  );
  const queryClient = useQueryClient();

  const getIntegrationForDepartment = React.useCallback(
    (departmentId: number) =>
      connectedIntegrations.find(
        (integration) => integration.department === departmentId,
      ),
    [connectedIntegrations],
  );

  const getIntegrationByEmail = React.useCallback(
    (email: string) =>
      connectedIntegrations.find(
        (integration) =>
          (integration.email_address || "").toLowerCase() ===
          email.toLowerCase(),
      ),
    [connectedIntegrations],
  );

  const getSupportEmailForDepartment = React.useCallback(
    (department: Department) =>
      getIntegrationForDepartment(department.id)?.email_address ||
      department.support_email ||
      "",
    [getIntegrationForDepartment],
  );

  const fetchDepartments = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      const response = await http.get<PaginatedResponse>(
        `${APIS.LIST_DEPARTMENTS}?${params}`,
      );
      setDepartments(response.data.results);
      setTotalCount(response.data.count);
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      if (axios.isAxiosError(err)) {
        errorNotification(
          `Failed to load departments: ${err.response?.status} ${err.response?.statusText}`,
        );
      } else {
        errorNotification("Failed to load departments");
      }
      setError("Failed to fetch departments");
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  React.useEffect(() => {
    fetchDepartments(1);
  }, []);

  React.useEffect(() => {
    if (drawerDepartment) {
      setGeneralForm({
        name: drawerDepartment.name,
        supportEmail: getSupportEmailForDepartment(drawerDepartment),
      });
    }
  }, [drawerDepartment, getSupportEmailForDepartment]);

  React.useEffect(() => {
    if (isDrawerOpen) {
      setActiveDrawerTab("general");
      setAgentSearch("");
      setAddAgentSearch("");
    }
  }, [isDrawerOpen]);

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedDepartments = [...filteredDepartments].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    if (a[sortBy] < b[sortBy]) return -1 * direction;
    if (a[sortBy] > b[sortBy]) return direction;
    return 0;
  });

  const buildTableData = (): DepartmentTableRow[] =>
    sortedDepartments.map((dept) => {
      const activeAgents = agents.filter(
        (agent) =>
          agent.is_active &&
          agent.department &&
          Array.isArray(agent.department) &&
          agent.department.some((d) => d.id === dept.id),
      ).length;
      return {
        ...dept,
        activeAgents,
        supportEmail: getSupportEmailForDepartment(dept),
      };
    });

  const openDrawer = (department: Department) => {
    setDrawerDepartment(department);
    setGeneralForm({
      name: department.name,
      supportEmail: getSupportEmailForDepartment(department),
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setDrawerDepartment(null);
    setSelectedAgentIds([]);
    setAgentSearch("");
    setAddAgentSearch("");
  };

  const handleSort = (key: keyof Department) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) return;
    setIsLoading(true);
    try {
      await http.post(APIS.CREATE_DEPARTMENT, {
        name: newDepartmentName.trim(),
        support_email: "",
      });
      successNotification("Department created successfully");
      setShowCreateModal(false);
      setNewDepartmentName("");
      await fetchDepartments(currentPage);
    } catch (err: any) {
      errorNotification(
        err?.response?.data?.message ||
          "Failed to create department. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = (id: number) => {
    setSelectedDepartmentId(id);
    setConfirm(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!selectedDepartmentId) return;
    setIsDeactivating(true);
    try {
      await http.put(
        `${APIS.UPDATE_DEPARTMENT_STATUS}${selectedDepartmentId}/`,
      );
      successNotification("Department status updated");
      await fetchDepartments(currentPage);
      refetchAgents();
    } catch (err) {
      errorNotification("Failed to update department status");
    } finally {
      setIsDeactivating(false);
      setConfirm(false);
      setSelectedDepartmentId(null);
    }
  };

  const handleGeneralSave = async () => {
    if (!drawerDepartment) return;
    if (!generalForm.name.trim()) {
      errorNotification("Department name is required");
      return;
    }
    setGeneralSaving(true);

    try {
      const trimmedEmail = generalForm.supportEmail.trim();
      const prevIntegration = getIntegrationForDepartment(drawerDepartment.id);
      const newIntegration = trimmedEmail
        ? getIntegrationByEmail(trimmedEmail)
        : undefined;

      await http.put(`${APIS.UPDATE_DEPARTMENT}${drawerDepartment.id}/`, {
        name: generalForm.name.trim(),
        support_email: trimmedEmail,
      });

      const updates: Promise<any>[] = [];

      if (
        prevIntegration &&
        (!newIntegration || prevIntegration.id !== newIntegration.id)
      ) {
        updates.push(
          updateMailIntegrationRouting(prevIntegration.id, {
            department: null,
          }),
        );
      }

      if (newIntegration) {
        updates.push(
          updateMailIntegrationRouting(newIntegration.id, {
            department: drawerDepartment.id,
          }),
        );
      }

      if (updates.length) {
        await Promise.all(updates);
        queryClient.invalidateQueries("mailIntegrations");
      }

      successNotification("Department updated successfully");
      setDrawerDepartment((prev) =>
        prev
          ? {
              ...prev,
              name: generalForm.name.trim(),
              support_email: trimmedEmail,
            }
          : prev,
      );
      await fetchDepartments(currentPage);
    } catch (err: any) {
      errorNotification(
        err?.response?.data?.message || "Failed to update department",
      );
    } finally {
      setGeneralSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!drawerDepartment) return;
    setStatusUpdating(true);
    try {
      await http.put(`${APIS.UPDATE_DEPARTMENT_STATUS}${drawerDepartment.id}/`);
      successNotification("Department status updated");
      await fetchDepartments(currentPage);
      refetchAgents();
    } catch (err) {
      errorNotification("Failed to update department status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const departmentAgents = drawerDepartment
    ? agents.filter(
        (agent) =>
          agent.department &&
          Array.isArray(agent.department) &&
          agent.department.some((d) => d.id === drawerDepartment.id),
      )
    : [];

  const availableAgents = drawerDepartment
    ? agents.filter(
        (agent) =>
          !agent.department ||
          !Array.isArray(agent.department) ||
          !agent.department.some((d) => d.id === drawerDepartment.id),
      )
    : [];

  const filteredDepartmentAgents = departmentAgents.filter((agent) =>
    `${agent.name} ${agent.email}`
      .toLowerCase()
      .includes(agentSearch.toLowerCase()),
  );

  const filteredAvailableAgents = availableAgents.filter((agent) =>
    `${agent.name} ${agent.email}`
      .toLowerCase()
      .includes(addAgentSearch.toLowerCase()),
  );

  const handleAssignAgents = async () => {
    if (!drawerDepartment || selectedAgentIds.length === 0) return;
    setIsAssigningAgents(true);
    try {
      await Promise.all(
        selectedAgentIds.map((id) => {
          const agent = agents.find((a) => a.id === id);
          if (!agent) return null;
          // Get existing department IDs and add the new one
          const existingDeptIds = Array.isArray(agent.department)
            ? agent.department.map((d) => d.id)
            : [];
          const newDeptIds = [...new Set([...existingDeptIds, drawerDepartment.id])];
          return http.put(`${APIS.UPDATE_AGENT}${agent.id}`, {
            name: agent.name,
            email: agent.email,
            phone_number: agent.phone_number,
            gender: agent.gender,
            departments: newDeptIds,
            role: agent.role,
          });
        }),
      );
      successNotification("Agents added to department");
      setIsAddAgentModalOpen(false);
      setSelectedAgentIds([]);
      setAddAgentSearch("");
      refetchAgents();
      await fetchDepartments(currentPage);
    } catch (err) {
      errorNotification("Failed to add agents");
    } finally {
      setIsAssigningAgents(false);
    }
  };

  const tableData = buildTableData();

  const columns = [
    {
      key: "name" as keyof DepartmentTableRow,
      header: "Department Name",
      sortable: true,
      render: (_: any, row: DepartmentTableRow) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {row.name}
          </p>
          <p className="text-xs text-gray-500">{row.slag}</p>
        </div>
      ),
    },
    {
      key: "activeAgents" as keyof DepartmentTableRow,
      header: "Active Agents",
      render: (value: any) => (
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Users size={14} /> {value}
        </div>
      ),
    },
    {
      key: "status" as keyof DepartmentTableRow,
      header: "Status",
      render: (value: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "A"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {value === "A" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "supportEmail" as keyof DepartmentTableRow,
      header: "Support Email",
      render: (value: any) => value || "—",
    },
    {
      key: "id" as keyof DepartmentTableRow,
      header: "Actions",
      render: (value: any, row: DepartmentTableRow) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={SettingsIcon}
            onClick={() =>
              openDrawer(
                departments.find((dept) => dept.id === row.id) || row,
              )
            }
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Power}
            onClick={() => handleDeactivate(value)}
          />
        </div>
      ),
    },
  ];

  const paginationInfo = (
    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 px-4 py-3">
      <span>
        Showing {(currentPage - 1) * pageSize + 1} to{" "}
        {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
      </span>
      <div className="space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchDepartments(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            fetchDepartments(currentPage + 1 > Math.ceil(totalCount / pageSize)
              ? currentPage
              : currentPage + 1)
          }
          disabled={currentPage >= Math.ceil(totalCount / pageSize)}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search departments..."
            className="w-full pl-10 pr-4 py-2 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800 focus:border-transparent"
          />
        </div>
        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
          New Department
        </Button>
      </div>

      {isLoading && <TableSkeleton />}

      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
          <Table<DepartmentTableRow>
            data={tableData}
            columns={columns}
            sortBy={sortBy as keyof DepartmentTableRow}
            sortDirection={sortDirection}
            onSort={(key) => handleSort(key as keyof Department)}
            showPagination={false}
          />
          {!searchTerm && paginationInfo}
        </div>
      )}

      {!isLoading && !error && departments.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <Home className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No departments
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new department.
            </p>
            <div className="mt-6">
              <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
                New Department
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewDepartmentName("");
        }}
        title="Create Department"
      >
        <div className="space-y-4">
          <Input
            label="Department Name"
            placeholder="Enter department name"
            value={newDepartmentName}
            onChange={(e) => setNewDepartmentName(e.target.value)}
            fullWidth
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleCreateDepartment}
              disabled={!newDepartmentName.trim()}
            >
              Create Department
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={drawerDepartment ? `Department • ${drawerDepartment.name}` : "Department"}
        size="3xl"
        showCloseButton
        closeOnBackdropClick={true}
      >
        {drawerDepartment && (
          <div className="space-y-6 max-w-4xl pr-8 pl-2 mr-auto">
            <div className="flex w-full items-center border-b border-gray-200 dark:border-gray-700">
              {[
                { id: "general", label: "General settings" },
                { id: "agents", label: "Agents" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveDrawerTab(tab.id as "general" | "agents")
                  }
                  className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 cursor-pointer ${
                    activeDrawerTab === tab.id
                      ? "border-primary-600 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeDrawerTab === "general" && (
              <section className="space-y-6">
                <div className="max-w-2xl">
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Department name
                  </label>
                  <Input
                    value={generalForm.name}
                    onChange={(e) =>
                      setGeneralForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    fullWidth
                  />
                </div>

                <div className="max-w-2xl">
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Support email
                  </label>
                  <select
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={generalForm.supportEmail}
                    onChange={(e) =>
                      setGeneralForm((prev) => ({
                        ...prev,
                        supportEmail: e.target.value,
                      }))
                    }
                  >
                    <option value="">Not assigned</option>
                    {connectedIntegrations.map((integration) => (
                      <option
                        key={integration.id}
                        value={integration.email_address || ""}
                      >
                        {integration.email_address || "Pending"}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only mailboxes that are connected and assigned to this
                    business will appear here.
                  </p>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between max-w-2xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Department status
                    </p>
                    <p className="text-xs text-gray-500">
                      {drawerDepartment.status === "A"
                        ? "This department is active and visible to agents."
                        : "This department is inactive and hidden from agents."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Power}
                    onClick={handleStatusToggle}
                    disabled={statusUpdating}
                  >
                    {statusUpdating
                      ? "Updating..."
                      : drawerDepartment.status === "A"
                      ? "Deactivate"
                      : "Activate"}
                  </Button>
                </div>

                <div className="flex justify-end gap-3 max-w-2xl">
                  <Button
                    type="button"
                    onClick={handleGeneralSave}
                    disabled={generalSaving}
                  >
                    {generalSaving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </section>
            )}

            {activeDrawerTab === "agents" && (
              <section className="space-y-4 max-w-4xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="Search agents"
                      value={agentSearch}
                      onChange={(e) => setAgentSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={UserPlus}
                    onClick={() => setIsAddAgentModalOpen(true)}
                    disabled={availableAgents.length === 0}
                  >
                    Add agents
                  </Button>
                </div>

                {filteredDepartmentAgents.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {departmentAgents.length === 0
                      ? "No agents assigned to this department."
                      : "No agents match your search."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredDepartmentAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {agent.name}
                          </p>
                          <p className="text-sm text-gray-500">{agent.email}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {agent.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isAddAgentModalOpen}
        onClose={() => {
          setIsAddAgentModalOpen(false);
          setSelectedAgentIds([]);
          setAddAgentSearch("");
        }}
        title="Add agents"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search available agents"
            value={addAgentSearch}
            onChange={(e) => setAddAgentSearch(e.target.value)}
          />

          {availableAgents.length === 0 ? (
            <p className="text-sm text-gray-500">
              All agents are already assigned to this department.
            </p>
          ) : filteredAvailableAgents.length === 0 ? (
            <p className="text-sm text-gray-500">No agents match your search.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-3">
              {filteredAvailableAgents.map((agent) => (
                <label
                  key={agent.id}
                  className="flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedAgentIds.includes(agent.id)}
                    onChange={(e) => {
                      setSelectedAgentIds((prev) =>
                        e.target.checked
                          ? [...prev, agent.id]
                          : prev.filter((id) => id !== agent.id),
                      );
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {agent.name}
                    </p>
                    <p className="text-sm text-gray-500">{agent.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              onClick={handleAssignAgents}
              disabled={
                selectedAgentIds.length === 0 ||
                isAssigningAgents ||
                filteredAvailableAgents.length === 0
              }
            >
              {isAssigningAgents ? "Adding..." : "Add agents"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        state={isDeactivating}
        cancel={() => setConfirm(false)}
        message="Are you sure you want to toggle this department's status?"
        show={confirm}
        onConfirm={handleDeactivateConfirm}
        variant="danger"
      />
    </div>
  );
};
