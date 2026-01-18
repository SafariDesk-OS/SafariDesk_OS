import React from "react";
import { Plus, Search, Edit, Trash2, Tag, Power, PowerOff } from "lucide-react";
import http from "../../services/http";
import axios from "axios";
import Button from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { APIS } from "../../services/apis";
import { errorNotification, successNotification } from "../ui/Toast";
import { Table } from "../ui/Table";
import { TableSkeleton } from "../ui/TableSkeleton";

interface TicketCategory {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TicketCategory[];
}

export const TicketCategories: React.FC = () => {
  const [categories, setCategories] = React.useState<TicketCategory[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategoryDescription, setNewCategoryDescription] =
    React.useState("");
  const [sortBy, setSortBy] = React.useState<keyof TicketCategory>("name");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "asc",
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingCategory, setEditingCategory] =
    React.useState<TicketCategory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<
    number | null
  >(null);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);

  const fetchCategories = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      const response = await http.get<PaginatedResponse>(
        `${APIS.LIST_TICKET_CATEGORIES}?${params}`,
      );

      setCategories(response.data.results);
      setTotalCount(response.data.count);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch ticket categories:", error);
      if (axios.isAxiosError(error)) {
        errorNotification(
          `Failed to load ticket categories: ${error.response?.status} ${error.response?.statusText}`,
        );
      } else {
        errorNotification("Failed to load ticket categories");
      }
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  React.useEffect(() => {
    fetchCategories(1);
  }, []);

  // Filter and sort categories locally (for search functionality)
  const filteredAndSortedCategories = React.useMemo(() => {
    return categories
      .filter(
        (category) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [categories, searchTerm, sortBy, sortDirection]);

  const handleSort = (key: keyof TicketCategory) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (page: number) => {
    fetchCategories(page);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryDescription.trim()) return;

    setIsSubmitting(true);

    try {
      const categoryData = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
      };

      const response = await http.post(
        APIS.CREATE_TICKET_CATEGORY,
        categoryData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      successNotification(
        response.data.message || "Ticket category created successfully",
      );

      // Refresh the categories list after successful creation
      await fetchCategories(currentPage);
      setNewCategoryName("");
      setNewCategoryDescription("");
      setShowCreateModal(false);
    } catch (error: any) {
      console.error("Failed to create ticket category:", error);
      errorNotification(error?.response?.data?.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    // Frontend validation
    if (!editingCategory.name.trim()) {
      errorNotification("Category name cannot be empty");
      return;
    }

    if (!editingCategory.description.trim()) {
      errorNotification("Description is required");
      return;
    }

    if (editingCategory.description.trim().length < 10) {
      errorNotification("Description must be at least 10 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryData = {
        name: editingCategory.name.trim(),
        description: editingCategory.description.trim(),
      };
      await http.patch(
        `${APIS.TICKET_CATEGORIES_BASE}${editingCategory.id}/`,
        categoryData,
      );
      successNotification("Category updated successfully");
      await fetchCategories(currentPage);
      setEditingCategory(null);
    } catch (error: any) {
      console.error("Failed to update ticket category:", error);
      // Show detailed error from backend if available
      const errorMessage = error?.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join(', ')
        : error?.response?.data?.message || "Failed to update category";
      errorNotification(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return;

    setIsSubmitting(true);
    try {
      await http.delete(`${APIS.TICKET_CATEGORIES_BASE}${deletingCategoryId}/`);
      successNotification("Action was successful");
      await fetchCategories(currentPage);
      setShowDeleteModal(false);
      setDeletingCategoryId(null);
    } catch (error: any) {
      console.error("Failed to delete ticket category:", error);
      errorNotification(error?.response?.data?.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: "name" as keyof TicketCategory,
      header: "Category Name",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Tag className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "description" as keyof TicketCategory,
      header: "Description",
      sortable: true,
      render: (value: string) => (
        <span
          className="text-gray-600 dark:text-gray-400 text-sm truncate max-w-xs"
          title={value}
        >
          {value}
        </span>
      ),
    },
    {
      key: "is_active" as keyof TicketCategory,
      header: "Status",
      sortable: true,
      render: (is_active: boolean) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at" as keyof TicketCategory,
      header: "Created",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "id" as keyof TicketCategory,
      header: "Actions",
      render: (id: number, row: TicketCategory) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Edit}
            onClick={() => setEditingCategory(row)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={row.is_active ? PowerOff : Power}
            onClick={() => {
              setDeletingCategoryId(id);
              setShowDeleteModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>

        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
          New Category
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <Input
          icon={Search}
          placeholder="Search ticket categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-700 dark:text-red-400">{error}</div>
        </div>
      )}

      {/* Categories Table */}
      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Table
            data={filteredAndSortedCategories}
            columns={columns}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            currentPage={searchTerm ? 1 : currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            showPagination={!searchTerm}
          />

          {/* Custom pagination info when searching */}
          {searchTerm && (
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {filteredAndSortedCategories.length} filtered results
                from {totalCount} total categories
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && categories.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No ticket categories
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new ticket category.
            </p>
            <div className="mt-6">
              <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
                New Category
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewCategoryName("");
          setNewCategoryDescription("");
        }}
        title="Create New Ticket Category"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            placeholder="Enter category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-xs text-gray-500">(minimum 10 characters)</span>
            </label>
            <textarea
              placeholder="Enter category description (at least 10 characters)"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              rows={3}
            />
            {newCategoryDescription && newCategoryDescription.trim().length < 10 && (
              <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">
                {newCategoryDescription.trim().length}/10 characters (need {10 - newCategoryDescription.trim().length} more)
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={handleCreateCategory}
              disabled={
                !newCategoryName.trim() ||
                !newCategoryDescription.trim() ||
                newCategoryDescription.trim().length < 10 ||
                isSubmitting
              }
            >
              {isSubmitting ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Loader */}
      {isLoading && <TableSkeleton />}

      {/* Edit Category Modal */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Edit Ticket Category"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            placeholder="Enter category name"
            value={editingCategory?.name || ""}
            onChange={(e) =>
              setEditingCategory(
                editingCategory
                  ? { ...editingCategory, name: e.target.value }
                  : null,
              )
            }
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-xs text-gray-500">(minimum 10 characters)</span>
            </label>
            <textarea
              placeholder="Enter category description (at least 10 characters)"
              value={editingCategory?.description || ""}
              onChange={(e) =>
                setEditingCategory(
                  editingCategory
                    ? { ...editingCategory, description: e.target.value }
                    : null,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              rows={3}
            />
            {editingCategory?.description && editingCategory.description.trim().length < 10 && (
              <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">
                {editingCategory.description.trim().length}/10 characters (need {10 - editingCategory.description.trim().length} more)
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={handleUpdateCategory}
              disabled={
                !editingCategory?.name.trim() ||
                !editingCategory?.description.trim() ||
                editingCategory.description.trim().length < 10 ||
                isSubmitting
              }
            >
              {isSubmitting ? "Updating..." : "Update Category"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Action"
      >
        <div>
          <p className="text-gray-500 dark:text-gray-100 ">
            Are you sure you want to{" "}
            {categories.find((c) => c.id === deletingCategoryId)?.is_active
              ? "deactivate"
              : "activate"}{" "}
            this ticket category?
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="danger"
              onClick={handleDeleteCategory}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Processing..."
                : categories.find((c) => c.id === deletingCategoryId)
                    ?.is_active
                ? "Deactivate"
                : "Activate"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
