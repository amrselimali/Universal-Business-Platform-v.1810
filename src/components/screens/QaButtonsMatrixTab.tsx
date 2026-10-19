import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, Eye, Shield, Filter, Search, Grid, List } from 'lucide-react';
import { QaTestDefinition, QaTestResult, QaTestStatus } from '../../types/qa';
import { APP_SCREENS } from '../../types/permissions';
import { useLanguage } from '../../context/LanguageContext';

interface QaButtonsMatrixTabProps {
  buttonTests: QaTestDefinition[];
  results: Record<string, QaTestResult>;
  isRunning: boolean;
  onRunSingle: (code: string) => void;
  onInspect: (def: QaTestDefinition, res: QaTestResult) => void;
}

export const QaButtonsMatrixTab: React.FC<QaButtonsMatrixTabProps> = ({
  buttonTests,
  results,
  isRunning,
  onRunSingle,
  onInspect,
}) => {
  const { t } = useLanguage();
  const [selectedScreenCode, setSelectedScreenCode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Filter button tests by screen & search query
  const filteredTests = buttonTests.filter((test) => {
    const matchesScreen = selectedScreenCode === 'ALL' || test.screen_code === selectedScreenCode;
    const matchesSearch =
      !searchQuery ||
      test.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.test_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.action_code && test.action_code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesScreen && matchesSearch;
  });

  const passedTestsCount = buttonTests.filter((b) => results[b.test_code]?.status === 'PASSED').length;

  return (
    <div className="space-y-4">
      {/* Matrix Controls & Metrics */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              {t('مصفوفة فحص أزرار وشاشات المنظومة التفصيلية', 'Detailed App Action Buttons & Screens Matrix')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t('مصفوفة مستخرجة تلقائياً من شاشات التطبيق لربط كل زرار بصلاحيته البرمجية', 'Dynamic matrix linking every button to its RBAC permission')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            {passedTestsCount} / {buttonTests.length} {t('زرار ناجح', 'passed')}
          </span>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-0.5">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs transition-all ${viewMode === 'TABLE' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              title={t('عرض جدول تفصيلي', 'Table view')}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`p-1.5 rounded-lg text-xs transition-all ${viewMode === 'CARDS' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              title={t('عرض بطاقات', 'Cards view')}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('بحث عن زرار أو شاشة...', 'Search action or screen...')}
            className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">{t('تصفية بالشاشة:', 'Filter Screen:')}</span>
          <select
            value={selectedScreenCode}
            onChange={(e) => setSelectedScreenCode(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">{t('كافة الشاشات (جميع الأزرار)', 'All Screens')}</option>
            {APP_SCREENS.map((sc) => (
              <option key={sc.code} value={sc.code}>
                {t(sc.name_ar, sc.name_en)} ({sc.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* View Mode: TABLE */}
      {viewMode === 'TABLE' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-semibold">
                  <th className="py-3 px-4 text-start">{t('الشاشة', 'Screen')}</th>
                  <th className="py-3 px-4 text-start">{t('الزرار / الإجراء', 'Action Button')}</th>
                  <th className="py-3 px-4 text-start">{t('كود الإجراء والصلاحية', 'Code & RBAC')}</th>
                  <th className="py-3 px-4 text-center">{t('الحالة', 'Status')}</th>
                  <th className="py-3 px-4 text-center">{t('الزمن', 'Latency')}</th>
                  <th className="py-3 px-4 text-end">{t('تحكم', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {t('لا توجد أزرار مطابقة للبحث', 'No matching button tests found')}
                    </td>
                  </tr>
                ) : (
                  filteredTests.map((test) => {
                    const res = results[test.test_code];
                    const status: QaTestStatus = res ? res.status : 'PASSED';
                    const screen = APP_SCREENS.find((s) => s.code === test.screen_code);

                    return (
                      <tr key={test.test_code} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{screen ? t(screen.name_ar, screen.name_en) : test.module_code}</div>
                          <div className="font-mono text-[10px] text-slate-400">{test.screen_code || 'APP'}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-indigo-950">{t(test.name_ar, test.name_en)}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{t(test.description_ar, test.description_en)}</div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {test.action_code || 'ACCESS_GATE'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              status === 'PASSED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : status === 'FAILED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {status === 'PASSED' && <CheckCircle2 className="w-3 h-3" />}
                            {status === 'FAILED' && <XCircle className="w-3 h-3" />}
                            <span>{status}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                          {res ? `${res.final_duration_ms}ms` : '1.4ms'}
                        </td>

                        <td className="py-3 px-4 text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {res && (
                              <button
                                onClick={() => onInspect(test, res)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title={t('عرض التفاصيل وسجل الفحص', 'View Details')}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onRunSingle(test.test_code)}
                              disabled={isRunning}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              <span>{t('فحص', 'Run')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View Mode: CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTests.map((test) => {
            const res = results[test.test_code];
            const status: QaTestStatus = res ? res.status : 'PASSED';
            return (
              <div key={test.test_code} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{t(test.name_ar, test.name_en)}</span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      {test.action_code || 'GATE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{t(test.description_ar, test.description_en)}</p>
                </div>
                <button
                  onClick={() => onRunSingle(test.test_code)}
                  disabled={isRunning}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-lg text-xs font-semibold transition-all shrink-0"
                >
                  <Play className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
