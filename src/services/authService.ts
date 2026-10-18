/**
 * Universal Business Platform - Authentication & Security Service
 * Handles login, uniform error messaging, account lockout, and password management.
 */

import { User } from '../types/entities';
import { dbEngine } from '../db/databaseEngine';
import { createAppError } from '../utils/logger';
import { toUtcIsoString } from '../utils/datetime';

export class AuthService {
  /**
   * Authenticate user with uniform error message on failure
   */
  public static login(usernameInput: string, passwordInput: string): { user: User; token: string } {
    const state = dbEngine.getState();
    const settings = state.app_settings[0];
    const username = usernameInput.trim().toLowerCase();

    const user = state.users.find((u) => u.username.toLowerCase() === username);

    const genericLoginError = createAppError(
      401,
      'اسم المستخدم أو كلمة المرور غير صحيحة',
      'Invalid username or password',
      `Login attempt failed for username: ${usernameInput}`
    );

    if (!user) {
      dbEngine.logAudit('users', 'unknown', 'LOGIN_FAILED', null, { attempted_username: usernameInput });
      throw genericLoginError;
    }

    const now = new Date();

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until) > now) {
      dbEngine.logAudit('users', user.id, 'LOGIN_FAILED', null, {
        username: user.username,
        reason: 'Account locked',
      });
      throw genericLoginError; // Keep uniform message to prevent enumeration
    }

    // Password validation (simulated hash verification)
    const isValid = user.password_hash === passwordInput;

    if (!isValid) {
      user.failed_attempts += 1;
      let isNewlyLocked = false;

      if (user.failed_attempts >= settings.max_failed_attempts) {
        const lockoutDate = new Date(now.getTime() + settings.lockout_minutes * 60 * 1000);
        user.locked_until = toUtcIsoString(lockoutDate);
        isNewlyLocked = true;
      }
      user.updated_at = toUtcIsoString();
      dbEngine.saveState();

      dbEngine.logAudit('users', user.id, 'LOGIN_FAILED', null, {
        username: user.username,
        failed_attempts: user.failed_attempts,
        is_locked: isNewlyLocked,
      });

      throw genericLoginError;
    }

    if (!user.is_active) {
      throw createAppError(
        403,
        'هذا الحساب معطل حالياً. يرجى مراجعة المسؤول.',
        'This account is currently deactivated. Please contact your administrator.'
      );
    }

    // Reset failed attempts on success
    user.failed_attempts = 0;
    user.locked_until = null;
    user.last_login_at = toUtcIsoString();
    user.updated_at = toUtcIsoString();
    dbEngine.saveState();

    const simulatedToken = `jwt-${user.id}-${Date.now()}`;

    dbEngine.logAudit('users', user.id, 'LOGIN', null, { username: user.username }, user.id);

    return { user: { ...user }, token: simulatedToken };
  }

  public static logout(user: User): void {
    dbEngine.logAudit('users', user.id, 'LOGOUT', null, { username: user.username }, user.id);
  }

  /**
   * Unlock locked account (requires permission)
   */
  public static unlockAccount(userId: string, adminUser: User): void {
    const state = dbEngine.getState();
    const user = state.users.find((u) => u.id === userId);
    if (!user) throw createAppError(404, 'المستخدم غير موجود', 'User not found');

    const oldState = { ...user };
    user.failed_attempts = 0;
    user.locked_until = null;
    user.updated_at = toUtcIsoString();
    user.version += 1;
    dbEngine.saveState();

    dbEngine.logAudit('users', user.id, 'UPDATE', oldState, user, adminUser.id);
  }

  /**
   * Admin password reset
   */
  public static resetPassword(userId: string, newPassword: string, adminUser: User): void {
    const state = dbEngine.getState();
    const settings = state.app_settings[0];
    const user = state.users.find((u) => u.id === userId);
    if (!user) throw createAppError(404, 'المستخدم غير موجود', 'User not found');

    if (newPassword.length < settings.password_min_length) {
      throw createAppError(
        400,
        `كلمة المرور يجب ألا تقل عن ${settings.password_min_length} أحرف`,
        `Password must be at least ${settings.password_min_length} characters`
      );
    }

    if (newPassword.toLowerCase() === user.username.toLowerCase()) {
      throw createAppError(
        400,
        'لا يمكن أن تكون كلمة المرور مطابقة لاسم المستخدم',
        'Password cannot match the username'
      );
    }

    user.password_hash = newPassword;
    user.failed_attempts = 0;
    user.locked_until = null;
    user.updated_at = toUtcIsoString();
    user.version += 1;
    dbEngine.saveState();

    dbEngine.logAudit(
      'users',
      user.id,
      'PASSWORD_RESET',
      null,
      { reset_by: adminUser.username },
      adminUser.id
    );
  }

  /**
   * User change own password
   */
  public static changePassword(
    user: User,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): void {
    const state = dbEngine.getState();
    const settings = state.app_settings[0];
    const liveUser = state.users.find((u) => u.id === user.id);
    if (!liveUser) throw createAppError(404, 'المستخدم غير موجود', 'User not found');

    if (liveUser.password_hash !== currentPassword) {
      throw createAppError(400, 'كلمة المرور الحالية غير صحيحة', 'Current password is incorrect');
    }

    if (newPassword !== confirmPassword) {
      throw createAppError(400, 'تأكيد كلمة المرور غير متطابق', 'Password confirmation does not match');
    }

    if (newPassword.length < settings.password_min_length) {
      throw createAppError(
        400,
        `كلمة المرور يجب ألا تقل عن ${settings.password_min_length} أحرف`,
        `Password must be at least ${settings.password_min_length} characters`
      );
    }

    if (newPassword.toLowerCase() === liveUser.username.toLowerCase()) {
      throw createAppError(
        400,
        'لا يمكن أن تكون كلمة المرور مطابقة لاسم المستخدم',
        'Password cannot match username'
      );
    }

    liveUser.password_hash = newPassword;
    liveUser.updated_at = toUtcIsoString();
    liveUser.version += 1;
    dbEngine.saveState();

    dbEngine.logAudit('users', liveUser.id, 'PASSWORD_RESET', null, { self_change: true }, liveUser.id);
  }
}
