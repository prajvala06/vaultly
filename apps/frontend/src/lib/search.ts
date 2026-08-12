const COMPLETE_EMAIL_PATTERN: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isCompleteEmail(value: string): boolean {
  return COMPLETE_EMAIL_PATTERN.test(value.trim());
}
