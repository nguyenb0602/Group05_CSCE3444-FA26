// A small, intentional list of obvious typos, not a domain allowlist.
// Unrecognized domains (e.g., a university email) are allowed if well formed.
const COMMON_DOMAIN_TYPOS = Object.freeze({
  gnail: 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'hotnail.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'icloud.con': 'icloud.com',
});

// Practical syntax validation for the signup form. Email verification in
// Cognito, not a regex, proves ownership of the mailbox.
const EMAIL_PATTERN = /^[^\s@]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

export function analyzeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  const atIndex = email.lastIndexOf('@');
  const localPart = atIndex >= 0 ? email.slice(0, atIndex) : '';
  const domain = atIndex >= 0 ? email.slice(atIndex + 1) : '';
  const correctedDomain = COMMON_DOMAIN_TYPOS[domain];
  return {
    email,
    valid: EMAIL_PATTERN.test(email) && domain.split('.').at(-1).length >= 2,
    suggestion: localPart && correctedDomain ? `${localPart}@${correctedDomain}` : '',
  };
}
