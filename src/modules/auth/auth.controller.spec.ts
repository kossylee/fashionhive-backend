import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "../user/entities/user.entity";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
            decodeToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            decode: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    jwtService = module.get(JwtService);
  });

  describe("register", () => {
    it("should register a new user", async () => {
      const registerDto = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        role: UserRole.USER,
      };

      const expectedResult = {
        user: { id: 1, username: "testuser", email: "test@example.com" },
        tokens: { accessToken: "access-token", refreshToken: "refresh-token" },
      };

      authService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("login", () => {
    it("should login user successfully", async () => {
      const user = { id: 1, username: "testuser", role: UserRole.USER };
      const loginDto = { username: "testuser", password: "password123" };
      const req = { user };

      const expectedResult = {
        user,
        tokens: { accessToken: "access-token", refreshToken: "refresh-token" },
      };

      authService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(req, loginDto);

      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("logout", () => {
    it("should logout user successfully", async () => {
      const user = { id: 1, username: "testuser" };
      const req = {
        headers: { authorization: "Bearer mock-token" },
      };

      authService.decodeToken.mockReturnValue({ jti: "test-jti" });
      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(user, req);

      expect(authService.decodeToken).toHaveBeenCalledWith("mock-token");
      expect(authService.logout).toHaveBeenCalledWith(1, "test-jti");
      expect(result).toEqual({ message: "Logged out successfully" });
    });
  });
});
