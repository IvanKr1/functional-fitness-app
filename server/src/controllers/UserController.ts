import { Router, Request, Response, NextFunction } from 'express';
import { User } from '../entities/User';
import { Database } from '../database/Database';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

export class UserController {
  public router: Router;
  private database: Database;

  constructor() {
    this.router = Router();
    this.database = new Database();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/profile', this.authenticateToken, this.getProfile.bind(this));
    this.router.put('/profile', this.authenticateToken, this.updateProfile.bind(this));
  }

  private authenticateToken(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Access token is required' });
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, user: any) => {
      if (err) {
        res.status(403).json({ message: 'Invalid token' });
        return;
      }
      req.user = user;
      next();
    });
  }

  private async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userRepository = this.database.getDataSource().getRepository(User);
      const user = await userRepository.findOne({
        where: { id: req.user?.userId },
        select: ['id', 'email', 'firstName', 'lastName', 'isAdmin', 'createdAt', 'updatedAt'],
      });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user profile' });
    }
  }

  private async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName } = req.body;
      const userRepository = this.database.getDataSource().getRepository(User);

      const user = await userRepository.findOne({ where: { id: req.user?.userId } });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;

      await userRepository.save(user);
      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating profile' });
    }
  }
}
