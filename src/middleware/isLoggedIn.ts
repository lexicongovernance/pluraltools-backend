import type { NextFunction, Response, Request } from 'express';

export function isLoggedIn() {
  return function (req: Request, res: Response, next: NextFunction) {
    if (req.session?.userId) {
      next();
    } else {
      return res.status(401).send();
    }
  };
}
