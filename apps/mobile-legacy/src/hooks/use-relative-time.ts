import { useEffect, useState } from "react";

import { formatDistanceToNowStrict, Locale } from "date-fns";
import { fr } from "date-fns/locale";

export const useRelativeTime = (
    dateInput: string | Date | number | null | undefined,
    options?: {
        addSuffix?: boolean;
        unit?: "second" | "minute" | "hour" | "day" | "month" | "year";
        locale?: Locale;
        roundingMethod?: "floor" | "ceil" | "round";
        includeSeconds?: boolean;
    },
    updateInterval: number = 60000
): string => {
    const [relativeTime, setRelativeTime] = useState("");

    useEffect(() => {
        if (dateInput === null || dateInput === undefined) {
            setRelativeTime("");
            return;
        }

        const date = new Date(dateInput);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            setRelativeTime("Invalid Date");
            return;
        }

        const updateTime = () => {
            // Default options if none provided, ensures suffix is added
            const effectiveOptions = {
                locale: fr,
                addSuffix: true,
                ...options,
            };

            try {
                const formattedTime = formatDistanceToNowStrict(date, effectiveOptions);
                setRelativeTime(formattedTime);
            } catch (error) {
                console.error("Error formatting relative time:", error);
                setRelativeTime(dateInput.toString()); // Handle potential errors during formatting
            }
        };

        // Initial update
        updateTime();

        // Set up interval for periodic updates
        const intervalId = setInterval(updateTime, updateInterval);

        // Clean up the interval when the component unmounts or dateInput changes
        return () => clearInterval(intervalId);
    }, [dateInput, options, updateInterval]);

    return relativeTime;
};
