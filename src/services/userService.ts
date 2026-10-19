/**
 * Universal Business Platform - Users Service & Repository
 * Handles user lifecycle, branch/warehouse linkage with trigger validation, and RBAC overrides.
 */

import { User, UserBranch, UserWarehouse, UserRole, UserPermission } from '../types/entities';
import { dbEngine } from '../db/databaseEngine';
import { normalizeArabic, matchesArabicSearch } from '../utils/arabic';
import { toUtcIsoString } from '../utils/datetime';
import { createAppError } from '../utils/logger';
import { UserPermissionService } from './userPermissionService';

export class UserService {
  public static getPaginated(
    currentUser: User,
    page = 1,
    pageSize = 25,
    searchQuery = '',
    sortBy: keyof User = 'username',
    sortAsc = true
  ): { items: User[]; totalCount: number; totalPages: number } {
    let users = [...dbEngine.getState().users];

    // Non-super-admin cannot see super-admin accounts
    if (!currentUser.is_super_admin) {
      users = users.filter((u) => !u.is_super_admin);
    }

    if (searchQuery.trim()) {
      users = users.filter((u) =>
        matchesArabicSearch(u.search_text || `${u.username} ${u.name || ''}`, searchQuery)
      );
    }

    users.sort((a, b) => {
      const valA = (a[sortBy] ?? '') as string | number;
      const valB = (b[sortBy] ?? '') as string | number;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return a.id.localeCompare(b.id);
    });

    const totalCount = users.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const offset = (page - 1) * pageSize;
    const items = users.slice(offset, offset + pageSize);

    return { items, totalCount, totalPages };
  }

  public static getUserBranches(userId: string): UserBranch[] {
    return dbEngine.getState().user_branches.filter((ub) => ub.user_id === userId);
  }

  public static getUserWarehouses(userId: string): string[] {
    return dbEngine
      .getState()
      .user_warehouses.filter((uw) => uw.user_id === userId)
      .map((uw) => uw.warehouse_id);
  }

  public static getUserRoles(userId: string): string[] {
    return dbEngine
      .getState()
      .user_roles.filter((ur) => ur.user_id === userId)
      .map((ur) => ur.role_id);
  }

  public static getUserPermissions(userId: string): UserPermission[] {
    return dbEngine.getState().user_permissions.filter((up) => up.user_id === userId);
  }

  /**
   * Validate that removing branches doesn't leave warehouses orphaned for this user
   */
  public static validateWarehouseBranchIntegrity(
    userId: string,
    remainingBranchIds: string[],
    targetWarehouseIds: string[]
  ): void {
    const state = dbEngine.getState();
    const orphanedWarehouses: string[] = [];

    for (const whId of targetWarehouseIds) {
      // Find which branches this warehouse belongs to
      const warehouseBranchIds = state.warehouse_branches
        .filter((wb) => wb.warehouse_id === whId)
        .map((wb) => wb.branch_id);

      // Check if any of user's remaining branches covers this warehouse
      const isCovered = warehouseBranchIds.some((bId) => remainingBranchIds.includes(bId));
      if (!isCovered) {
        const wh = state.warehouses.find((w) => w.id === whId);
        orphanedWarehouses.push(wh ? `${wh.name_ar} (${wh.code})` : whId);
      }
    }

    if (orphanedWarehouses.length > 0) {
      throw createAppError(
        400,
        `لا يمكن تطبيق العملية لأن المخازن التالية ستصبح غير تابعة لأي من فروع المستخدم: [${orphanedWarehouses.join(
          ', '
        )}]. يرجى فك ربط هذه المخازن من المستخدم أولاً.`,
        `Operation rejected: Warehouses [${orphanedWarehouses.join(
          ', '
        )}] do not belong to the remaining branches. Unlink them first.`
      );
    }
  }

  public static create(
    data: {
      name: string;
      username: string;
      password: string;
      language: 'ar' | 'en';
      is_admin: boolean;
      branchIds: { branchId: string; isDefault: boolean }[];
      warehouseIds: string[];
      roleIds: string[];
    },
    currentUser: User
  ): User {
    const state = dbEngine.getState();
    const existing = state.users.find((u) => u.username.toLowerCase() === data.username.toLowerCase());
    if (existing) throw createAppError(400, 'اسم المستخدم موجود بالفعل', 'Username already exists');

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: data.name,
      username: data.username,
      password_hash: data.password,
      is_active: true,
      language: data.language,
      is_admin: data.is_admin,
      is_super_admin: false,
      failed_attempts: 0,
      locked_until: null,
      last_login_at: null,
      search_text: normalizeArabic(`${data.username} ${data.name}`),
      created_at: toUtcIsoString(),
      updated_at: toUtcIsoString(),
      version: 1,
    };

    if (!data.is_admin) {
      this.validateWarehouseBranchIntegrity(
        newUser.id,
        data.branchIds.map((b) => b.branchId),
        data.warehouseIds
      );
    }

    state.users.push(newUser);

    // Save branches
    data.branchIds.forEach((b) => {
      state.user_branches.push({
        id: `ub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: newUser.id,
        branch_id: b.branchId,
        is_default: b.isDefault,
      });
    });

    // Save warehouses
    data.warehouseIds.forEach((wId) => {
      state.user_warehouses.push({
        id: `uw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: newUser.id,
        warehouse_id: wId,
      });
    });

    // Save roles
    data.roleIds.forEach((rId) => {
      state.user_roles.push({
        id: `ur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: newUser.id,
        role_id: rId,
      });
    });

    dbEngine.saveState();
    dbEngine.logAudit('users', newUser.id, 'INSERT', null, newUser, currentUser.id);
    return newUser;
  }

  public static update(
    user: User,
    branches: { branchId: string; isDefault: boolean }[],
    warehouseIds: string[],
    roleIds: string[],
    currentUser: User
  ): User {
    const state = dbEngine.getState();
    const existing = state.users.find((u) => u.id === user.id);
    if (!existing) throw createAppError(404, 'المستخدم غير موجود', 'User not found');

    dbEngine.verifyConcurrency(existing.version, user.version);

    if (!user.is_admin) {
      this.validateWarehouseBranchIntegrity(
        user.id,
        branches.map((b) => b.branchId),
        warehouseIds
      );
    }

    const oldData = { ...existing };
    existing.name = user.name;
    existing.username = user.username;
    existing.language = user.language;
    existing.is_admin = user.is_admin;
    existing.is_active = user.is_active;
    existing.search_text = normalizeArabic(`${user.username} ${user.name}`);
    existing.updated_at = toUtcIsoString();
    existing.version += 1;

    // Replace branches
    state.user_branches = state.user_branches.filter((ub) => ub.user_id !== user.id);
    branches.forEach((b) => {
      state.user_branches.push({
        id: `ub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: user.id,
        branch_id: b.branchId,
        is_default: b.isDefault,
      });
    });

    // Replace warehouses
    state.user_warehouses = state.user_warehouses.filter((uw) => uw.user_id !== user.id);
    warehouseIds.forEach((wId) => {
      state.user_warehouses.push({
        id: `uw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: user.id,
        warehouse_id: wId,
      });
    });

    // Replace roles
    state.user_roles = state.user_roles.filter((ur) => ur.user_id !== user.id);
    roleIds.forEach((rId) => {
      state.user_roles.push({
        id: `ur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: user.id,
        role_id: rId,
      });
    });

    dbEngine.saveState();
    dbEngine.logAudit('users', existing.id, 'UPDATE', oldData, existing, currentUser.id);
    return { ...existing };
  }

  public static saveUserPermissions = UserPermissionService.saveUserPermissions;
  public static copyPermissions = UserPermissionService.copyPermissions;

  public static deleteOrDeactivate(id: string, currentUser: User): { actionTaken: 'DELETED' | 'DEACTIVATED' } {
    const state = dbEngine.getState();
    const index = state.users.findIndex((u) => u.id === id);
    if (index === -1) throw createAppError(404, 'المستخدم غير موجود', 'User not found');

    const targetUser = state.users[index];
    if (targetUser.is_super_admin) {
      throw createAppError(403, 'لا يمكن حذف Super Admin', 'Cannot delete Super Admin account');
    }

    const hasAudits = state.audit_log.some((a) => a.user_id === id);

    if (hasAudits) {
      const oldData = { ...targetUser };
      targetUser.is_active = false;
      targetUser.updated_at = toUtcIsoString();
      targetUser.version += 1;
      dbEngine.saveState();
      dbEngine.logAudit('users', targetUser.id, 'UPDATE', oldData, targetUser, currentUser.id);
      return { actionTaken: 'DEACTIVATED' };
    }

    state.user_branches = state.user_branches.filter((ub) => ub.user_id !== id);
    state.user_warehouses = state.user_warehouses.filter((uw) => uw.user_id !== id);
    state.user_roles = state.user_roles.filter((ur) => ur.user_id !== id);
    state.user_permissions = state.user_permissions.filter((up) => up.user_id !== id);
    state.users.splice(index, 1);

    dbEngine.saveState();
    dbEngine.logAudit('users', id, 'DELETE', targetUser, null, currentUser.id);
    return { actionTaken: 'DELETED' };
  }
}
