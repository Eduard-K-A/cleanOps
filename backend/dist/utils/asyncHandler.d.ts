import type { Request, Response, NextFunction, RequestHandler } from 'express';
/**
 * Wrap an async Express handler and forward rejections to `next()`.
 * Express v4 does not automatically catch errors thrown from async handlers.
 */
export declare function asyncHandler<Req extends Request = Request, Res extends Response = Response, Next extends NextFunction = NextFunction>(fn: (req: Req, res: Res, next: Next) => Promise<any>): RequestHandler;
//# sourceMappingURL=asyncHandler.d.ts.map