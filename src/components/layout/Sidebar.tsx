import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  Warehouse,
  Users,
  ShieldCheck,
  Coins,
  Sliders,
  Settings,
  FileText,
  Database,
  CheckCheck,
  X,
  Layers,
} from 'lucide-react';
import { ScreenCode, ScreenCodes, APP_SCREENS } from '../../types/permissions';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SettingsService } from '../../services/settingsService';

interface SidebarProps {
  currentScreen: ScreenCode;
  onNavigate: (screen: ScreenCode) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard,
  GitBranch,
  Warehouse,
  Users,
  ShieldCheck,
  Coins,
  Sliders,
  Settings,
  FileText,
  Database,
  CheckCheck,
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();
  const settings = SettingsService.get();

  // Filter allowed screens based on server-evaluated RBAC
  const visibleScreens = APP_SCREENS.filter((screen) => {
    if (screen.superAdminOnly && !user?.is_super_admin) {
      return false;
    }
    return hasPermission(screen.code, 'BTN_VIEW');
  });

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-700 border-e border-slate-200/80">
      {/* Brand Header - Full company name without ellipsis */}
      <div className="min-h-16 py-3.5 px-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-start gap-3 w-full">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs shrink-0 mt-0.5">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pe-1">
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
              {settings.company_name}
            </h1>
            <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
              {t('منظومة ERP السحابية المتكاملة', 'Cloud ERP Platform')}
            </p>
          </div>
        </div>

        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List - Calming light colors */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {t('الشاشات والوحدات', 'Modules & Screens')}
        </div>

        {visibleScreens.map((screen) => {
          const IconComponent = ICON_MAP[screen.icon] || LayoutDashboard;
          const isActive = currentScreen === screen.code;

          return (
            <button
              key={screen.code}
              onClick={() => {
                onNavigate(screen.code);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-start group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100/70'
              }`}
            >
              <IconComponent
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                }`}
              />
              <span className="truncate flex-1">{t(screen.name_ar, screen.name_en)}</span>
              {screen.superAdminOnly && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  Super
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Footer info */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>{t('إصدار المنظومة', 'System Version')}</span>
          <span className="font-mono text-slate-600 font-medium">v2.2-cloud</span>
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px]">
          <span>{t('حالة الاتصال', 'Status')}</span>
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {t('متصل ونشط', 'Active')}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar with light styling */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 start-0 w-80 max-w-[85vw] shadow-2xl z-10 animate-in slide-in-from-start duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
