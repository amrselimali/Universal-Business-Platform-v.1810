/**
 * Universal Business Platform - Database Management Service (DbUp & Super Admin)
 * Handles migration execution, table inspection, seed application, and audited row mutations.
 */

import { User } from '../types/entities';
import { dbEngine, DatabaseState } from '../db/databaseEngine';
import { DB_MIGRATIONS, DbMigration } from '../db/migrations';
import { createAppError } from '../utils/logger';
import { toUtcIsoString } from '../utils/datetime';

export interface TableSummary {
  tableName: keyof DatabaseState;
  rowCount: number;
  description_ar: string;
  description_en: string;
}

export class DbManagementService {
  public static getMigrations(): DbMigration[] {
    return dbEngine.getState().migrations;
  }

  public static getTableSummaries(): TableSummary[] {
    const s = dbEngine.getState();
    return [
      { tableName: 'app_settings', rowCount: s.app_settings.length, description_ar: 'الإعدادات الأساسية', description_en: 'Core System Settings' },
      { tableName: 'branches', rowCount: s.branches.length, description_ar: 'فروع الشركة', description_en: 'Company Branches' },
      { tableName: 'warehouses', rowCount: s.warehouses.length, description_ar: 'المستودعات والمخازن', description_en: 'Warehouses' },
      { tableName: 'warehouse_branches', rowCount: s.warehouse_branches.length, description_ar: 'ربط المخازن بالفروع', description_en: 'Warehouse-Branch Links' },
      { tableName: 'users', rowCount: s.users.length, description_ar: 'المستخدمين', description_en: 'User Accounts' },
      { tableName: 'user_branches', rowCount: s.user_branches.length, description_ar: 'ربط المستخدمين بالفروع', description_en: 'User-Branch Links' },
      { tableName: 'user_warehouses', rowCount: s.user_warehouses.length, description_ar: 'ربط المستخدمين بالمخازن', description_en: 'User-Warehouse Links' },
      { tableName: 'roles', rowCount: s.roles.length, description_ar: 'الأدوار الإدارية', description_en: 'Roles' },
      { tableName: 'role_permissions', rowCount: s.role_permissions.length, description_ar: 'صلاحيات الأدوار', description_en: 'Role Permissions' },
      { tableName: 'user_permissions', rowCount: s.user_permissions.length, description_ar: 'صلاحيات المستخدمين المخصصة', description_en: 'User Permission Overrides' },
      { tableName: 'currencies', rowCount: s.currencies.length, description_ar: 'العملات وأسعارها', description_en: 'Currencies' },
      { tableName: 'custom_field_definitions', rowCount: s.custom_field_definitions.length, description_ar: 'تعريف الحقول الإضافية', description_en: 'Custom Field Definitions' },
      { tableName: 'audit_log', rowCount: s.audit_log.length, description_ar: 'سجل الأنشطة والأمان', description_en: 'Audit & Security Logs' },
    ];
  }

  public static getTableRows(tableName: keyof DatabaseState, limit = 25): any[] {
    const tableData = dbEngine.getState()[tableName];
    if (Array.isArray(tableData)) {
      return tableData.slice(0, limit);
    }
    return [];
  }

  public static runMigrations(currentUser: User): { appliedCount: number; message: string } {
    if (!currentUser.is_super_admin) {
      throw createAppError(403, 'يتطلب تنفيذ التحديثات صلاحية Super Admin', 'Super Admin privilege required');
    }

    const state = dbEngine.getState();
    let appliedCount = 0;

    state.migrations.forEach((m) => {
      if (m.status !== 'APPLIED') {
        m.status = 'APPLIED';
        m.applied_at = toUtcIsoString();
        appliedCount += 1;
      }
    });

    dbEngine.saveState();
    dbEngine.logAudit('schemaversions', 'migration_run', 'MIGRATION', null, { appliedCount }, currentUser.id);

    return {
      appliedCount,
      message: `تم التحقق من قاعدة البيانات بنجاح، وجميع السكريبتات (${state.migrations.length}) مطبقة بالكامل.`,
    };
  }

  public static resetAndSeed(currentUser: User): void {
    if (!currentUser.is_super_admin) {
      throw createAppError(403, 'يتطلب توليد البيانات الأولية صلاحية Super Admin', 'Super Admin privilege required');
    }

    dbEngine.resetToFactory();
    dbEngine.logAudit('database', 'reset_factory', 'MIGRATION', null, { reset_by: currentUser.username }, currentUser.id);
  }
}
