import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing authentication token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'secret-key') as { sub: string; email: string; role: string };
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
}
