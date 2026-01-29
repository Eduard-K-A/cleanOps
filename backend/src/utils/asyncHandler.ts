import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrap an async Express handler and forward rejections to `next()`.
 * Express v4 does not automatically catch errors thrown from async handlers.
 */
export function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response,
  Next extends NextFunction = NextFunction,
>(
  fn: (req: Req, res: Res, next: Next) => Promise<any>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as any, res as any, next as any)).catch(next);
  };
}

