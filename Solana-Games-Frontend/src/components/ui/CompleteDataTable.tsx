import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search, Download, Filter } from 'lucide-react';

interface Column<T> {
    key: keyof T | string;
    label: string;
    render?: (value: any, row: T) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    title: string;
    searchable?: boolean;
    pageSize?: number;
    className?: string;
}

export const CompleteDataTable = <T extends Record<string, any>>({
    data,
    columns,
    title,
    searchable = true,
    pageSize: initialPageSize = 10,
    className = ''
}: DataTableProps<T>) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [showAll, setShowAll] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const filteredData = useMemo(() => {
        let processed = [...(data || [])];

        // Search
        if (search) {
            processed = processed.filter(row =>
                Object.values(row).some(val =>
                    String(val).toLowerCase().includes(search.toLowerCase())
                )
            );
        }

        // Sort
        if (sortConfig) {
            processed.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processed;
    }, [data, search, sortConfig]);

    const displayData = showAll ? filteredData : filteredData.slice((page - 1) * pageSize, page * pageSize);
    const totalPages = Math.ceil(filteredData.length / pageSize);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    if (!data) return null;

    return (
        <div className={`w-full bg-bg-secondary/50 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden flex flex-col ${className}`}>
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-gaming font-bold text-white flex items-center gap-2">
                        {title}
                        <span className="text-xs font-mono font-normal text-text-secondary bg-white/5 px-2 py-0.5 rounded-full">
                            {filteredData.length} records
                        </span>
                    </h3>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {searchable && (
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                            <input
                                type="text"
                                placeholder="Search data..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-9 pr-4 py-2 bg-bg-tertiary border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-solana-purple transition-colors"
                            />
                        </div>
                    )}

                    {filteredData.length > pageSize && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${showAll
                                    ? 'bg-solana-purple text-white shadow-[0_0_15px_rgba(153,69,255,0.3)]'
                                    : 'bg-bg-tertiary text-text-secondary hover:text-white hover:bg-white/10'}
                            `}
                        >
                            {showAll ? 'Show Paged' : 'Show All'}
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full">
                    <thead className="bg-bg-tertiary/50 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={String(col.key) || idx}
                                    onClick={() => col.sortable !== false && handleSort(String(col.key))}
                                    className={`
                                        px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider
                                        ${col.sortable !== false ? 'cursor-pointer hover:text-solana-cyan transition-colors' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.label}
                                        {sortConfig?.key === col.key && (
                                            <span className="text-solana-cyan">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {displayData.length > 0 ? (
                            displayData.map((row, rowIdx) => (
                                <tr
                                    key={rowIdx}
                                    className="hover:bg-white/5 transition-colors group"
                                >
                                    {columns.map((col, colIdx) => (
                                        <td key={`${rowIdx}-${colIdx}`} className="px-6 py-4 text-sm text-text-primary whitespace-nowrap">
                                            {col.render ? col.render(row[col.key as string], row) : String(row[col.key as string] ?? '-')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-text-secondary">
                                    <div className="flex flex-col items-center gap-3">
                                        <Search className="w-8 h-8 opacity-20" />
                                        <p>No records found matching your search</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!showAll && totalPages > 1 && (
                <div className="p-4 border-t border-white/5 flex justify-between items-center bg-bg-tertiary/30">
                    <div className="text-xs text-text-secondary">
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg bg-bg-tertiary hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg bg-bg-tertiary hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
