import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { CurrentUser } from "./decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    const decoded = this.authService.decodeToken(
      refreshTokenDto.refreshToken
    ) as any;
    return this.authService.refreshTokens(
      decoded.sub,
      refreshTokenDto.refreshToken
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: any, @Request() req) {
    // Extract JTI from the token
    const token = req.headers.authorization?.replace("Bearer ", "");
    const decoded = this.authService.decodeToken(token) as any;
    await this.authService.logout(user.id, decoded.jti);
    return { message: "Logged out successfully" };
  }

  @UseGuards(JwtAuthGuard)
  @Post("profile")
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
