import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { LlmModelId } from '../value-objects/LlmModelId.ts';
import { ManufacturerId } from '../value-objects/ManufacturerId.ts';

interface LlmModelProps {
  manufacturerId: ManufacturerId;
  name: string;
  technicalName: string;
  pricePerMillionInputTokens: number;
  pricePerMillionOutputTokens: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * LlmModel Entity
 * Represents a specific LLM model (e.g., GPT-4o, Claude Opus 4.5, Gemini 2.0)
 */
export class LlmModel extends Entity<LlmModelId> {
  private props: LlmModelProps;

  private constructor(id: LlmModelId, props: LlmModelProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new LLM model
   */
  public static create(
    manufacturerId: ManufacturerId,
    name: string,
    technicalName: string,
    pricePerMillionInputTokens: number = 0,
    pricePerMillionOutputTokens: number = 0,
    isDefault: boolean = false
  ): Result<LlmModel> {
    if (!name || name.trim().length === 0) {
      return Result.fail(ErrorCode.LLM_MODEL_NAME_EMPTY);
    }

    if (name.length > 100) {
      return Result.fail(ErrorCode.LLM_MODEL_NAME_TOO_LONG);
    }

    if (!technicalName || technicalName.trim().length === 0) {
      return Result.fail(ErrorCode.LLM_MODEL_TECHNICAL_NAME_EMPTY);
    }

    const now = new Date();
    const id = LlmModelId.create();

    const model = new LlmModel(id, {
      manufacturerId,
      name: name.trim(),
      technicalName: technicalName.trim(),
      pricePerMillionInputTokens,
      pricePerMillionOutputTokens,
      isDefault,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(model);
  }

  /**
   * Reconstruct a model from persistence
   */
  public static reconstruct(
    id: LlmModelId,
    manufacturerId: ManufacturerId,
    name: string,
    technicalName: string,
    pricePerMillionInputTokens: number,
    pricePerMillionOutputTokens: number,
    isDefault: boolean,
    createdAt: Date,
    updatedAt: Date
  ): LlmModel {
    return new LlmModel(id, {
      manufacturerId,
      name,
      technicalName,
      pricePerMillionInputTokens,
      pricePerMillionOutputTokens,
      isDefault,
      createdAt,
      updatedAt,
    });
  }

  // Getters
  public getManufacturerId(): ManufacturerId {
    return this.props.manufacturerId;
  }

  public getName(): string {
    return this.props.name;
  }

  public getTechnicalName(): string {
    return this.props.technicalName;
  }

  public getPricePerMillionInputTokens(): number {
    return this.props.pricePerMillionInputTokens;
  }

  public getPricePerMillionOutputTokens(): number {
    return this.props.pricePerMillionOutputTokens;
  }

  public getIsDefault(): boolean {
    return this.props.isDefault;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic

  /**
   * Update model name
   */
  public updateName(name: string): Result<void> {
    if (!name || name.trim().length === 0) {
      return Result.fail(ErrorCode.LLM_MODEL_NAME_EMPTY);
    }

    if (name.length > 100) {
      return Result.fail(ErrorCode.LLM_MODEL_NAME_TOO_LONG);
    }

    this.props.name = name.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update model technical name
   */
  public updateTechnicalName(technicalName: string): Result<void> {
    if (!technicalName || technicalName.trim().length === 0) {
      return Result.fail(ErrorCode.LLM_MODEL_TECHNICAL_NAME_EMPTY);
    }

    this.props.technicalName = technicalName.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update model pricing
   */
  public updatePrices(pricePerMillionInputTokens: number, pricePerMillionOutputTokens: number): void {
    this.props.pricePerMillionInputTokens = pricePerMillionInputTokens;
    this.props.pricePerMillionOutputTokens = pricePerMillionOutputTokens;
    this.props.updatedAt = new Date();
  }

  /**
   * Set whether this model is the default
   */
  public setDefault(isDefault: boolean): void {
    this.props.isDefault = isDefault;
    this.props.updatedAt = new Date();
  }
}
