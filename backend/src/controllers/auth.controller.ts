import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/user.js';
import { Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET ?? 'secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function register(req: Request, res: Response) {
  const { email, password, role } = req.body;
  const existing = await User.findOne({ email }).exec();
  if (existing) return res.status(409).json({ message: 'User already exists' });

  const user = await User.create({
    email,
    passwordHash: hashPassword(password),
    role: role || 'viewer',
  });
  res.status(201).json({ id: user.id, email: user.email, role: user.role });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).exec();
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
}
