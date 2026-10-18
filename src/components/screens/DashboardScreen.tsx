import React from 'react';
import {
  GitBranch,
  Warehouse,
  Users,
  Coins,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Database,
  Sliders,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ScreenCode, ScreenCodes, APP_SCREENS } from '../../types/permissions';
import { dbEngine } from '../../db/databaseEngine';
import { formatCairoDateTime } from '../../utils/datetime';
import { SettingsService } from '../../services/settingsService';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenCode) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const { user, currentBranch, hasPermission } = useAuth();
  const { t } = useLanguage();
  const state = dbEngine.getState();
  const settings = SettingsService.get();

  const totalBranches = state.branches.filter((b) => b.is_active).length;
  const totalWarehouses = state.warehouses.filter((w) => w.is_active).length;
  const totalUsers = state.users.filter((u) => u.is_active).length;
  const baseCurrency = state.currencies.find((c) => c.is_base) || state.currencies[0];
  const recentAudits = state.audit_log.slice(0, 5);

  const kpis = [
    {
      title_ar: 'الفروع النشطة',
      title_en: 'Active Branches',
      value: totalBranches,
      icon: GitBranch,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      screen: ScreenCodes.BRANCHES_MANAGEMENT,
    },
    {
      title_ar: 'المستودعات والمخازن',
      title_en: 'Warehouses',
      value: totalWarehouses,
      icon: Warehouse,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      screen: ScreenCodes.WAREHOUSES_MANAGEMENT,
    },
    {
      title_ar: 'المستخدمين النشطين',
      title_en: 'Active Users',
      value: totalUsers,
      icon: Users,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
      screen: ScreenCodes.USERS_MANAGEMENT,
    },
    {
      title_ar: 'العملة الأساسية',
      title_en: 'Base Currency',
      value: `${baseCurrency?.currency_code} (${baseCurrency?.symbol})`,
      icon: Coins,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      screen: ScreenCodes.CURRENCIES_MANAGEMENT,
    },
  ];

  // Quick shortcuts allowed for user
  const allowedShortcuts = APP_SCREENS.filter(
    (s) => s.code !== ScreenCodes.DASHBOARD && (!s.superAdminOnly || user?.is_super_admin) && hasPermission(s.code, 'BTN_VIEW')
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('النظام يعمل بكفاءة متزامنة حتى 100 مستخدم', 'Operational Capacity: 100 concurrent users')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {t('مرحباً بك،', 'Welcome back,')} {user?.name || user?.username}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            {settings.company_name} —{' '}
            {currentBranch
              ? `${t('الفرع الحالي:', 'Current Branch:')} ${t(currentBranch.name_ar, currentBranch.name_en || currentBranch.name_ar)}`
              : user?.is_admin
              ? t('عرض شامل لكافة فروع المنظومة (صلاحية مدير عام)', 'Global Multi-Branch View (Admin)')
              : t('بدون فرع محدد', 'No specific branch')}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(kpi.screen)}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {t(kpi.title_ar, kpi.title_en)}
                </span>
                <div className={`p-2 rounded-xl border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-800 tracking-tight">
                  {kpi.value}
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Columns: Quick Navigation & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Shortcuts */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span>{t('اختصارات الشاشات المصرح بها', 'Permitted Shortcuts')}</span>
          </h3>
          <div className="space-y-1.5 flex-1">
            {allowedShortcuts.slice(0, 6).map((sc) => (
              <button
                key={sc.code}
                onClick={() => onNavigate(sc.code)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 border border-transparent hover:border-slate-200 transition-all text-start"
              >
                <span>{t(sc.name_ar, sc.name_en)}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Audit Activities (Keyset view preview) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>{t('آخر العمليات المسجلة في سجل الأمان (Audit)', 'Recent Audit Activities')}</span>
            </h3>
            {hasPermission(ScreenCodes.AUDIT_LOG_VIEW, 'BTN_VIEW') && (
              <button
                onClick={() => onNavigate(ScreenCodes.AUDIT_LOG_VIEW)}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                {t('عرض السجل الكامل', 'View Full Log')}
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {recentAudits.map((audit) => (
              <div key={audit.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                      audit.action === 'INSERT'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : audit.action === 'UPDATE'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : audit.action === 'DELETE'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : audit.action === 'LOGIN_FAILED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {audit.action}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800">{audit.table_name}</span>
                    <span className="text-slate-400 ms-1.5 font-mono text-[11px]">
                      (ID: {audit.record_id})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
                  {audit.trace_id && (
                    <span className="hidden sm:inline bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                      {audit.trace_id}
                    </span>
                  )}
                  <span>{formatCairoDateTime(audit.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
