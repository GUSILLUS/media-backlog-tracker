import { type Request, type Response, type NextFunction } from 'express';
import AuthService from './auth.service';

const { verifyToken } = AuthService;

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const decodedToken = await verifyToken(token);

    if (typeof decodedToken === 'string') {
      return res.status(401).json({ message: "Invalid token" });
    }

    const id = decodedToken?.id;

    req.userId = id;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};