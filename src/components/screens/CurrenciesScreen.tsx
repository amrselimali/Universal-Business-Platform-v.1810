import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Coins, Check, Star } from 'lucide-react';
import { Currency } from '../../types/entities';
import { ScreenCodes, ActionCodes } from '../../types/permissions';
import { CurrencyService } from '../../services/currencyService';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';

export const CurrenciesScreen: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  const [formData, setFormData] = useState({
    currency_code: '',
    name_ar: '',
    name_en: '',
    symbol: '',
    decimals: 2,
    is_base: false,
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadData = () => {
    setCurrencies(CurrencyService.getAll());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingCurrency(null);
    setFormData({
      currency_code: '',
      name_ar: '',
      name_en: '',
      symbol: '',
      decimals: 2,
      is_base: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (curr: Currency) => {
    setEditingCurrency(curr);
    setFormData({
      currency_code: curr.currency_code,
      name_ar: curr.name_ar,
      name_en: curr.name_en || '',
      symbol: curr.symbol || '',
      decimals: curr.decimals,
      is_base: curr.is_base,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingCurrency) {
        CurrencyService.update(
          {
            ...editingCurrency,
            ...formData,
            currency_code: formData.currency_code.toUpperCase(),
            name_en: formData.name_en || null,
            symbol: formData.symbol || null,
          },
          user.id
        );
        showSuccess(t('تم تعديل العملة بنجاح', 'Currency updated successfully'));
      } else {
        CurrencyService.create(
          {
            ...formData,
            currency_code: formData.currency_code.toUpperCase(),
            name_en: formData.name_en || null,
            symbol: formData.symbol || null,
          },
          user.id
        );
        showSuccess(t('تمت إضافة العملة بنجاح', 'Currency added successfully'));
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(t('تعذر حفظ العملة', 'Failed to save currency'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message, err.traceId);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId || !user) return;
    try {
      CurrencyService.delete(deleteTargetId, user.id);
      showSuccess(t('تم حذف العملة بنجاح', 'Currency deleted successfully'));
      setDeleteTargetId(null);
      loadData();
    } catch (err: any) {
      showError(t('خطأ أثناء حذف العملة', 'Delete failed'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message);
    }
  };

  const columns: Column<Currency>[] = [
    { key: 'currency_code', header_ar: 'كود العملة', header_en: 'Code', sortable: true, width: '120px', render: (c) => <span className="font-mono font-bold text-slate-800">{c.currency_code}</span> },
    { key: 'name_ar', header_ar: 'الاسم (عربي)', header_en: 'Name (AR)', sortable: true },
    { key: 'name_en', header_ar: 'الاسم (EN)', header_en: 'Name (EN)', sortable: true },
    { key: 'symbol', header_ar: 'الرمز', header_en: 'Symbol', width: '90px', render: (c) => <span className="font-semibold text-slate-700">{c.symbol || '—'}</span> },
    { key: 'decimals', header_ar: 'الفواصل العشرية', header_en: 'Decimals', width: '120px', render: (c) => <span className="font-mono text-xs">{c.decimals}</span> },
    {
      key: 'is_base',
      header_ar: 'العملة الأساسية',
      header_en: 'Base Currency',
      width: '140px',
      render: (c) => (
        c.is_base ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{t('العملة الأساسية', 'Base Currency')}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-medium">—</span>
        )
      ),
    },
    { key: 'version', header_ar: 'الإصدار', header_en: 'Version', width: '80px', render: (c) => <span className="font-mono text-xs text-slate-400">v{c.version}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-indigo-600" />
            <span>{t('إدارة العملات', 'Currencies Management')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('إدارة العملات المحلية والدولية، وتحديد العملة الأساسية للنظام (Singleton Base)', 'Manage multi-currencies and base currency')}</p>
        </div>

        {hasPermission(ScreenCodes.CURRENCIES_MANAGEMENT, ActionCodes.ADD) && (
          <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all">
            <Plus className="w-4 h-4" />
            <span>{t('إضافة عملة جديدة', 'Add Currency')}</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={currencies}
        totalCount={currencies.length}
        currentPage={1}
        pageSize={25}
        onPageChange={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        onRefresh={loadData}
        renderActions={(curr) => (
          <div className="flex items-center justify-end gap-1">
            {hasPermission(ScreenCodes.CURRENCIES_MANAGEMENT, ActionCodes.EDIT) && (
              <button onClick={() => handleOpenEdit(curr)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg" title={t('تعديل', 'Edit')}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {hasPermission(ScreenCodes.CURRENCIES_MANAGEMENT, ActionCodes.DELETE) && !curr.is_base && (
              <button onClick={() => setDeleteTargetId(curr.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title={t('حذف', 'Delete')}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCurrency ? t('تعديل العملة', 'Edit Currency') : t('إضافة عملة جديدة', 'Add Currency')} maxWidth="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('كود العملة (3 أحرف)', 'Code (3 letters)')} *</label>
              <input type="text" required maxLength={3} value={formData.currency_code} onChange={(e) => setFormData({ ...formData, currency_code: e.target.value.toUpperCase() })} placeholder="e.g. EGP, USD" className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('الرمز (Symbol)', 'Symbol')}</label>
              <input type="text" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} placeholder="e.g. ج.م, $" className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('عدد الفواصل العشرية (Decimals)', 'Decimals')}</label>
            <input type="number" min={0} max={4} value={formData.decimals} onChange={(e) => setFormData({ ...formData, decimals: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input type="checkbox" checked={formData.is_base} onChange={(e) => setFormData({ ...formData, is_base: e.target.checked })} className="w-4 h-4 rounded text-indigo-600 border-slate-300" />
            <span className="text-xs font-bold text-amber-700">{t('تعيين كعملة أساسية للنظام (Base Currency)', 'Set as System Base Currency')}</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">{t('إلغاء', 'Cancel')}</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">{t('حفظ العملة', 'Save Currency')}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleteTargetId)} onClose={() => setDeleteTargetId(null)} onConfirm={handleConfirmDelete} title={t('تأكيد حذف العملة', 'Confirm Currency Deletion')} message={t('هل أنت متأكد من رغبتك في حذف هذه العملة؟ لا يمكن حذف العملة الأساسية.', 'Are you sure you want to delete this currency?')} />
    </div>
  );
};
