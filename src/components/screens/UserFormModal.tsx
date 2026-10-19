import React from 'react';
import { User, Branch, Warehouse, Role } from '../../types/entities';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingUser: User | null;
  formData: {
    name: string;
    username: string;
    password: string;
    language: 'ar' | 'en';
    is_admin: boolean;
    branchSelections: { branchId: string; isDefault: boolean }[];
    warehouseIds: string[];
    roleIds: string[];
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  branches: Branch[];
  warehouses: Warehouse[];
  roles: Role[];
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingUser,
  formData,
  setFormData,
  branches,
  warehouses,
  roles,
}) => {
  const { t } = useLanguage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingUser ? t('تعديل بيانات المستخدم', 'Edit User') : t('إضافة مستخدم جديد', 'Add User')} maxWidth="2xl">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('الاسم الكامل', 'Full Name')} *</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('اسم المستخدم', 'Username')} *</label>
            <input type="text" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>
          {!editingUser && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('كلمة المرور الأولية', 'Initial Password')} *</label>
              <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min 8 characters" className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('اللغة الافتراضية', 'Language')}</label>
            <select value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value as 'ar' | 'en' })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl">
              <option value="ar">العربية (Arabic)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input type="checkbox" checked={formData.is_admin} onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })} className="w-4 h-4 rounded text-indigo-600 border-slate-300" />
          <span className="text-xs font-bold text-indigo-700">{t('تعيين كمدير نظام (يتجاوز قيود الصلاحيات)', 'Set as Administrator')}</span>
        </label>

        {/* Branch Assignments */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700">{t('فروع المستخدم والفرع الافتراضي:', 'User Branches & Default:')}</label>
          <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            {branches.map((b) => {
              const isSelected = formData.branchSelections.some((bs) => bs.branchId === b.id);
              const isDefault = formData.branchSelections.find((bs) => bs.branchId === b.id)?.isDefault ?? false;

              return (
                <div key={b.id} className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const makeDefault = formData.branchSelections.length === 0;
                          setFormData({ ...formData, branchSelections: [...formData.branchSelections, { branchId: b.id, isDefault: makeDefault }] });
                        } else {
                          setFormData({ ...formData, branchSelections: formData.branchSelections.filter((bs) => bs.branchId !== b.id) });
                        }
                      }}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                    />
                    <span className="font-medium text-slate-800">{t(b.name_ar, b.name_en || b.name_ar)}</span>
                  </label>

                  {isSelected && (
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="default_branch"
                        checked={isDefault}
                        onChange={() => {
                          setFormData({
                            ...formData,
                            branchSelections: formData.branchSelections.map((bs) => ({ ...bs, isDefault: bs.branchId === b.id })),
                          });
                        }}
                        className="w-3.5 h-3.5 text-indigo-600"
                      />
                      <span>{t('الفرع الافتراضي', 'Default Branch')}</span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Warehouse Assignments */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700">{t('المستودعات المصرح للمستخدم بالعمل عليها:', 'Permitted Warehouses:')}</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            {warehouses.map((w) => {
              const checked = formData.warehouseIds.includes(w.id);
              return (
                <label key={w.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) setFormData({ ...formData, warehouseIds: [...formData.warehouseIds, w.id] });
                      else setFormData({ ...formData, warehouseIds: formData.warehouseIds.filter((id) => id !== w.id) });
                    }}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                  />
                  <span className="font-medium text-slate-700">{t(w.name_ar, w.name_en || w.name_ar)}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Roles Selection */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700">{t('الأدوار الإدارية المرتبطة:', 'Assigned Roles:')}</label>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => {
              const checked = formData.roleIds.includes(r.id);
              return (
                <label key={r.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition-all ${checked ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) setFormData({ ...formData, roleIds: [...formData.roleIds, r.id] });
                      else setFormData({ ...formData, roleIds: formData.roleIds.filter((id) => id !== r.id) });
                    }}
                    className="w-3.5 h-3.5 rounded text-indigo-600"
                  />
                  <span>{t(r.name_ar, r.name_en || r.name_ar)}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">{t('إلغاء', 'Cancel')}</button>
          <button type="submit" className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">{t('حفظ المستخدم', 'Save User')}</button>
        </div>
      </form>
    </Modal>
  );
};
