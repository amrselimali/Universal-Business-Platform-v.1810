/**
 * Universal Business Platform - Database Entities & Schema Interfaces
 */

export interface AppSettings {
  id: string; // uuid
  company_name: string;
  logo_url: string | null;
  default_language: 'ar' | 'en';
  date_format: string;
  time_format: string;
  number_format: string;
  session_timeout_minutes: number;
  password_min_length: number;
  max_failed_attempts: number;
  lockout_minutes: number;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Branch {
  id: string; // uuid
  code: string;
  name_ar: string;
  name_en: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  custom_fields: Record<string, any>;
  search_text: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Warehouse {
  id: string; // uuid
  code: string;
  name_ar: string;
  name_en: string | null;
  is_active: boolean;
  custom_fields: Record<string, any>;
  search_text: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface WarehouseBranch {
  id: string;
  warehouse_id: string;
  branch_id: string;
}

export interface User {
  id: string;
  name: string | null;
  username: string;
  password_hash: string;
  is_active: boolean;
  language: 'ar' | 'en';
  is_admin: boolean;
  is_super_admin: boolean;
  failed_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  search_text: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  replaced_by: string | null;
  created_ip: string | null;
  created_at: string;
}

export interface UserBranch {
  id: string;
  user_id: string;
  branch_id: string;
  is_default: boolean;
}

export interface UserWarehouse {
  id: string;
  user_id: string;
  warehouse_id: string;
}

export interface Role {
  id: string;
  code: string;
  name_ar: string;
  name_en: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface RolePermission {
  id: string;
  role_id: string;
  screen_code: string;
  action_code: string;
  is_allowed: boolean;
  scope: 0 | 1 | 2; // 0 = My records, 1 = My branches, 2 = All
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  screen_code: string;
  action_code: string;
  is_allowed: boolean;
  scope: 0 | 1 | 2; // 0 = My records, 1 = My branches, 2 = All
}

export interface Currency {
  id: string;
  currency_code: string;
  name_ar: string;
  name_en: string | null;
  symbol: string | null;
  decimals: number;
  is_base: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

export type CustomFieldDataType = 'text' | 'number' | 'date' | 'bool' | 'list';

export interface CustomFieldDefinition {
  id: string;
  entity_name: 'branches' | 'warehouses' | 'users';
  field_key: string;
  label_ar: string;
  label_en: string | null;
  data_type: CustomFieldDataType;
  options: string[] | null;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  version: number;
}

export type AuditAction =
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PERMISSION_CHANGE'
  | 'PASSWORD_RESET'
  | 'MIGRATION';

export interface AuditLog {
  id: number; // bigint identity
  user_id: string | null;
  branch_id: string | null;
  table_name: string;
  record_id: string;
  action: AuditAction;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  ip_address: string | null;
  trace_id: string | null;
  created_at: string;
}
