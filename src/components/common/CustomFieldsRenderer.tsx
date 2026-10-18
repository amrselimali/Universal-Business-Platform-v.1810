import React from 'react';
import { CustomFieldDefinition } from '../../types/entities';
import { useLanguage } from '../../context/LanguageContext';

interface CustomFieldsRendererProps {
  definitions: CustomFieldDefinition[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  disabled?: boolean;
}

export const CustomFieldsRenderer: React.FC<CustomFieldsRendererProps> = ({
  definitions,
  values,
  onChange,
  disabled = false,
}) => {
  const { t } = useLanguage();

  if (definitions.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
        {t('الحقول المخصصة الإضافية', 'Custom Fields')}
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {definitions.map((def) => {
          const val = values[def.field_key] ?? '';
          const label = t(def.label_ar, def.label_en || def.label_ar);

          return (
            <div key={def.id} className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {label}
                {def.is_required && <span className="text-rose-500 ms-1">*</span>}
              </label>

              {def.data_type === 'text' && (
                <input
                  type="text"
                  value={val}
                  disabled={disabled}
                  required={def.is_required}
                  onChange={(e) => onChange(def.field_key, e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-slate-50"
                />
              )}

              {def.data_type === 'number' && (
                <input
                  type="number"
                  value={val}
                  disabled={disabled}
                  required={def.is_required}
                  onChange={(e) => onChange(def.field_key, e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-slate-50"
                />
              )}

              {def.data_type === 'date' && (
                <input
                  type="date"
                  value={val}
                  disabled={disabled}
                  required={def.is_required}
                  onChange={(e) => onChange(def.field_key, e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-slate-50"
                />
              )}

              {def.data_type === 'bool' && (
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={Boolean(val)}
                    disabled={disabled}
                    onChange={(e) => onChange(def.field_key, e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-xs text-slate-600">{t('نعم / مفعل', 'Yes / Enabled')}</span>
                </label>
              )}

              {def.data_type === 'list' && (
                <select
                  value={val}
                  disabled={disabled}
                  required={def.is_required}
                  onChange={(e) => onChange(def.field_key, e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-slate-50"
                >
                  <option value="">{t('— اختر خياراً —', '— Select an option —')}</option>
                  {(def.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
