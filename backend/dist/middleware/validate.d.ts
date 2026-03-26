import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiResponse } from '../types';
/**
 * Middleware to validate request body/query/params using Zod schema
 */
export declare function validate(schema: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}): (req: Request, res: Response<ApiResponse>, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map