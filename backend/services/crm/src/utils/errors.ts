import { CRMError } from '../types';

export class AppError extends CRMError {
  constructor(statusCode: number, code: string, message: string) {
    super(message, code, statusCode);
  }
}
