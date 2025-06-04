import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UserService } from "../user/user.service";
import { RedisService } from "../redis/redis.service";
import { RegisterDto } from "./dto/register.dto";
import { User } from "../user/entities/user.entity";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if (user && (await user.validatePassword(password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(
    registerDto: RegisterDto
  ): Promise<{ user: Partial<User>; tokens: any }> {
    const existingUser = await this.userService.findByUsernameOrEmail(
      registerDto.username,
      registerDto.email
    );

    if (existingUser) {
      throw new ConflictException("Username or email already exists");
    }

    const user = await this.userService.create(registerDto);
    const tokens = await this.generateTokens(user);

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const { password, refreshToken, ...userResult } = user;
    return { user: userResult, tokens };
  }

  async login(user: any): Promise<{ user: any; tokens: any }> {
    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  async refreshTokens(userId: number, refreshToken: string): Promise<any> {
    const user = await this.userService.findById(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException("Access Denied");
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException("Access Denied");
    }

    // Check if refresh token exists in Redis
    const storedToken = await this.redisService.getRefreshToken(userId);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: number, jti: string): Promise<void> {
    // Blacklist the current access token
    const accessTokenTtl = this.getTokenTtl(
      this.configService.get("JWT_EXPIRES_IN")
    );
    await this.redisService.blacklistToken(jti, accessTokenTtl);

    // Remove refresh token from database and Redis
    await this.userService.updateRefreshToken(userId, null);
    await this.redisService.deleteRefreshToken(userId);
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  private async generateTokens(
    user: any
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = uuidv4();
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      jti,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get("JWT_SECRET"),
      expiresIn: this.configService.get("JWT_EXPIRES_IN"),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti },
      {
        secret: this.configService.get("JWT_REFRESH_SECRET"),
        expiresIn: this.configService.get("JWT_REFRESH_EXPIRES_IN"),
      }
    );

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(
    userId: number,
    refreshToken: string
  ): Promise<void> {
    const hashedRefreshToken = refreshToken
      ? await bcrypt.hash(refreshToken, 12)
      : null;
    await this.userService.updateRefreshToken(userId, hashedRefreshToken);

    if (refreshToken) {
      const refreshTokenTtl = this.getTokenTtl(
        this.configService.get("JWT_REFRESH_EXPIRES_IN")
      );
      await this.redisService.setRefreshToken(
        userId,
        refreshToken,
        refreshTokenTtl
      );
    }
  }

  private getTokenTtl(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 24 * 60 * 60;
      default:
        return 900; // 15 minutes default
    }
  }
}
