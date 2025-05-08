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
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../db");
const authenticate_1 = require("../utils/authenticate");
const router = express_1.default.Router();
const REFRESH_TOKENS = [];
// Register a new user.
router.post('/register', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        const hashed = yield bcrypt_1.default.hash(password, 10);
        yield db_1.pool.query('INSERT INTO USERLOGIN (USERNAME, EMAIL, PASSWORD) VALUES (?, ?, ?)', [username, email, hashed]);
        res.json({ message: 'User registered' });
        return;
    }
    catch (error) {
        res.status(500).json({ message: error.toString() });
        return;
    }
}));
// Login an existing user.
router.get('/login', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const [rows] = yield db_1.pool.query('SELECT * FROM USERLOGIN WHERE USERNAME = ?', [username]);
        const user = rows[0];
        if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const accessToken = jsonwebtoken_1.default.sign({ username }, 'secret_jwt', {
            expiresIn: '15m',
        });
        const refreshToken = jsonwebtoken_1.default.sign({ username }, 'secret_refresh');
        REFRESH_TOKENS.push(refreshToken);
        res.json({ accessToken, refreshToken });
        return;
    }
    catch (error) {
        res.status(500).json({ message: error.toString() });
        return;
    }
}));
// Refresh the access token.
router.post('/refresh', (req, res, next) => {
    const { token } = req.body;
    if (!token || !REFRESH_TOKENS.includes(token)) {
        res.sendStatus(403);
        return;
    }
    jsonwebtoken_1.default.verify(token, 'secret_refresh', (err, user) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        else {
            const accessToken = jsonwebtoken_1.default.sign({ username: user.username }, 'secret_jwt', { expiresIn: '15m' });
            res.json({ accessToken });
            return;
        }
    });
});
// Protected profile route.
router.get('/profile', authenticate_1.authenticateToken, (req, res, next) => {
    res.json({
        message: 'This is a protected profile route.',
        user: req.user,
    });
    return;
});
exports.default = router;
