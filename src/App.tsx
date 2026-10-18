import React, { useState } from 'react';
import { ScreenCode, ScreenCodes } from './types/permissions';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginScreen } from './components/screens/LoginScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { BranchesScreen } from './components/screens/BranchesScreen';
import { WarehousesScreen } from './components/screens/WarehousesScreen';
import { UsersScreen } from './components/screens/UsersScreen';
import { RolesScreen } from './components/screens/RolesScreen';
import { CurrenciesScreen } from './components/screens/CurrenciesScreen';
import { CustomFieldsScreen } from './components/screens/CustomFieldsScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { AuditLogScreen } from './components/screens/AuditLogScreen';
import { DatabaseScreen } from './components/screens/DatabaseScreen';
import { QaControlCenterScreen } from './components/screens/QaControlCenterScreen';
import { ForbiddenScreen } from './components/screens/ForbiddenScreen';
import { ChangePasswordModal } from './components/screens/ChangePasswordModal';

const MainShell: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenCode>(ScreenCodes.DASHBOARD);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  if (!user) {
    return <LoginScreen />;
  }

  // Security gate: Verify screen view permission
  const canViewCurrentScreen =
    currentScreen === ScreenCodes.DASHBOARD ||
    (currentScreen === ScreenCodes.DB_MANAGEMENT
      ? user.is_super_admin
      : hasPermission(currentScreen, 'BTN_VIEW'));

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex antialiased">
      {/* Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {!canViewCurrentScreen ? (
            <ForbiddenScreen onBackToDashboard={() => setCurrentScreen(ScreenCodes.DASHBOARD)} />
          ) : (
            <>
              {currentScreen === ScreenCodes.DASHBOARD && (
                <DashboardScreen onNavigate={(screen) => setCurrentScreen(screen)} />
              )}
              {currentScreen === ScreenCodes.BRANCHES_MANAGEMENT && <BranchesScreen />}
              {currentScreen === ScreenCodes.WAREHOUSES_MANAGEMENT && <WarehousesScreen />}
              {currentScreen === ScreenCodes.USERS_MANAGEMENT && <UsersScreen />}
              {currentScreen === ScreenCodes.ROLES_MANAGEMENT && <RolesScreen />}
              {currentScreen === ScreenCodes.CURRENCIES_MANAGEMENT && <CurrenciesScreen />}
              {currentScreen === ScreenCodes.CUSTOM_FIELDS_MANAGEMENT && <CustomFieldsScreen />}
              {currentScreen === ScreenCodes.APP_SETTINGS && <SettingsScreen />}
              {currentScreen === ScreenCodes.AUDIT_LOG_VIEW && <AuditLogScreen />}
              {currentScreen === ScreenCodes.DB_MANAGEMENT && <DatabaseScreen />}
              {currentScreen === ScreenCodes.QA_CONTROL_CENTER && <QaControlCenterScreen />}
            </>
          )}
        </main>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider>
          <MainShell />
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
}
