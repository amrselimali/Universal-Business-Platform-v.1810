/**
 * QA & Test Control Center v2.2 - Core Types & Definitions
 */

export type QaCategory =
  | 'UNIT'
  | 'INTEGRATION'
  | 'WORKFLOW'
  | 'SECURITY_RBAC'
  | 'DB_INTEGRITY';

export type QaTestType = 'AUTOMATED' | 'API_CONTRACT' | 'SECURITY' | 'INTEGRITY';

export type QaPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type QaTestStatus =
  | 'PASSED'
  | 'FAILED'
  | 'UNTESTED'
  | 'RUNNING'
  | 'BLOCKED'
  | 'SKIPPED'
  | 'STALE'
  | 'CANCELLED'
  | 'ERROR';

export interface QaTestDefinition {
  id: string;
  test_code: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  module_code: string;
  screen_code?: string;
  action_code?: string;
  category: QaCategory;
  test_type: QaTestType;
  priority: QaPriority;
  is_critical: boolean;
  timeout_ms: number;
  retry_limit: number;
  environment: 'LOCAL_TEST' | 'CI_TEST';
  version: number;
  tags: string[];
}

export interface QaTestAttempt {
  attempt_number: number;
  status: QaTestStatus;
  duration_ms: number;
  error_message?: string;
  assertion_details?: {
    expected: any;
    actual: any;
    passed: boolean;
    name: string;
  }[];
  logs: string[];
  executed_at: string;
}

export interface QaTestResult {
  test_code: string;
  status: QaTestStatus;
  final_duration_ms: number;
  attempts: QaTestAttempt[];
  is_flaky: boolean;
  executed_at: string;
  trace_id: string;
}

export interface QaRun {
  id: string; // run uuid
  environment: 'LOCAL_TEST' | 'CI_TEST';
  code_revision: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  started_at: string;
  completed_at?: string;
  selected_test_codes: string[];
  results: Record<string, QaTestResult>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    flaky: number;
    duration_ms: number;
  };
  quality_gates_passed: boolean;
  gate_breakdown: {
    gate_name: string;
    passed: boolean;
    reason?: string;
  }[];
}
