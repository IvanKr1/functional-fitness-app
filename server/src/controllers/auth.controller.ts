import { Request, Response } from 'express';
import { authService } from '../services/auth.js';

export const authController = {
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: 'Invalid credentials' });
        }
    },

    async register(req: Request, res: Response) {
        try {
            const { email, password, name } = req.body;
            const user = await authService.register(email, password, name);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ error: 'Registration failed' });
        }
    },
};
