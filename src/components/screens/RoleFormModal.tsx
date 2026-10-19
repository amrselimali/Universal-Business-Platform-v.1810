import React from 'react';
import { Shield, CheckSquare, Square } from 'lucide-react';
import { Role, RolePermission } from '../../types/entities';
import { APP_SCREENS } from '../../types/permissions';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingRole: Role | null;
  formData: {
    code: string;
    name_ar: string;
    name_en: string;
    is_active: boolean;
    permissions: Omit<RolePermission, 'id' | 'role_id'>[];
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onToggleAction: (screenCode: string, actionCode: string) => void;
  onScopeChange: (screenCode: string, actionCode: string, scope: 0 | 1 | 2) => void;
  onSelectAllForScreen: (screenCode: string, allow: boolean) => void;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingRole,
  formData,
  setFormData,
  onToggleAction,
  onScopeChange,
  onSelectAllForScreen,
}) => {
  const { t } = useLanguage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingRole ? t('تعديل بيانات الدور ومصفوفة صلاحياته', 'Edit Role & Permissions') : t('إضافة دور جديد', 'Add New Role')} maxWidth="3xl">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('كود الدور (فريد)', 'Role Code')} *</label>
            <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('الاسم بالعربية', 'Arabic Name')} *</label>
            <input type="text" required value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('الاسم بالإنجليزية', 'English Name')}</label>
            <input type="text" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="space-y-3 pt-3 border-t border-slate-100 max-h-[50vh] overflow-y-auto pe-1">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('مصفوفة الصلاحيات ونطاق الوصول', 'Permissions & Scope Matrix')}</h4>
          {APP_SCREENS.map((screen) => (
            <div key={screen.code} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t(screen.name_ar, screen.name_en)}</span>
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => onSelectAllForScreen(screen.code, true)} className="px-2 py-0.5 text-[11px] font-medium text-indigo-600 hover:bg-white rounded">{t('تحديد الكل', 'Select All')}</button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={() => onSelectAllForScreen(screen.code, false)} className="px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-white rounded">{t('إلغاء الكل', 'Deselect')}</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {screen.actions.map((act) => {
                  const perm = formData.permissions.find((p) => p.screen_code === screen.code && p.action_code === act.code);
                  const isChecked = Boolean(perm?.is_allowed);

                  return (
                    <div key={act.code} className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${isChecked ? 'bg-indigo-50/60 border-indigo-200' : 'bg-white border-slate-200'}`}>
                      <div onClick={() => onToggleAction(screen.code, act.code)} className="flex items-center gap-2 cursor-pointer flex-1">
                        {isChecked ? <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-300 shrink-0" />}
                        <span className="font-medium text-slate-700">{t(act.label_ar, act.label_en)}</span>
                      </div>

                      {isChecked && (
                        <select value={perm?.scope ?? 1} onChange={(e) => onScopeChange(screen.code, act.code, Number(e.target.value) as 0 | 1 | 2)} className="text-[11px] px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-700">
                          <option value={0}>{t('سجلاتي فقط', 'My Records')}</option>
                          <option value={1}>{t('فروعي المصرح بها', 'My Branches')}</option>
                          <option value={2}>{t('كافة الفروع والبيانات', 'All Records')}</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">{t('إلغاء', 'Cancel')}</button>
          <button type="submit" className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">{t('حفظ الدور', 'Save Role')}</button>
        </div>
      </form>
    </Modal>
  );
};
