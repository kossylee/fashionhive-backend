import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UserService } from "../../user/user.service";
import { RedisService } from "../../redis/redis.service";

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private redisService: RedisService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload) {
    // Check if token is blacklisted
    const isBlacklisted = await this.redisService.isTokenBlacklisted(
      payload.jti
    );
    if (isBlacklisted) {
      throw new UnauthorizedException("Token has been revoked");
    }

    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }

    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
