/**
 * Universal Business Platform - App Settings Service & Repository
 * Handles singleton system configuration, formats, and security policies.
 */

import { AppSettings } from '../types/entities';
import { dbEngine } from '../db/databaseEngine';
import { toUtcIsoString } from '../utils/datetime';
import { createAppError } from '../utils/logger';

export class SettingsService {
  public static get(): AppSettings {
    const settings = dbEngine.getState().app_settings[0];
    if (!settings) {
      throw createAppError(500, 'إعدادات النظام غير مهيأة', 'System settings are uninitialized');
    }
    return settings;
  }

  public static update(newSettings: AppSettings, actorId: string): AppSettings {
    const state = dbEngine.getState();
    const current = state.app_settings[0];

    dbEngine.verifyConcurrency(current.version, newSettings.version);

    if (newSettings.password_min_length < 8) {
      throw createAppError(
        400,
        'الحد الأدنى لطول كلمة المرور لا يقل عن 8 أحرف',
        'Password minimum length cannot be less than 8'
      );
    }

    if (newSettings.max_failed_attempts < 1) {
      throw createAppError(400, 'عدد محاولات الدخول يجب أن يكون 1 على الأقل', 'Max failed attempts must be at least 1');
    }

    const oldData = { ...current };
    state.app_settings[0] = {
      ...newSettings,
      updated_at: toUtcIsoString(),
      version: current.version + 1,
    };

    dbEngine.saveState();
    dbEngine.logAudit('app_settings', current.id, 'UPDATE', oldData, state.app_settings[0], actorId);
    return state.app_settings[0];
  }
}
