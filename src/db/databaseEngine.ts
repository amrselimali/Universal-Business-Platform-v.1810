/**
 * Universal Business Platform - Cloud Database Engine & Repository
 * Enforces PostgreSQL constraints, optimistic concurrency (version), Keyset pagination, and audit logging.
 */

import {
  AppSettings,
  Branch,
  Warehouse,
  WarehouseBranch,
  User,
  UserBranch,
  UserWarehouse,
  Role,
  RolePermission,
  UserRole,
  UserPermission,
  Currency,
  CustomFieldDefinition,
  AuditLog,
  AuditAction,
} from '../types/entities';
import {
  INITIAL_SETTINGS,
  INITIAL_BRANCHES,
  INITIAL_WAREHOUSES,
  INITIAL_WAREHOUSE_BRANCHES,
  INITIAL_CURRENCIES,
  INITIAL_USERS,
  INITIAL_USER_BRANCHES,
  INITIAL_USER_WAREHOUSES,
  INITIAL_ROLES,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_USER_ROLES,
  INITIAL_USER_PERMISSIONS,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_AUDIT_LOGS,
} from './seedData';
import { DB_MIGRATIONS, DbMigration } from './migrations';
import { generateTraceId, sanitizeRecordData, createAppError } from '../utils/logger';
import { toUtcIsoString } from '../utils/datetime';

const STORAGE_KEY = 'ubp_cloud_db_v1';

export interface DatabaseState {
  app_settings: AppSettings[];
  branches: Branch[];
  warehouses: Warehouse[];
  warehouse_branches: WarehouseBranch[];
  users: User[];
  user_branches: UserBranch[];
  user_warehouses: UserWarehouse[];
  roles: Role[];
  role_permissions: RolePermission[];
  user_roles: UserRole[];
  user_permissions: UserPermission[];
  currencies: Currency[];
  custom_field_definitions: CustomFieldDefinition[];
  audit_log: AuditLog[];
  migrations: DbMigration[];
}

class DatabaseEngine {
  private state: DatabaseState;
  private currentAuditId = 100;

  constructor() {
    this.state = this.loadState();
    if (this.state.audit_log.length > 0) {
      this.currentAuditId = Math.max(...this.state.audit_log.map((a) => a.id), 100);
    }
  }

  private loadState(): DatabaseState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        return JSON.parse(serialized);
      }
    } catch {
      // fallback
    }
    return this.createInitialState();
  }

  private createInitialState(): DatabaseState {
    const fresh: DatabaseState = {
      app_settings: [{ ...INITIAL_SETTINGS }],
      branches: [...INITIAL_BRANCHES],
      warehouses: [...INITIAL_WAREHOUSES],
      warehouse_branches: [...INITIAL_WAREHOUSE_BRANCHES],
      users: [...INITIAL_USERS],
      user_branches: [...INITIAL_USER_BRANCHES],
      user_warehouses: [...INITIAL_USER_WAREHOUSES],
      roles: [...INITIAL_ROLES],
      role_permissions: [...INITIAL_ROLE_PERMISSIONS],
      user_roles: [...INITIAL_USER_ROLES],
      user_permissions: [...INITIAL_USER_PERMISSIONS],
      currencies: [...INITIAL_CURRENCIES],
      custom_field_definitions: [...INITIAL_CUSTOM_FIELDS],
      audit_log: [...INITIAL_AUDIT_LOGS],
      migrations: [...DB_MIGRATIONS],
    };
    this.saveState(fresh);
    return fresh;
  }

  public saveState(stateToSave = this.state): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.error('Failed to save DB state to local storage:', err);
    }
  }

  public resetToFactory(): DatabaseState {
    this.state = this.createInitialState();
    return this.state;
  }

  public getState(): DatabaseState {
    return this.state;
  }

  /**
   * Insert audit log entry with Keyset ID
   */
  public logAudit(
    tableName: string,
    recordId: string,
    action: AuditAction,
    oldData: Record<string, any> | null,
    newData: Record<string, any> | null,
    userId: string | null = null,
    branchId: string | null = null,
    traceId: string = generateTraceId()
  ): AuditLog {
    this.currentAuditId += 1;
    const entry: AuditLog = {
      id: this.currentAuditId,
      user_id: userId,
      branch_id: branchId,
      table_name: tableName,
      record_id: recordId,
      action,
      old_data: sanitizeRecordData(oldData),
      new_data: sanitizeRecordData(newData),
      ip_address: '127.0.0.1',
      trace_id: traceId,
      created_at: toUtcIsoString(),
    };
    this.state.audit_log.unshift(entry);
    this.saveState();
    return entry;
  }

  /**
   * Concurrency version checker
   */
  public verifyConcurrency(currentVersion: number, expectedVersion: number): void {
    if (currentVersion !== expectedVersion) {
      throw createAppError(
        409,
        'تم تعديل السجل بواسطة مستخدم آخر. يرجى إعادة تحميل البيانات.',
        'The record has been modified by another user. Please reload the data.',
        `Concurrency conflict: current version ${currentVersion} !== expected ${expectedVersion}`
      );
    }
  }

  /**
   * Keyset pagination on audit_log (WHERE id < @last_id ORDER BY id DESC LIMIT 25)
   */
  public getAuditLogsKeyset(
    lastId?: number | null,
    limit = 25,
    filters?: {
      action?: string;
      tableName?: string;
      userId?: string;
      branchId?: string;
      dateFrom?: string;
      dateTo?: string;
      traceId?: string;
    }
  ): { items: AuditLog[]; nextLastId: number | null; hasMore: boolean } {
    let filtered = [...this.state.audit_log];

    if (filters?.action) {
      filtered = filtered.filter((l) => l.action === filters.action);
    }
    if (filters?.tableName) {
      filtered = filtered.filter((l) => l.table_name === filters.tableName);
    }
    if (filters?.userId) {
      filtered = filtered.filter((l) => l.user_id === filters.userId);
    }
    if (filters?.branchId) {
      filtered = filtered.filter((l) => l.branch_id === filters.branchId);
    }
    if (filters?.traceId) {
      filtered = filtered.filter((l) => l.trace_id?.toLowerCase().includes(filters.traceId!.toLowerCase()));
    }
    if (filters?.dateFrom) {
      filtered = filtered.filter((l) => new Date(l.created_at) >= new Date(filters.dateFrom!));
    }
    if (filters?.dateTo) {
      filtered = filtered.filter((l) => new Date(l.created_at) <= new Date(filters.dateTo!));
    }

    // Sort by id DESC
    filtered.sort((a, b) => b.id - a.id);

    // Apply Keyset: WHERE id < @lastId
    if (lastId != null) {
      filtered = filtered.filter((l) => l.id < lastId);
    }

    const items = filtered.slice(0, limit);
    const hasMore = filtered.length > limit;
    const nextLastId = items.length > 0 ? items[items.length - 1].id : null;

    return { items, nextLastId, hasMore };
  }
}

export const dbEngine = new DatabaseEngine();
