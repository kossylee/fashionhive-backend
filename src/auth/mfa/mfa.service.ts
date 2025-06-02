import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { User } from "src/modules/user/entities/user.entity";
import { Repository } from "typeorm";

import * as speakeasy from 'speakeasy';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';
import { InjectRepository } from "@nestjs/typeorm";
@Injectable()
export class MfaService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    
        @Inject('REDIS_CLIENT')
        private readonly redisClient: Redis,
    
        // private readonly emailService: EmailService,
      ) {}

  async generateTotpSecret(user: User) {
    const secret = speakeasy.generateSecret({
      name: `YourAppName (${user.email})`,
      length: 20,
    });

    const encryptedSecret = await bcrypt.hash(secret.base32, 10);

    user.mfaSecret = encryptedSecret;
    await this.userRepository.save(user);

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return { secret: secret.base32, qrCodeDataUrl };
  }

  async verifyTotpToken(user: User, token: string): Promise<boolean> {
    if (!user.mfaSecret) return false;

    // decrypt the secret from user.mfaSecret using bcrypt or a symmetric encryption key (bcrypt is one-way so for real use AES encryption is better)
    // For demo, assume you store plain or can decrypt it
    const decryptedSecret = await this.decryptSecret(user.mfaSecret);

    return speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  async sendEmailOtp(user: User) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  
    await this.redisClient.set(`email-otp:${user.id}`, otp, 'EX', 300);
  
    console.log(`Send OTP ${otp} to email ${user.email}`);
  
    // When you have emailService ready, replace console.log with:
    // await this.emailService.sendEmail({
    //   to: user.email,
    //   subject: 'Your Login OTP',
    //   html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    // });
  }
  

  async verifyEmailOtp(userId: string, otp: string): Promise<boolean> {
    const storedOtp = await this.redisClient.get(`email-otp:${userId}`);
    if (storedOtp === otp) {
      await this.redisClient.del(`email-otp:${userId}`);
      return true;
    }
    return false;
  }

  async decryptSecret(encryptedSecret: string): Promise<string> {
    // TODO: Implement AES decryption or change storage strategy
    // For now, assume secret stored in plain text (not recommended for prod)
    return encryptedSecret;
  }
  

}
