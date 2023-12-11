import type { Request, Response } from 'express';

export function destroySession() {
  return function (req: Request, res: Response) {
    req.session.destroy();
    return res.status(204).clearCookie('forum_app_cookie', { path: '/' }).send();
  };
}
