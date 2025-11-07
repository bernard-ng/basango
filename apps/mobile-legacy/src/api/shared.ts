import { skipToken, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import qs from "qs";

import client from "@/api/client";

export type PaginationFilters = {
    page?: number;
    limit?: number;
    lastId?: string;
};

export type ArticleFilters = PaginationFilters & {
    dateRange?: {
        start: number;
        end: number;
    };
    search?: string;
    sortDirection?: "asc" | "desc";
};

export type PaginationInfo = {
    current: number;
    limit: number;
    lastId?: string;
    offset: number;
};

export type ClientDetailErrorResponse = {
    type: string;
    title: string;
    detail: string;
    status: number;
};

export type ClientErrorResponse = {
    code: string;
    message: string;
};

export type ErrorResponse = AxiosError<ClientErrorResponse | ClientDetailErrorResponse>;

export type PaginatedResponse<TItem> = {
    items: TItem[];
    pagination: PaginationInfo;
};

export const safeMessage = (error: AxiosError<ClientErrorResponse | ClientDetailErrorResponse> | Error): string => {
    if (error instanceof AxiosError && error.response) {
        const response = error.response.data;

        if ("message" in response) {
            return response.message;
        } else if ("detail" in response) {
            return response.detail;
        }
    }

    return "Une erreur est survenue";
};

export const usePaginatedInfiniteQuery = <TItem>(endpoint: string, filters: PaginationFilters = {}) => {
    return useInfiniteQuery<PaginatedResponse<TItem>, ErrorResponse>({
        initialData: undefined,
        initialPageParam: null,
        queryKey: [endpoint, filters],
        queryFn: async ({ pageParam = null }) => {
            const query = qs.stringify({ ...filters, lastId: pageParam }, { skipNulls: true });
            const url = `${endpoint}?${query}`;
            const response = await client.get<PaginatedResponse<TItem>>(url);
            return response.data;
        },
        getNextPageParam: (lastPage: PaginatedResponse<TItem>) => {
            const { lastId } = lastPage.pagination;
            return lastId ? lastId : null;
        },
        staleTime: 1_000 * 60 * 10,
    });
};

export const usePaginatedQuery = <TItem>(endpoint: string, filters: PaginationFilters = {}) => {
    return useQuery<PaginatedResponse<TItem>, ErrorResponse>({
        queryKey: [endpoint, filters],
        queryFn: async (): Promise<PaginatedResponse<TItem>> => {
            const query = qs.stringify({ ...filters, lastId: null }, { skipNulls: true });
            const url = `${endpoint}?${query}`;
            const response = await client.get<PaginatedResponse<TItem>>(url);
            return response.data;
        },
        staleTime: 1_000 * 60 * 10,
    });
};

export const useGetQuery = <TItem>(endpoint: string, enabled: boolean = true) => {
    return useQuery<TItem, ErrorResponse>({
        queryKey: [endpoint],
        queryFn: enabled
            ? async (): Promise<TItem> => {
                  const response = await client.get<TItem>(endpoint);
                  return response.data;
              }
            : skipToken,
        staleTime: 1_000 * 60 * 10,
    });
};

export const usePostQuery = <TPayload = void, TResponse = void>(endpoint: string, keys: string[] = []) => {
    const queryClient = useQueryClient();
    return useMutation<TResponse, ErrorResponse, TPayload>({
        mutationFn: async (data: TPayload): Promise<TResponse> => {
            const response = await client.post<TResponse>(endpoint, data);
            return response.data;
        },
        onSuccess: async () => {
            for (const key of keys) {
                await queryClient.invalidateQueries({ queryKey: [key] });
            }
        },
    });
};

export const usePutQuery = <TPayload = void, TResponse = void>(endpoint: string, keys: string[] = []) => {
    const queryClient = useQueryClient();
    return useMutation<TResponse, ErrorResponse, TPayload>({
        mutationFn: async (data: TPayload): Promise<TResponse> => {
            const response = await client.put<TResponse>(endpoint, data);
            return response.data;
        },
        onSuccess: async () => {
            for (const key of keys) {
                await queryClient.invalidateQueries({ queryKey: [key] });
            }
        },
    });
};

export const useDeleteQuery = <TResponse = void>(endpoint: string, keys: string[] = []) => {
    const queryClient = useQueryClient();
    return useMutation<TResponse, ErrorResponse>({
        mutationFn: async (): Promise<TResponse> => {
            const response = await client.delete<TResponse>(endpoint);
            return response.data;
        },
        onSuccess: async () => {
            for (const key of keys) {
                await queryClient.invalidateQueries({ queryKey: [key] });
            }
        },
    });
};
