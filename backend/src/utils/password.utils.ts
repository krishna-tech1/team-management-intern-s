import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Hash password using bcrypt (12 rounds)
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

/**
 * Compare plain password with hashed password
 */
export const comparePassword = async (
  plain: string,
  hashed: string
): Promise<boolean> => {
  return bcrypt.compare(plain, hashed);
};

// Alias for compatibility
export const comparePasswords = comparePassword;

/**
 * Generate a crypto secure random password with mixed case, numbers, and special characters
 * Policy: Minimum 12 characters, Uppercase, Lowercase, Number, Special character
 */
export const generateRandomPassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@#$%^&*!';

  if (length < 12) {
    length = 12;
  }

  // Ensure at least one character from each required set
  const chars = [
    uppercase[crypto.randomInt(0, uppercase.length)],
    lowercase[crypto.randomInt(0, lowercase.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    special[crypto.randomInt(0, special.length)],
  ];

  const allChars = uppercase + lowercase + numbers + special;
  for (let i = chars.length; i < length; i++) {
    chars.push(allChars[crypto.randomInt(0, allChars.length)]);
  }

  // Fisher-Yates shuffle using secure random ints
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const temp = chars[i];
    chars[i] = chars[j];
    chars[j] = temp;
  }

  return chars.join('');
};

/**
 * Validate password strength
 * Requirements: min 12 chars, at least one uppercase, one lowercase, one number, one special char
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[@#$%^&*!]/.test(password)) {
    errors.push('Password must contain at least one special character (@#$%^&*!)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};