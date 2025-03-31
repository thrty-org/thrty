import { BadRequestError } from '@thrty/http-errors';
import type { ZodIssue } from 'zod';

export class ZodBadRequestError extends BadRequestError {
  issues: ZodIssue[];

  constructor(message: string, issues: ZodIssue[]) {
    super(message);
    this.issues = issues;
  }
}
