import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Branch } from '../types/entities';
import { ScreenCode, ActionCode } from '../types/permissions';
import { dbEngine } from '../db/databaseEngine';
import { AuthService } from '../services/authService';
import { PermissionService, PermissionCheckResult } from '../services/permissionService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  currentBranch: Branch | null;
  userBranches: Branch[];
  login: (username: string, pass: string) => void;
  logout: () => void;
  switchBranch: (branchId: string) => void;
  hasPermission: (screenCode: ScreenCode | string, actionCode: ActionCode | string) => boolean;
  getPermissionDetails: (screenCode: ScreenCode | string, actionCode: ActionCode | string) => PermissionCheckResult;
  refreshUserState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ubp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ubp_token'));
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(() => {
    try {
      const saved = localStorage.getItem('ubp_curr_branch');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userBranches, setUserBranches] = useState<Branch[]>([]);

  // Load user branches
  const resolveUserBranches = useCallback((targetUser: User): { branches: Branch[]; defaultBranch: Branch | null } => {
    const state = dbEngine.getState();
    if (targetUser.is_admin) {
      // Admins have access to all active branches
      const allActive = state.branches.filter((b) => b.is_active);
      return { branches: allActive, defaultBranch: allActive[0] || null };
    }

    const assigned = state.user_branches.filter((ub) => ub.user_id === targetUser.id);
    const assignedIds = assigned.map((ub) => ub.branch_id);
    const branches = state.branches.filter((b) => assignedIds.includes(b.id) && b.is_active);

    const defaultLink = assigned.find((ub) => ub.is_default);
    const defaultBranch = branches.find((b) => b.id === defaultLink?.branch_id) || branches[0] || null;

    return { branches, defaultBranch };
  }, []);

  useEffect(() => {
    if (user) {
      const { branches, defaultBranch } = resolveUserBranches(user);
      setUserBranches(branches);
      if (!currentBranch || !branches.some((b) => b.id === currentBranch.id)) {
        setCurrentBranch(defaultBranch);
        if (defaultBranch) {
          localStorage.setItem('ubp_curr_branch', JSON.stringify(defaultBranch));
        } else {
          localStorage.removeItem('ubp_curr_branch');
        }
      }
    } else {
      setUserBranches([]);
      setCurrentBranch(null);
      localStorage.removeItem('ubp_curr_branch');
    }
  }, [user, resolveUserBranches]);

  // Session Timeout Detection
  useEffect(() => {
    if (!user) return;

    let timeoutId: any;
    const settings = dbEngine.getState().app_settings[0];
    const timeoutMs = (settings?.session_timeout_minutes || 30) * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
      }, timeoutMs);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [user]);

  const login = (usernameInput: string, passwordInput: string) => {
    const { user: authedUser, token: authToken } = AuthService.login(usernameInput, passwordInput);

    // Verify branch requirement
    const { branches, defaultBranch } = resolveUserBranches(authedUser);
    if (!authedUser.is_admin && branches.length === 0) {
      throw new Error('لا يوجد فروع مخصصة لهذا المستخدم. يرجى مراجعة مسؤول النظام.');
    }

    setUser(authedUser);
    setToken(authToken);
    setUserBranches(branches);
    setCurrentBranch(defaultBranch);

    localStorage.setItem('ubp_user', JSON.stringify(authedUser));
    localStorage.setItem('ubp_token', authToken);
    if (defaultBranch) {
      localStorage.setItem('ubp_curr_branch', JSON.stringify(defaultBranch));
    }
  };

  const logout = () => {
    if (user) {
      AuthService.logout(user);
    }
    setUser(null);
    setToken(null);
    setCurrentBranch(null);
    setUserBranches([]);
    localStorage.removeItem('ubp_user');
    localStorage.removeItem('ubp_token');
    localStorage.removeItem('ubp_curr_branch');
  };

  const switchBranch = (branchId: string) => {
    const target = userBranches.find((b) => b.id === branchId);
    if (target) {
      setCurrentBranch(target);
      localStorage.setItem('ubp_curr_branch', JSON.stringify(target));
    }
  };

  const hasPermission = (screenCode: ScreenCode | string, actionCode: ActionCode | string): boolean => {
    return PermissionService.checkPermission(user, screenCode, actionCode).allowed;
  };

  const getPermissionDetails = (
    screenCode: ScreenCode | string,
    actionCode: ActionCode | string
  ): PermissionCheckResult => {
    return PermissionService.checkPermission(user, screenCode, actionCode);
  };

  const refreshUserState = () => {
    if (!user) return;
    const freshUser = dbEngine.getState().users.find((u) => u.id === user.id);
    if (freshUser) {
      setUser({ ...freshUser });
      localStorage.setItem('ubp_user', JSON.stringify(freshUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        currentBranch,
        userBranches,
        login,
        logout,
        switchBranch,
        hasPermission,
        getPermissionDetails,
        refreshUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
