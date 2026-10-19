import React, { useState, useEffect } from 'react';
import { Shield, Copy, CheckSquare, Square, Info } from 'lucide-react';
import { User, UserPermission } from '../../types/entities';
import { APP_SCREENS } from '../../types/permissions';
import { UserService } from '../../services/userService';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { dbEngine } from '../../db/databaseEngine';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  onClose,
  targetUser,
}) => {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();

  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [copySourceUserId, setCopySourceUserId] = useState('');

  useEffect(() => {
    if (targetUser) {
      setPermissions(UserService.getUserPermissions(targetUser.id));
      const usersList = dbEngine.getState().users.filter((u) => u.id !== targetUser.id && !u.is_super_admin);
      setAllUsers(usersList);
    }
  }, [targetUser, isOpen]);

  if (!targetUser) return null;

  const handleToggleAction = (screenCode: string, actionCode: string) => {
    setPermissions((prev) => {
      const existing = prev.find((p) => p.screen_code === screenCode && p.action_code === actionCode);
      if (existing) {
        if (existing.is_allowed) {
          // Switch to explicitly denied
          return prev.map((p) =>
            p.screen_code === screenCode && p.action_code === actionCode
              ? { ...p, is_allowed: false }
              : p
          );
        } else {
          // Remove override altogether (revert to role/deny)
          return prev.filter((p) => !(p.screen_code === screenCode && p.action_code === actionCode));
        }
      } else {
        // Add explicit allow with scope 1 (my branches default)
        return [
          ...prev,
          {
            id: `temp-${Date.now()}-${Math.random()}`,
            user_id: targetUser.id,
            screen_code: screenCode,
            action_code: actionCode,
            is_allowed: true,
            scope: 1,
          },
        ];
      }
    });
  };

  const handleScopeChange = (screenCode: string, actionCode: string, scope: 0 | 1 | 2) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.screen_code === screenCode && p.action_code === actionCode ? { ...p, scope } : p
      )
    );
  };

  const handleSelectAllForScreen = (screenCode: string, allow: boolean) => {
    const screenMeta = APP_SCREENS.find((s) => s.code === screenCode);
    if (!screenMeta) return;

    setPermissions((prev) => {
      const filtered = prev.filter((p) => p.screen_code !== screenCode);
      const newPerms = screenMeta.actions.map((act) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        user_id: targetUser.id,
        screen_code: screenCode,
        action_code: act.code,
        is_allowed: allow,
        scope: 1 as const,
      }));
      return [...filtered, ...newPerms];
    });
  };

  const handleCopyPermissions = () => {
    if (!copySourceUserId || !currentUser) return;
    try {
      UserService.copyPermissions(copySourceUserId, targetUser.id, currentUser);
      setPermissions(UserService.getUserPermissions(targetUser.id));
      showSuccess(t('تم نسخ الصلاحيات بنجاح', 'Permissions copied successfully'));
    } catch (err: any) {
      showError(t('خطأ في النسخ', 'Copy failed'), err.message);
    }
  };

  const handleSave = () => {
    if (!currentUser) return;
    try {
      UserService.saveUserPermissions(targetUser.id, permissions, currentUser);
      showSuccess(t('تم حفظ الصلاحيات المخصصة بنجاح', 'User permissions saved successfully'));
      onClose();
    } catch (err: any) {
      showError(t('خطأ أثناء الحفظ', 'Save failed'), err.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('صلاحيات المستخدم المخصصة:', 'Custom Permissions for:')} ${targetUser.name || targetUser.username}`}
      subtitle={t('تحديد الصلاحيات الفردية وتعيين نطاق الوصول لكل شاشة وإجراء', 'Configure individual permissions and access scope')}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Copy from User Toolbar */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Copy className="w-4 h-4 text-indigo-600" />
            <span>{t('نسخ الصلاحيات من مستخدم آخر:', 'Copy permissions from another user:')}</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={copySourceUserId}
              onChange={(e) => setCopySourceUserId(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">{t('— اختر مستخدم المصدر —', '— Select Source User —')}</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.username} (@{u.username})
                </option>
              ))}
            </select>
            <button
              onClick={handleCopyPermissions}
              disabled={!copySourceUserId}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-all"
            >
              {t('نسخ الآن', 'Copy Now')}
            </button>
          </div>
        </div>

        {/* Screen Permissions List */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pe-1">
          {APP_SCREENS.map((screen) => {
            return (
              <div
                key={screen.code}
                className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t(screen.name_ar, screen.name_en)}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectAllForScreen(screen.code, true)}
                      className="px-2 py-0.5 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      {t('تحديد الكل (سماح)', 'Allow All')}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllForScreen(screen.code, false)}
                      className="px-2 py-0.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50 rounded"
                    >
                      {t('منع الكل', 'Deny All')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {screen.actions.map((act) => {
                    const override = permissions.find(
                      (p) => p.screen_code === screen.code && p.action_code === act.code
                    );

                    const isAllowed = override ? override.is_allowed : false;
                    const isOverridden = Boolean(override);

                    return (
                      <div
                        key={act.code}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                          isOverridden
                            ? isAllowed
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : 'bg-rose-50/60 border-rose-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div
                          onClick={() => handleToggleAction(screen.code, act.code)}
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          {isOverridden ? (
                            isAllowed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-rose-600 shrink-0" />
                            )
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <span className="font-medium text-slate-700">
                            {t(act.label_ar, act.label_en)}
                          </span>
                        </div>

                        {isOverridden && isAllowed && (
                          <select
                            value={override?.scope ?? 1}
                            onChange={(e) =>
                              handleScopeChange(
                                screen.code,
                                act.code,
                                Number(e.target.value) as 0 | 1 | 2
                              )
                            }
                            className="text-[11px] px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-700"
                          >
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
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {t('إلغاء', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
          >
            {t('حفظ مصفوفة الصلاحيات', 'Save Permissions Matrix')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
