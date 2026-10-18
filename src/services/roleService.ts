/**
 * Universal Business Platform - Roles Service & Repository
 * Handles Role definitions, Action permissions, Scope assignment (0,1,2), and Copy.
 */

import { Role, RolePermission } from '../types/entities';
import { dbEngine } from '../db/databaseEngine';
import { toUtcIsoString } from '../utils/datetime';
import { createAppError } from '../utils/logger';

export class RoleService {
  public static getAll(): Role[] {
    return dbEngine.getState().roles;
  }

  public static getPermissionsForRole(roleId: string): RolePermission[] {
    return dbEngine.getState().role_permissions.filter((rp) => rp.role_id === roleId);
  }

  public static create(
    data: { code: string; name_ar: string; name_en: string; permissions: Omit<RolePermission, 'id' | 'role_id'>[] },
    actorId: string
  ): Role {
    const state = dbEngine.getState();
    const existing = state.roles.find((r) => r.code.toLowerCase() === data.code.toLowerCase());
    if (existing) throw createAppError(400, 'كود الدور مستخدم بالفعل', 'Role code already exists');

    const newRole: Role = {
      id: `r-${Date.now()}`,
      code: data.code,
      name_ar: data.name_ar,
      name_en: data.name_en,
      is_active: true,
      created_at: toUtcIsoString(),
      updated_at: toUtcIsoString(),
      version: 1,
    };

    state.roles.push(newRole);

    data.permissions.forEach((p) => {
      state.role_permissions.push({
        id: `rp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        role_id: newRole.id,
        screen_code: p.screen_code,
        action_code: p.action_code,
        is_allowed: p.is_allowed,
        scope: p.scope,
      });
    });

    dbEngine.saveState();
    dbEngine.logAudit('roles', newRole.id, 'INSERT', null, newRole, actorId);
    return newRole;
  }

  public static update(
    role: Role,
    permissions: Omit<RolePermission, 'id' | 'role_id'>[],
    actorId: string
  ): Role {
    const state = dbEngine.getState();
    const existing = state.roles.find((r) => r.id === role.id);
    if (!existing) throw createAppError(404, 'الدور غير موجود', 'Role not found');

    dbEngine.verifyConcurrency(existing.version, role.version);

    const oldData = { ...existing };
    existing.code = role.code;
    existing.name_ar = role.name_ar;
    existing.name_en = role.name_en;
    existing.is_active = role.is_active;
    existing.updated_at = toUtcIsoString();
    existing.version += 1;

    // Replace permissions
    state.role_permissions = state.role_permissions.filter((rp) => rp.role_id !== role.id);
    permissions.forEach((p) => {
      state.role_permissions.push({
        id: `rp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        role_id: role.id,
        screen_code: p.screen_code,
        action_code: p.action_code,
        is_allowed: p.is_allowed,
        scope: p.scope,
      });
    });

    dbEngine.saveState();
    dbEngine.logAudit('roles', existing.id, 'UPDATE', oldData, existing, actorId);
    return { ...existing };
  }

  public static copyRole(sourceRoleId: string, newCode: string, newNameAr: string, actorId: string): Role {
    const state = dbEngine.getState();
    const sourceRole = state.roles.find((r) => r.id === sourceRoleId);
    if (!sourceRole) throw createAppError(404, 'الدور المصدر غير موجود', 'Source role not found');

    const sourcePerms = state.role_permissions.filter((rp) => rp.role_id === sourceRoleId);

    return this.create(
      {
        code: newCode,
        name_ar: newNameAr,
        name_en: `${sourceRole.name_en || ''} (Copy)`,
        permissions: sourcePerms.map((p) => ({
          screen_code: p.screen_code,
          action_code: p.action_code,
          is_allowed: p.is_allowed,
          scope: p.scope,
        })),
      },
      actorId
    );
  }

  public static delete(id: string, actorId: string): void {
    const state = dbEngine.getState();
    const index = state.roles.findIndex((r) => r.id === id);
    if (index === -1) throw createAppError(404, 'الدور غير موجود', 'Role not found');

    const role = state.roles[index];
    const isAssigned = state.user_roles.some((ur) => ur.role_id === id);
    if (isAssigned) {
      throw createAppError(
        400,
        'لا يمكن حذف دور معين لمستخدمين. قم بإلغاء تعيينه أولاً أو تعطيله.',
        'Cannot delete role assigned to users. Deactivate it instead.'
      );
    }

    state.role_permissions = state.role_permissions.filter((rp) => rp.role_id !== id);
    state.roles.splice(index, 1);
    dbEngine.saveState();
    dbEngine.logAudit('roles', id, 'DELETE', role, null, actorId);
  }
}
