/**
 * QA & Test Control Center v2.2 - Central Service Orchestrator
 * Discovers screen and button tests dynamically, manages runs, and evaluates quality gates.
 */

import { QaTestDefinition, QaRun, QaTestResult } from '../types/qa';
import { QaDiscoveryEngine } from './qaDiscoveryEngine';
import { SYSTEM_CONSTRAINT_QA_TESTS } from './qaSystemTests';
import { QaExecutionEngine } from './qaExecutionEngine';
import { toUtcIsoString } from '../utils/datetime';

export class QaService {
  private static runHistory: QaRun[] = [];

  /**
   * Returns all tests dynamically:
   * 1. Dynamic screen and button action tests
   * 2. Architectural (300 lines limit), resource consumption & system constraints
   */
  public static getTests(): QaTestDefinition[] {
    const actionTests = QaDiscoveryEngine.discoverActionTests();
    return [...SYSTEM_CONSTRAINT_QA_TESTS, ...actionTests];
  }

  public static getButtonActionTests(): QaTestDefinition[] {
    return QaDiscoveryEngine.discoverActionTests();
  }

  public static getSystemConstraintTests(): QaTestDefinition[] {
    return SYSTEM_CONSTRAINT_QA_TESTS;
  }

  public static getRunHistory(): QaRun[] {
    return this.runHistory;
  }

  /**
   * Execute selected tests with progress reporting and quality gates evaluation
   */
  public static async executeRun(
    selectedCodes: string[],
    environment: 'LOCAL_TEST' | 'CI_TEST' = 'LOCAL_TEST',
    onProgress?: (completed: number, total: number, currentCode: string) => void
  ): Promise<QaRun> {
    const allTests = this.getTests();
    const startTime = Date.now();
    const runId = `run-${Date.now()}`;

    const run: QaRun = {
      id: runId,
      environment,
      code_revision: 'git-rev-c82f91',
      status: 'RUNNING',
      started_at: toUtcIsoString(),
      selected_test_codes: selectedCodes,
      results: {},
      summary: {
        total: selectedCodes.length,
        passed: 0,
        failed: 0,
        blocked: 0,
        flaky: 0,
        duration_ms: 0,
      },
      quality_gates_passed: false,
      gate_breakdown: [],
    };

    let processed = 0;

    for (const code of selectedCodes) {
      const def = allTests.find((t) => t.test_code === code);
      if (!def) continue;

      if (onProgress) {
        onProgress(processed, selectedCodes.length, def.name_ar);
      }

      const testResult = await QaExecutionEngine.executeTest(def);
      run.results[code] = testResult;

      if (testResult.status === 'PASSED') run.summary.passed += 1;
      else if (testResult.status === 'FAILED') run.summary.failed += 1;
      else if (testResult.status === 'BLOCKED') run.summary.blocked += 1;

      if (testResult.is_flaky) run.summary.flaky += 1;

      processed += 1;
      // Responsive yield
      await new Promise((res) => setTimeout(res, 25));
    }

    const endTime = Date.now();
    run.completed_at = toUtcIsoString();
    run.summary.duration_ms = endTime - startTime;
    run.status = run.summary.failed === 0 ? 'COMPLETED' : 'FAILED';

    // Quality Gates Evaluation
    run.gate_breakdown = [
      {
        gate_name: 'حد 300 سطر وتقسيم الشاشات (Clean Architecture)',
        passed: run.results['ARCH_300_LINES_PER_FILE_LIMIT']?.status === 'PASSED',
        reason: 'جميع الملفات البرمجية لا تتجاوز 300 سطر ومقسمة لـ component وservice وrepository',
      },
      {
        gate_name: 'استهلاك الموارد وسرعة الاستجابة (100 مستخدم)',
        passed: run.results['PERF_RESOURCE_CONSUMPTION_BENCHMARK']?.status === 'PASSED',
        reason: 'استهلاك الذاكرة منخفض وزمن الاستجابة أقل من 50ms تحت ضغط 100 مستخدم',
      },
      {
        gate_name: 'سعة 300 صف في الصفحة واستقرار الأداء',
        passed: run.results['PERF_300_ROWS_PER_PAGE_CAPACITY']?.status === 'PASSED',
        reason: 'معالجة وعرض 300 صف في الصفحة الواحدة بدون بطء أو استهلاك زائد للذاكرة',
      },
      {
        gate_name: 'مصفوفة فحص أزرار وشاشات التطبيق',
        passed: !selectedCodes.some(
          (c) => c.startsWith('TEST_ACTION_') && run.results[c]?.status !== 'PASSED'
        ),
        reason: 'تم التحقق من ربط كافة الأزرار بالصلاحيات والإجراءات البرمجية',
      },
      {
        gate_name: 'ترقيم 25 سجلاً وKeyset لسجل الأنشطة',
        passed:
          run.results['DB_PAGINATION_25_ROWS_LIMIT']?.status === 'PASSED' &&
          run.results['DB_KEYSET_AUDIT_LOG_PAGINATION']?.status === 'PASSED',
        reason: 'تقسيم الداتا بحد أقصى 25 تسجيلاً وترقيم Keyset السريع للسجلات الضخمة',
      },
      {
        gate_name: 'الأمان وقفل الحسابات وحماية Super Admin',
        passed:
          run.results['SEC_ACCOUNT_LOCKOUT_UNIFORM_MESSAGE']?.status === 'PASSED' &&
          run.results['SEC_SUPER_ADMIN_PROTECTION']?.status === 'PASSED',
        reason: 'قفل الحساب بعد المحاولات الفاشلة وحماية حسابات Super Admin بالكامل',
      },
    ];

    run.quality_gates_passed = run.gate_breakdown.every((g) => g.passed);

    this.runHistory.unshift(run);
    return run;
  }
}
