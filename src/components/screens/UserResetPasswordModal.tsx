import React from 'react';
import { User } from '../../types/entities';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';

interface UserResetPasswordModalProps {
  user: User | null;
  newPassword: string;
  onPasswordChange: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const UserResetPasswordModal: React.FC<UserResetPasswordModalProps> = ({
  user,
  newPassword,
  onPasswordChange,
  onClose,
  onSubmit,
}) => {
  const { t } = useLanguage();
  if (!user) return null;

  return (
    <Modal
      isOpen={Boolean(user)}
      onClose={onClose}
      title={`${t('إعادة تعيين كلمة المرور لـ:', 'Reset Password for:')} ${user.username}`}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t('كلمة المرور الجديدة', 'New Password')}
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {t('إلغاء', 'Cancel')}
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
          >
            {t('تعيين كلمة المرور', 'Set Password')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
