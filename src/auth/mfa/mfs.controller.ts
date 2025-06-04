import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { MfaService } from './mfa.service';


@Controller('mfa')
export class mfaController {
  constructor(private readonly mfaService: MfaService
  ) {}


  @Post('setup-mfa')
  async setupMfa(@Req() req) {
  const user = req.user;
  const { secret, qrCodeDataUrl } = await this.mfaService.generateTotpSecret(user);
  return { secret, qrCodeDataUrl };
}
@Post('verify-mfa')
async verifyMfa(@Req() req, @Body() body: { token: string; method: 'totp' | 'email' }) {
  const user = req.user;

  let verified = false;
  if (body.method === 'totp') {
    verified = await this.mfaService.verifyTotpToken(user, body.token);
  } else if (body.method === 'email') {
    verified = await this.mfaService.verifyEmailOtp(user.id, body.token);
  }

  if (!verified) {
    throw new UnauthorizedException('Invalid MFA token');
  }

  return { success: true };
}

}