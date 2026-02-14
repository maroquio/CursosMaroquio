export interface LlmModelDto {
  id: string;
  manufacturerId: string;
  name: string;
  technicalName: string;
  pricePerMillionInputTokens: number;
  pricePerMillionOutputTokens: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
