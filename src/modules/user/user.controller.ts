import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Delete,
  ForbiddenException,
  NotFoundException,
  Req,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dtos/create-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "./entities/user.entity";


@Controller("users")
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.userService.findAll();
  }

  @Get("profile")
  getProfile(@CurrentUser() user: any) {
    return this.userService.findById(user.id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Delete(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivateUser(@Param("id") id: number) {
    return this.userService.deactivateUser(id);
  }

  /**
   * GDPR-compliant user deletion endpoint
   */
  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteUser(
    @Param("id") id: number,
    @CurrentUser() performedBy: any
  ) {
    await this.userService.deleteUser(Number(id), performedBy.id);
    return { message: "User deleted (GDPR anonymized and soft-deleted)." };
  }

  @Post(":id/activate")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  activateUser(@Param("id") id: number) {
    return this.userService.activateUser(id);
  }
}
