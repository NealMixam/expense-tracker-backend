import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

interface UserPayload {
  id: number;
  email?: string;
  username?: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('token');

  if (!token) {
    return res.status(403).json({ message: 'Нет доступа (Authorization denied)' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserPayload;

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Токен не валиден' });
  }
};

export default authMiddleware;
