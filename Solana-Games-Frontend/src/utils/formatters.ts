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
