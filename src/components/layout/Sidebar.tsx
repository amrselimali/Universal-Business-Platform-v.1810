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
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-[170px]">
              {settings.company_name}
            </h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-wider">
              {t('منظومة ERP السحابية', 'Cloud ERP Platform')}
            </p>
          </div>
        </div>

        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <IconComponent
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                }`}
              />
              <span className="truncate flex-1">{t(screen.name_ar, screen.name_en)}</span>
              {screen.superAdminOnly && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Super
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Footer info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>{t('إصدار النظام', 'Version')}</span>
          <span className="font-mono text-slate-400">v2.2-cloud</span>
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px]">
          <span>{t('المستخدمين المتزامنين', 'Capacity')}</span>
          <span className="text-emerald-400 font-medium">100 {t('مستخدم متزامن', 'concurrent')}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 border-e border-slate-800 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 start-0 w-72 max-w-[85vw] shadow-2xl z-10 animate-in slide-in-from-start duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
