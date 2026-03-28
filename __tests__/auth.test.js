import { hashPassword, verifyPassword } from '@/lib/auth';
import crypto from 'crypto';

describe('Authentication Utilities', () => {
  describe('hashPassword & verifyPassword (bcrypt)', () => {
    it('should hash a password and successfully verify it', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should fail verification with incorrect password', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword('wrongpassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('verifyPassword (legacy fallback)', () => {
    it('should successfully verify a legacy pbkdf2 hash', async () => {
      const password = 'legacyPassword123';
      const salt = 'd5f1c9a2b8e34'; // Dummy salt
      // Generate a manual legacy hash to simulate old DB row
      const legacyHash = crypto
        .pbkdf2Sync(password, salt, 100_000, 64, 'sha512')
        .toString('hex');
      const stored = `${salt}:${legacyHash}`;
      
      const isValid = await verifyPassword(password, stored);
      expect(isValid).toBe(true);
    });
    
    it('should fail legacy verification with incorrect password', async () => {
      const password = 'legacyPassword123';
      const salt = 'd5f1c9a2b8e34'; 
      const legacyHash = crypto
        .pbkdf2Sync(password, salt, 100_000, 64, 'sha512')
        .toString('hex');
      const stored = `${salt}:${legacyHash}`;
      
      const isValid = await verifyPassword('wrong', stored);
      expect(isValid).toBe(false);
    });
  });
});
