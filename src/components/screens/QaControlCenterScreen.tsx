import React, { useState, useEffect } from 'react';
import {
  CheckCheck,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Server,
  Layers,
  Filter,
  Eye,
  Activity,
} from 'lucide-react';
import { QaTestDefinition, QaRun, QaTestResult, QaCategory, QaTestStatus } from '../../types/qa';
import { QaService, REGISTERED_QA_TESTS } from '../../services/qaService';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { Modal } from '../common/Modal';

export const QaControlCenterScreen: React.FC = () => {
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();

  const [tests, setTests] = useState<QaTestDefinition[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgress, setCurrentProgress] = useState({ completed: 0, total: 0, currentName: '' });
  const [activeRun, setActiveRun] = useState<QaRun | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  // Result inspection modal
  const [inspectTestResult, setInspectTestResult] = useState<{ def: QaTestDefinition; result: QaTestResult } | null>(null);

  useEffect(() => {
    const list = QaService.getTests();
    setTests(list);
    setSelectedCodes(list.map((l) => l.test_code));
  }, []);

  const handleRunSelected = async (targetCodes: string[]) => {
    if (targetCodes.length === 0) return;
    setIsRunning(true);
    setCurrentProgress({ completed: 0, total: targetCodes.length, currentName: 'Initializing Test Sandbox...' });

    try {
      const run = await QaService.executeRun(targetCodes, 'LOCAL_TEST', (completed, total, currentName) => {
        setCurrentProgress({ completed, total, currentName });
      });
      setActiveRun(run);
      if (run.quality_gates_passed) {
        showSuccess(t('نجحت كافة معايير الجودة (Quality Gates Passed)', 'All Quality Gates Passed'), t(`تم تنفيذ ${run.summary.total} اختبارات بنجاح بنسبة 100%`, `Executed ${run.summary.total} tests successfully`));
      } else {
        showError(t('فشل بعض اختبارات الجودة', 'Quality Gate Failure'), t(`فشل ${run.summary.failed} اختبارات حرجة`, `${run.summary.failed} critical test(s) failed`));
      }
    } catch (err: any) {
      showError(t('خطأ أثناء تشغيل الاختبارات', 'Execution Error'), err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunSingle = (code: string) => {
    handleRunSelected([code]);
  };

  const handleRunFailedOnly = () => {
    if (!activeRun) return;
    const failedCodes = Object.keys(activeRun.results).filter((k) => activeRun.results[k].status === 'FAILED');
    if (failedCodes.length === 0) {
      showSuccess(t('لا توجد اختبارات فاشلة لإعادة تشغيلها', 'No failed tests to retry'));
      return;
    }
    handleRunSelected(failedCodes);
  };

  // Filtered matrix tests
  const filteredTests = tests.filter((test) => {
    if (categoryFilter && test.category !== categoryFilter) return false;
    const res = activeRun?.results[test.test_code];
    const status: QaTestStatus = res ? res.status : 'UNTESTED';
    if (statusFilter && status !== statusFilter) return false;
    if (search.trim()) {
      const text = `${test.test_code} ${test.name_ar} ${test.name_en}`.toLowerCase();
      if (!text.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const passedCount = activeRun ? activeRun.summary.passed : 0;
  const failedCount = activeRun ? activeRun.summary.failed : 0;
  const flakyCount = activeRun ? activeRun.summary.flaky : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCheck className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {t('مركز اختبارات الجودة QA & Test Control Center v2.2', 'QA & Test Control Center v2.2')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Dynamic Discovery Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('اكتشاف تلقائي للشاشات والأزرار والعمليات المحاسبية وعزل تام لبيئة الاختبار LOCAL_TEST', 'Dynamic feature discovery and isolated test matrix runner')}
          </p>
        </div>

        {/* Execution Actions */}
        <div className="flex items-center gap-2">
          {activeRun && failedCount > 0 && (
            <button
              onClick={handleRunFailedOnly}
              disabled={isRunning}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('إعادة الفاشلة فقط', 'Retry Failed')}</span>
            </button>
          )}

          <button
            onClick={() => handleRunSelected(tests.map((t) => t.test_code))}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{t('تشغيل كافة الاختبارات (Full Suite)', 'Run Full Suite')}</span>
          </button>
        </div>
      </div>

      {/* Execution Progress Bar */}
      {isRunning && (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>{currentProgress.currentName}</span>
            </span>
            <span className="font-mono">
              {currentProgress.completed} / {currentProgress.total} (
              {Math.round((currentProgress.completed / currentProgress.total) * 100)}%)
            </span>
          </div>
          <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-200"
              style={{ width: `${(currentProgress.completed / currentProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* KPI & Quality Gates Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{t('إجمالي الاختبارات المكتشفة', 'Discovered Tests')}</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{tests.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600">{t('الناجحة (Passed)', 'Passed')}</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{passedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-rose-600">{t('الفاشلة (Failed)', 'Failed')}</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{failedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-amber-600">{t('حالة بوابات الجودة (Quality Gates)', 'Quality Gates')}</span>
          <div className="mt-1 flex items-center gap-1.5">
            {activeRun ? (
              activeRun.quality_gates_passed ? (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> FAILED
                </span>
              )
            ) : (
              <span className="text-xs text-slate-400 font-medium">Ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Matrix Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <input
            type="text"
            placeholder={t('بحث في الاختبارات...', 'Search test code or name...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-w-[200px]"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="">{t('— كافة التصنيفات —', '— All Categories —')}</option>
            <option value="UNIT">{t('اختبارات الوحدة (UNIT)', 'Unit Tests')}</option>
            <option value="INTEGRATION">{t('اختبارات التكامل (INTEGRATION)', 'Integration Tests')}</option>
            <option value="WORKFLOW">{t('اختبارات مسار الأعمال (WORKFLOW)', 'Workflow Tests')}</option>
            <option value="SECURITY_RBAC">{t('أمان وصلاحيات (SECURITY_RBAC)', 'Security & RBAC')}</option>
            <option value="DB_INTEGRITY">{t('سلامة قاعدة البيانات (DB_INTEGRITY)', 'DB Integrity')}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="">{t('— كافة الحالات —', '— All Statuses —')}</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
            <option value="UNTESTED">Untested</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          {filteredTests.length} {t('اختبار مصفوف', 'tests in matrix')}
        </div>
      </div>

      {/* Dynamic Test Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-3 px-4 text-start font-mono">Test Code</th>
                <th className="py-3 px-4 text-start">{t('اسم الاختبار والهدف', 'Test Name & Objective')}</th>
                <th className="py-3 px-4 text-start">{t('التصنيف', 'Category')}</th>
                <th className="py-3 px-4 text-start">{t('الأهمية', 'Priority')}</th>
                <th className="py-3 px-4 text-start">{t('الحالة', 'Status')}</th>
                <th className="py-3 px-4 text-start">{t('زمن التنفيذ', 'Duration')}</th>
                <th className="py-3 px-4 text-end">{t('الإجراء', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTests.map((test) => {
                const res = activeRun?.results[test.test_code];
                const status: QaTestStatus = res ? res.status : 'UNTESTED';

                return (
                  <tr key={test.test_code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{test.test_code}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{t(test.name_ar, test.name_en)}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t(test.description_ar, test.description_en)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                        {test.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        test.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        test.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {test.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        status === 'PASSED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        status === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {status === 'PASSED' && <CheckCircle2 className="w-3 h-3" />}
                        {status === 'FAILED' && <XCircle className="w-3 h-3" />}
                        <span>{status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {res ? `${res.final_duration_ms}ms` : '—'}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        {res && (
                          <button
                            onClick={() => setInspectTestResult({ def: test, result: res })}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                            title={t('عرض تفاصيل الفحص والسجلات', 'Inspect Result')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRunSingle(test.test_code)}
                          disabled={isRunning}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40"
                        >
                          {t('تشغيل', 'Run')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Result Inspector Modal */}
      <Modal
        isOpen={Boolean(inspectTestResult)}
        onClose={() => setInspectTestResult(null)}
        title={`${t('تقرير نتيجة الفحص:', 'Execution Report:')} ${inspectTestResult?.def.test_code}`}
        maxWidth="3xl"
      >
        {inspectTestResult && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{t(inspectTestResult.def.name_ar, inspectTestResult.def.name_en)}</div>
              <p className="text-slate-500 text-[11px]">{t(inspectTestResult.def.description_ar, inspectTestResult.def.description_en)}</p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-600">
                <span>Status: <b>{inspectTestResult.result.status}</b></span>
                <span>Trace ID: <b>{inspectTestResult.result.trace_id}</b></span>
                <span>Duration: <b>{inspectTestResult.result.final_duration_ms}ms</b></span>
              </div>
            </div>

            {/* Attempts Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800">{t('المحاولات والتحققات الرياضية والمنطقية (Assertions):', 'Test Attempts & Assertions:')}</h4>
              {inspectTestResult.result.attempts.map((att, idx) => (
                <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Attempt #{att.attempt_number} ({att.duration_ms}ms)</span>
                    <span className={att.status === 'PASSED' ? 'text-emerald-600' : 'text-rose-600'}>{att.status}</span>
                  </div>

                  {att.assertion_details && (
                    <div className="space-y-1">
                      {att.assertion_details.map((asrt, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-50">
                          <span className="font-medium text-slate-700">{asrt.name}</span>
                          <span className="font-mono text-slate-500">
                            Expected: {JSON.stringify(asrt.expected)} | Actual: {JSON.stringify(asrt.actual)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-2 bg-slate-900 text-slate-200 rounded-lg font-mono text-[10px] space-y-0.5">
                    {att.logs.map((lg, i) => <div key={i}>{lg}</div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
