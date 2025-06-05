import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { User } from "./entities/user.entity";
import { Order } from "../order/entities/order.entity";
import { AuditLogModule } from "../audit-log/audit-log.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order]),
    TypeOrmModule.forFeature([Order]),
    forwardRef(() => AuditLogModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
