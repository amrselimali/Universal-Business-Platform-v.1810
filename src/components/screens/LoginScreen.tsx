import React, { useState } from 'react';
import { Layers, Lock, User, AlertCircle, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SettingsService } from '../../services/settingsService';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const settings = SettingsService.get();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Simulate small network delay for realism
      await new Promise((res) => setTimeout(res, 200));
      login(username, password);
    } catch (err: any) {
      setErrorMessage(
        err.userMessageAr
          ? t(err.userMessageAr, err.userMessageEn)
          : err.message || t('اسم المستخدم أو كلمة المرور غير صحيحة', 'Invalid username or password')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md mb-4 shadow-lg border border-white/20">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">{settings.company_name}</h2>
          <p className="text-xs text-indigo-100 mt-1 opacity-90">
            {t('المنصة المتكاملة لإدارة موارد الشركات والمؤسسات', 'Universal Business ERP Platform')}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              {t('تسجيل الدخول للمنظومة', 'Sign In to Platform')}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t('أدخل اسم المستخدم وكلمة المرور الخاصة بك للمتابعة', 'Enter your credentials to continue')}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('اسم المستخدم', 'Username')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. superadmin, admin"
                  className="w-full ps-10 pe-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('كلمة المرور', 'Password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full ps-10 pe-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? t('جاري التحقق...', 'Authenticating...') : t('دخول النظام', 'Sign In')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>

          {/* Quick Credential Presets for Testability */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('حسابات تجريبية مهيأة مسبقاً (انقر للملء التلقائي):', 'Preset Demo Accounts:')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin', 'Admin@123456')}
                className="p-2 text-start rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
              >
                <div className="font-bold text-slate-800">superadmin</div>
                <div className="text-[10px] text-slate-500">Super Admin (All Privileges)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'Admin@123456')}
                className="p-2 text-start rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
              >
                <div className="font-bold text-slate-800">admin</div>
                <div className="text-[10px] text-slate-500">Admin (System Admin)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('m_khaled', 'User@123456')}
                className="col-span-2 p-2 text-start rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
              >
                <div className="font-bold text-slate-800">m_khaled</div>
                <div className="text-[10px] text-slate-500">
                  {t('مدير فرع القاهرة (صلاحيات مخصصة مقيدة بالفرع)', 'Cairo Branch Manager (Restricted)')}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
