export class CreateManufacturerCommand {
  constructor(
    public readonly name: string,
    public readonly slug: string
  ) {}
}
