import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ForbiddenScreenProps {
  onBackToDashboard: () => void;
}

export const ForbiddenScreen: React.FC<ForbiddenScreenProps> = ({ onBackToDashboard }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-800">
        {t('ليس لديك صلاحية لفتح هذه الشاشة (403 Forbidden)', 'Access Denied (403 Forbidden)')}
      </h2>
      <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
        {t(
          'تم رفض الوصول إلى هذه الشاشة بواسطة مصفوفة الصلاحيات أو قيود عزل الفروع على السيرفر. يرجى مراجعة مسؤول النظام لمنحك الصلاحيات المناسبة.',
          'Access to this module is restricted by server authorization rules or branch boundary constraints.'
        )}
      </p>

      <button
        onClick={onBackToDashboard}
        className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        <span>{t('العودة للوحة التحكم', 'Back to Dashboard')}</span>
      </button>
    </div>
  );
};
