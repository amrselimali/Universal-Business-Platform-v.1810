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
} from '../types/entities';
import { ScreenCodes, ActionCodes } from '../types/permissions';
import { normalizeArabic } from '../utils/arabic';

export const INITIAL_SETTINGS: AppSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  company_name: 'Universal Business Platform ERP',
  logo_url: null,
  default_language: 'ar',
  date_format: 'dd/MM/yyyy',
  time_format: 'HH:mm',
  number_format: '#,##0.00',
  session_timeout_minutes: 30,
  password_min_length: 8,
  max_failed_attempts: 5,
  lockout_minutes: 15,
  created_at: '2026-10-18T00:00:00.000Z',
  updated_at: '2026-10-18T00:00:00.000Z',
  version: 1,
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    code: 'BR-CAI',
    name_ar: 'الفرع الرئيسي - القاهرة',
    name_en: 'Main Branch - Cairo',
    address: 'شارع التسعين، التجمع الخامس، القاهرة',
    phone: '+201001234567',
    is_active: true,
    custom_fields: { tax_card: '984-213-441' },
    search_text: normalizeArabic('BR-CAI الفرع الرئيسي - القاهرة Main Branch - Cairo +201001234567'),
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    code: 'BR-ALX',
    name_ar: 'فرع الإسكندرية - سموحة',
    name_en: 'Alexandria Branch - Smouha',
    address: 'شارع فوزي معاذ، سموحة، الإسكندرية',
    phone: '+201207654321',
    is_active: true,
    custom_fields: { tax_card: '984-213-442' },
    search_text: normalizeArabic('BR-ALX فرع الإسكندرية - سموحة Alexandria Branch - Smouha +201207654321'),
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000003',
    code: 'BR-GZA',
    name_ar: 'فرع الجيزة - المهندسين',
    name_en: 'Giza Branch - Mohandessin',
    address: 'شارع جامعة الدول العربية، المهندسين',
    phone: '+201115554321',
    is_active: true,
    custom_fields: {},
    search_text: normalizeArabic('BR-GZA فرع الجيزة - المهندسين Giza Branch - Mohandessin +201115554321'),
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'w1000000-0000-0000-0000-000000000001',
    code: 'WH-CENTRAL',
    name_ar: 'مستودع العبور المركزي',
    name_en: 'Obour Central Warehouse',
    is_active: true,
    custom_fields: { capacity_sqm: 4500 },
    search_text: normalizeArabic('WH-CENTRAL مستودع العبور المركزي Obour Central Warehouse'),
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
  {
    id: 'w1000000-0000-0000-0000-000000000002',
    code: 'WH-ALX',
    name_ar: 'مخزن برج العرب',
    name_en: 'Borg El Arab Warehouse',
    is_active: true,
    custom_fields: { capacity_sqm: 2200 },
    search_text: normalizeArabic('WH-ALX مخزن برج العرب Borg El Arab Warehouse'),
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
];

export const INITIAL_WAREHOUSE_BRANCHES: WarehouseBranch[] = [
  {
    id: 'wb-01',
    warehouse_id: 'w1000000-0000-0000-0000-000000000001',
    branch_id: 'b1000000-0000-0000-0000-000000000001', // WH-CENTRAL linked to Cairo
  },
  {
    id: 'wb-02',
    warehouse_id: 'w1000000-0000-0000-0000-000000000001',
    branch_id: 'b1000000-0000-0000-0000-000000000003', // WH-CENTRAL also linked to Giza
  },
  {
    id: 'wb-03',
    warehouse_id: 'w1000000-0000-0000-0000-000000000002',
    branch_id: 'b1000000-0000-0000-0000-000000000002', // WH-ALX linked to Alexandria
  },
];

export const INITIAL_CURRENCIES: Currency[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    currency_code: 'EGP',
    name_ar: 'جنيه مصري',
    name_en: 'Egyptian Pound',
    symbol: 'ج.م',
    decimals: 2,
    is_base: true,
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    currency_code: 'USD',
    name_ar: 'دولار أمريكي',
    name_en: 'US Dollar',
    symbol: '$',
    decimals: 2,
    is_base: false,
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    currency_code: 'SAR',
    name_ar: 'ريال سعودي',
    name_en: 'Saudi Riyal',
    symbol: 'ر.س',
    decimals: 2,
    is_base: false,
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u1000000-0000-0000-0000-000000000001',
    name: 'المهندس أحمد حسني (Super Admin)',
    username: 'superadmin',
    password_hash: 'Admin@123456', // Simulated hash, default credentials
    is_active: true,
    language: 'ar',
    is_admin: true,
    is_super_admin: true,
    failed_attempts: 0,
    locked_until: null,
    last_login_at: '2026-10-18T01:00:00.000Z',
    search_text: normalizeArabic('superadmin المهندس احمد حسني'),
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
  {
    id: 'u1000000-0000-0000-0000-000000000002',
    name: 'عمرو سليم (System Admin)',
    username: 'admin',
    password_hash: 'Admin@123456',
    is_active: true,
    language: 'ar',
    is_admin: true,
    is_super_admin: false,
    failed_attempts: 0,
    locked_until: null,
    last_login_at: '2026-10-18T00:30:00.000Z',
    search_text: normalizeArabic('admin عمرو سليم'),
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
  {
    id: 'u1000000-0000-0000-0000-000000000003',
    name: 'محمد خالد (مدير فرع القاهرة)',
    username: 'm_khaled',
    password_hash: 'User@123456',
    is_active: true,
    language: 'ar',
    is_admin: false,
    is_super_admin: false,
    failed_attempts: 0,
    locked_until: null,
    last_login_at: null,
    search_text: normalizeArabic('m_khaled محمد خالد'),
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
];

export const INITIAL_USER_BRANCHES: UserBranch[] = [
  {
    id: 'ub-01',
    user_id: 'u1000000-0000-0000-0000-000000000003',
    branch_id: 'b1000000-0000-0000-0000-000000000001',
    is_default: true,
  },
];

export const INITIAL_USER_WAREHOUSES: UserWarehouse[] = [
  {
    id: 'uw-01',
    user_id: 'u1000000-0000-0000-0000-000000000003',
    warehouse_id: 'w1000000-0000-0000-0000-000000000001',
  },
];

export const INITIAL_ROLES: Role[] = [
  {
    id: 'r1000000-0000-0000-0000-000000000001',
    code: 'BRANCH_MANAGER',
    name_ar: 'مدير فرع',
    name_en: 'Branch Manager',
    is_active: true,
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
  {
    id: 'r1000000-0000-0000-0000-000000000002',
    code: 'WAREHOUSE_SUPERVISOR',
    name_ar: 'أمين مخزن',
    name_en: 'Warehouse Supervisor',
    is_active: true,
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
];

export const INITIAL_ROLE_PERMISSIONS: RolePermission[] = [
  {
    id: 'rp-01',
    role_id: 'r1000000-0000-0000-0000-000000000001',
    screen_code: ScreenCodes.DASHBOARD,
    action_code: ActionCodes.VIEW,
    is_allowed: true,
    scope: 1,
  },
  {
    id: 'rp-02',
    role_id: 'r1000000-0000-0000-0000-000000000001',
    screen_code: ScreenCodes.BRANCHES_MANAGEMENT,
    action_code: ActionCodes.VIEW,
    is_allowed: true,
    scope: 1,
  },
  {
    id: 'rp-03',
    role_id: 'r1000000-0000-0000-0000-000000000001',
    screen_code: ScreenCodes.WAREHOUSES_MANAGEMENT,
    action_code: ActionCodes.VIEW,
    is_allowed: true,
    scope: 1,
  },
];

export const INITIAL_USER_ROLES: UserRole[] = [
  {
    id: 'ur-01',
    user_id: 'u1000000-0000-0000-0000-000000000003',
    role_id: 'r1000000-0000-0000-0000-000000000001',
  },
];

export const INITIAL_USER_PERMISSIONS: UserPermission[] = [];

export const INITIAL_CUSTOM_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'cf-01',
    entity_name: 'branches',
    field_key: 'tax_card',
    label_ar: 'رقم البطاقة الضريبية',
    label_en: 'Tax Card Number',
    data_type: 'text',
    options: null,
    is_required: false,
    is_active: true,
    sort_order: 1,
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
  {
    id: 'cf-02',
    entity_name: 'warehouses',
    field_key: 'capacity_sqm',
    label_ar: 'المساحة بالمتر المربع',
    label_en: 'Capacity (SQM)',
    data_type: 'number',
    options: null,
    is_required: false,
    is_active: true,
    sort_order: 1,
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    version: 1,
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    user_id: 'u1000000-0000-0000-0000-000000000001',
    branch_id: null,
    table_name: 'app_settings',
    record_id: '00000000-0000-0000-0000-000000000001',
    action: 'MIGRATION',
    old_data: null,
    new_data: { status: 'Applied 0001_initial_schema.sql, 0002_security_and_rbac.sql' },
    ip_address: '127.0.0.1',
    trace_id: 'tr-boot0000000001',
    created_at: '2026-10-18T00:00:00.000Z',
  },
  {
    id: 2,
    user_id: 'u1000000-0000-0000-0000-000000000001',
    branch_id: null,
    table_name: 'users',
    record_id: 'u1000000-0000-0000-0000-000000000001',
    action: 'LOGIN',
    old_data: null,
    new_data: { username: 'superadmin', auth_method: 'Standard' },
    ip_address: '127.0.0.1',
    trace_id: 'tr-login00000001',
    created_at: '2026-10-18T01:00:00.000Z',
  },
];
