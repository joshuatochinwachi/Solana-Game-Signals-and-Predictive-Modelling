import { useState, useEffect, useRef } from 'react';
import { fetchWithRetry } from '../services/api';
import type { ApiResponse } from '../types/api';

export const useAutoRefresh = <T>(endpoint: string, interval = 30000) => {
    const [data, setData] = useState<ApiResponse<T> | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Use a ref to track if component is mounted to avoid state updates on unmount
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        const fetchData = async () => {
            try {
                // Don't set loading to true on subsequent refreshes to avoid flickering
                if (!data) setLoading(true);

                const result = await fetchWithRetry<T>(endpoint);

                if (isMounted.current) {
                    setData(result);
                    // Use the API's last_updated if available, otherwise current time
                    // Ensure strict UTC parsing
                    const apiTimeStr = result.metadata?.last_updated;
                    const apiTime = apiTimeStr
                        ? new Date((apiTimeStr.endsWith('Z') ? apiTimeStr : apiTimeStr + 'Z').replace(' ', 'T'))
                        : new Date();
                    setLastUpdate(apiTime);
                    setError(null);
                }
            } catch (err) {
                if (isMounted.current) {
                    setError(err instanceof Error ? err : new Error('Unknown error'));
                }
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        };

        fetchData(); // Initial fetch
        const intervalId = setInterval(fetchData, interval); // Auto-refresh

        return () => {
            isMounted.current = false;
            clearInterval(intervalId);
        };
    }, [endpoint, interval]); // Removed 'data' from deps to avoid loop

    return { data, loading, error, lastUpdate };
};
