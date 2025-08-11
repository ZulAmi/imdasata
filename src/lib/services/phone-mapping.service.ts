import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';

export class PhoneMappingService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits

  /**
   * Initialize encryption key from environment
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.PHONE_ENCRYPTION_KEY;
    if (!key || key.length !== this.keyLength * 2) { // hex string is 2x length
      throw new Error('PHONE_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    return Buffer.from(key, 'hex');
  }

  /**
   * Encrypt phone number with AES-256-GCM
   */
  private encryptPhone(phoneNumber: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    
    let encrypted = cipher.update(phoneNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt phone number with validation
   */
  private decryptPhone(encryptedPhone: string): string {
    const key = this.getEncryptionKey();
    const [ivHex, authTagHex, encrypted] = encryptedPhone.split(':');
    
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted phone format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Store encrypted phone mapping for user
   */
  async storePhoneMapping(anonymousId: string, phoneNumber: string): Promise<void> {
    try {
      const encryptedPhone = this.encryptPhone(phoneNumber);
      
      await prisma.$executeRaw`
        INSERT INTO secure_phone_mappings (id, anonymous_id, encrypted_phone, created_at, updated_at, is_active)
        VALUES (gen_random_uuid(), ${anonymousId}, ${encryptedPhone}, NOW(), NOW(), true)
        ON CONFLICT (anonymous_id) 
        DO UPDATE SET 
          encrypted_phone = EXCLUDED.encrypted_phone, 
          updated_at = NOW(),
          is_active = true,
          deleted_at = NULL
      `;
      
    } catch (error) {
      console.error('Error storing phone mapping:', error);
      throw new Error('Failed to store phone mapping');
    }
  }

  /**
   * Retrieve decrypted phone number for user
   */
  async getPhoneNumber(anonymousId: string): Promise<string | null> {
    try {
      const result = await prisma.$queryRaw`
        SELECT encrypted_phone 
        FROM secure_phone_mappings 
        WHERE anonymous_id = ${anonymousId} 
          AND is_active = true 
          AND deleted_at IS NULL
      ` as Array<{ encrypted_phone: string }>;

      if (result.length === 0) {
        return null;
      }

      return this.decryptPhone(result[0].encrypted_phone);
    } catch (error) {
      console.error('Error retrieving phone number:', error);
      return null;
    }
  }

  /**
   * Soft delete phone mapping for PDPA compliance
   */
  async deletePhoneMapping(anonymousId: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE secure_phone_mappings 
        SET is_active = false, deleted_at = NOW(), updated_at = NOW()
        WHERE anonymous_id = ${anonymousId}
      `;
    } catch (error) {
      console.error('Error deleting phone mapping:', error);
      throw new Error('Failed to delete phone mapping');
    }
  }

  /**
   * Permanently purge phone mapping (for complete data removal)
   */
  async purgePhoneMapping(anonymousId: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        DELETE FROM secure_phone_mappings 
        WHERE anonymous_id = ${anonymousId}
      `;
    } catch (error) {
      console.error('Error purging phone mapping:', error);
      throw new Error('Failed to purge phone mapping');
    }
  }

  /**
   * Generate secure encryption key for environment setup
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}