import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TailorService } from "./tailor.service";
import { Tailor } from "./entities/tailor.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Tailor])],
  providers: [TailorService],
  exports: [TailorService],
})
export class TailorModule {}
