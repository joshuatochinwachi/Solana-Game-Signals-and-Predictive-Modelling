export const safeNumber = (value: any, fallback = 0): number => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? fallback : num;
};

export const safePercent = (value: any, decimals = 1): string => {
    const num = safeNumber(value, 0);
    return `${num.toFixed(decimals)}%`;
};

export const formatNumber = (value: any, fallback = 0): string => {
    return safeNumber(value, fallback).toLocaleString();
};

export const formatCurrency = (value: any, currency = 'USD', fallback = 0): string => {
    return safeNumber(value, fallback).toLocaleString('en-US', {
        style: 'currency',
        currency,
    });
};

export const safeDate = (value: any): Date | undefined => {
    if (!value) return undefined;

    try {
        // Handle ISO strings that might have spaces instead of T (common in SQL)
        // Safari strictly requires T separator
        const dateStr = String(value).trim();
        const safeStr = dateStr.includes(' ') && !dateStr.includes('T')
            ? dateStr.replace(' ', 'T')
            : dateStr;

        const date = new Date(safeStr);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            // Try parsing as ISO substring if it contains timezone info that might confuse Safari
            if (safeStr.includes('UTC')) {
                return new Date(safeStr.split(' UTC')[0].replace(' ', 'T') + 'Z');
            }
            return undefined;
        }

        return date;
    } catch {
        return undefined;
    }
};
