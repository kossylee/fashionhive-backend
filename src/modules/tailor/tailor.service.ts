import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tailor, TailorSpecialty } from "./entities/tailor.entity";

@Injectable()
export class TailorService {
  constructor(
    @InjectRepository(Tailor)
    private tailorRepository: Repository<Tailor>
  ) {}

  async findAvailableTailorForOrder(
    requiredSpecialties: TailorSpecialty[]
  ): Promise<Tailor> {
    const availableTailors = await this.tailorRepository
      .createQueryBuilder("tailor")
      .where("tailor.isAvailable = :isAvailable", { isAvailable: true })
      .andWhere("tailor.currentWorkload < tailor.maxWeeklyCapacity")
      .orderBy("tailor.currentWorkload", "ASC")
      .getMany();

    // Find tailor with matching specialties and lowest workload
    const matchingTailor = availableTailors.find((tailor) =>
      requiredSpecialties.every((specialty) =>
        tailor.specialties.includes(specialty)
      )
    );

    if (!matchingTailor) {
      throw new NotFoundException(
        "No available tailor with matching specialties found"
      );
    }

    return matchingTailor;
  }

  async updateTailorWorkload(
    tailorId: number,
    orderCount: number
  ): Promise<Tailor> {
    const tailor = await this.tailorRepository.findOne({
      where: { id: tailorId },
    });

    if (!tailor) {
      throw new NotFoundException("Tailor not found");
    }

    tailor.currentWorkload += orderCount;

    // Update availability based on workload
    tailor.isAvailable = tailor.currentWorkload < tailor.maxWeeklyCapacity;

    const savedTailor = await this.tailorRepository.save(tailor);
    return Array.isArray(savedTailor) ? savedTailor[0] : savedTailor;
  }

  async resetWeeklyWorkload(): Promise<void> {
    await this.tailorRepository
      .createQueryBuilder()
      .update(Tailor)
      .set({ currentWorkload: 0, isAvailable: true })
      .execute();
  }

  // CRUD operations
  async create(createTailorDto: any): Promise<Tailor> {
    const tailor = this.tailorRepository.create(createTailorDto);
    const savedTailor = await this.tailorRepository.save(tailor);
    return Array.isArray(savedTailor) ? savedTailor[0] : savedTailor;
  }

  async findAll(): Promise<Tailor[]> {
    return this.tailorRepository.find();
  }

  async findOne(id: number): Promise<Tailor> {
    const tailor = await this.tailorRepository.findOne({
      where: { id },
      relations: ["orders"],
    });

    if (!tailor) {
      throw new NotFoundException("Tailor not found");
    }

    return tailor;
  }

  async update(id: number, updateTailorDto: any): Promise<Tailor> {
    const tailor = await this.findOne(id);
    Object.assign(tailor, updateTailorDto);
    const savedTailor = await this.tailorRepository.save(tailor);
    return Array.isArray(savedTailor) ? savedTailor[0] : savedTailor;
  }

  async remove(id: number): Promise<void> {
    const tailor = await this.findOne(id);
    await this.tailorRepository.remove(tailor);
  }
}
