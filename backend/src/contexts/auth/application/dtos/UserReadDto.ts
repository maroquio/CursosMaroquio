/**
 * UserReadDto (Read Model)
 * Data Transfer Object used for queries
 * Optimized for reading and displaying user data
 * Should NOT be used for write operations
 */
export interface UserReadDto {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  photoUrl: string | null;
  createdAt: Date;
}
