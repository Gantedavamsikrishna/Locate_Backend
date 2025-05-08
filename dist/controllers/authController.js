"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const asyncHandler_1 = require("../utils/asyncHandler");
const JWT_SECRET = 'mysecretkey';
const JWT_REFRESH_SECRET = 'myrefreshsecret';
let users = []; // In-memory storage (replace with DB in production)
exports.register = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    const userExists = users.find(u => u.email === email);
    if (userExists)
        return res.status(409).json({ message: 'Email already registered' });
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const newUser = {
        id: Date.now(),
        name,
        email,
        password: hashedPassword
    };
    users.push(newUser);
    res.status(201).json({ message: 'User registered successfully' });
}));
exports.login = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = users.find(u => u.email == email);
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    const match = yield bcrypt_1.default.compare(password, user.password);
    if (!match)
        return res.status(401).json({ message: 'Invalid password' });
    const accessToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email }
    });
}));
exports.refreshToken = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(401).json({ message: 'Refresh token required' });
    jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
        if (err)
            return res.status(403).json({ message: 'Invalid refresh token' });
        const newAccessToken = jsonwebtoken_1.default.sign({ id: decoded.id }, JWT_SECRET, { expiresIn: '15m' });
        res.json({ accessToken: newAccessToken });
    });
}));
