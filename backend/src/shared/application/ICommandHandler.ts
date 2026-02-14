import type { Result } from '../domain/Result';

/**
 * Interface for Command Handlers
 * Commands represent operations that change the state of the system
 *
 * @template TCommand - The command type
 * @template TResult - The result type (defaults to void for commands that only change state)
 */
export interface ICommandHandler<TCommand, TResult = void> {
  /**
   * Execute the command
   * Returns Result<TResult> where TResult defaults to void for state-changing commands
   */
  execute(command: TCommand): Promise<Result<TResult>>;
}
