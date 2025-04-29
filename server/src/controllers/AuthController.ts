import { Router, Request, Response } from 'express';
import { User } from '../entities/User';
import { Database } from '../database/Database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

export class AuthController {
    public router: Router;
    private database: Database;

    constructor() {
        this.router = Router();
        this.database = new Database();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post('/register', this.register.bind(this));
        this.router.post('/login', this.login.bind(this));
    }

    private async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, firstName, lastName } = req.body;
            const userRepository = this.database.getDataSource().getRepository(User);

            const existingUser = await userRepository.findOne({ where: { email } });
            if (existingUser) {
                res.status(400).json({ message: 'Email already exists' });
                return;
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = userRepository.create({
                email,
                password: hashedPassword,
                firstName,
                lastName,
            });

            await userRepository.save(user);
            res.status(201).json({ message: 'User created successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error creating user' });
        }
    }

    private async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const userRepository = this.database.getDataSource().getRepository(User);

            const user = await userRepository.findOne({ where: { email } });
            if (!user) {
                res.status(401).json({ message: 'Invalid credentials' });
                return;
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                res.status(401).json({ message: 'Invalid credentials' });
                return;
            }

            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1h' }
            );

            res.json({ token });
        } catch (error) {
            res.status(500).json({ message: 'Error logging in' });
        }
    }
}
