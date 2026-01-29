import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiResponse } from '../types';

/**
 * Middleware to validate request body/query/params using Zod schema
 */
export function validate(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          code: 400,
        });
        return;
      }
      next(error);
    }
  };
}
