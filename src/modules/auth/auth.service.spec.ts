import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UserService } from "../user/user.service";
import { RedisService } from "../redis/redis.service";
import { User, UserRole } from "../user/entities/user.entity";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt");
jest.mock("uuid", () => ({ v4: () => "test-uuid" }));

describe("AuthService", () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: Partial<User> = {
    id: 1,
    username: "testuser",
    email: "test@example.com",
    role: UserRole.USER,
    isActive: true,
    validatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByUsername: jest.fn(),
            findByUsernameOrEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            updateRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            setRefreshToken: jest.fn(),
            getRefreshToken: jest.fn(),
            deleteRefreshToken: jest.fn(),
            blacklistToken: jest.fn(),
            isTokenBlacklisted: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                JWT_SECRET: "test-secret",
                JWT_EXPIRES_IN: "15m",
                JWT_REFRESH_SECRET: "test-refresh-secret",
                JWT_REFRESH_EXPIRES_IN: "7d",
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    redisService = module.get(RedisService);
    configService = module.get(ConfigService);
  });

  describe("validateUser", () => {
    it("should return user data when credentials are valid", async () => {
      const mockUserWithPassword = { ...mockUser, password: "hashedPassword" };
      userService.findByUsername.mockResolvedValue(
        mockUserWithPassword as User
      );
      (mockUser.validatePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser("testuser", "password");

      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          username: "testuser",
          email: "test@example.com",
        })
      );
      expect(result.password).toBeUndefined();
    });

    it("should return null when credentials are invalid", async () => {
      userService.findByUsername.mockResolvedValue(null);

      const result = await service.validateUser("testuser", "wrongpassword");

      expect(result).toBeNull();
    });
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const registerDto = {
        username: "newuser",
        email: "new@example.com",
        password: "password123",
        role: UserRole.USER,
      };

      userService.findByUsernameOrEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(mockUser as User);
      jwtService.sign.mockReturnValue("mock-token");
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-refresh-token");

      const result = await service.register(registerDto);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("tokens");
      expect(userService.create).toHaveBeenCalledWith(registerDto);
    });

    it("should throw ConflictException when user already exists", async () => {
      const registerDto = {
        username: "existinguser",
        email: "existing@example.com",
        password: "password123",
      };

      userService.findByUsernameOrEmail.mockResolvedValue(mockUser as User);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe("refreshTokens", () => {
    it("should refresh tokens successfully", async () => {
      const userId = 1;
      const refreshToken = "valid-refresh-token";
      const mockUserWithRefreshToken = {
        ...mockUser,
        refreshToken: "hashed-refresh-token",
      };

      userService.findById.mockResolvedValue(mockUserWithRefreshToken as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      redisService.getRefreshToken.mockResolvedValue(refreshToken);
      jwtService.sign.mockReturnValue("new-token");
      (bcrypt.hash as jest.Mock).mockResolvedValue("new-hashed-refresh-token");

      const result = await service.refreshTokens(userId, refreshToken);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
    });

    it("should throw UnauthorizedException when refresh token is invalid", async () => {
      const userId = 1;
      const refreshToken = "invalid-refresh-token";

      userService.findById.mockResolvedValue(null);

      await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe("logout", () => {
    it("should logout user successfully", async () => {
      const userId = 1;
      const jti = "test-jti";

      await service.logout(userId, jti);

      expect(redisService.blacklistToken).toHaveBeenCalledWith(
        jti,
        expect.any(Number)
      );
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(userId, null);
      expect(redisService.deleteRefreshToken).toHaveBeenCalledWith(userId);
    });
  });
});
