/**
 * DateTime utilities for Universal Business Platform
 * Dates are stored in UTC ISO string, and displayed in Cairo Timezone (Africa/Cairo)
 */

export function toUtcIsoString(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Format a UTC ISO timestamp to Cairo Local Time (Africa/Cairo)
 */
export function formatCairoDateTime(
  utcIsoString: string | null | undefined,
  includeSeconds = false
): string {
  if (!utcIsoString) return '—';

  try {
    const date = new Date(utcIsoString);
    if (isNaN(date.getTime())) return '—';

    // Format using Cairo timezone
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Cairo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: false,
    });

    return formatter.format(date).replace(',', '');
  } catch (err) {
    return utcIsoString;
  }
}

/**
 * Format a UTC ISO timestamp to Cairo Date only (dd/MM/yyyy)
 */
export function formatCairoDate(utcIsoString: string | null | undefined): string {
  if (!utcIsoString) return '—';
  try {
    const date = new Date(utcIsoString);
    if (isNaN(date.getTime())) return '—';

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Cairo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return formatter.format(date);
  } catch {
    return utcIsoString;
  }
}

/**
 * Format a UTC ISO timestamp to Cairo Time only (HH:mm)
 */
export function formatCairoTime(utcIsoString: string | null | undefined): string {
  if (!utcIsoString) return '—';
  try {
    const date = new Date(utcIsoString);
    if (isNaN(date.getTime())) return '—';

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(date);
  } catch {
    return utcIsoString;
  }
}
