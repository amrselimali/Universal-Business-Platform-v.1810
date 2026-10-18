import React, { useState, useEffect } from 'react';
import {
  Building2,
  Globe,
  Clock,
  User as UserIcon,
  LogOut,
  Key,
  Menu,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SettingsService } from '../../services/settingsService';
import { formatCairoDateTime } from '../../utils/datetime';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenChangePassword: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenChangePassword }) => {
  const { user, currentBranch, userBranches, switchBranch, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [cairoTime, setCairoTime] = useState<string>(formatCairoDateTime(new Date().toISOString()));
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);

  const settings = SettingsService.get();

  useEffect(() => {
    const timer = setInterval(() => {
      setCairoTime(formatCairoDateTime(new Date().toISOString()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 flex items-center justify-between gap-4">
      {/* Left / Start: Mobile Menu Toggle & Branch Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          title={t('القائمة', 'Menu')}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Branch Switcher */}
        {userBranches.length > 1 ? (
          <div className="relative">
            <button
              onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate max-w-[160px] sm:max-w-[220px]">
                {currentBranch
                  ? t(currentBranch.name_ar, currentBranch.name_en || currentBranch.name_ar)
                  : t('كافة الفروع', 'All Branches')}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 ms-1" />
            </button>

            {isBranchMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsBranchMenuOpen(false)}
                />
                <div className="absolute start-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-100">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                    {t('التبديل بين الفروع المتاحة', 'Switch Branch')}
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {userBranches.map((branch) => {
                      const isSelected = currentBranch?.id === branch.id;
                      return (
                        <button
                          key={branch.id}
                          onClick={() => {
                            switchBranch(branch.id);
                            setIsBranchMenuOpen(false);
                          }}
                          className={`w-full text-start px-3 py-2 text-xs flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-indigo-50/70 text-indigo-600 font-bold' : 'text-slate-700'
                          }`}
                        >
                          <span className="truncate">
                            {t(branch.name_ar, branch.name_en || branch.name_ar)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                            {branch.code}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100/60 px-3 py-1.5 rounded-xl border border-slate-200/60">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {currentBranch
                ? t(currentBranch.name_ar, currentBranch.name_en || currentBranch.name_ar)
                : user?.is_admin
                ? t('مسؤول النظام (الكل)', 'Administrator (Global)')
                : t('بدون فرع', 'No branch')}
            </span>
          </div>
        )}
      </div>

      {/* Right / End: Cairo Time, Language Switcher, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cairo Time Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-mono text-slate-600">
          <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span title={t('توقيت القاهرة (UTC+2/UTC+3)', 'Cairo Time')}>
            {cairoTime}
          </span>
        </div>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all"
          title={t('تبديل اللغة', 'Switch Language')}
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{language === 'ar' ? 'English' : 'عربي'}</span>
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-start"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || user?.username}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                {user?.is_super_admin ? (
                  <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                    <Shield className="w-2.5 h-2.5" /> Super Admin
                  </span>
                ) : user?.is_admin ? (
                  <span className="text-indigo-600 font-semibold">Admin</span>
                ) : (
                  <span>@{user?.username}</span>
                )}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 ms-0.5" />
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
              <div className="absolute end-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-100">
                <div className="px-4 py-2.5">
                  <p className="text-xs font-bold text-slate-800">{user?.name || user?.username}</p>
                  <p className="text-[11px] text-slate-400 font-mono">@{user?.username}</p>
                  <div className="mt-1">
                    {user?.is_super_admin ? (
                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Super Administrator
                      </span>
                    ) : user?.is_admin ? (
                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        System Admin
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-600">
                        Standard User
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenChangePassword();
                    }}
                    className="w-full text-start px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('تغيير كلمة المرور', 'Change Password')}</span>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-start px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('تسجيل الخروج', 'Sign Out')}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
