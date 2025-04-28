import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dtos/create-user.dto";

@Injectable()
export class UserService {
  private users = [];

  findAll() {
    return this.users;
  }

  create(createUserDto: CreateUserDto) {
    const user = { id: Date.now(), ...createUserDto };
    this.users.push(user);
    return user;
  }
}
