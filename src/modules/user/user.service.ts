import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dtos/create-user.dto";
import { User, UserRole } from "./entities/user.entity";
import { Order } from "../order/entities/order.entity";
import { AuditLogService } from "../audit-log/audit-log.service";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @Inject(forwardRef(() => AuditLogService))
    private auditLogService: AuditLogService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: [
        "id",
        "username",
        "email",
        "role",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUsernameOrEmail(
    username: string,
    email: string
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ username }, { email }],
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string | null
  ): Promise<void> {
    await this.userRepository.update(userId, { refreshToken });
  }

  async deactivateUser(id: number): Promise<void> {
    await this.userRepository.update(id, { isActive: false });
  }

  async activateUser(id: number): Promise<void> {
    await this.userRepository.update(id, { isActive: true });
  }

  /**
   * GDPR-compliant user deletion
   * - Only non-admins can be deleted
   * - Anonymizes PII
   * - Soft-deletes related orders
   * - Logs the deletion
   */
  async deleteUser(userId: number, performedBy: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === UserRole.ADMIN) throw new ForbiddenException("Cannot delete admin accounts");

    // Anonymize PII
    user.username = `deleted_user_${user.id}`;
    user.email = `deleted${user.id}@anonymized.local`;
    user.isActive = false;
    user.refreshToken = null;
    // If measurements field/entity is added in future, anonymize here.

    await this.userRepository.save(user);

    // Soft-delete related orders
    await this.orderRepository.update({ customer: { id: userId } }, { isDeleted: true });

    // Audit log
    await this.auditLogService.log(
      'GDPR_USER_DELETE',
      userId,
      performedBy,
      { anonymized: true }
    );
  }
}

