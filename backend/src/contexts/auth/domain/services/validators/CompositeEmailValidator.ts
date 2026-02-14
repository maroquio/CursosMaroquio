import { Result } from '@shared/domain/Result.ts';
import type { IEmailValidator } from '../IEmailValidator.ts';

/**
 * Composite Email Validator
 *
 * Combines multiple validators using the Composite Pattern.
 * All validators must pass for the email to be considered valid.
 *
 * @example
 * const validator = new CompositeEmailValidator([
 *   new RFC5322EmailValidator(),
 *   new CorporateDomainValidator(['company.com']),
 * ]);
 */
export class CompositeEmailValidator implements IEmailValidator {
  public readonly name: string;
  private readonly validators: IEmailValidator[];

  constructor(validators: IEmailValidator[]) {
    if (validators.length === 0) {
      throw new Error('CompositeEmailValidator requires at least one validator');
    }
    this.validators = validators;
    this.name = `Composite[${validators.map((v) => v.name).join(', ')}]`;
  }

  public validate(email: string): Result<void> {
    for (const validator of this.validators) {
      const result = validator.validate(email);
      if (result.isFailure) {
        return result;
      }
    }
    return Result.ok<void>(undefined);
  }

  /**
   * Add a validator to the chain
   * Returns a new CompositeEmailValidator (immutable)
   */
  public withValidator(validator: IEmailValidator): CompositeEmailValidator {
    return new CompositeEmailValidator([...this.validators, validator]);
  }
}
