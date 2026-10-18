import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, ShieldAlert, Clock, Building } from 'lucide-react';
import { AppSettings } from '../../types/entities';
import { ScreenCodes, ActionCodes } from '../../types/permissions';
import { SettingsService } from '../../services/settingsService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';

export const SettingsScreen: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();

  const [settings, setSettings] = useState<AppSettings>(SettingsService.get());
  const [formData, setFormData] = useState<AppSettings>(settings);

  useEffect(() => {
    const s = SettingsService.get();
    setSettings(s);
    setFormData(s);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const updated = SettingsService.update(formData, user.id);
      setSettings(updated);
      setFormData(updated);
      showSuccess(t('تم حفظ إعدادات المنظومة بنجاح', 'Settings saved successfully'));
    } catch (err: any) {
      showError(t('تعذر حفظ الإعدادات', 'Failed to save settings'), err.userMessageAr ? t(err.userMessageAr, err.userMessageEn) : err.message, err.traceId);
    }
  };

  const canEdit = hasPermission(ScreenCodes.APP_SETTINGS, ActionCodes.EDIT);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-600" />
          <span>{t('الإعدادات الأساسية للمنظومة (app_settings)', 'System Settings')}</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('تخصيص هوية المنظومة، وسياسات الأمان وقفل الحسابات، ومدد الجلسات وتنسيقات الوقت', 'Configure company identity, lockout policies, and time formats')}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>{t('هوية المؤسسة واللغة الافتراضية', 'Organization Identity & Localization')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('اسم الشركة / المؤسسة', 'Company Name')} *</label>
              <input type="text" required disabled={!canEdit} value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('رابط اللوجو (logo_url)', 'Logo URL')}</label>
              <input type="text" disabled={!canEdit} value={formData.logo_url || ''} onChange={(e) => setFormData({ ...formData, logo_url: e.target.value || null })} placeholder="https://example.com/logo.png" className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl disabled:bg-slate-50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('اللغة الافتراضية للمنظومة', 'Default Language')}</label>
              <select disabled={!canEdit} value={formData.default_language} onChange={(e) => setFormData({ ...formData, default_language: e.target.value as any })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl disabled:bg-slate-50">
                <option value="ar">العربية (Arabic - RTL)</option>
                <option value="en">English (LTR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Lockout Policy */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>{t('سياسات الأمان وقفل الحسابات (Account Lockout Policy)', 'Security & Lockout Policies')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('الحد الأدنى لكلمة المرور (لا يقل عن 8)', 'Min Password Length (>= 8)')} *
              </label>
              <input type="number" min={8} max={32} required disabled={!canEdit} value={formData.password_min_length} onChange={(e) => setFormData({ ...formData, password_min_length: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono disabled:bg-slate-50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('محاولات الدخول الفاشلة قبل القفل', 'Max Failed Attempts')} *
              </label>
              <input type="number" min={1} max={10} required disabled={!canEdit} value={formData.max_failed_attempts} onChange={(e) => setFormData({ ...formData, max_failed_attempts: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono disabled:bg-slate-50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('مدة قفل الحساب (بالدقائق)', 'Lockout Duration (Minutes)')} *
              </label>
              <input type="number" min={1} max={120} required disabled={!canEdit} value={formData.lockout_minutes} onChange={(e) => setFormData({ ...formData, lockout_minutes: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono disabled:bg-slate-50" />
            </div>
          </div>
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
            {t('ملاحظة أمان: عند تجاوز الحد الأقصى لمحاولات الدخول الفاشلة، يُقفل الحساب مؤقتاً بالدقائق المحددة، وتبقى رسالة تسجيل الدخول موحدة تماماً لمنع هجمات الاستكشاف والتخمين.', 'Security note: Accounts lock automatically upon exceeding max failed attempts, and the system continues returning uniform non-revealing error messages.')}
          </p>
        </div>

        {/* Formats & Timeouts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>{t('تنسيقات الوقت والأرقام وفترة الجلسة', 'Session & Formats')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('انتهاء الجلسة (دقائق خمول)', 'Session Timeout (Mins)')}</label>
              <input type="number" min={5} max={480} required disabled={!canEdit} value={formData.session_timeout_minutes} onChange={(e) => setFormData({ ...formData, session_timeout_minutes: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono disabled:bg-slate-50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('تنسيق التاريخ', 'Date Format')}</label>
              <input type="text" required disabled={!canEdit} value={formData.date_format} onChange={(e) => setFormData({ ...formData, date_format: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono disabled:bg-slate-50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('تنسيق الوقت', 'Time Format')}</label>
              <input type="text" required disabled={!canEdit} value={formData.time_format} onChange={(e) => setFormData({ ...formData, time_format: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono disabled:bg-slate-50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('تنسيق الأرقام', 'Number Format')}</label>
              <input type="text" required disabled={!canEdit} value={formData.number_format} onChange={(e) => setFormData({ ...formData, number_format: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono disabled:bg-slate-50" />
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center justify-end">
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all">
              <Save className="w-4 h-4" />
              <span>{t('حفظ التعديلات', 'Save Settings')}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
