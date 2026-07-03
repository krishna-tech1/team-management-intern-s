import * as bcrypt from 'bcryptjs';

/**
 * Generate default password from employee's Date of Birth
 * Format: DDMMYYYY with mixed case and special character
 * Example: DOB 1990-05-15 -> "150590@Temp"
 */
export const generateDefaultPasswordFromDOB = (dateOfBirth: Date): string => {
  if (!dateOfBirth) {
    throw new Error('Date of Birth is required to generate password');
  }

  const date = new Date(dateOfBirth);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  // Format: DDMMYY@Temp (e.g., 150590@Temp)
  const defaultPassword = `${day}${month}${year}@Temp`;
  return defaultPassword;
};

/**
 * Generate a random password with mixed case, numbers, and special characters
 */
export const generateRandomPassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@#$%^&*!';

  const allChars = uppercase + lowercase + numbers + special;

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare plain password with hashed password
 */
export const comparePasswords = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Validate password strength
 * Requirements: min 8 chars, at least one uppercase, one lowercase, one number, one special char
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
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
