export class CreateModelCommand {
  constructor(
    public readonly manufacturerId: string,
    public readonly name: string,
    public readonly technicalName: string,
    public readonly pricePerMillionInputTokens?: number,
    public readonly pricePerMillionOutputTokens?: number,
    public readonly isDefault?: boolean
  ) {}
}
