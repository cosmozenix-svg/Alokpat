/**
 * Validation utilities for Bangladeshi phone numbers and real email addresses
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string; // 11-digit clean format e.g. "01712345678"
  formatted: string;  // Formatted string e.g. "(+88)01712345678"
  digitsCount: number;
  error?: string;
}

/**
 * Extracts and cleans the Bangladeshi phone digits.
 * Strips non-digits, strips leading +88 or 88 if present, and clamps to 11 digits.
 */
export function cleanBangladeshiPhoneDigits(input: string): string {
  if (!input) return '';
  // Remove non-digit characters
  let digits = input.replace(/\D/g, '');
  // If user pasted or typed 8801..., strip the leading country code 88
  if (digits.startsWith('8801') && digits.length >= 13) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 11);
}

/**
 * Validates that a phone number is an 11-digit Bangladeshi mobile number starting with "01"
 * Examples: 017XXXXXXXX, 018XXXXXXXX, 019XXXXXXXX, 013XXXXXXXX, etc.
 */
export function validateBangladeshiPhone(input: string): PhoneValidationResult {
  const digits = cleanBangladeshiPhoneDigits(input);

  if (!digits) {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      digitsCount: 0,
      error: 'Phone number is required. Please enter an 11-digit Bangladeshi number starting with "01".',
    };
  }

  if (!digits.startsWith('01')) {
    return {
      isValid: false,
      normalized: digits,
      formatted: `(+88)${digits}`,
      digitsCount: digits.length,
      error: 'Bangladeshi phone numbers must start with "01" [(+88)01XXXXXXXXX].',
    };
  }

  if (digits.length < 11) {
    return {
      isValid: false,
      normalized: digits,
      formatted: `(+88)${digits}`,
      digitsCount: digits.length,
      error: `Must be exactly 11 digits (${digits.length}/11 entered, ${11 - digits.length} more numbers needed).`,
    };
  }

  // Exact 11 digits starting with 01
  return {
    isValid: true,
    normalized: digits,
    formatted: `(+88)${digits}`,
    digitsCount: 11,
  };
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates that an email is a real, properly formed email with a valid domain.
 * Rejects incomplete or fake emails like "as@a", "test@test", "a@b".
 * Accepts standard email providers such as @gmail.com, @yahoo.com, @outlook.com,
 * @hotmail.com, @icloud.com, corporate and academic domains with valid TLDs.
 */
export function validateRealEmail(email: string): EmailValidationResult {
  const clean = email.trim().toLowerCase();
  if (!clean) {
    return { isValid: false, error: 'Email address is required.' };
  }

  // Must contain exactly one @
  const atParts = clean.split('@');
  if (atParts.length !== 2) {
    return { isValid: false, error: 'Please enter a valid email with a single "@" (e.g. user@gmail.com).' };
  }

  const [localPart, domainPart] = atParts;

  // Local part validation (at least 2 chars, valid characters)
  if (!localPart || localPart.length < 2) {
    return { isValid: false, error: 'Email username before "@" must have at least 2 characters.' };
  }

  if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
    return { isValid: false, error: 'Email contains invalid characters before "@".' };
  }

  // Domain part validation (must contain a dot and not be dummy like "a")
  if (!domainPart || !domainPart.includes('.')) {
    return {
      isValid: false,
      error: 'Please enter a proper email with a domain extension like @gmail.com, @yahoo.com, or @outlook.com.',
    };
  }

  const domainSegments = domainPart.split('.');
  const domainName = domainSegments[0];
  const tld = domainSegments[domainSegments.length - 1];

  // Domain name before the dot must have at least 2 characters (reject "a" in "as@a")
  if (!domainName || domainName.length < 2) {
    return {
      isValid: false,
      error: 'Invalid domain name. Please use a real email address (e.g. @gmail.com, @yahoo.com, @outlook.com).',
    };
  }

  // TLD after the last dot must have at least 2 characters (reject single character extensions)
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return {
      isValid: false,
      error: 'Domain must end with a valid extension like .com, .net, .org, or .bd.',
    };
  }

  // Strict format regex check
  const emailRegex = /^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return {
      isValid: false,
      error: 'Please enter a valid real email address (e.g. yourname@gmail.com).',
    };
  }

  // Disallow obvious dummy single-character domains or test domains
  if (domainPart === 'test.com' || domainPart === 'as.a' || domainPart === 'a.a' || domainPart.endsWith('.a')) {
    return {
      isValid: false,
      error: 'Please provide a real email address like something@gmail.com, yahoo.com, or outlook.com.',
    };
  }

  return { isValid: true };
}
