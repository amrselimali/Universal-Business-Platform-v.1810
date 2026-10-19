import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Sliders, Check, X } from 'lucide-react';
import { CustomFieldDefinition, CustomFieldDataType } from '../../types/entities';
import { ScreenCodes, ActionCodes } from '../../types/permissions';
import { CustomFieldService } from '../../services/customFieldService';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';

export const CustomFieldsScreen: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();

  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);

  const [formData, setFormData] = useState({
    entity_name: 'branches' as 'branches' | 'warehouses' | 'users',
    field_key: '',
    label_ar: '',
    label_en: '',
    data_type: 'text' as CustomFieldDataType,
    optionsInput: '',
    is_required: false,
    is_active: true,
    sort_order: 1,
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadData = () => {
    setFields(CustomFieldService.getAll());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingField(null);
    setFormData({
      entity_name: 'branches',
      field_key: '',
      label_ar: '',
      label_en: '',
      data_type: 'text',
      optionsInput: '',
      is_required: false,
      is_active: true,
      sort_order: fields.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: CustomFieldDefinition) => {
    setEditingField(f);
    setFormData({
      entity_name: f.entity_name,
      field_key: f.field_key,
      label_ar: f.label_ar,
      label_en: f.label_en || '',
      data_type: f.data_type,
      optionsInput: (f.options || []).join(', '),
      is_required: f.is_required,
      is_active: f.is_active,
      sort_order: f.sort_order,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsedOptions =
      formData.data_type === 'list'
        ? formData.optionsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : null;

    try {
      if (editingField) {
        CustomFieldService.update(
          {
            ...editingField,
            ...formData,
            label_en: formData.label_en || null,
            options: parsedOptions,
          },
          user.id
        );
        showSuccess(t('تم تعديل الحقل المخصص بنجاح', 'Custom field updated successfully'));
      } else {
        CustomFieldService.create(
          {
            ...formData,
            label_en: formData.label_en || null,
            options: parsedOptions,
          },
          user.id
        );
        showSuccess(t('تم إنشاء الحقل المخصص بنجاح', 'Custom field created successfully'));
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(t('تعذر حفظ الحقل', 'Save failed'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId || !user) return;
    try {
      CustomFieldService.delete(deleteTargetId, user.id);
      showSuccess(t('تم حذف الحقل المخصص', 'Custom field deleted'));
      setDeleteTargetId(null);
      loadData();
    } catch (err: any) {
      showError(t('خطأ أثناء الحذف', 'Delete failed'), err.message);
    }
  };

  const columns: Column<CustomFieldDefinition>[] = [
    { key: 'entity_name', header_ar: 'الكيان التابع له', header_en: 'Target Entity', sortable: true, width: '130px', render: (f) => <span className="font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">{f.entity_name}</span> },
    { key: 'field_key', header_ar: 'مفتاح الحقل', header_en: 'Field Key', sortable: true, width: '130px', render: (f) => <span className="font-mono text-xs text-slate-800">{f.field_key}</span> },
    { key: 'label_ar', header_ar: 'العنوان (عربي)', header_en: 'Label (AR)', sortable: true },
    { key: 'label_en', header_ar: 'العنوان (EN)', header_en: 'Label (EN)', sortable: true },
    { key: 'data_type', header_ar: 'النوع', header_en: 'Data Type', width: '90px', render: (f) => <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100">{f.data_type}</span> },
    { key: 'is_required', header_ar: 'إلزامي', header_en: 'Required', width: '80px', render: (f) => f.is_required ? <span className="text-xs font-bold text-rose-600">{t('نعم', 'Yes')}</span> : <span className="text-xs text-slate-400">{t('لا', 'No')}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <span>{t('تعريف الحقول الإضافية', 'Custom Fields')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('إضافة حقول بيانات إضافية مخصصة للفروع والمخازن والمستخدمين', 'Define additional custom fields for entities')}</p>
        </div>

        {hasPermission(ScreenCodes.CUSTOM_FIELDS_MANAGEMENT, ActionCodes.ADD) && (
          <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all">
            <Plus className="w-4 h-4" />
            <span>{t('إضافة حقل جديد', 'Add Field')}</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={fields}
        totalCount={fields.length}
        currentPage={1}
        pageSize={25}
        onPageChange={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        onRefresh={loadData}
        renderActions={(field) => (
          <div className="flex items-center justify-end gap-1">
            {hasPermission(ScreenCodes.CUSTOM_FIELDS_MANAGEMENT, ActionCodes.EDIT) && (
              <button onClick={() => handleOpenEdit(field)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg" title={t('تعديل', 'Edit')}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {hasPermission(ScreenCodes.CUSTOM_FIELDS_MANAGEMENT, ActionCodes.DELETE) && (
              <button onClick={() => setDeleteTargetId(field.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title={t('حذف', 'Delete')}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingField ? t('تعديل الحقل المخصص', 'Edit Custom Field') : t('إضافة حقل مخصص جديد', 'Add Custom Field')} maxWidth="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('الكيان التابع له', 'Target Entity')} *</label>
            <select disabled={Boolean(editingField)} value={formData.entity_name} onChange={(e) => setFormData({ ...formData, entity_name: e.target.value as any })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl disabled:bg-slate-50">
              <option value="branches">{t('فروع الشركة', 'Branches')}</option>
              <option value="warehouses">{t('المستودعات والمخازن', 'Warehouses')}</option>
              <option value="users">{t('المستخدمين', 'Users')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('رمز الحقل بالإنجليزية', 'Field Identifier')} *</label>
            <input type="text" required disabled={Boolean(editingField)} placeholder="e.g. tax_card, vat_id" value={formData.field_key} onChange={(e) => setFormData({ ...formData, field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono disabled:bg-slate-50" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('العنوان بالعربية', 'Arabic Label')} *</label>
              <input type="text" required value={formData.label_ar} onChange={(e) => setFormData({ ...formData, label_ar: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('العنوان بالإنجليزية', 'English Label')}</label>
              <input type="text" value={formData.label_en} onChange={(e) => setFormData({ ...formData, label_en: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('نوع البيانات', 'Data Type')}</label>
            <select value={formData.data_type} onChange={(e) => setFormData({ ...formData, data_type: e.target.value as any })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl">
              <option value="text">{t('نص', 'Text')}</option>
              <option value="number">{t('رقم', 'Number')}</option>
              <option value="date">{t('تاريخ', 'Date')}</option>
              <option value="bool">{t('قيمة منطقية (نعم/لا)', 'Boolean')}</option>
              <option value="list">{t('قائمة خيارات منسدلة', 'Dropdown List')}</option>
            </select>
          </div>

          {formData.data_type === 'list' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('الخيارات (مفصولة بفواصل)', 'Options (comma-separated)')}</label>
              <input type="text" placeholder="e.g. Option 1, Option 2, Option 3" value={formData.optionsInput} onChange={(e) => setFormData({ ...formData, optionsInput: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl" />
            </div>
          )}

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" checked={formData.is_required} onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })} className="w-4 h-4 rounded text-indigo-600 border-slate-300" />
              <span>{t('حقل إلزامي', 'Required field')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded text-indigo-600 border-slate-300" />
              <span>{t('حقل نشط', 'Active field')}</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">{t('إلغاء', 'Cancel')}</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">{t('حفظ الحقل', 'Save Field')}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleteTargetId)} onClose={() => setDeleteTargetId(null)} onConfirm={handleConfirmDelete} title={t('تأكيد حذف الحقل المخصص', 'Confirm Field Deletion')} message={t('هل أنت متأكد من رغبتك في حذف هذا الحقل؟', 'Are you sure you want to delete this custom field?')} />
    </div>
  );
};
