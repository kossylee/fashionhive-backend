import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ZkpService } from './zkp.service';

@Controller('measurements')
export class ZkpController {
  constructor(private readonly zkpService: ZkpService) {}

  @Post('proof')
  async generateProof(@Body() body: any) {
    // body: { measurement: ... }
    return this.zkpService.generateProof(body.measurement);
  }

  @Post('verify')
  async verifyProof(@Body() body: any) {
    // body: { proof, publicSignals }
    const valid = await this.zkpService.verifyProof(body.proof, body.publicSignals);
    return { valid };
  }

  @Get('proof-artifacts/:userId')
  async getProofArtifacts(@Param('userId') userId: string) {
    return this.zkpService.getProofArtifacts(userId);
  }
}
