import React from 'react';
import { QaTestDefinition, QaTestResult } from '../../types/qa';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';

interface QaInspectModalProps {
  data: { def: QaTestDefinition; res: QaTestResult } | null;
  onClose: () => void;
}

export const QaInspectModal: React.FC<QaInspectModalProps> = ({ data, onClose }) => {
  const { t } = useLanguage();
  if (!data) return null;

  return (
    <Modal
      isOpen={Boolean(data)}
      onClose={onClose}
      title={`${t('تقرير الفحص:', 'Execution Report:')} ${data.def.test_code}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="font-bold text-slate-900">{t(data.def.name_ar, data.def.name_en)}</div>
          <p className="text-[11px] text-slate-500">{t(data.def.description_ar, data.def.description_en)}</p>
          <div className="flex items-center gap-3 pt-1 font-mono text-[11px] text-slate-600">
            <span>Status: <b>{data.res.status}</b></span>
            <span>Trace: <b>{data.res.trace_id}</b></span>
            <span>Time: <b>{data.res.final_duration_ms}ms</b></span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-slate-800">{t('نتائج التحقق الرياضي والمنطقي (Assertions):', 'Assertions Evaluation:')}</h4>
          {data.res.attempts[0]?.assertion_details?.map((asrt, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-800">{asrt.name}</span>
              <span className="font-mono text-slate-500">Actual: {String(asrt.actual)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-slate-800">{t('سجلات التنفيذ البرمجية (Execution Logs):', 'Logs:')}</h4>
          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1 max-h-40 overflow-y-auto">
            {data.res.attempts[0]?.logs.map((lg, i) => <div key={i}>{lg}</div>)}
          </div>
        </div>
      </div>
    </Modal>
  );
};
