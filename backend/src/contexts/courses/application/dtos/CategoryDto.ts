/**
 * Category Data Transfer Object
 * Used for API responses and internal data transfer
 */
export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
