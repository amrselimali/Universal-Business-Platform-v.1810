import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, Shield, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { Role, RolePermission } from '../../types/entities';
import { ScreenCodes, ActionCodes, APP_SCREENS } from '../../types/permissions';
import { RoleService } from '../../services/roleService';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';

export const RolesScreen: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();

  const [roles, setRoles] = useState<Role[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name_ar: '',
    name_en: '',
    is_active: true,
    permissions: [] as Omit<RolePermission, 'id' | 'role_id'>[],
  });

  const [copyTargetRole, setCopyTargetRole] = useState<Role | null>(null);
  const [copyData, setCopyData] = useState({ code: '', name_ar: '' });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadRoles = () => {
    setRoles(RoleService.getAll());
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleOpenAdd = () => {
    setEditingRole(null);
    setFormData({
      code: `ROLE_0${roles.length + 1}`,
      name_ar: '',
      name_en: '',
      is_active: true,
      permissions: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    const perms = RoleService.getPermissionsForRole(role.id).map((p) => ({
      screen_code: p.screen_code,
      action_code: p.action_code,
      is_allowed: p.is_allowed,
      scope: p.scope,
    }));
    setFormData({
      code: role.code,
      name_ar: role.name_ar,
      name_en: role.name_en || '',
      is_active: role.is_active,
      permissions: perms,
    });
    setIsModalOpen(true);
  };

  const handleToggleAction = (screenCode: string, actionCode: string) => {
    setFormData((prev) => {
      const existing = prev.permissions.find((p) => p.screen_code === screenCode && p.action_code === actionCode);
      if (existing) {
        return {
          ...prev,
          permissions: prev.permissions.filter((p) => !(p.screen_code === screenCode && p.action_code === actionCode)),
        };
      } else {
        return {
          ...prev,
          permissions: [
            ...prev.permissions,
            { screen_code: screenCode, action_code: actionCode, is_allowed: true, scope: 1 },
          ],
        };
      }
    });
  };

  const handleScopeChange = (screenCode: string, actionCode: string, scope: 0 | 1 | 2) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) =>
        p.screen_code === screenCode && p.action_code === actionCode ? { ...p, scope } : p
      ),
    }));
  };

  const handleSelectAllForScreen = (screenCode: string, allow: boolean) => {
    const screenMeta = APP_SCREENS.find((s) => s.code === screenCode);
    if (!screenMeta) return;

    setFormData((prev) => {
      const filtered = prev.permissions.filter((p) => p.screen_code !== screenCode);
      if (!allow) return { ...prev, permissions: filtered };
      const newPerms = screenMeta.actions.map((act) => ({
        screen_code: screenCode,
        action_code: act.code,
        is_allowed: true,
        scope: 1 as const,
      }));
      return { ...prev, permissions: [...filtered, ...newPerms] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingRole) {
        RoleService.update({ ...editingRole, ...formData, name_en: formData.name_en || null }, formData.permissions, user.id);
        showSuccess(t('تم تعديل الدور وصلاحياته بنجاح', 'Role updated successfully'));
      } else {
        RoleService.create({ ...formData, name_en: formData.name_en }, user.id);
        showSuccess(t('تم إنشاء الدور بنجاح', 'Role created successfully'));
      }
      setIsModalOpen(false);
      loadRoles();
    } catch (err: any) {
      showError(t('تعذر حفظ الدور', 'Failed to save role'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message, err.traceId);
    }
  };

  const handleCopyRole = () => {
    if (!copyTargetRole || !user || !copyData.code || !copyData.name_ar) return;
    try {
      RoleService.copyRole(copyTargetRole.id, copyData.code, copyData.name_ar, user.id);
      showSuccess(t('تم استنساخ الدور بنجاح', 'Role cloned successfully'));
      setCopyTargetRole(null);
      loadRoles();
    } catch (err: any) {
      showError(t('خطأ أثناء نسخ الدور', 'Copy role failed'), err.message);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId || !user) return;
    try {
      RoleService.delete(deleteTargetId, user.id);
      showSuccess(t('تم حذف الدور بنجاح', 'Role deleted successfully'));
      setDeleteTargetId(null);
      loadRoles();
    } catch (err: any) {
      showError(t('خطأ أثناء حذف الدور', 'Delete failed'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message);
    }
  };

  const columns: Column<Role>[] = [
    { key: 'code', header_ar: 'كود الدور', header_en: 'Code', sortable: true, width: '150px', render: (r) => <span className="font-mono font-bold text-slate-800">{r.code}</span> },
    { key: 'name_ar', header_ar: 'الاسم (عربي)', header_en: 'Name (AR)', sortable: true },
    { key: 'name_en', header_ar: 'الاسم (EN)', header_en: 'Name (EN)', sortable: true },
    {
      key: 'perms_count',
      header_ar: 'عدد الصلاحيات الممنوحة',
      header_en: 'Granted Permissions',
      render: (r) => {
        const count = RoleService.getPermissionsForRole(r.id).filter((p) => p.is_allowed).length;
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">{count} {t('صلاحية', 'actions')}</span>;
      },
    },
    { key: 'version', header_ar: 'الإصدار', header_en: 'Version', width: '80px', render: (r) => <span className="font-mono text-xs text-slate-400">v{r.version}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>{t('إدارة الأدوار والصلاحيات (Roles & RBAC)', 'Roles & Permissions')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('تعريف الأدوار الوظيفية، تحديد مصفوفة الصلاحيات ونطاق الوصول لكل شاشة وزرار', 'Define functional roles and action scopes')}</p>
        </div>

        {hasPermission(ScreenCodes.ROLES_MANAGEMENT, ActionCodes.ADD) && (
          <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all">
            <Plus className="w-4 h-4" />
            <span>{t('إضافة دور جديد', 'Add Role')}</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={roles}
        totalCount={roles.length}
        currentPage={1}
        pageSize={25}
        onPageChange={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        onRefresh={loadRoles}
        renderActions={(role) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => { setCopyTargetRole(role); setCopyData({ code: `${role.code}_COPY`, name_ar: `${role.name_ar} (نسخة)` }); }} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg" title={t('نسخ الدور', 'Clone Role')}>
              <Copy className="w-3.5 h-3.5" />
            </button>
            {hasPermission(ScreenCodes.ROLES_MANAGEMENT, ActionCodes.EDIT) && (
              <button onClick={() => handleOpenEdit(role)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg" title={t('تعديل', 'Edit')}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {hasPermission(ScreenCodes.ROLES_MANAGEMENT, ActionCodes.DELETE) && (
              <button onClick={() => setDeleteTargetId(role.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title={t('حذف', 'Delete')}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      />

      {/* Add / Edit Role Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole ? t('تعديل بيانات الدور ومصفوفة صلاحياته', 'Edit Role & Permissions') : t('إضافة دور جديد', 'Add New Role')} maxWidth="3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('مصفوفة الصلاحيات ونطاق الوصول (سجلاتي 0 / فروعي 1 / الكل 2)', 'Permissions & Scope Matrix')}</h4>
            {APP_SCREENS.map((screen) => (
              <div key={screen.code} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t(screen.name_ar, screen.name_en)}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => handleSelectAllForScreen(screen.code, true)} className="px-2 py-0.5 text-[11px] font-medium text-indigo-600 hover:bg-white rounded">{t('تحديد الكل', 'Select All')}</button>
                    <span className="text-slate-300">|</span>
                    <button type="button" onClick={() => handleSelectAllForScreen(screen.code, false)} className="px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-white rounded">{t('إلغاء الكل', 'Deselect')}</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {screen.actions.map((act) => {
                    const perm = formData.permissions.find((p) => p.screen_code === screen.code && p.action_code === act.code);
                    const isChecked = Boolean(perm?.is_allowed);

                    return (
                      <div key={act.code} className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${isChecked ? 'bg-indigo-50/60 border-indigo-200' : 'bg-white border-slate-200'}`}>
                        <div onClick={() => handleToggleAction(screen.code, act.code)} className="flex items-center gap-2 cursor-pointer flex-1">
                          {isChecked ? <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-300 shrink-0" />}
                          <span className="font-medium text-slate-700">{t(act.label_ar, act.label_en)}</span>
                        </div>

                        {isChecked && (
                          <select value={perm?.scope ?? 1} onChange={(e) => handleScopeChange(screen.code, act.code, Number(e.target.value) as 0 | 1 | 2)} className="text-[11px] px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-700">
                            <option value={0}>{t('سجلاتي (0)', 'My (0)')}</option>
                            <option value={1}>{t('فروعي (1)', 'Branch (1)')}</option>
                            <option value={2}>{t('الكل (2)', 'All (2)')}</option>
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
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">{t('إلغاء', 'Cancel')}</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">{t('حفظ الدور', 'Save Role')}</button>
          </div>
        </form>
      </Modal>

      {/* Copy Role Modal */}
      <Modal isOpen={Boolean(copyTargetRole)} onClose={() => setCopyTargetRole(null)} title={`${t('استنساخ الدور:', 'Clone Role:')} ${copyTargetRole?.name_ar}`} maxWidth="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('كود الدور الجديد', 'New Role Code')} *</label>
            <input type="text" value={copyData.code} onChange={(e) => setCopyData({ ...copyData, code: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('اسم الدور الجديد', 'New Role Name')} *</label>
            <input type="text" value={copyData.name_ar} onChange={(e) => setCopyData({ ...copyData, name_ar: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setCopyTargetRole(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">{t('إلغاء', 'Cancel')}</button>
            <button onClick={handleCopyRole} className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">{t('تأكيد الاستنساخ', 'Clone Now')}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleteTargetId)} onClose={() => setDeleteTargetId(null)} onConfirm={handleConfirmDelete} title={t('تأكيد حذف الدور', 'Confirm Role Deletion')} message={t('هل أنت متأكد من رغبتك في حذف هذا الدور؟ لن يمكن حذفه إذا كان هناك مستخدمين مرتبطين به.', 'Are you sure you want to delete this role? It cannot be deleted if assigned to users.')} />
    </div>
  );
};
