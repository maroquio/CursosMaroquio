/**
 * Application DTOs (Data Transfer Objects)
 *
 * This module exports all DTOs used in the Auth context application layer.
 * DTOs are organized following ISP (Interface Segregation Principle):
 *
 * - TokenResponse: Only token-related data
 * - AuthenticatedUser: Only user identity data
 * - LoginResponse: Composite of TokenResponse + AuthenticatedUser
 * - UserReadDto: Read model for user queries
 */

// Token-related DTOs
export type { TokenResponse } from './TokenResponse.ts';
export type { AuthenticatedUser } from './AuthenticatedUser.ts';
export type { LoginResponse } from './LoginResponse.ts';

// Query read models
export type { UserReadDto } from './UserReadDto.ts';
export type { UserAdminReadDto } from './UserAdminReadDto.ts';
export type { PaginatedUsersDto } from './PaginatedUsersDto.ts';
export type { RoleReadDto, PaginatedRolesDto } from './RoleReadDto.ts';
export type { PermissionReadDto, PaginatedPermissionsDto } from './PermissionReadDto.ts';
