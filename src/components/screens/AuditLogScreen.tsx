import React, { useState, useEffect } from 'react';
import { FileText, Eye, ChevronLeft, Filter, RefreshCw, Copy, Check } from 'lucide-react';
import { AuditLog, AuditAction } from '../../types/entities';
import { dbEngine } from '../../db/databaseEngine';
import { formatCairoDateTime } from '../../utils/datetime';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';

export const AuditLogScreen: React.FC = () => {
  const { t } = useLanguage();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextLastId, setNextLastId] = useState<number | null>(null);
  const [lastIdStack, setLastIdStack] = useState<(number | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);

  // Filters
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [traceIdFilter, setTraceIdFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Diff detail modal
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);
  const [copiedTrace, setCopiedTrace] = useState(false);

  const fetchKeyset = (lastId: number | null = null) => {
    const res = dbEngine.getAuditLogsKeyset(lastId, 25, {
      action: selectedAction || undefined,
      tableName: selectedTable || undefined,
      traceId: traceIdFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    setLogs(res.items);
    setHasMore(res.hasMore);
    setNextLastId(res.nextLastId);
  };

  useEffect(() => {
    setLastIdStack([null]);
    setPageIndex(0);
    fetchKeyset(null);
  }, [selectedAction, selectedTable, traceIdFilter, dateFrom, dateTo]);

  const handleNextPage = () => {
    if (!nextLastId || !hasMore) return;
    setLastIdStack((prev) => [...prev, nextLastId]);
    setPageIndex((prev) => prev + 1);
    fetchKeyset(nextLastId);
  };

  const handlePrevPage = () => {
    if (pageIndex <= 0) return;
    const targetLastId = lastIdStack[pageIndex - 1];
    setLastIdStack((prev) => prev.slice(0, -1));
    setPageIndex((prev) => prev - 1);
    fetchKeyset(targetLastId);
  };

  const handleCopyTrace = (tr: string) => {
    navigator.clipboard.writeText(tr);
    setCopiedTrace(true);
    setTimeout(() => setCopiedTrace(false), 2000);
  };

  const allActions: AuditAction[] = [
    'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PERMISSION_CHANGE', 'PASSWORD_RESET', 'MIGRATION',
  ];

  const allTables = [
    'users', 'branches', 'warehouses', 'roles', 'user_permissions', 'currencies', 'app_settings', 'custom_field_definitions', 'schemaversions',
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span>{t('سجل الأنشطة والأمان', 'Audit & Security Log')}</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('سجل شامل غير قابل للتعديل أو الحذف لمتابعة العمليات والأمان بالمنظومة', 'Immutable audit log for tracking all platform operations')}
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>{t('تصفية السجلات:', 'Filter Logs:')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500">
            <option value="">{t('— كافة الإجراءات —', '— All Actions —')}</option>
            {allActions.map((act) => <option key={act} value={act}>{act}</option>)}
          </select>

          <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500">
            <option value="">{t('— كافة الجداول —', '— All Tables —')}</option>
            {allTables.map((tbl) => <option key={tbl} value={tbl}>{tbl}</option>)}
          </select>

          <input type="text" placeholder={t('رقم التتبع Trace ID...', 'Trace ID...')} value={traceIdFilter} onChange={(e) => setTraceIdFilter(e.target.value)} className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-indigo-500" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
        </div>
      </div>

      {/* Keyset Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-semibold text-xs">
                <th className="py-3 px-4 text-start font-mono">ID</th>
                <th className="py-3 px-4 text-start">{t('نوع الإجراء', 'Action')}</th>
                <th className="py-3 px-4 text-start">{t('الجدول', 'Table')}</th>
                <th className="py-3 px-4 text-start font-mono">Record ID</th>
                <th className="py-3 px-4 text-start font-mono">{t('رقم التتبع (Trace ID)', 'Trace ID')}</th>
                <th className="py-3 px-4 text-start">{t('التوقيت (القاهرة)', 'Cairo Time')}</th>
                <th className="py-3 px-4 text-end">{t('تفاصيل التعديل', 'Diff')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {t('لا توجد سجلات مطابقة للشروط المحددة', 'No audit logs found')}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{log.id}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        log.action === 'INSERT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        log.action === 'DELETE' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        log.action === 'LOGIN_FAILED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.table_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 truncate max-w-[120px]">{log.record_id}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {log.trace_id ? (
                        <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-bold select-all">
                          {log.trace_id}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatCairoDateTime(log.created_at, true)}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button onClick={() => setInspectLog(log)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('عرض المقارنة', 'Inspect Diff')}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/40">
          <div>
            {t(`الصفحة رقم ${pageIndex + 1}`, `Page #${pageIndex + 1}`)}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevPage} disabled={pageIndex === 0} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all">
              {t('السابق (الأحدث)', 'Previous (Newer)')}
            </button>
            <button onClick={handleNextPage} disabled={!hasMore} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all">
              {t('التالي (الأقدم)', 'Next (Older)')}
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-side JSON Diff Modal */}
      <Modal isOpen={Boolean(inspectLog)} onClose={() => setInspectLog(null)} title={`${t('تفاصيل السجل والتغييرات - سجل رقم ', 'Audit Record Details - #')}${inspectLog?.id}`} maxWidth="4xl">
        {inspectLog && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="font-bold text-slate-800">{inspectLog.table_name}</span> &bull; {inspectLog.action} &bull; ID: {inspectLog.record_id}
              </div>
              {inspectLog.trace_id && (
                <button onClick={() => handleCopyTrace(inspectLog.trace_id!)} className="flex items-center gap-1 font-mono text-[11px] bg-white px-2 py-1 rounded border border-slate-200 text-indigo-600 hover:bg-indigo-50">
                  {copiedTrace ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{inspectLog.trace_id}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl">
                <div className="font-bold text-rose-800 mb-2">{t('القيم السابقة (old_data):', 'Previous State (old_data):')}</div>
                <pre className="whitespace-pre-wrap overflow-x-auto text-slate-800 max-h-80">
                  {inspectLog.old_data ? JSON.stringify(inspectLog.old_data, null, 2) : t('لا توجد بيانات سابقة (إدخال جديد)', 'null (New Record)')}
                </pre>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <div className="font-bold text-emerald-800 mb-2">{t('القيم الجديدة (new_data):', 'New State (new_data):')}</div>
                <pre className="whitespace-pre-wrap overflow-x-auto text-slate-800 max-h-80">
                  {inspectLog.new_data ? JSON.stringify(inspectLog.new_data, null, 2) : t('تم الحذف', 'null (Deleted)')}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
