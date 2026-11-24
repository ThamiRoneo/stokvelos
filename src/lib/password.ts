/** PRD §5: at least 8 characters, including at least 1 number. */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /\d/.test(password);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
