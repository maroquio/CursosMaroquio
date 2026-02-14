import { Entity } from '../../domain/Entity.ts';
import { Identifier } from '../../domain/Identifier.ts';

/**
 * Read-only repository interface
 * For queries that don't modify state (CQRS Query side)
 */
export interface IReadRepository<TEntity extends Entity<Identifier<any>>, TId extends Identifier<any>> {
  /**
   * Find an entity by its ID
   */
  findById(id: TId): Promise<TEntity | null>;

  /**
   * Check if an entity exists by its ID
   */
  exists(id: TId): Promise<boolean>;
}

/**
 * Write repository interface
 * For commands that modify state (CQRS Command side)
 */
export interface IWriteRepository<TEntity extends Entity<Identifier<any>>, TId extends Identifier<any>> {
  /**
   * Save an entity (insert or update)
   */
  save(entity: TEntity): Promise<void>;

  /**
   * Delete an entity by its ID
   */
  delete(id: TId): Promise<void>;
}

/**
 * Full repository interface (Read + Write)
 * For repositories that need both read and write operations
 * Most repositories will implement this interface
 */
export interface IRepository<TEntity extends Entity<Identifier<any>>, TId extends Identifier<any>>
  extends IReadRepository<TEntity, TId>,
    IWriteRepository<TEntity, TId> {}
