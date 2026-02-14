export class UpdateManufacturerCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly slug?: string
  ) {}
}
