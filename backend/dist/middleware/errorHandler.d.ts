import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
export declare class AppError extends Error {
    message: string;
    statusCode: number;
    code?: number | undefined;
    constructor(message: string, statusCode?: number, code?: number | undefined);
}
export declare function errorHandler(err: Error | AppError, req: Request, res: Response<ApiResponse>, next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map