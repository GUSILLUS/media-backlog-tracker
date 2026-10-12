import crypto from 'node:crypto';

const generateSessionToken = (): string => {
  const randomString = crypto.randomBytes(32).toString(
'base64url'
  );

  return randomString;
}

const hashSessionToken = (raw: string): string => {
  const hashString = crypto.createHash('SHA-256').update(raw).digest("base64url");
  return hashString;
}

export {
  generateSessionToken,
  hashSessionToken
}
