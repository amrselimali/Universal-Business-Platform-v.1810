import React from 'react';
import { Play, CheckCircle2, XCircle, Eye, Cpu, FileCode2, Database, ShieldAlert, Sparkles } from 'lucide-react';
import { QaTestDefinition, QaTestResult, QaTestStatus } from '../../types/qa';
import { useLanguage } from '../../context/LanguageContext';

interface QaConstraintsTabProps {
  constraintTests: QaTestDefinition[];
  results: Record<string, QaTestResult>;
  isRunning: boolean;
  onRunSingle: (code: string) => void;
  onInspect: (def: QaTestDefinition, res: QaTestResult) => void;
}

export const QaConstraintsTab: React.FC<QaConstraintsTabProps> = ({
  constraintTests,
  results,
  isRunning,
  onRunSingle,
  onInspect,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>{t('فحص القيود الهندسية، استهلاك الموارد، وقواعد البيانات', 'Architecture, Resource & DB Constraints')}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('التحقق من حد 300 سطر، واستهلاك الموارد لـ 100 مستخدم، وترقيم 25 صفاً، وتزامن البيانات', 'Verify 300-line limit, 100-user capacity, pagination & concurrency')}
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
          {constraintTests.length} {t('اختبارات أساسية', 'Core Specs')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {constraintTests.map((test) => {
          const res = results[test.test_code];
          const status: QaTestStatus = res ? res.status : 'UNTESTED';

          const isResourceTest = test.test_code.includes('RESOURCE') || test.test_code.includes('PERF');
          const isArchTest = test.test_code.includes('300_LINES');

          return (
            <div
              key={test.test_code}
              className={`p-4 rounded-2xl border shadow-xs transition-all flex flex-col justify-between gap-3 ${
                isResourceTest
                  ? 'bg-gradient-to-br from-indigo-50/50 to-white border-indigo-200'
                  : isArchTest
                  ? 'bg-gradient-to-br from-emerald-50/40 to-white border-emerald-200'
                  : 'bg-white border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    status === 'PASSED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    status === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {status === 'PASSED' && <CheckCircle2 className="w-3 h-3" />}
                    {status === 'FAILED' && <XCircle className="w-3 h-3" />}
                    <span>{status}</span>
                  </span>

                  <span className="text-[10px] font-mono text-slate-400 font-semibold">{test.category}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug">{t(test.name_ar, test.name_en)}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{t(test.description_ar, test.description_en)}</p>
              </div>

              {res && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Duration: {res.final_duration_ms}ms</span>
                  <span className="font-semibold text-indigo-600">{res.attempts[0]?.assertion_details?.[0]?.actual}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[10px] font-mono text-slate-400">{test.test_code}</span>

                <div className="flex items-center gap-1.5">
                  {res && (
                    <button
                      onClick={() => onInspect(test, res)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                      title={t('عرض التفاصيل', 'Details')}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onRunSingle(test.test_code)}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                  >
                    <Play className="w-3 h-3" />
                    <span>{t('تشغيل الفحص', 'Test')}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
