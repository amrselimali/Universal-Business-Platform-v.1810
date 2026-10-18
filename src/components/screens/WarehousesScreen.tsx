import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Warehouse as WarehouseIcon, Building2 } from 'lucide-react';
import { Warehouse, Branch } from '../../types/entities';
import { ScreenCodes, ActionCodes } from '../../types/permissions';
import { WarehouseService } from '../../services/warehouseService';
import { BranchService } from '../../services/branchService';
import { CustomFieldService } from '../../services/customFieldService';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CustomFieldsRenderer } from '../common/CustomFieldsRenderer';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';

export const WarehousesScreen: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError, showInfo } = useNotification();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof Warehouse>('name_ar');
  const [sortAsc, setSortAsc] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name_ar: '',
    name_en: '',
    is_active: true,
    branchIds: [] as string[],
    custom_fields: {} as Record<string, any>,
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const customFieldDefs = CustomFieldService.getForEntity('warehouses');

  const loadData = () => {
    const res = WarehouseService.getPaginated(page, 25, search, sortBy, sortAsc);
    setWarehouses(res.items);
    setTotalCount(res.totalCount);
    setBranches(BranchService.getAll());
  };

  useEffect(() => {
    loadData();
  }, [page, search, sortBy, sortAsc]);

  const handleOpenAdd = () => {
    setEditingWarehouse(null);
    setFormData({
      code: `WH-0${totalCount + 1}`,
      name_ar: '',
      name_en: '',
      is_active: true,
      branchIds: branches[0] ? [branches[0].id] : [],
      custom_fields: {},
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    const linked = WarehouseService.getLinkedBranchIds(warehouse.id);
    setFormData({
      code: warehouse.code,
      name_ar: warehouse.name_ar,
      name_en: warehouse.name_en || '',
      is_active: warehouse.is_active,
      branchIds: linked,
      custom_fields: { ...(warehouse.custom_fields || {}) },
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.branchIds.length === 0) {
      showError(t('خطأ في الربط', 'Linkage error'), t('يجب ربط المخزن بفرع واحد على الأقل', 'Warehouse must be linked to at least one branch'));
      return;
    }

    try {
      if (editingWarehouse) {
        WarehouseService.update(
          { ...editingWarehouse, ...formData, name_en: formData.name_en || null },
          formData.branchIds,
          user.id
        );
        showSuccess(t('تم تعديل بيانات المخزن بنجاح', 'Warehouse updated successfully'));
      } else {
        WarehouseService.create(
          { ...formData, name_en: formData.name_en || null },
          formData.branchIds,
          user.id
        );
        showSuccess(t('تم إنشاء المخزن بنجاح', 'Warehouse created successfully'));
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(t('تعذر حفظ المخزن', 'Failed to save warehouse'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message, err.traceId);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId || !user) return;
    try {
      const result = WarehouseService.deleteOrDeactivate(deleteTargetId, user.id);
      if (result.actionTaken === 'DEACTIVATED') {
        showInfo(t('تم تعطيل المخزن', 'Warehouse Deactivated'), t('نظراً لارتباط المخزن بمستخدمين أو عمليات سابقة، تم تحويل الإجراء لتعطيل المخزن.', 'Deactivated safely due to existing references.'));
      } else {
        showSuccess(t('تم حذف المخزن نهائياً', 'Warehouse permanently deleted'));
      }
      setDeleteTargetId(null);
      loadData();
    } catch (err: any) {
      showError(t('خطأ أثناء الحذف', 'Delete failed'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message, err.traceId);
    }
  };

  const columns: Column<Warehouse>[] = [
    { key: 'code', header_ar: 'كود المخزن', header_en: 'Code', sortable: true, width: '130px', render: (w) => <span className="font-mono font-bold text-slate-800">{w.code}</span> },
    { key: 'name_ar', header_ar: 'الاسم (عربي)', header_en: 'Name (AR)', sortable: true },
    { key: 'name_en', header_ar: 'الاسم (EN)', header_en: 'Name (EN)', sortable: true },
    {
      key: 'branches',
      header_ar: 'الفروع المرتبطة',
      header_en: 'Linked Branches',
      render: (w) => {
        const linkedIds = WarehouseService.getLinkedBranchIds(w.id);
        const linkedBranches = branches.filter((b) => linkedIds.includes(b.id));
        return (
          <div className="flex flex-wrap gap-1">
            {linkedBranches.map((b) => (
              <span key={b.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <Building2 className="w-3 h-3 text-indigo-500" />
                <span>{t(b.name_ar, b.name_en || b.name_ar)}</span>
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'is_active',
      header_ar: 'الحالة',
      header_en: 'Status',
      sortable: true,
      width: '100px',
      render: (w) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${w.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {w.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          <span>{w.is_active ? t('نشط', 'Active') : t('معطل', 'Inactive')}</span>
        </span>
      ),
    },
    { key: 'version', header_ar: 'الإصدار', header_en: 'Version', width: '80px', render: (w) => <span className="font-mono text-xs text-slate-400">v{w.version}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <WarehouseIcon className="w-5 h-5 text-indigo-600" />
            <span>{t('إدارة المخازن والمستودعات', 'Warehouses Management')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('ربط المخازن بفرع أو أكثر، وتحديد سعاتها وحقولها الإضافية', 'Manage warehouses and branch linkages')}</p>
        </div>

        {hasPermission(ScreenCodes.WAREHOUSES_MANAGEMENT, ActionCodes.ADD) && (
          <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all">
            <Plus className="w-4 h-4" />
            <span>{t('إضافة مخزن جديد', 'Add New Warehouse')}</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={warehouses}
        totalCount={totalCount}
        currentPage={page}
        pageSize={25}
        onPageChange={setPage}
        searchQuery={search}
        onSearchChange={(q) => { setSearch(q); setPage(1); }}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onSortChange={(k) => {
          if (sortBy === k) setSortAsc(!sortAsc);
          else { setSortBy(k as keyof Warehouse); setSortAsc(true); }
        }}
        onRefresh={loadData}
        renderActions={(warehouse) => (
          <div className="flex items-center justify-end gap-1">
            {hasPermission(ScreenCodes.WAREHOUSES_MANAGEMENT, ActionCodes.EDIT) && (
              <button onClick={() => handleOpenEdit(warehouse)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors" title={t('تعديل', 'Edit')}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {hasPermission(ScreenCodes.WAREHOUSES_MANAGEMENT, ActionCodes.DELETE) && (
              <button onClick={() => setDeleteTargetId(warehouse.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title={t('حذف/تعطيل', 'Delete/Deactivate')}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingWarehouse ? t('تعديل بيانات المخزن', 'Edit Warehouse') : t('إضافة مخزن جديد', 'Add Warehouse')} maxWidth="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('كود المخزن', 'Warehouse Code')} *</label>
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

          {/* Linked Branches (Multi-Branch Support) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              {t('ربط الفروع التابع لها هذا المخزن (فرع أو أكثر)', 'Linked Branches (One or more)')} *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {branches.map((b) => {
                const checked = formData.branchIds.includes(b.id);
                return (
                  <label key={b.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors text-xs">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) setFormData({ ...formData, branchIds: [...formData.branchIds, b.id] });
                        else setFormData({ ...formData, branchIds: formData.branchIds.filter((id) => id !== b.id) });
                      }}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                    />
                    <span className="font-medium text-slate-700">{t(b.name_ar, b.name_en || b.name_ar)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded text-indigo-600 border-slate-300" />
            <span className="text-xs font-medium text-slate-700">{t('المخزن نشط ومتاح للصرف والإيداع', 'Warehouse is active')}</span>
          </label>

          <CustomFieldsRenderer definitions={customFieldDefs} values={formData.custom_fields} onChange={(k, v) => setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [k]: v } })} />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">{t('إلغاء', 'Cancel')}</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">{t('حفظ المخزن', 'Save Warehouse')}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleteTargetId)} onClose={() => setDeleteTargetId(null)} onConfirm={handleConfirmDelete} title={t('تأكيد حذف أو تعطيل المخزن', 'Confirm Warehouse Removal')} message={t('هل أنت متأكد من رغبتك في حذف هذا المخزن؟ سيتم تحويل الإجراء تلقائياً إلى تعطيل إذا كان مرتبطاً بمستخدمين أو أرصدة.', 'Are you sure you want to remove this warehouse? It will be safely deactivated if referenced.')} />
    </div>
  );
};
