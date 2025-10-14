import { User } from '../models/User';

/**
 * Generates a unique student code in the format ABC-123-XYZ
 * Format: 3 uppercase letters - 3 digits - 3 alphanumeric characters
 */
export function generateStudentCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  // Generate first part: 3 uppercase letters
  let part1 = '';
  for (let i = 0; i < 3; i++) {
    part1 += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate second part: 3 digits
  let part2 = '';
  for (let i = 0; i < 3; i++) {
    part2 += digits.charAt(Math.floor(Math.random() * digits.length));
  }

  // Generate third part: 3 alphanumeric characters
  let part3 = '';
  for (let i = 0; i < 3; i++) {
    part3 += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
  }

  return `${part1}-${part2}-${part3}`;
}

/**
 * Generates a unique student code that doesn't exist in the database
 */
export async function generateUniqueStudentCode(): Promise<string> {
  let code = generateStudentCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existingUser = await User.findOne({ studentCode: code });
    if (!existingUser) {
      return code;
    }
    code = generateStudentCode();
    attempts++;
  }

  throw new Error('Failed to generate unique student code after maximum attempts');
}

/**
 * Validates the format of a student code
 */
export function validateStudentCodeFormat(code: string): boolean {
  const pattern = /^[A-Z]{3}-[0-9]{3}-[A-Z0-9]{3}$/;
  return pattern.test(code);
}

