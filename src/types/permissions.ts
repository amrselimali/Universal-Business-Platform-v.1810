/**
 * Universal Business Platform - Screens, Actions, and RBAC Definitions
 */

export const ScreenCodes = {
  DASHBOARD: 'DASHBOARD',
  BRANCHES_MANAGEMENT: 'BRANCHES_MANAGEMENT',
  WAREHOUSES_MANAGEMENT: 'WAREHOUSES_MANAGEMENT',
  USERS_MANAGEMENT: 'USERS_MANAGEMENT',
  ROLES_MANAGEMENT: 'ROLES_MANAGEMENT',
  CURRENCIES_MANAGEMENT: 'CURRENCIES_MANAGEMENT',
  CUSTOM_FIELDS_MANAGEMENT: 'CUSTOM_FIELDS_MANAGEMENT',
  APP_SETTINGS: 'APP_SETTINGS',
  AUDIT_LOG_VIEW: 'AUDIT_LOG_VIEW',
  DB_MANAGEMENT: 'DB_MANAGEMENT',
  QA_CONTROL_CENTER: 'QA_CONTROL_CENTER',
} as const;

export type ScreenCode = (typeof ScreenCodes)[keyof typeof ScreenCodes];

export const ActionCodes = {
  VIEW: 'BTN_VIEW',
  ADD: 'BTN_ADD',
  EDIT: 'BTN_EDIT',
  DELETE: 'BTN_DELETE',
  RESET_PASSWORD: 'BTN_RESET_PASSWORD',
  UNLOCK: 'BTN_UNLOCK',
  RUN_MIGRATION: 'BTN_RUN_MIGRATION',
  APPLY_SEED: 'BTN_APPLY_SEED',
  EXECUTE_TEST: 'BTN_EXECUTE_TEST',
  EXPORT_DATA: 'BTN_EXPORT_DATA',
} as const;

export type ActionCode = (typeof ActionCodes)[keyof typeof ActionCodes];

export interface ScreenMetadata {
  code: ScreenCode;
  name_ar: string;
  name_en: string;
  icon: string;
  actions: { code: ActionCode; label_ar: string; label_en: string }[];
  superAdminOnly?: boolean;
}

export const APP_SCREENS: ScreenMetadata[] = [
  {
    code: ScreenCodes.DASHBOARD,
    name_ar: 'لوحة التحكم والمؤشرات',
    name_en: 'Dashboard & KPIs',
    icon: 'LayoutDashboard',
    actions: [{ code: ActionCodes.VIEW, label_ar: 'عرض', label_en: 'View' }],
  },
  {
    code: ScreenCodes.BRANCHES_MANAGEMENT,
    name_ar: 'إدارة الفروع',
    name_en: 'Branches Management',
    icon: 'GitBranch',
    actions: [
      { code: ActionCodes.VIEW, label_ar: 'عرض', label_en: 'View' },
      { code: ActionCodes.ADD, label_ar: 'إضافة فرع', label_en: 'Add' },
      { code: ActionCodes.EDIT, label_ar: 'تعديل فرع', label_en: 'Edit' },
      { code: ActionCodes.DELETE, label_ar: 'تعطيل/حذف', label_en: 'Delete' },
    ],
  },
  {
    code: ScreenCodes.WAREHOUSES_MANAGEMENT,
    name_ar: 'إدارة المخازن',
    name_en: 'Warehouses Management',
    icon: 'Warehouse',
    actions: [
      { code: ActionCodes.VIEW, label_ar: 'عرض', label_en: 'View' },
      { code: ActionCodes.ADD, label_ar: 'إضافة مخزن', label_en: 'Add' },
      { code: ActionCodes.EDIT, label_ar: 'تعديل مخزن', label_en: 'Edit' },
      { code: ActionCodes.DELETE, label_ar: 'تعطيل/حذف', label_en: 'Delete' },
    ],
  },
  {
    code: ScreenCodes.USERS_MANAGEMENT,
    name_ar: 'إدارة المستخدمين',
    name_en: 'Users Management',
    icon: 'Users',
    actions: [
      { code: ActionCodes.VIEW, label_ar: 'عرض', label_en: 'View' },
      { code: ActionCodes.ADD, label_ar: 'إضافة مستخدم', label_en: 'Add' },
      { code: ActionCodes.EDIT, label_ar: 'تعديل مستخدم', label_en: 'Edit' },
      { code: ActionCodes.DELETE, label_ar: 'تعطيل/حذف', label_en: 'Delete' },
      { code: ActionCodes.RESET_PASSWORD, label_ar: 'إعادة تعيين كلمة المرور', label_en: 'Reset Password' },
      { code: ActionCodes.UNLOCK, label_ar: 'فك قفل الحساب', label_en: 'Unlock Account' },
    ],
  },
  {
    code: ScreenCodes.ROLES_MANAGEMENT,
    name_ar: 'إدارة الأدوار والصلاحيات',
    name_en: 'Roles & Permissions',
    icon: 'ShieldCheck',
    actions: [
      { code: ActionCodes.VIEW, label_ar: 'عرض', label_en: 'View' },
      { code: ActionCodes.ADD, label_ar: 'إضافة دور', label_en: 'Add' },
      { code: ActionCodes.EDIT, label_ar: 'تعديل دور', label_en: 'Edit' },
      { code: ActionCodes.DELETE, label_ar: 'حذف دور', label_en: 'Delete' },
    ],
  },
  {
    code: ScreenCodes.CURRENCIES_MANAGEMENT,
    name_ar: 'إدارة العملات',
    name_en: 'Currencies Management',
    icon: 'Coins',
    actions: [
      { code: ActionCodes.VIEW, label_ar: 'عرض', label_en: 'View' },
      { code: ActionCodes.ADD, label_ar: 'إضافة عملة', label_en: 'Add' },
      { code: ActionCodes.EDIT, label_ar: 'تعديل عملة', label_en: 'Edit' },
      { code: ActionCodes.DELETE, label_ar: 'حذف عملة', label_en: 'Delete' },
    ],
  },
  {
    code: ScreenCodes.CUSTOM_FIELDS_MANAGEMENT,
    name_ar: 'تعريف الحقول المخصصة',
    name_en: 'Custom Field Definitions',
    icon: 'Sliders',
    actions: [
      { code: ActionCodes.VIEW, label_ar: 'عرض', label_en: 'View' },
      { code: ActionCodes.ADD, label_ar: 'إضافة حقل', label_en: 'Add' },
      { code: ActionCodes.EDIT, label_ar: 'تعديل حقل', label_en: 'Edit' },
      { code: ActionCodes.DELETE, label_ar: 'حذف حقل', label_en: 'Delete' },
    ],
  },
  {
    code: ScreenCodes.APP_SETTINGS,
    name_ar: 'الإعدادات الأساسية للنظام',
    name_en: 'System Settings',
    icon: 'Settings',
    actions: [
      { code: ActionCodes.VIEW, label_ar: 'عرض', label_en: 'View' },
      { code: ActionCodes.EDIT, label_ar: 'تعديل الإعدادات', label_en: 'Edit' },
    ],
  },
  {
    code: ScreenCodes.AUDIT_LOG_VIEW,
    name_ar: 'سجل الأنشطة والأمان',
    name_en: 'Audit & Security Log',
    icon: 'FileText',
    actions: [
      { code: ActionCodes.VIEW, label_ar: 'عرض السجل', label_en: 'View' },
      { code: ActionCodes.EXPORT_DATA, label_ar: 'تصدير', label_en: 'Export' },
    ],
  },
  {
    code: ScreenCodes.DB_MANAGEMENT,
    name_ar: 'إدارة قاعدة البيانات',
    name_en: 'Database & Updates',
    icon: 'Database',
    superAdminOnly: true,
    actions: [
      { code: ActionCodes.VIEW, label_ar: 'عرض الجداول', label_en: 'View' },
      { code: ActionCodes.RUN_MIGRATION, label_ar: 'تنفيذ التحديثات', label_en: 'Run Migrations' },
      { code: ActionCodes.APPLY_SEED, label_ar: 'توليد البيانات الأولية', label_en: 'Run Seeder' },
      { code: ActionCodes.EDIT, label_ar: 'تعديل صفوف الجدول', label_en: 'Edit Row' },
      { code: ActionCodes.DELETE, label_ar: 'حذف صف', label_en: 'Delete Row' },
    ],
  },
  {
    code: ScreenCodes.QA_CONTROL_CENTER,
    name_ar: 'مركز اختبارات الجودة',
    name_en: 'QA & Test Control Center',
    icon: 'CheckCheck',
    actions: [
      { code: ActionCodes.VIEW, label_ar: 'عرض مصفوفة الاختبارات', label_en: 'View Matrix' },
      { code: ActionCodes.EXECUTE_TEST, label_ar: 'تشغيل الاختبارات', label_en: 'Run Tests' },
    ],
  },
];
