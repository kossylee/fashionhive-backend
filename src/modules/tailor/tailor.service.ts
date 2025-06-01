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
    return (await this.tailorRepository.save(tailor)) as unknown as Tailor;
  }

  async update(id: number, updateTailorDto: any): Promise<Tailor> {
    const tailor = await this.findOne(id);
    Object.assign(tailor, updateTailorDto);
    return (await this.tailorRepository.save(tailor)) as unknown as Tailor;
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
    tailor.isAvailable = tailor.currentWorkload < tailor.maxWeeklyCapacity;

    return (await this.tailorRepository.save(tailor)) as unknown as Tailor;
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

  async remove(id: number): Promise<void> {
    const tailor = await this.findOne(id);
    await this.tailorRepository.remove(tailor);
  }
}
