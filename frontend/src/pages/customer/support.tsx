import { useEffect, useState } from "react";
import axios from "axios"; // Re-added axios import
import TicketFormSkeleton from "../../components/loader/TicketFormSkeleton"; // Import the skeleton
import { APIS } from "../../services/apis";
import { CustomerLayout } from './layout/CustomerLayout'; // Import CustomerLayout
import { CreateTicketModal } from '../../components/tickets/CreateTicketModal';

interface Department {
  id: number;
  name: string;
  slag: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface DomainValidationResponse {
  business_id: number;
  business_name: string;
  departments: Department[];
  ticket_categories: Category[];
}

const Support = () => {
  const [domainError, setDomainError] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDomain, setIsLoadingDomain] = useState(true);

  useEffect(() => {
    const validateDomain = async () => {
      try {
        const response = await axios.post<DomainValidationResponse>(APIS.VALIDATE_DOMAIN, {
          url: window.location.href,
        });
        setCategories(response.data.ticket_categories);
        setDepartments(response.data.departments);
      } catch (error) {
        setDomainError(true);
      } finally {
        setTimeout(() => setIsLoadingDomain(false), 1000);
      }
    };

    validateDomain();
  }, []);

  if (isLoadingDomain) {
    return (
      <CustomerLayout>
        <TicketFormSkeleton />
      </CustomerLayout>
    );
  }

  // Only render form if data is successfully loaded
  if (domainError || categories.length === 0 || departments.length === 0) {
    return (
      <CustomerLayout>
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md my-5 text-center">
          {domainError && (
            <div className="mb-4 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3">
              <strong className="font-semibold">Error: </strong> This help center url is not recognized.
            </div>
          )}
          {!domainError && (categories.length === 0 || departments.length === 0) && (
            <div className="mb-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3">
              <strong className="font-semibold">Loading: </strong> Preparing help center form...
            </div>
          )}
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            Create Support Ticket
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let us know how we can help you today.
          </p>
        </div>
        <CreateTicketModal
          loadFromApi={false}
          categories={categories}
          departments={departments}
          variant="customer"
        />
      </div>
    </CustomerLayout>
  );
};

export default Support;
