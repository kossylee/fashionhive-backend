import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Inventory } from "./entities/inventory.entity";

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>
  ) {}

  async create(createInventoryDto: any): Promise<Inventory> {
    const existing = await this.inventoryRepository.findOne({
      where: { sku: createInventoryDto.sku },
    });

    if (existing) {
      throw new ConflictException("Material with this SKU already exists");
    }

    const inventory = this.inventoryRepository.create(createInventoryDto);
    const savedInventory = await this.inventoryRepository.save(inventory);
    return Array.isArray(savedInventory) ? savedInventory[0] : savedInventory;
  }

  async findAll(): Promise<Inventory[]> {
    return this.inventoryRepository.find();
  }

  async findOne(id: number): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
    });

    if (!inventory) {
      throw new NotFoundException("Material not found");
    }

    return inventory;
  }

  async update(id: number, updateInventoryDto: any): Promise<Inventory> {
    const inventory = await this.findOne(id);
    Object.assign(inventory, updateInventoryDto);
    const savedInventory = await this.inventoryRepository.save(inventory);
    return Array.isArray(savedInventory) ? savedInventory[0] : savedInventory;
  }

  async remove(id: number): Promise<void> {
    const inventory = await this.findOne(id);
    await this.inventoryRepository.remove(inventory);
  }

  async checkStock(
    materialId: number,
    requiredQuantity: number
  ): Promise<boolean> {
    const inventory = await this.findOne(materialId);
    return inventory.quantity >= requiredQuantity;
  }

  async reduceStock(materialId: number, quantity: number): Promise<void> {
    const inventory = await this.findOne(materialId);

    if (inventory.quantity < quantity) {
      throw new ConflictException("Insufficient stock");
    }

    inventory.quantity -= quantity;
    await this.inventoryRepository.save(inventory);
  }

  async checkLowStock(): Promise<Inventory[]> {
    return this.inventoryRepository
      .createQueryBuilder("inventory")
      .where("inventory.quantity <= inventory.reorderPoint")
      .getMany();
  }
}
