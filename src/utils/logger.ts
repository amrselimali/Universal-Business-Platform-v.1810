/**
 * Serilog-style structured logger with Trace ID generation
 * Generates unique trace IDs and sanitizes sensitive data (passwords, tokens)
 */

export function generateTraceId(): string {
  const chars = 'abcdef0123456789';
  let trace = 'tr-';
  for (let i = 0; i < 16; i++) {
    trace += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return trace;
}

export function sanitizeRecordData(data: Record<string, any> | null | undefined): Record<string, any> | null {
  if (!data) return null;
  const clone = { ...data };

  // Strict exclusion of passwords and tokens
  const sensitiveKeys = ['password', 'password_hash', 'token', 'token_hash', 'secret'];
  for (const key of Object.keys(clone)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      delete clone[key];
    }
  }
  return clone;
}

export interface AppError {
  traceId: string;
  userMessageAr: string;
  userMessageEn: string;
  statusCode: number;
  internalDetails?: string;
}

export function createAppError(
  statusCode: number,
  userMessageAr: string,
  userMessageEn: string,
  internalDetails?: string
): AppError {
  const traceId = generateTraceId();
  // Log structured diagnostic entry
  console.error(`[UBP-ERROR] [${traceId}] (${statusCode}) ${userMessageEn}:`, internalDetails || '');
  return {
    traceId,
    userMessageAr,
    userMessageEn,
    statusCode,
    internalDetails,
  };
}
