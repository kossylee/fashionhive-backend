import { IsString, IsEmail, Length, IsEnum, IsOptional } from "class-validator";
import { UserRole } from "../../user/entities/user.entity";

export class RegisterDto {
  @IsString()
  @Length(3, 20)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 50)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
