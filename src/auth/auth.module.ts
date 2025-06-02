import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MfaService } from './mfa/mfa.service';
import { mfaController } from './mfa/mfs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { UserModule } from 'src/modules/user/user.module';
import { Auth } from './entities/auth.entity';

@Module({
  imports: [UserModule,TypeOrmModule.forFeature([Auth])],
  controllers: [AuthController, mfaController],
  providers: [AuthService, MfaService],
  exports: [AuthService, MfaService],
})
export class AuthModule {}
