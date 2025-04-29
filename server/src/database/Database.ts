import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export class Database {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'fitness_app',
      entities: [__dirname + '/../entities/*.ts'],
      synchronize: true, // Set to false in production
      logging: true,
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.dataSource.initialize();
      console.log('Database connection established');
    } catch (error) {
      console.error('Error connecting to the database:', error);
      throw error;
    }
  }

  public getDataSource(): DataSource {
    return this.dataSource;
  }
} 