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
const db_1 = require("../db");
const router = express_1.default.Router();
// Create a new user
router.post("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const apiName = "user/create";
    const port = req.socket.localPort;
    let conn;
    try {
        conn = yield db_1.pool.getConnection();
        yield conn.beginTransaction();
        yield (0, db_1.executeDbQuery)("CALL GenerateUserId(@id)", [], false, apiName, port, conn);
        const idRows = yield (0, db_1.executeDbQuery)("SELECT @id as newUserId", [], false, apiName, port, conn);
        const newUserId = (_a = idRows[0]) === null || _a === void 0 ? void 0 : _a.newUserId;
        const { city_id, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, created_by } = req.body;
        const insertQuery = `INSERT INTO USERS (CITY_ID, USER_ID, NAME, SURNAME, FATHER_NAME, GENDER, DOB, MOBILE_NUMBER, ALTERNATE_NUMBER, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_AT) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`;
        const params = [city_id, newUserId, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, created_by];
        const result = yield (0, db_1.executeDbQuery)(insertQuery, params, false, apiName, port, conn);
        yield conn.commit();
        res.json({ status: 1, message: "User created", userId: newUserId, affectedRows: result.affectedRows });
    }
    catch (err) {
        if (conn)
            yield conn.rollback();
        res.json({ status: 0, error: err.toString() });
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
    const query = "SELECT CITY_ID, USER_ID, NAME, SURNAME, FATHER_NAME, GENDER, DOB, MOBILE_NUMBER, ALTERNATE_NUMBER, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM USERS";
    try {
        const rows = yield (0, db_1.executeDbQuery)(query, [], false, apiName, port);
        res.json({ status: rows.length ? 1 : 0, data: rows });
    }
    catch (err) {
        res.json({ status: 0, error: err.toString() });
    }
}));
// Get User Details
router.get("/users/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const apiName = "user/read";
    const port = req.socket.localPort;
    const id = req.params.id;
    const query = "SELECT CITY_ID, USER_ID, NAME, SURNAME, FATHER_NAME, GENDER, DOB, MOBILE_NUMBER, ALTERNATE_NUMBER, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM USERS WHERE USER_ID = ?";
    try {
        const rows = yield (0, db_1.executeDbQuery)(query, [id], false, apiName, port);
        res.json({ status: rows.length ? 1 : 0, data: rows });
    }
    catch (err) {
        res.json({ status: 0, error: err.toString() });
    }
}));
// Update User
router.put("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const apiName = "user/update";
    const port = req.socket.localPort;
    const { id, city_id, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, edited_by } = req.body;
    const query = ` UPDATE USERS SET CITY_ID = ?, NAME = ?, SURNAME = ?, FATHER_NAME = ?, GENDER = ?, DOB = ?, MOBILE_NUMBER = ?, ALTERNATE_NUMBER = ?, EMAIL = ?, ROLE = ?, ADDRESS = ?, STATUS = ?, IMAGE_URL = ?, UPDATED_BY = ?, UPDATED_AT = NOW() WHERE USER_ID = ?`;
    const params = [city_id, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, edited_by, id];
    try {
        const result = yield (0, db_1.executeDbQuery)(query, params, true, apiName, port);
        res.json({ status: result.affectedRows ? 1 : 0, message: "User updated" });
    }
    catch (err) {
        res.json({ status: 0, error: err.toString() });
    }
}));
exports.default = router;
