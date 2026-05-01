import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Secret key for JWT. In production, this MUST come from an environment variable.
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-key-for-development';
// 32-byte Master Key for AES-256 Encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; 

export const encryptAES = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decryptAES = (text: string): string => {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // High salt rounds for security
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Generate a JWT suitable for long-term authentication
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
};

// Verify the JWT token
export const verifyToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
};

// Generate 2FA Secret
export const generateTwoFactorSecret = (username: string) => {
  const secret = speakeasy.generateSecret({
    name: `CyberSecApp (${username})`
  });
  return secret;
};

// Generate QR Code for 2FA
export const generateQRCode = async (otpauth_url: string) => {
  return await QRCode.toDataURL(otpauth_url);
};

// Verify 2FA code
export const verifyTwoFactorToken = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow minor time drift
  });
};
