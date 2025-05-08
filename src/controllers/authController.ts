// controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { asyncHandler } from '../utils/asyncHandler';

const JWT_SECRET = 'mysecretkey';
const JWT_REFRESH_SECRET = 'myrefreshsecret';

interface User {
    id: number;
    name: string;
    email: string;
    password: string;
}

let users: User[] = []; // In-memory storage (replace with DB in production)

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    const userExists = users.find(u => u.email === email);
    if (userExists) return res.status(409).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { 
        id: Date.now(), 
        name, 
        email, 
        password: hashedPassword 
    };
    users.push(newUser);

    res.status(201).json({ message: 'User registered successfully' });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid password' });

    const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email }
    });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
        if (err) return res.status(403).json({ message: 'Invalid refresh token' });
        
        const newAccessToken = jwt.sign({ id: decoded.id }, JWT_SECRET, { expiresIn: '15m' });
        res.json({ accessToken: newAccessToken });
    });
});