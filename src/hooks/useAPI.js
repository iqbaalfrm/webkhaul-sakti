import { useState, useEffect, useCallback } from 'react';

// Custom hook for API calls with loading and error states
export const useAPI = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Custom hook for API mutations (create, update, delete)
export const useAPIMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (apiCall, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall();
      
      if (options.onSuccess) {
        options.onSuccess(response.data);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Terjadi kesalahan';
      setError(errorMessage);
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      console.error('API Mutation Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, reset };
};

// Custom hook for paginated data
export const usePaginatedAPI = (apiCall, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchData = useCallback(async (newParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const mergedParams = { ...params, ...newParams };
      const response = await apiCall(mergedParams);
      
      setData(response.data.families || response.data.iuranRecords || []);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
      
      setParams(mergedParams);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
      console.error('Paginated API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiCall, params]);

  useEffect(() => {
    fetchData();
  }, []);

  const updateParams = useCallback((newParams) => {
    fetchData({ ...newParams, page: 1 });
  }, [fetchData]);

  const changePage = useCallback((page) => {
    fetchData({ page });
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    loading,
    error,
    updateParams,
    changePage,
    refetch
  };
};