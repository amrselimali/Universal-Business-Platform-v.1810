/**
 * QA Dynamic Discovery Engine
 * Automatically discovers all registered screens and buttons from APP_SCREENS
 * and dynamically constructs test definitions for every screen and every action button.
 */

import { APP_SCREENS } from '../types/permissions';
import { QaTestDefinition } from '../types/qa';

export class QaDiscoveryEngine {
  /**
   * Dynamically constructs tests for every screen and every single button
   */
  public static discoverActionTests(): QaTestDefinition[] {
    const discoveredTests: QaTestDefinition[] = [];

    APP_SCREENS.forEach((screen) => {
      // 1. Screen View / Accessibility Test
      discoveredTests.push({
        id: `t-screen-${screen.code.toLowerCase()}`,
        test_code: `TEST_SCREEN_${screen.code}_ACCESS`,
        name_ar: `فحص إتاحة شاشة: ${screen.name_ar}`,
        name_en: `Screen Gate: ${screen.name_en}`,
        description_ar: `التحقق من صحة تحميل مكونات الشاشة، وتطبيق قيود الأمان والصلاحيات المطلوبة`,
        description_en: `Validate screen accessibility and permission enforcement for ${screen.code}`,
        module_code: screen.code,
        screen_code: screen.code,
        category: 'WORKFLOW',
        test_type: 'AUTOMATED',
        priority: screen.superAdminOnly ? 'CRITICAL' : 'HIGH',
        is_critical: screen.superAdminOnly ?? false,
        timeout_ms: 1000,
        retry_limit: 1,
        environment: 'LOCAL_TEST',
        version: 1,
        tags: ['screen_gate', screen.code.toLowerCase()],
      });

      // 2. Action Buttons Tests for this Screen
      screen.actions.forEach((act) => {
        discoveredTests.push({
          id: `t-btn-${screen.code.toLowerCase()}-${act.code.toLowerCase()}`,
          test_code: `TEST_ACTION_${screen.code}_${act.code}`,
          name_ar: `فحص زرار [${act.label_ar}] بشاشة ${screen.name_ar}`,
          name_en: `Button Action [${act.label_en}] in ${screen.name_en}`,
          description_ar: `فحص استجابة الزرار ${act.code}، والتحقق من الصلاحية على السيرفر وتنفيذ الأمر`,
          description_en: `Verify click handler, server authorization, and execution for ${screen.code}.${act.code}`,
          module_code: screen.code,
          screen_code: screen.code,
          action_code: act.code,
          category: 'SECURITY_RBAC',
          test_type: 'AUTOMATED',
          priority: act.code.includes('DELETE') || act.code.includes('RESET') ? 'CRITICAL' : 'HIGH',
          is_critical: act.code.includes('DELETE') || act.code.includes('RUN_MIGRATION'),
          timeout_ms: 1200,
          retry_limit: 1,
          environment: 'LOCAL_TEST',
          version: 1,
          tags: ['button_test', screen.code.toLowerCase(), act.code.toLowerCase()],
        });
      });
    });

    return discoveredTests;
  }
}
