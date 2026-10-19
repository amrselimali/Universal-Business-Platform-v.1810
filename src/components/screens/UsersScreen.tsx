import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Unlock, Key, Shield, Check, X, Users as UsersIcon, ShieldAlert } from 'lucide-react';
import { User, Branch, Warehouse, Role } from '../../types/entities';
import { ScreenCodes, ActionCodes } from '../../types/permissions';
import { UserService } from '../../services/userService';
import { BranchService } from '../../services/branchService';
import { WarehouseService } from '../../services/warehouseService';
import { RoleService } from '../../services/roleService';
import { AuthService } from '../../services/authService';
import { DataTable, Column } from '../common/DataTable';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UserPermissionsModal } from './UserPermissionsModal';
import { UserFormModal } from './UserFormModal';
import { UserResetPasswordModal } from './UserResetPasswordModal';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';

export const UsersScreen: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError, showInfo } = useNotification();

  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof User>('username');
  const [sortAsc, setSortAsc] = useState(true);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // User form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    language: 'ar' as 'ar' | 'en',
    is_admin: false,
    branchSelections: [] as { branchId: string; isDefault: boolean }[],
    warehouseIds: [] as string[],
    roleIds: [] as string[],
  });

  const [permTargetUser, setPermTargetUser] = useState<User | null>(null);
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [pageSize, setPageSize] = useState(25);

  const loadData = () => {
    if (!currentUser) return;
    const res = UserService.getPaginated(currentUser, page, pageSize, search, sortBy, sortAsc);
    setUsers(res.items);
    setTotalCount(res.totalCount);
    setBranches(BranchService.getAll());
    setWarehouses(WarehouseService.getAll());
    setRoles(RoleService.getAll());
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, search, sortBy, sortAsc, currentUser]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '', username: '', password: '', language: 'ar', is_admin: false,
      branchSelections: branches[0] ? [{ branchId: branches[0].id, isDefault: true }] : [],
      warehouseIds: [], roleIds: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (target: User) => {
    setEditingUser(target);
    setFormData({
      name: target.name || '', username: target.username, password: '', language: target.language, is_admin: target.is_admin,
      branchSelections: UserService.getUserBranches(target.id).map((ub) => ({ branchId: ub.branch_id, isDefault: ub.is_default })),
      warehouseIds: UserService.getUserWarehouses(target.id),
      roleIds: UserService.getUserRoles(target.id),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!formData.is_admin && formData.branchSelections.length === 0) {
      showError(t('خطأ في الفروع', 'Branch Error'), t('يجب تحديد فرع واحد على الأقل للمستخدم العادي', 'Standard user must have at least one branch'));
      return;
    }

    try {
      if (editingUser) {
        UserService.update(
          { ...editingUser, name: formData.name, username: formData.username, language: formData.language, is_admin: formData.is_admin },
          formData.branchSelections,
          formData.warehouseIds,
          formData.roleIds,
          currentUser
        );
        showSuccess(t('تم تحديث بيانات المستخدم بنجاح', 'User updated successfully'));
      } else {
        if (!formData.password) {
          showError(t('كلمة المرور مطلوبة', 'Password required'));
          return;
        }
        UserService.create(
          {
            name: formData.name,
            username: formData.username,
            password: formData.password,
            language: formData.language,
            is_admin: formData.is_admin,
            branchIds: formData.branchSelections,
            warehouseIds: formData.warehouseIds,
            roleIds: formData.roleIds,
          },
          currentUser
        );
        showSuccess(t('تم إنشاء المستخدم بنجاح', 'User created successfully'));
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(t('تعذر حفظ المستخدم', 'Failed to save user'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message, err.traceId);
    }
  };

  const handleUnlock = (target: User) => {
    if (!currentUser) return;
    try {
      AuthService.unlockAccount(target.id, currentUser);
      showSuccess(t('تم فك قفل الحساب بنجاح', 'Account unlocked successfully'));
      loadData();
    } catch (err: any) {
      showError(t('خطأ أثناء فك القفل', 'Unlock failed'), err.message);
    }
  };

  const handleResetPassword = () => {
    if (!resetTargetUser || !currentUser) return;
    try {
      AuthService.resetPassword(resetTargetUser.id, newPassword, currentUser);
      showSuccess(t('تم إعادة تعيين كلمة المرور بنجاح', 'Password reset successfully'));
      setResetTargetUser(null);
      setNewPassword('');
    } catch (err: any) {
      showError(t('خطأ في تعيين كلمة المرور', 'Password reset failed'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId || !currentUser) return;
    try {
      const result = UserService.deleteOrDeactivate(deleteTargetId, currentUser);
      if (result.actionTaken === 'DEACTIVATED') {
        showInfo(t('تم تعطيل المستخدم بدلاً من الحذف', 'User Deactivated'), t('لوجود حركات وسجلات سابقة للمستخدم، تم تعطيله حفاظاً على سلامة البيانات.', 'Safely deactivated due to existing audit logs.'));
      } else {
        showSuccess(t('تم حذف المستخدم نهائياً', 'User permanently deleted'));
      }
      setDeleteTargetId(null);
      loadData();
    } catch (err: any) {
      showError(t('خطأ أثناء الحذف', 'Delete failed'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message);
    }
  };

  const columns: Column<User>[] = [
    { key: 'username', header_ar: 'اسم المستخدم', header_en: 'Username', sortable: true, width: '130px', render: (u) => <span className="font-mono font-bold text-slate-800">@{u.username}</span> },
    { key: 'name', header_ar: 'الاسم الكامل', header_en: 'Full Name', sortable: true, render: (u) => <span>{u.name || '—'}</span> },
    {
      key: 'type',
      header_ar: 'النوع والصلاحية',
      header_en: 'Role / Type',
      render: (u) => (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${u.is_super_admin ? 'bg-amber-100 text-amber-800 border border-amber-300' : u.is_admin ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-600'}`}>
          {u.is_super_admin ? 'Super Admin' : u.is_admin ? 'Admin' : 'Standard'}
        </span>
      ),
    },
    {
      key: 'lock_status',
      header_ar: 'حالة الحساب',
      header_en: 'Account State',
      render: (u) => {
        const isLocked = u.locked_until && new Date(u.locked_until) > new Date();
        return isLocked ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <ShieldAlert className="w-3 h-3" /><span>{t('مقفل مؤقتاً', 'Locked')}</span>
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
            {u.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>{t(u.is_active ? 'نشط' : 'معطل', u.is_active ? 'Active' : 'Inactive')}</span>
          </span>
        );
      },
    },
    { key: 'version', header_ar: 'الإصدار', header_en: 'Version', width: '80px', render: (u) => <span className="font-mono text-xs text-slate-400">v{u.version}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-indigo-600" />
            <span>{t('إدارة المستخدمين والصلاحيات', 'Users Management')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('إدارة حسابات الموظفين، ربط الفروع والمستودعات، والتحكم بالصلاحيات الدقيقة', 'Manage user accounts, branch-warehouse linkages, and permissions')}</p>
        </div>

        {hasPermission(ScreenCodes.USERS_MANAGEMENT, ActionCodes.ADD) && (
          <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all">
            <Plus className="w-4 h-4" />
            <span>{t('إضافة مستخدم جديد', 'Add User')}</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={users}
        totalCount={totalCount}
        currentPage={page}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(1); }}
        onPageChange={setPage}
        searchQuery={search}
        onSearchChange={(q) => { setSearch(q); setPage(1); }}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onSortChange={(k) => {
          if (sortBy === k) setSortAsc(!sortAsc);
          else { setSortBy(k as keyof User); setSortAsc(true); }
        }}
        onRefresh={loadData}
        renderActions={(target) => {
          const isLocked = (target.locked_until && new Date(target.locked_until) > new Date()) || target.failed_attempts > 0;
          return (
            <div className="flex items-center justify-end gap-1">
              {isLocked && hasPermission(ScreenCodes.USERS_MANAGEMENT, ActionCodes.UNLOCK) && (
                <button onClick={() => handleUnlock(target)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title={t('فك قفل الحساب', 'Unlock Account')}>
                  <Unlock className="w-3.5 h-3.5" />
                </button>
              )}
              {hasPermission(ScreenCodes.USERS_MANAGEMENT, ActionCodes.RESET_PASSWORD) && (
                <button onClick={() => { setResetTargetUser(target); setNewPassword(''); }} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg" title={t('إعادة تعيين كلمة المرور', 'Reset Password')}>
                  <Key className="w-3.5 h-3.5" />
                </button>
              )}
              {hasPermission(ScreenCodes.USERS_MANAGEMENT, ActionCodes.EDIT) && (
                <button onClick={() => setPermTargetUser(target)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg" title={t('تعديل مصفوفة الصلاحيات', 'Permissions')}>
                  <Shield className="w-3.5 h-3.5" />
                </button>
              )}
              {hasPermission(ScreenCodes.USERS_MANAGEMENT, ActionCodes.EDIT) && (
                <button onClick={() => handleOpenEdit(target)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg" title={t('تعديل', 'Edit')}>
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {hasPermission(ScreenCodes.USERS_MANAGEMENT, ActionCodes.DELETE) && !target.is_super_admin && (
                <button onClick={() => setDeleteTargetId(target.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title={t('حذف/تعطيل', 'Delete/Deactivate')}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        }}
      />

      {/* User Form Modal (Modular sub-component under 300 lines) */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingUser={editingUser}
        formData={formData}
        setFormData={setFormData}
        branches={branches}
        warehouses={warehouses}
        roles={roles}
      />

      {/* Permissions Matrix Modal */}
      <UserPermissionsModal isOpen={Boolean(permTargetUser)} onClose={() => setPermTargetUser(null)} targetUser={permTargetUser} />

      {/* Reset Password Modal */}
      <UserResetPasswordModal
        user={resetTargetUser}
        newPassword={newPassword}
        onPasswordChange={setNewPassword}
        onClose={() => setResetTargetUser(null)}
        onSubmit={handleResetPassword}
      />

      <ConfirmDialog isOpen={Boolean(deleteTargetId)} onClose={() => setDeleteTargetId(null)} onConfirm={handleConfirmDelete} title={t('تأكيد حذف أو تعطيل المستخدم', 'Confirm User Removal')} message={t('هل أنت متأكد من رغبتك في حذف هذا الحساب؟ إذا كان للمستخدم أي سجلات أو عمليات سابقة فسيتم تحويل الإجراء إلى تعطيل الحساب لحفظ السجلات.', 'Are you sure you want to remove this user? It will be safely deactivated if records exist.')} />
    </div>
  );
};
