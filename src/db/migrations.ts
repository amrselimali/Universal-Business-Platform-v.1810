/**
 * Universal Business Platform - DbUp Migration Scripts
 * Numbered SQL scripts (0001_xxx.sql, 0002_xxx.sql...) executed in sequence
 */

export interface DbMigration {
  script_name: string;
  applied_at: string | null;
  status: 'PENDING' | 'APPLIED' | 'FAILED';
  description_ar: string;
  description_en: string;
  sql: string;
}

export const DB_MIGRATIONS: DbMigration[] = [
  {
    script_name: '0001_initial_schema.sql',
    applied_at: '2026-10-18T00:00:00.000Z',
    status: 'APPLIED',
    description_ar: 'إنشاء الجداول الأساسية (الإعدادات، الفروع، المخازن، المستخدمين، العملات، الأدوار)',
    description_en: 'Create initial core schema (app_settings, branches, warehouses, users, currencies, roles)',
    sql: `-- 0001_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name character varying(255) NOT NULL,
  logo_url character varying(500),
  default_language character varying(10) NOT NULL DEFAULT 'ar',
  date_format character varying(30) NOT NULL DEFAULT 'dd/MM/yyyy',
  time_format character varying(30) NOT NULL DEFAULT 'HH:mm',
  number_format character varying(30) NOT NULL DEFAULT '#,##0.00',
  session_timeout_minutes smallint NOT NULL DEFAULT 30,
  password_min_length smallint NOT NULL DEFAULT 8,
  max_failed_attempts smallint NOT NULL DEFAULT 5,
  lockout_minutes smallint NOT NULL DEFAULT 15,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX idx_app_settings_singleton ON app_settings ((true));

CREATE TABLE branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code character varying(30) UNIQUE NOT NULL,
  name_ar character varying(255) NOT NULL,
  name_en character varying(255),
  address character varying(500),
  phone character varying(50),
  is_active boolean NOT NULL DEFAULT true,
  custom_fields jsonb NOT NULL DEFAULT '{}',
  search_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1
);

CREATE TABLE warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code character varying(30) UNIQUE NOT NULL,
  name_ar character varying(255) NOT NULL,
  name_en character varying(255),
  is_active boolean NOT NULL DEFAULT true,
  custom_fields jsonb NOT NULL DEFAULT '{}',
  search_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1
);

CREATE TABLE warehouse_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  UNIQUE(warehouse_id, branch_id)
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name character varying(255),
  username character varying(150) NOT NULL,
  password_hash character varying(255) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  language character varying(10) NOT NULL DEFAULT 'ar',
  is_admin boolean NOT NULL DEFAULT false,
  is_super_admin boolean NOT NULL DEFAULT false,
  failed_attempts smallint NOT NULL DEFAULT 0,
  locked_until timestamp with time zone,
  last_login_at timestamp with time zone,
  search_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  CHECK (NOT is_super_admin OR is_admin)
);
CREATE UNIQUE INDEX idx_users_username_lower ON users (lower(username));`,
  },
  {
    script_name: '0002_security_and_rbac.sql',
    applied_at: '2026-10-18T00:00:01.000Z',
    status: 'APPLIED',
    description_ar: 'جداول الصلاحيات والأدوار ورموز التحديث وسجل الأنشطة',
    description_en: 'Security, refresh tokens, roles, user permissions and audit log',
    sql: `-- 0002_security_and_rbac.sql
CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash character varying(255) UNIQUE NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  revoked_at timestamp with time zone,
  replaced_by uuid REFERENCES refresh_tokens(id) ON DELETE SET NULL,
  created_ip inet,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code character varying(50) UNIQUE NOT NULL,
  name_ar character varying(255) NOT NULL,
  name_en character varying(255),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1
);

CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  screen_code character varying(100) NOT NULL,
  action_code character varying(100) NOT NULL,
  is_allowed boolean NOT NULL DEFAULT true,
  scope smallint NOT NULL DEFAULT 1 CHECK (scope IN (0,1,2)),
  UNIQUE (role_id, screen_code, action_code)
);

CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE (user_id, role_id)
);

CREATE TABLE user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  screen_code character varying(100) NOT NULL,
  action_code character varying(100) NOT NULL,
  is_allowed boolean NOT NULL DEFAULT true,
  scope smallint NOT NULL DEFAULT 1 CHECK (scope IN (0,1,2)),
  UNIQUE (user_id, screen_code, action_code)
);

CREATE TABLE user_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  is_default boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, branch_id)
);

CREATE TABLE user_warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  UNIQUE (user_id, warehouse_id)
);

CREATE TABLE currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code character(3) UNIQUE NOT NULL,
  name_ar character varying(100) UNIQUE NOT NULL,
  name_en character varying(100) UNIQUE,
  symbol character varying(10),
  decimals smallint NOT NULL DEFAULT 2,
  is_base boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX idx_currencies_single_base ON currencies (is_base) WHERE is_base;

CREATE TABLE audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  table_name character varying(100) NOT NULL,
  record_id character varying(100) NOT NULL,
  action character varying(20) NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','LOGIN_FAILED','PERMISSION_CHANGE','PASSWORD_RESET','MIGRATION')),
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  trace_id character varying(64),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);`,
  },
  {
    script_name: '0003_custom_fields.sql',
    applied_at: '2026-10-18T00:00:02.000Z',
    status: 'APPLIED',
    description_ar: 'جدول تعريف الحقول المخصصة والدوال المساعدة',
    description_en: 'Custom field definitions schema and helper constraints',
    sql: `-- 0003_custom_fields.sql
CREATE TABLE custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name character varying(100) NOT NULL,
  field_key character varying(60) NOT NULL CHECK (field_key ~ '^[a-z][a-z0-9_]*$'),
  label_ar character varying(255) NOT NULL,
  label_en character varying(255),
  data_type character varying(20) NOT NULL CHECK (data_type IN ('text', 'number', 'date', 'bool', 'list')),
  options jsonb,
  is_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (entity_name, field_key)
);`,
  },
];
