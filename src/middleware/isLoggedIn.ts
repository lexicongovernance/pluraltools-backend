import type { NextFunction, Response, Request } from 'express';

export function isLoggedIn() {
  return function (req: Request, res: Response, next: NextFunction) {
    if (req.session?.userId) {
      next();
    } else {
      req.session.destroy();
      return res.status(403).clearCookie('forum_app_cookie', { path: '/' }).send();
    }
  };
}
