import { MeasurementEncryptionService } from './measurement-encryption.service';

describe('MeasurementEncryptionService', () => {
  const key = 'test-key-32-bytes-123456789012345'; // 32 bytes for AES-256
  let service: MeasurementEncryptionService;

  beforeEach(() => {
    process.env.MEASUREMENT_AES_KEY = key;
    service = new MeasurementEncryptionService();
  });

  it('should encrypt and decrypt data correctly', () => {
    const plain = JSON.stringify({ chest: 40, waist: 32 });
    const encrypted = service.encrypt(plain);
    expect(encrypted).not.toEqual(plain);
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toEqual(plain);
  });

  it('should not decrypt with the wrong key', () => {
    const plain = 'secret-data';
    const encrypted = service.encrypt(plain);
    process.env.MEASUREMENT_AES_KEY = 'wrong-key-32-bytes-123456789012345';
    const wrongService = new MeasurementEncryptionService();
    const decrypted = wrongService.decrypt(encrypted);
    expect(decrypted).not.toEqual(plain);
  });
});
