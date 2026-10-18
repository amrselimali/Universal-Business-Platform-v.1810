/**
 * Universal Business Platform - Branches Service & Repository
 * Handles CRUD operations, 25-row pagination, search normalization, and soft-delete conversion.
 */

import { Branch } from '../types/entities';
import { dbEngine } from '../db/databaseEngine';
import { normalizeArabic, matchesArabicSearch } from '../utils/arabic';
import { toUtcIsoString } from '../utils/datetime';
import { createAppError } from '../utils/logger';

export class BranchService {
  public static getAll(): Branch[] {
    return dbEngine.getState().branches;
  }

  public static getPaginated(
    page = 1,
    pageSize = 25,
    searchQuery = '',
    sortBy: keyof Branch = 'name_ar',
    sortAsc = true
  ): { items: Branch[]; totalCount: number; totalPages: number } {
    let branches = [...dbEngine.getState().branches];

    if (searchQuery.trim()) {
      branches = branches.filter((b) =>
        matchesArabicSearch(b.search_text || `${b.code} ${b.name_ar} ${b.name_en || ''}`, searchQuery)
      );
    }

    branches.sort((a, b) => {
      const valA = (a[sortBy] ?? '') as string | number;
      const valB = (b[sortBy] ?? '') as string | number;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return a.id.localeCompare(b.id);
    });

    const totalCount = branches.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const offset = (page - 1) * pageSize;
    const items = branches.slice(offset, offset + pageSize);

    return { items, totalCount, totalPages };
  }

  public static getById(id: string): Branch | undefined {
    return dbEngine.getState().branches.find((b) => b.id === id);
  }

  public static create(data: Omit<Branch, 'id' | 'created_at' | 'updated_at' | 'version' | 'search_text'>, actorId: string): Branch {
    const state = dbEngine.getState();
    const existing = state.branches.find((b) => b.code.toLowerCase() === data.code.toLowerCase());
    if (existing) {
      throw createAppError(400, 'كود الفرع مستخدم بالفعل', 'Branch code already exists');
    }

    const newBranch: Branch = {
      ...data,
      id: `b-${Date.now()}`,
      search_text: normalizeArabic(`${data.code} ${data.name_ar} ${data.name_en || ''} ${data.phone || ''}`),
      created_at: toUtcIsoString(),
      updated_at: toUtcIsoString(),
      version: 1,
    };

    state.branches.push(newBranch);
    dbEngine.saveState();
    dbEngine.logAudit('branches', newBranch.id, 'INSERT', null, newBranch, actorId, newBranch.id);
    return newBranch;
  }

  public static update(branch: Branch, actorId: string): Branch {
    const state = dbEngine.getState();
    const existing = state.branches.find((b) => b.id === branch.id);
    if (!existing) throw createAppError(404, 'الفرع غير موجود', 'Branch not found');

    dbEngine.verifyConcurrency(existing.version, branch.version);

    const oldData = { ...existing };
    existing.code = branch.code;
    existing.name_ar = branch.name_ar;
    existing.name_en = branch.name_en;
    existing.address = branch.address;
    existing.phone = branch.phone;
    existing.is_active = branch.is_active;
    existing.custom_fields = branch.custom_fields || {};
    existing.search_text = normalizeArabic(
      `${branch.code} ${branch.name_ar} ${branch.name_en || ''} ${branch.phone || ''}`
    );
    existing.updated_at = toUtcIsoString();
    existing.version += 1;

    dbEngine.saveState();
    dbEngine.logAudit('branches', existing.id, 'UPDATE', oldData, existing, actorId, existing.id);
    return { ...existing };
  }

  /**
   * Delete branch: if associated with warehouse_branches, user_branches or audit_log,
   * converts delete to deactivation (is_active = false)
   */
  public static deleteOrDeactivate(id: string, actorId: string): { actionTaken: 'DELETED' | 'DEACTIVATED' } {
    const state = dbEngine.getState();
    const index = state.branches.findIndex((b) => b.id === id);
    if (index === -1) throw createAppError(404, 'الفرع غير موجود', 'Branch not found');

    const branch = state.branches[index];

    // Check references
    const hasWarehouses = state.warehouse_branches.some((wb) => wb.branch_id === id);
    const hasUsers = state.user_branches.some((ub) => ub.branch_id === id);
    const hasAudits = state.audit_log.some((a) => a.branch_id === id);

    if (hasWarehouses || hasUsers || hasAudits) {
      // Convert to soft deactivation
      const oldData = { ...branch };
      branch.is_active = false;
      branch.updated_at = toUtcIsoString();
      branch.version += 1;
      dbEngine.saveState();
      dbEngine.logAudit('branches', branch.id, 'UPDATE', oldData, branch, actorId, branch.id);
      return { actionTaken: 'DEACTIVATED' };
    }

    state.branches.splice(index, 1);
    dbEngine.saveState();
    dbEngine.logAudit('branches', id, 'DELETE', branch, null, actorId, id);
    return { actionTaken: 'DELETED' };
  }
}
