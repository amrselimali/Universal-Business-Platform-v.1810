import React from 'react';
import { ChevronRight, ChevronLeft, ArrowUpDown, Search, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface Column<T> {
  key: string;
  header_ar: string;
  header_en: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalCount: number;
  currentPage: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy?: string;
  sortAsc?: boolean;
  onSortChange?: (columnKey: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  actionHeader?: string;
  renderActions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  totalCount,
  currentPage,
  pageSize = 25,
  onPageChange,
  searchQuery,
  onSearchChange,
  sortBy,
  sortAsc,
  onSortChange,
  onRefresh,
  isLoading = false,
  renderActions,
}: DataTableProps<T>) {
  const { t } = useLanguage();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalCount, currentPage * pageSize);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('بحث (مطابقة ذكية للهمزات والأحرف)...', 'Search (smart normalization)...')}
            className="w-full ps-9 pe-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              title={t('تحديث البيانات', 'Refresh')}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl border border-slate-200/60 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <span className="text-xs text-slate-500 font-medium px-2 py-1 bg-white border border-slate-200 rounded-lg">
            {t('الحد الأقصى: 25 سجل', 'Max: 25 rows')}
          </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-start border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-medium text-xs">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3.5 px-4 text-start font-semibold select-none ${
                    col.sortable ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''
                  }`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && onSortChange && onSortChange(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t(col.header_ar, col.header_en)}</span>
                    {col.sortable && (
                      <ArrowUpDown
                        className={`w-3.5 h-3.5 ${
                          sortBy === col.key ? 'text-indigo-600 font-bold' : 'text-slate-300'
                        }`}
                      />
                    )}
                  </div>
                </th>
              ))}
              {renderActions && (
                <th className="py-3.5 px-4 text-end font-semibold text-slate-600">
                  {t('الإجراءات', 'Actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (renderActions ? 1 : 0)}
                  className="py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                    <span className="text-sm font-medium">{t('جاري تحميل السجلات...', 'Loading records...')}</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (renderActions ? 1 : 0)}
                  className="py-12 text-center text-slate-400"
                >
                  <div className="text-sm font-medium">{t('لا توجد بيانات مطابقة', 'No records found')}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {t('جرّب تغيير كلمات البحث أو إضافة سجل جديد', 'Try adjusting your search criteria or add a new record')}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={String(row.id)} className="hover:bg-slate-50/80 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="py-3.5 px-4 align-middle">
                      {col.render ? col.render(row) : (row as any)[col.key] ?? '—'}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="py-3.5 px-4 align-middle text-end whitespace-nowrap">
                      {renderActions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/40">
        <div>
          {t(
            `عرض من ${startIdx} إلى ${endIdx} من إجمالي ${totalCount} سجل`,
            `Showing ${startIdx} to ${endIdx} of ${totalCount} entries`
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all"
            title={t('السابق', 'Previous')}
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          </button>

          <span className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all"
            title={t('التالي', 'Next')}
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
