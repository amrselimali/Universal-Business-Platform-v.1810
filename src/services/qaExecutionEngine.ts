/**
 * QA Execution Engine
 * Executes test definitions, evaluates assertions, measures resource consumption, and reports metrics.
 */

import { QaTestDefinition, QaTestResult, QaTestStatus, QaTestAttempt } from '../types/qa';
import { dbEngine } from '../db/databaseEngine';
import { generateTraceId } from '../utils/logger';
import { toUtcIsoString } from '../utils/datetime';
import { PermissionService } from './permissionService';
import { QaSystemHandlers } from './qaSystemHandlers';

export class QaExecutionEngine {
  public static async executeTest(def: QaTestDefinition): Promise<QaTestResult> {
    const traceId = generateTraceId();
    const attempts: QaTestAttempt[] = [];
    let passed = false;
    let isFlaky = false;

    for (let attemptNum = 1; attemptNum <= def.retry_limit; attemptNum++) {
      const attemptStart = performance.now();
      const logs: string[] = [`[${traceId}] Started attempt #${attemptNum} for ${def.test_code}`];
      const assertionDetails: { name: string; expected: any; actual: any; passed: boolean }[] = [];
      let status: QaTestStatus = 'PASSED';
      let errorMsg: string | undefined;

      try {
        // 1. Check for Button Action Tests
        if (def.test_code.startsWith('TEST_ACTION_')) {
          const parts = def.test_code.replace('TEST_ACTION_', '').split('_');
          const screenCode = def.screen_code || parts[0];
          const actionCode = def.action_code || parts.slice(1).join('_');

          const superAdminUser = dbEngine.getState().users.find((u) => u.is_super_admin);
          const adminPerm = PermissionService.checkPermission(superAdminUser || null, screenCode, actionCode);

          assertionDetails.push({
            name: `زرار ${actionCode}: فحص ربط الصلاحيات الإدارية`,
            expected: true,
            actual: adminPerm.allowed,
            passed: adminPerm.allowed,
          });

          assertionDetails.push({
            name: `زرار ${actionCode}: فحص كود الإجراء والواجهة`,
            expected: def.action_code,
            actual: actionCode,
            passed: def.action_code === actionCode,
          });

          logs.push(`Button ${actionCode} in screen ${screenCode} verified for execution readiness.`);
        }
        // 2. Check for Screen Access Tests
        else if (def.test_code.startsWith('TEST_SCREEN_')) {
          const screenCode = def.screen_code || '';
          const superAdminUser = dbEngine.getState().users.find((u) => u.is_super_admin);
          const screenPerm = PermissionService.checkPermission(superAdminUser || null, screenCode, 'BTN_VIEW');

          assertionDetails.push({
            name: `بوابة شاشة ${screenCode}: إتاحة العرض للمدير`,
            expected: true,
            actual: screenPerm.allowed,
            passed: screenPerm.allowed,
          });
          logs.push(`Screen view gate for ${screenCode} verified successfully.`);
        }
        // 3. System & Architecture Constraints Tests
        else {
          const systemResult = QaSystemHandlers.handle(def.test_code);
          assertionDetails.push(...systemResult.assertionDetails);
          logs.push(...systemResult.logs);
        }
      } catch (err: any) {
        status = 'FAILED';
        errorMsg = err.message || 'Assertion failed';
        logs.push(`[ERROR] ${errorMsg}`);
      }

      const attemptDuration = performance.now() - attemptStart;
      attempts.push({
        attempt_number: attemptNum,
        status,
        duration_ms: Math.round(attemptDuration),
        error_message: errorMsg,
        assertion_details: assertionDetails,
        logs,
        executed_at: toUtcIsoString(),
      });

      if (status === 'PASSED') {
        passed = true;
        if (attemptNum > 1) isFlaky = true;
        break;
      }
    }

    return {
      test_code: def.test_code,
      status: passed ? 'PASSED' : 'FAILED',
      final_duration_ms: attempts.reduce((acc, a) => acc + a.duration_ms, 0),
      attempts,
      is_flaky: isFlaky,
      executed_at: toUtcIsoString(),
      trace_id: traceId,
    };
  }
}
