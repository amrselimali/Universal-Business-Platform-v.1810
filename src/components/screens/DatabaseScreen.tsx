import React, { useState, useEffect } from 'react';
import { Database, Play, CheckCircle2, RefreshCw, Server, AlertTriangle, Layers, Code, ShieldCheck } from 'lucide-react';
import { DbManagementService, TableSummary } from '../../services/dbManagementService';
import { DatabaseState } from '../../db/databaseEngine';
import { DbMigration } from '../../db/migrations';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const DatabaseScreen: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();

  const [migrations, setMigrations] = useState<DbMigration[]>([]);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [selectedTable, setSelectedTable] = useState<keyof DatabaseState>('branches');
  const [tableRows, setTableRows] = useState<any[]>([]);

  const [inspectSql, setInspectSql] = useState<DbMigration | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const loadData = () => {
    setMigrations(DbManagementService.getMigrations());
    const tableSummaries = DbManagementService.getTableSummaries();
    setTables(tableSummaries);
    setTableRows(DbManagementService.getTableRows(selectedTable, 25));
  };

  useEffect(() => {
    loadData();
  }, [selectedTable]);

  if (!user?.is_super_admin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800">{t('وصول محظور (403 Forbidden)', 'Access Denied')}</h3>
        <p className="text-xs text-slate-500 mt-1">{t('شاشة إدارة قاعدة البيانات والـ Migrations مخصصة لـ Super Admin فقط.', 'Super Admin access only.')}</p>
      </div>
    );
  }

  const handleRunMigrations = async () => {
    setIsMigrating(true);
    try {
      await new Promise((res) => setTimeout(res, 350));
      const res = DbManagementService.runMigrations(user);
      showSuccess(t('تم تنفيذ التحديثات بنجاح', 'Migrations executed'), res.message);
      loadData();
    } catch (err: any) {
      showError(t('فشل التحديث', 'Migration failed'), err.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleResetFactory = () => {
    try {
      DbManagementService.resetAndSeed(user);
      showSuccess(t('تمت إعادة ضبط وتهيئة قاعدة البيانات', 'Database reset & seeded'));
      setIsResetConfirmOpen(false);
      loadData();
    } catch (err: any) {
      showError(t('خطأ أثناء التهيئة', 'Reset failed'), err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>{t('إدارة قاعدة البيانات والتحديثات', 'Database & Updates')}</span>
          </h2>
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{t('متصل بالسيرفر السحابي', 'Connected to Cloud Server')}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 text-[11px]">
              {t('قاعدة بيانات مركزية موحدة', 'Central Enterprise Database')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
          >
            {t('إعادة ضبط البيانات الأولية', 'Reset Initial Data')}
          </button>
          <button
            onClick={handleRunMigrations}
            disabled={isMigrating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
            <span>{t('تحديث قاعدة البيانات', 'Update Database')}</span>
          </button>
        </div>
      </div>

      {/* Migration Scripts Checklist */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>{t('حزم التحديثات المنفذة', 'Executed Update Scripts')}</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {migrations.filter((m) => m.status === 'APPLIED').length} / {migrations.length} {t('مطبقة', 'Applied')}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {migrations.map((mig) => (
            <div key={mig.script_name} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-mono font-bold text-slate-800">{mig.script_name}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t(mig.description_ar, mig.description_en)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {mig.status}
                </span>
                <button
                  onClick={() => setInspectSql(mig)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                  title={t('عرض التفاصيل', 'View Details')}
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Summaries & Raw Row Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-2 pb-2">
            {t('جداول قاعدة البيانات', 'Database Tables')}
          </h4>
          <div className="space-y-1 max-h-[450px] overflow-y-auto">
            {tables.map((tbl) => (
              <button
                key={tbl.tableName}
                onClick={() => setSelectedTable(tbl.tableName)}
                className={`w-full text-start p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  selectedTable === tbl.tableName
                    ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="font-mono">{tbl.tableName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                  {tbl.rowCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800">
              {t('بيانات جدول:', 'Table Records:')} <span className="font-mono text-indigo-600">{selectedTable}</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              {tableRows.length} {t('سجلات معروضة', 'rows loaded')}
            </span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[400px]">
            <table className="w-full text-start border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  {tableRows[0] &&
                    Object.keys(tableRows[0]).map((col) => (
                      <th key={col} className="p-2.5 text-start font-bold">
                        {col}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tableRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="p-2.5 whitespace-nowrap truncate max-w-[200px]">
                        {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SQL Script Viewer Modal */}
      <Modal isOpen={Boolean(inspectSql)} onClose={() => setInspectSql(null)} title={`${t('كود سكريبت SQL:', 'SQL Script:')} ${inspectSql?.script_name}`} maxWidth="3xl">
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[60vh] whitespace-pre">
          {inspectSql?.sql}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetFactory}
        title={t('تأكيد إعادة تهيئة البيانات (Seed Reset)', 'Confirm Seed Reset')}
        message={t('تحذير: سيتم استعادة البيانات الأولية والمستخدمين والفروع المصنعية، وتسجيل العملية في سجل الأنشطة.', 'Warning: This will restore default initial seeds. Action is logged in audit log.')}
        confirmLabel={t('إعادة التهيئة الآن', 'Reset Now')}
      />
    </div>
  );
};
