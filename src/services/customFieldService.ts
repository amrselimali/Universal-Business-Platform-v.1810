/**
 * Universal Business Platform - Custom Field Definitions Service
 * Allows Admin to configure custom fields from the UI for branches, warehouses, and users.
 */

import { CustomFieldDefinition } from '../types/entities';
import { dbEngine } from '../db/databaseEngine';
import { toUtcIsoString } from '../utils/datetime';
import { createAppError } from '../utils/logger';

export class CustomFieldService {
  public static getAll(): CustomFieldDefinition[] {
    return dbEngine.getState().custom_field_definitions.sort((a, b) => a.sort_order - b.sort_order);
  }

  public static getForEntity(entityName: 'branches' | 'warehouses' | 'users'): CustomFieldDefinition[] {
    return dbEngine
      .getState()
      .custom_field_definitions.filter((cf) => cf.entity_name === entityName && cf.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public static create(
    data: Omit<CustomFieldDefinition, 'id' | 'created_at' | 'updated_at' | 'version'>,
    actorId: string
  ): CustomFieldDefinition {
    const state = dbEngine.getState();

    // Check regex: ^[a-z][a-z0-9_]*$
    const keyRegex = /^[a-z][a-z0-9_]*$/;
    if (!keyRegex.test(data.field_key)) {
      throw createAppError(
        400,
        'مفتاح الحقل يجب أن يبدأ بحرف إنجليزي صغير ويحتوي فقط على حروف صغيرة وأرقام وعلامة _',
        'Field key must start with lowercase letter and contain only lowercase letters, digits, and underscores'
      );
    }

    const existing = state.custom_field_definitions.find(
      (cf) => cf.entity_name === data.entity_name && cf.field_key === data.field_key
    );
    if (existing) {
      throw createAppError(400, 'هذا المفتاح مستخدم بالفعل لهذا الكيان', 'Field key already exists for this entity');
    }

    const newField: CustomFieldDefinition = {
      ...data,
      id: `cf-${Date.now()}`,
      created_at: toUtcIsoString(),
      updated_at: toUtcIsoString(),
      version: 1,
    };

    state.custom_field_definitions.push(newField);
    dbEngine.saveState();
    dbEngine.logAudit('custom_field_definitions', newField.id, 'INSERT', null, newField, actorId);
    return newField;
  }

  public static update(field: CustomFieldDefinition, actorId: string): CustomFieldDefinition {
    const state = dbEngine.getState();
    const existing = state.custom_field_definitions.find((cf) => cf.id === field.id);
    if (!existing) throw createAppError(404, 'الحقل غير موجود', 'Custom field not found');

    dbEngine.verifyConcurrency(existing.version, field.version);

    const oldData = { ...existing };
    existing.label_ar = field.label_ar;
    existing.label_en = field.label_en;
    existing.is_required = field.is_required;
    existing.is_active = field.is_active;
    existing.sort_order = field.sort_order;
    existing.options = field.options;
    existing.updated_at = toUtcIsoString();
    existing.version += 1;

    dbEngine.saveState();
    dbEngine.logAudit('custom_field_definitions', existing.id, 'UPDATE', oldData, existing, actorId);
    return { ...existing };
  }

  public static delete(id: string, actorId: string): void {
    const state = dbEngine.getState();
    const index = state.custom_field_definitions.findIndex((cf) => cf.id === id);
    if (index === -1) throw createAppError(404, 'الحقل غير موجود', 'Custom field not found');

    const field = state.custom_field_definitions[index];
    state.custom_field_definitions.splice(index, 1);
    dbEngine.saveState();
    dbEngine.logAudit('custom_field_definitions', id, 'DELETE', field, null, actorId);
  }
}
