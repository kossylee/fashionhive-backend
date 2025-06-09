export class CreateMeasurementDto {
  userId: string;
  measurement: Record<string, any>; // The raw measurement data (to be encrypted)
}
