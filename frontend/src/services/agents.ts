import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { errorNotification } from "../components/ui/Toast";
import { APIS } from "../services/apis";
import http from "../services/http";
import { ApiResponse } from "../types/agents";

export const useFetchAgents = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const response = await http.get<ApiResponse>(APIS.LIST_AGENTS);
      setData(response.data);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      errorNotification(err.response?.data?.message || "An error occurred");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return { data, isLoading, isError, refetch: fetchAgents };
};
