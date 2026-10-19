/**
 * Universal Business Platform - User Permission Overrides Service
 * Handles user-specific permission overrides, saving, and copying.
 */

import { User, UserPermission } from '../types/entities';
import { dbEngine } from '../db/databaseEngine';

export class UserPermissionService {
  public static getUserPermissions(userId: string): UserPermission[] {
    return dbEngine.getState().user_permissions.filter((up) => up.user_id === userId);
  }

  public static saveUserPermissions(
    userId: string,
    permissions: UserPermission[],
    currentUser: User
  ): void {
    const state = dbEngine.getState();
    const oldPerms = state.user_permissions.filter((up) => up.user_id === userId);

    state.user_permissions = state.user_permissions.filter((up) => up.user_id !== userId);
    permissions.forEach((p) => {
      state.user_permissions.push({
        ...p,
        id: `up-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
      });
    });

    dbEngine.saveState();
    dbEngine.logAudit(
      'user_permissions',
      userId,
      'PERMISSION_CHANGE',
      { count: oldPerms.length },
      { count: permissions.length },
      currentUser.id
    );
  }

  public static copyPermissions(
    sourceUserId: string,
    targetUserId: string,
    currentUser: User
  ): void {
    const state = dbEngine.getState();
    const sourcePerms = state.user_permissions.filter((up) => up.user_id === sourceUserId);

    state.user_permissions = state.user_permissions.filter((up) => up.user_id !== targetUserId);
    sourcePerms.forEach((sp) => {
      state.user_permissions.push({
        ...sp,
        id: `up-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: targetUserId,
      });
    });

    dbEngine.saveState();
    dbEngine.logAudit(
      'user_permissions',
      targetUserId,
      'PERMISSION_CHANGE',
      null,
      { copied_from: sourceUserId, copied_count: sourcePerms.length },
      currentUser.id
    );
  }
}
