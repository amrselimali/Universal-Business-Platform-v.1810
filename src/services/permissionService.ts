/**
 * Universal Business Platform - RBAC & Security Permission Service
 * Enforces server-side authorization gates, branch isolation, and Super Admin protection.
 */

import { User } from '../types/entities';
import { ScreenCode, ActionCode } from '../types/permissions';
import { dbEngine } from '../db/databaseEngine';
import { createAppError } from '../utils/logger';

export interface PermissionCheckResult {
  allowed: boolean;
  scope: 0 | 1 | 2; // 0 = My records, 1 = My branches, 2 = All
  inheritedFromRole?: boolean;
}

export class PermissionService {
  /**
   * Evaluates if a user has permission for a specific screen and action.
   * Priority:
   * 1. Admin (is_admin = true) -> ALWAYS ALLOWED (Scope 2)
   * 2. user_permissions (explicit individual override - can allow or deny)
   * 3. role_permissions (from any active role assigned to user)
   * 4. Default: DENY
   */
  public static checkPermission(
    user: User | null,
    screenCode: ScreenCode | string,
    actionCode: ActionCode | string
  ): PermissionCheckResult {
    if (!user || !user.is_active) {
      return { allowed: false, scope: 0 };
    }

    // Admin bypass
    if (user.is_admin) {
      return { allowed: true, scope: 2 };
    }

    const state = dbEngine.getState();

    // 1. Check individual user_permissions overrides
    const userPerm = state.user_permissions.find(
      (p) => p.user_id === user.id && p.screen_code === screenCode && p.action_code === actionCode
    );
    if (userPerm) {
      return {
        allowed: userPerm.is_allowed,
        scope: userPerm.scope,
        inheritedFromRole: false,
      };
    }

    // 2. Check role_permissions from assigned user_roles
    const assignedRoles = state.user_roles.filter((ur) => ur.user_id === user.id);
    const roleIds = assignedRoles.map((ur) => ur.role_id);

    const activeRoles = state.roles.filter((r) => roleIds.includes(r.id) && r.is_active);
    const activeRoleIds = activeRoles.map((r) => r.id);

    const rolePerms = state.role_permissions.filter(
      (rp) =>
        activeRoleIds.includes(rp.role_id) &&
        rp.screen_code === screenCode &&
        rp.action_code === actionCode &&
        rp.is_allowed
    );

    if (rolePerms.length > 0) {
      // Find highest scope among roles (2 > 1 > 0)
      const maxScope = Math.max(...rolePerms.map((rp) => rp.scope)) as 0 | 1 | 2;
      return {
        allowed: true,
        scope: maxScope,
        inheritedFromRole: true,
      };
    }

    // Default deny
    return { allowed: false, scope: 0 };
  }

  /**
   * Enforces that user is permitted to perform action, or throws 403 AppError
   */
  public static enforce(
    user: User | null,
    screenCode: ScreenCode | string,
    actionCode: ActionCode | string,
    currentBranchId?: string | null
  ): PermissionCheckResult {
    const result = this.checkPermission(user, screenCode, actionCode);
    if (!result.allowed) {
      throw createAppError(
        403,
        'ليس لديك صلاحية لتنفيذ هذا الإجراء',
        'You do not have permission to perform this action',
        `User ${user?.username} denied access to ${screenCode}.${actionCode}`
      );
    }

    // Branch isolation check (unless admin)
    if (user && !user.is_admin && currentBranchId) {
      const state = dbEngine.getState();
      const hasBranch = state.user_branches.some(
        (ub) => ub.user_id === user.id && ub.branch_id === currentBranchId
      );
      if (!hasBranch) {
        throw createAppError(
          403,
          'غير مصرح لك بالوصول لبيانات هذا الفرع',
          'You are not authorized to access this branch',
          `User ${user.username} does not belong to branch ${currentBranchId}`
        );
      }
    }

    return result;
  }

  /**
   * Protects Super Admin records from being viewed or modified by standard Admin
   */
  public static assertCanManageUser(currentUser: User, targetUser: User): void {
    if (targetUser.is_super_admin && !currentUser.is_super_admin) {
      throw createAppError(
        403,
        'لا يمكنك تعديل أو إدارة حساب Super Admin',
        'Cannot modify or manage a Super Admin account',
        `User ${currentUser.username} attempted to alter Super Admin ${targetUser.username}`
      );
    }
  }
}
