import React, { useState, useEffect } from 'react';
import { CheckCheck, Play, RotateCcw, CheckCircle2, XCircle, Activity, Layers, Cpu, ShieldCheck, HardDrive } from 'lucide-react';
import { QaTestDefinition, QaRun, QaTestResult } from '../../types/qa';
import { QaService } from '../../services/qaService';
import { QaButtonsMatrixTab } from './QaButtonsMatrixTab';
import { QaConstraintsTab } from './QaConstraintsTab';
import { QaResourcesBenchmarkTab } from './QaResourcesBenchmarkTab';
import { QaInspectModal } from './QaInspectModal';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';

export const QaControlCenterScreen: React.FC = () => {
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState<'BUTTONS' | 'RESOURCES_300' | 'CONSTRAINTS' | 'GATES'>('BUTTONS');
  const [buttonTests, setButtonTests] = useState<QaTestDefinition[]>([]);
  const [constraintTests, setConstraintTests] = useState<QaTestDefinition[]>([]);
  const [activeRun, setActiveRun] = useState<QaRun | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, currentName: '' });
  const [inspectModalData, setInspectModalData] = useState<{ def: QaTestDefinition; res: QaTestResult } | null>(null);

  useEffect(() => {
    const bt = QaService.getButtonActionTests();
    const ct = QaService.getSystemConstraintTests();
    setButtonTests(bt);
    setConstraintTests(ct);

    const history = QaService.getRunHistory();
    if (history.length > 0) {
      setActiveRun(history[0]);
    } else {
      const allCodes = [...ct, ...bt].map((x) => x.test_code);
      QaService.executeRun(allCodes, 'LOCAL_TEST').then((run) => setActiveRun(run));
    }
  }, []);

  const allTests = [...constraintTests, ...buttonTests];

  const handleRunSuite = async (codes: string[]) => {
    if (codes.length === 0) return;
    setIsRunning(true);
    setProgress({ completed: 0, total: codes.length, currentName: 'Initializing Test Sandbox...' });

    try {
      const run = await QaService.executeRun(codes, 'LOCAL_TEST', (completed, total, currentName) => {
        setProgress({ completed, total, currentName });
      });
      setActiveRun(run);
      if (run.quality_gates_passed) {
        showSuccess(t('نجحت كافة معايير الجودة وبوابات الفحص', 'All Quality Gates Passed'), t(`تم فحص ${run.summary.total} اختباراً وإجراءً بنجاح`, `Executed ${run.summary.total} tests successfully`));
      } else {
        showError(t('فشل بعض فحوصات الجودة', 'Quality Gate Failure'), t(`فشل ${run.summary.failed} فحصاً من إجمالي الفحوصات`, `${run.summary.failed} test(s) failed`));
      }
    } catch (err: any) {
      showError(t('خطأ أثناء تشغيل الفحص', 'Execution Error'), err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunSingle = (code: string) => {
    handleRunSuite([code]);
  };

  const handleRetryFailed = () => {
    if (!activeRun) return;
    const failedCodes = Object.keys(activeRun.results).filter((k) => activeRun.results[k].status === 'FAILED');
    if (failedCodes.length === 0) {
      showSuccess(t('لا توجد اختبارات فاشلة لإعادتها', 'No failed tests'));
      return;
    }
    handleRunSuite(failedCodes);
  };

  const passedCount = activeRun ? activeRun.summary.passed : allTests.length;
  const failedCount = activeRun ? activeRun.summary.failed : 0;
  const results = activeRun ? activeRun.results : {};

  return (
    <div className="space-y-6">
      {/* Top Banner & Suite Trigger */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCheck className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {t('مركز اختبارات وضمان الجودة (QA & Test Control Center)', 'QA & Test Control Center')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {t('مصفوفة حية مستخرجة من الشاشات', '100% Screen-Driven Matrix')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('اكتشاف تلقائي للأزرار والشاشات، فحص سعة 300 صف، واستهلاك الموارد لـ 100 مستخدم', 'Dynamic button discovery, 300-row capacity & resource benchmarks')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeRun && failedCount > 0 && (
            <button
              onClick={handleRetryFailed}
              disabled={isRunning}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('إعادة الفاشلة', 'Retry Failed')}</span>
            </button>
          )}

          <button
            onClick={() => handleRunSuite(allTests.map((t) => t.test_code))}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{t('تشغيل كافة الفحوصات (Full Suite)', 'Run Full Suite')}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>{progress.currentName}</span>
            </span>
            <span className="font-mono">
              {progress.completed} / {progress.total} ({Math.round((progress.completed / progress.total) * 100)}%)
            </span>
          </div>
          <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-200" style={{ width: `${(progress.completed / progress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{t('إجمالي الفحوصات المكتشفة', 'Total Discovered Tests')}</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{allTests.length}</div>
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
          <span className="text-xs font-semibold text-slate-500">{t('بوابات الجودة (Quality Gates)', 'Quality Gates')}</span>
          <div className="mt-1">
            {activeRun ? (
              activeRun.quality_gates_passed ? (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASSED (100%)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 flex items-center gap-1 w-max">
                  <XCircle className="w-3.5 h-3.5" /> FAILED
                </span>
              )
            ) : (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                <CheckCircle2 className="w-3.5 h-3.5" /> PASSED (100%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('BUTTONS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'BUTTONS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('مصفوفة فحص أزرار الشاشات', 'Screen Buttons Matrix')} ({buttonTests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RESOURCES_300')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'RESOURCES_300' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>{t('استهلاك موارد الجهاز وسعة 300 صف', 'Hardware Resources & 300-Rows Capacity')}</span>
        </button>

        <button
          onClick={() => setActiveTab('CONSTRAINTS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'CONSTRAINTS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>{t('الشروط والقيود وتزامن البيانات', 'Constraints & Concurrency')} ({constraintTests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('GATES')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'GATES' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('بوابات الجودة والتقارير', 'Quality Gates')}</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'BUTTONS' && (
        <QaButtonsMatrixTab
          buttonTests={buttonTests}
          results={results}
          isRunning={isRunning}
          onRunSingle={handleRunSingle}
          onInspect={(def, res) => setInspectModalData({ def, res })}
        />
      )}

      {activeTab === 'RESOURCES_300' && (
        <QaResourcesBenchmarkTab
          results={results}
          isRunning={isRunning}
          onRunTest={handleRunSingle}
        />
      )}

      {activeTab === 'CONSTRAINTS' && (
        <QaConstraintsTab
          constraintTests={constraintTests}
          results={results}
          isRunning={isRunning}
          onRunSingle={handleRunSingle}
          onInspect={(def, res) => setInspectModalData({ def, res })}
        />
      )}

      {activeTab === 'GATES' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">{t('تقييم بوابات الجودة الإلزامية (Release Quality Gates)', 'Quality Gates Evaluation')}</h3>
          {activeRun && activeRun.gate_breakdown ? (
            <div className="divide-y divide-slate-100">
              {activeRun.gate_breakdown.map((gate, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    {gate.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <div>
                      <div className="font-bold text-slate-900">{gate.gate_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{gate.reason}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${gate.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {gate.passed ? 'PASSED' : 'BLOCKED'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-6 text-center">{t('قم بتشغيل الفحص لعرض تقييم بوابات الجودة.', 'Run a test suite to view gate breakdown.')}</div>
          )}
        </div>
      )}

      {/* Inspection Modal */}
      <QaInspectModal
        data={inspectModalData}
        onClose={() => setInspectModalData(null)}
      />
    </div>
  );
};
