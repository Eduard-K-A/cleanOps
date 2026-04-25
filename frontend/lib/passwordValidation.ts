/**
 * Password Validation Utility
 * Implements strict password requirements for security
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number; // 0-100
}

const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: /[A-Z]/,
  REQUIRE_LOWERCASE: /[a-z]/,
  REQUIRE_NUMBER: /[0-9]/,
  REQUIRE_SPECIAL: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  NO_SPACES: /\s/,
  NO_COMMON_PATTERNS: [
    /sequential[0-9]{4}$/i,
    /^[a-z]{3}[0-9]{3}$/i, // like abc123
  ],
};

/**
 * Validates a password against strict security requirements
 * @param password - The password to validate
 * @returns PasswordValidationResult object with validation details
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check if password is empty or null
  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak',
      score: 0,
    };
  }

  // Rule 1: Minimum length
  if (password.length < PASSWORD_RULES.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_RULES.MIN_LENGTH} characters long`);
  } else {
    score += 15;
    // Bonus points for longer passwords
    if (password.length >= 12) score += 5;
    if (password.length >= 16) score += 5;
  }

  // Rule 2: No spaces
  if (PASSWORD_RULES.NO_SPACES.test(password)) {
    errors.push('Password cannot contain spaces');
  } else {
    score += 5;
  }

  // Rule 3: Uppercase letters
  if (!PASSWORD_RULES.REQUIRE_UPPERCASE.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  } else {
    score += 20;
  }

  // Rule 4: Lowercase letters
  if (!PASSWORD_RULES.REQUIRE_LOWERCASE.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  } else {
    score += 20;
  }

  // Rule 5: Numbers
  if (!PASSWORD_RULES.REQUIRE_NUMBER.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  } else {
    score += 20;
  }

  // Rule 6: Special characters
  if (!PASSWORD_RULES.REQUIRE_SPECIAL.test(password)) {
    errors.push(
      'Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)'
    );
  } else {
    score += 20;
  }

  // Rule 7: No common patterns
  for (const pattern of PASSWORD_RULES.NO_COMMON_PATTERNS) {
    if (pattern.test(password)) {
      errors.push('Password contains a common pattern. Please use a more unique password');
      break;
    }
  }

  // Rule 8: Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain the same character repeated 3 or more times');
  } else {
    score += 5;
  }

  // Determine strength based on score
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 40) {
    strength = 'weak';
  } else if (score < 60) {
    strength = 'fair';
  } else if (score < 80) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  // Clamp score to 0-100
  score = Math.min(Math.max(score, 0), 100);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

/**
 * Gets a user-friendly description of password strength
 */
export function getPasswordStrengthLabel(strength: string): string {
  switch (strength) {
    case 'weak':
      return 'Weak - Does not meet security requirements';
    case 'fair':
      return 'Fair - Consider adding more complexity';
    case 'good':
      return 'Good - Strong password';
    case 'strong':
      return 'Strong - Excellent security';
    default:
      return 'Unknown';
  }
}

/**
 * Get color for password strength indicator
 */
export function getPasswordStrengthColor(strength: string): string {
  switch (strength) {
    case 'weak':
      return '#ef4444'; // red
    case 'fair':
      return '#f97316'; // orange
    case 'good':
      return '#eab308'; // yellow
    case 'strong':
      return '#22c55e'; // green
    default:
      return '#6b7280'; // gray
  }
}
