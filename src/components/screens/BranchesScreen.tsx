import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, GitBranch } from 'lucide-react';
import { Branch } from '../../types/entities';
import { ScreenCodes, ActionCodes } from '../../types/permissions';
import { BranchService } from '../../services/branchService';
import { CustomFieldService } from '../../services/customFieldService';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CustomFieldsRenderer } from '../common/CustomFieldsRenderer';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { formatCairoDateTime } from '../../utils/datetime';

export const BranchesScreen: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError, showInfo } = useNotification();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof Branch>('name_ar');
  const [sortAsc, setSortAsc] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name_ar: '',
    name_en: '',
    address: '',
    phone: '',
    is_active: true,
    custom_fields: {} as Record<string, any>,
  });

  // Delete state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const customFieldDefs = CustomFieldService.getForEntity('branches');

  const loadBranches = () => {
    const res = BranchService.getPaginated(page, 25, search, sortBy, sortAsc);
    setBranches(res.items);
    setTotalCount(res.totalCount);
  };

  useEffect(() => {
    loadBranches();
  }, [page, search, sortBy, sortAsc]);

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setFormData({
      code: `BR-0${totalCount + 1}`,
      name_ar: '',
      name_en: '',
      address: '',
      phone: '',
      is_active: true,
      custom_fields: {},
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      code: branch.code,
      name_ar: branch.name_ar,
      name_en: branch.name_en || '',
      address: branch.address || '',
      phone: branch.phone || '',
      is_active: branch.is_active,
      custom_fields: { ...(branch.custom_fields || {}) },
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingBranch) {
        BranchService.update(
          {
            ...editingBranch,
            ...formData,
            name_en: formData.name_en || null,
            address: formData.address || null,
            phone: formData.phone || null,
          },
          user.id
        );
        showSuccess(t('تم تعديل بيانات الفرع بنجاح', 'Branch updated successfully'));
      } else {
        BranchService.create(
          {
            ...formData,
            name_en: formData.name_en || null,
            address: formData.address || null,
            phone: formData.phone || null,
          },
          user.id
        );
        showSuccess(t('تم إنشاء الفرع بنجاح', 'Branch created successfully'));
      }
      setIsModalOpen(false);
      loadBranches();
    } catch (err: any) {
      showError(t('تعذر حفظ الفرع', 'Failed to save branch'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message, err.traceId);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId || !user) return;
    try {
      const result = BranchService.deleteOrDeactivate(deleteTargetId, user.id);
      if (result.actionTaken === 'DEACTIVATED') {
        showInfo(
          t('تم تعطيل الفرع بدلاً من الحذف', 'Branch Deactivated Instead of Deleted'),
          t('نظراً لارتباط الفرع بمخازن أو مستخدمين أو سجلات سابقة، تم تحويل الإجراء إلى تعطيل الحساب (is_active = false) لضمان سلامة البيانات.', 'Due to existing links, the branch was safely set to inactive.')
        );
      } else {
        showSuccess(t('تم حذف الفرع نهائياً', 'Branch permanently deleted'));
      }
      setDeleteTargetId(null);
      loadBranches();
    } catch (err: any) {
      showError(t('خطأ أثناء الحذف', 'Delete failed'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message, err.traceId);
    }
  };

  const columns: Column<Branch>[] = [
    { key: 'code', header_ar: 'كود الفرع', header_en: 'Code', sortable: true, width: '120px', render: (b) => <span className="font-mono font-bold text-slate-800">{b.code}</span> },
    { key: 'name_ar', header_ar: 'الاسم (عربي)', header_en: 'Name (AR)', sortable: true },
    { key: 'name_en', header_ar: 'الاسم (EN)', header_en: 'Name (EN)', sortable: true },
    { key: 'phone', header_ar: 'رقم الهاتف', header_en: 'Phone', render: (b) => <span className="font-mono text-xs">{b.phone || '—'}</span> },
    {
      key: 'is_active',
      header_ar: 'الحالة',
      header_en: 'Status',
      sortable: true,
      width: '100px',
      render: (b) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {b.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          <span>{b.is_active ? t('نشط', 'Active') : t('معطل', 'Inactive')}</span>
        </span>
      ),
    },
    { key: 'version', header_ar: 'الإصدار', header_en: 'Version', width: '80px', render: (b) => <span className="font-mono text-xs text-slate-400">v{b.version}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            <span>{t('إدارة الفروع', 'Branches Management')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('إدارة فروع الشركة وتحديد بياناتها وربط الحقول المخصصة', 'Manage company branches and custom fields')}</p>
        </div>

        {hasPermission(ScreenCodes.BRANCHES_MANAGEMENT, ActionCodes.ADD) && (
          <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all">
            <Plus className="w-4 h-4" />
            <span>{t('إضافة فرع جديد', 'Add New Branch')}</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={branches}
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
          else { setSortBy(k as keyof Branch); setSortAsc(true); }
        }}
        onRefresh={loadBranches}
        renderActions={(branch) => (
          <div className="flex items-center justify-end gap-1">
            {hasPermission(ScreenCodes.BRANCHES_MANAGEMENT, ActionCodes.EDIT) && (
              <button onClick={() => handleOpenEdit(branch)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors" title={t('تعديل', 'Edit')}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {hasPermission(ScreenCodes.BRANCHES_MANAGEMENT, ActionCodes.DELETE) && (
              <button onClick={() => setDeleteTargetId(branch.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title={t('حذف/تعطيل', 'Delete/Deactivate')}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBranch ? t('تعديل بيانات الفرع', 'Edit Branch') : t('إضافة فرع جديد', 'Add Branch')} maxWidth="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('كود الفرع', 'Branch Code')} *</label>
              <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('الاسم بالعربية', 'Arabic Name')} *</label>
              <input type="text" required value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('الاسم بالإنجليزية', 'English Name')}</label>
              <input type="text" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('رقم الهاتف', 'Phone')}</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('العنوان', 'Address')}</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded text-indigo-600 border-slate-300" />
            <span className="text-xs font-medium text-slate-700">{t('الفرع نشط ومتاح للعمليات', 'Branch is active')}</span>
          </label>

          {/* Dynamic Custom Fields */}
          <CustomFieldsRenderer definitions={customFieldDefs} values={formData.custom_fields} onChange={(k, v) => setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [k]: v } })} />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">{t('إلغاء', 'Cancel')}</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">{t('حفظ الفرع', 'Save Branch')}</button>
          </div>
        </form>
      </Modal>

      {/* Delete / Deactivate Confirmation */}
      <ConfirmDialog isOpen={Boolean(deleteTargetId)} onClose={() => setDeleteTargetId(null)} onConfirm={handleConfirmDelete} title={t('تأكيد حذف أو تعطيل الفرع', 'Confirm Branch Removal')} message={t('هل أنت متأكد من رغبتك في حذف هذا الفرع؟ إذا كان الفرع مرتبطاً بحركات أو مخازن أو مستخدمين فسيتم تحويل الإجراء تلقائياً إلى تعطيل للحفاظ على ترابط السجلات.', 'Are you sure you want to remove this branch? If referenced elsewhere, it will be automatically deactivated.')} confirmLabel={t('تأكيد الإجراء', 'Proceed')} />
    </div>
  );
};
