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
// src/routes/user.ts
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
// Create a new user endpoint that uses the stored procedure to generate a new user ID.
router.post("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const apiName = "user/create";
    const port = req.socket.localPort;
    let conn;
    try {
        // Manually acquire a connection and begin a transaction.
        conn = yield db_1.pool.getConnection();
        yield conn.beginTransaction();
        const port = req.socket.localPort;
        // Call stored procedure to generate a new user ID.
        yield (0, db_1.executeDbQuery)("CALL GenerateUserId(@id)", [], false, apiName, port, conn);
        const idRows = yield (0, db_1.executeDbQuery)("SELECT @id as newUserId", [], false, apiName, port, conn);
        const newUserId = idRows[0].newUserId; // e.g., 'USR006'
        // Destructure input fields from request body.
        const { district_id, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, created_by, } = req.body;
        const insertQuery = `INSERT INTO USER_MST (CITY_ID, USER_ID, FIRST_NAME, SUR_NAME, FATHER_NAME, GENDER, DOB, MOBILE, ALTERNATE_MOBILE, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_AT) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`;
        const params = [district_id, newUserId, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, created_by];
        const result = yield (0, db_1.executeDbQuery)(insertQuery, params, false, apiName, port, conn);
        yield conn.commit();
        res.json({ message: "User created", userId: newUserId, affectedRows: result.affectedRows });
    }
    catch (err) {
        if (conn)
            yield conn.rollback();
        res.status(500).json({ error: err.toString() });
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// Get All Users
router.get("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const apiName = "user/read-all";
    const port = (_b = (_a = req.socket) === null || _a === void 0 ? void 0 : _a.localPort) !== null && _b !== void 0 ? _b : 3000;
    const query = "SELECT CITY_ID, USER_ID, FIRST_NAME, SUR_NAME, FATHER_NAME, GENDER, DOB, MOBILE, ALTERNATE_MOBILE, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_ON, UPDATED_BY, UPDATED_AT FROM USERS";
    try {
        const rows = yield (0, db_1.executeDbQuery)(query, [], false, apiName, port);
        if (!rows || rows.length === 0) {
            res.status(404).json({ message: "No users found." });
            return;
        }
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ error: err.toString() });
    }
}));
// Read user details.
router.get("/users/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.body;
    const apiName = "user/read";
    const port = (_b = (_a = req.socket) === null || _a === void 0 ? void 0 : _a.localPort) !== null && _b !== void 0 ? _b : 3000;
    const query = "SELECT CITY_ID, USER_ID, FIRST_NAME, SUR_NAME, FATHER_NAME, GENDER, DOB, MOBILE, ALTERNATE_MOBILE, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_ON, UPDATED_BY, UPDATED_AT FROM USERS WHERE USER_ID = ?";
    try {
        const rows = yield (0, db_1.executeDbQuery)(query, id, false, apiName, port);
        if (!rows || rows.length === 0) {
            res.status(404).json({ message: "User not found." });
            return;
        }
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ error: err.toString() });
    }
}));
// Update user information.
router.put("/users/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const apiName = "user/update";
    const port = req.socket.localPort;
    const { district_id, first_name, sur_name, mobile, email, edited_by, id } = req.body;
    const query = `UPDATE USERS SET CITY_ID ?, FIRST_NAME=?, SUR_NAME=?, MOBILE=?, EMAIL=?, UPDATED_BY=?, UPDATED_AT=NOW() WHERE USER_ID = ?`;
    const params = [district_id, first_name, sur_name, mobile, email, edited_by, id];
    try {
        const result = yield (0, db_1.executeDbQuery)(query, params, true, apiName, port);
        res.json({ message: "User updated", affectedRows: result.affectedRows });
    }
    catch (err) {
        res.status(500).json({ error: err.toString() });
    }
}));
exports.default = router;
