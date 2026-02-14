import { Result } from '../domain/Result';

/**
 * Interface for Query Handlers
 * Queries represent read-only operations that don't change system state
 * Generic type R represents the returned Read Model (DTO)
 */
export interface IQueryHandler<T, R> {
  /**
   * Execute the query
   * Should return Result<R> where R is a Read Model (DTO)
   */
  execute(query: T): Promise<Result<R>>;
}
