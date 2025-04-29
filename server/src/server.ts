import express, { Application } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { Database } from './database/Database';
import { AuthController } from './controllers/AuthController.js';
import { UserController } from './controllers/UserController.js';

export class Server {
  private app: Application;
  private port: number;
  private database: Database;

  constructor() {
    config();
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    this.database = new Database();
    this.initializeMiddlewares();
    this.initializeControllers();
  }

  private initializeMiddlewares(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private initializeControllers(): void {
    const authController = new AuthController();
    const userController = new UserController();

    this.app.use('/api/auth', authController.router);
    this.app.use('/api/users', userController.router);
  }

  public async start(): Promise<void> {
    try {
      await this.database.connect();
      this.app.listen(this.port, () => {
        console.log(`Server is running on port ${this.port}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}
