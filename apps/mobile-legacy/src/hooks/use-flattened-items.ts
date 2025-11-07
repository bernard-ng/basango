import { useMemo } from "react";

interface Page<T> {
    items: T[];
}

interface PaginatedResult<T> {
    pages?: Page<T>[];
    items?: T[];
}

export const useFlattenedItems = <T>(data: PaginatedResult<T> | undefined | null): T[] => {
    return useMemo((): T[] => {
        if (!data) {
            return [];
        }

        if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
            return data.pages.flatMap(page => page.items || []);
        } else if (data.items && Array.isArray(data.items)) {
            return data.items;
        } else {
            return [];
        }
    }, [data]);
};
