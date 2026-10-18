/**
 * Universal Business Platform - Warehouses Service & Repository
 * Handles Warehouses CRUD, Branch links, 25-row pagination, search normalization.
 */

import { Warehouse } from '../types/entities';
import { dbEngine } from '../db/databaseEngine';
import { normalizeArabic, matchesArabicSearch } from '../utils/arabic';
import { toUtcIsoString } from '../utils/datetime';
import { createAppError } from '../utils/logger';

export class WarehouseService {
  public static getAll(): Warehouse[] {
    return dbEngine.getState().warehouses;
  }

  public static getPaginated(
    page = 1,
    pageSize = 25,
    searchQuery = '',
    sortBy: keyof Warehouse = 'name_ar',
    sortAsc = true
  ): { items: Warehouse[]; totalCount: number; totalPages: number } {
    let warehouses = [...dbEngine.getState().warehouses];

    if (searchQuery.trim()) {
      warehouses = warehouses.filter((w) =>
        matchesArabicSearch(w.search_text || `${w.code} ${w.name_ar} ${w.name_en || ''}`, searchQuery)
      );
    }

    warehouses.sort((a, b) => {
      const valA = (a[sortBy] ?? '') as string | number;
      const valB = (b[sortBy] ?? '') as string | number;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return a.id.localeCompare(b.id);
    });

    const totalCount = warehouses.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const offset = (page - 1) * pageSize;
    const items = warehouses.slice(offset, offset + pageSize);

    return { items, totalCount, totalPages };
  }

  public static getLinkedBranchIds(warehouseId: string): string[] {
    return dbEngine
      .getState()
      .warehouse_branches.filter((wb) => wb.warehouse_id === warehouseId)
      .map((wb) => wb.branch_id);
  }

  public static create(
    data: Omit<Warehouse, 'id' | 'created_at' | 'updated_at' | 'version' | 'search_text'>,
    branchIds: string[],
    actorId: string
  ): Warehouse {
    const state = dbEngine.getState();
    const existing = state.warehouses.find((w) => w.code.toLowerCase() === data.code.toLowerCase());
    if (existing) {
      throw createAppError(400, 'كود المخزن مستخدم بالفعل', 'Warehouse code already exists');
    }

    const newWarehouse: Warehouse = {
      ...data,
      id: `w-${Date.now()}`,
      search_text: normalizeArabic(`${data.code} ${data.name_ar} ${data.name_en || ''}`),
      created_at: toUtcIsoString(),
      updated_at: toUtcIsoString(),
      version: 1,
    };

    state.warehouses.push(newWarehouse);

    // Link branches
    for (const bId of branchIds) {
      state.warehouse_branches.push({
        id: `wb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        warehouse_id: newWarehouse.id,
        branch_id: bId,
      });
    }

    dbEngine.saveState();
    dbEngine.logAudit('warehouses', newWarehouse.id, 'INSERT', null, newWarehouse, actorId);
    return newWarehouse;
  }

  public static update(warehouse: Warehouse, branchIds: string[], actorId: string): Warehouse {
    const state = dbEngine.getState();
    const existing = state.warehouses.find((w) => w.id === warehouse.id);
    if (!existing) throw createAppError(404, 'المخزن غير موجود', 'Warehouse not found');

    dbEngine.verifyConcurrency(existing.version, warehouse.version);

    const oldData = { ...existing };
    existing.code = warehouse.code;
    existing.name_ar = warehouse.name_ar;
    existing.name_en = warehouse.name_en;
    existing.is_active = warehouse.is_active;
    existing.custom_fields = warehouse.custom_fields || {};
    existing.search_text = normalizeArabic(`${warehouse.code} ${warehouse.name_ar} ${warehouse.name_en || ''}`);
    existing.updated_at = toUtcIsoString();
    existing.version += 1;

    // Update branch linkages
    state.warehouse_branches = state.warehouse_branches.filter((wb) => wb.warehouse_id !== warehouse.id);
    for (const bId of branchIds) {
      state.warehouse_branches.push({
        id: `wb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        warehouse_id: warehouse.id,
        branch_id: bId,
      });
    }

    dbEngine.saveState();
    dbEngine.logAudit('warehouses', existing.id, 'UPDATE', oldData, existing, actorId);
    return { ...existing };
  }

  public static deleteOrDeactivate(id: string, actorId: string): { actionTaken: 'DELETED' | 'DEACTIVATED' } {
    const state = dbEngine.getState();
    const index = state.warehouses.findIndex((w) => w.id === id);
    if (index === -1) throw createAppError(404, 'المخزن غير موجود', 'Warehouse not found');

    const warehouse = state.warehouses[index];
    const hasUsers = state.user_warehouses.some((uw) => uw.warehouse_id === id);

    if (hasUsers) {
      const oldData = { ...warehouse };
      warehouse.is_active = false;
      warehouse.updated_at = toUtcIsoString();
      warehouse.version += 1;
      dbEngine.saveState();
      dbEngine.logAudit('warehouses', warehouse.id, 'UPDATE', oldData, warehouse, actorId);
      return { actionTaken: 'DEACTIVATED' };
    }

    state.warehouse_branches = state.warehouse_branches.filter((wb) => wb.warehouse_id !== id);
    state.warehouses.splice(index, 1);
    dbEngine.saveState();
    dbEngine.logAudit('warehouses', id, 'DELETE', warehouse, null, actorId);
    return { actionTaken: 'DELETED' };
  }
}
