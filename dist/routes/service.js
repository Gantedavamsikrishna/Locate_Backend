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
// Create a new service record.
router.post("/services", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const apiName = "service/create";
    const port = req.socket.localPort;
    let conn;
    try {
        conn = yield db_1.pool.getConnection();
        yield conn.beginTransaction();
        const rows = yield (0, db_1.executeDbQuery)("SELECT MAX(CAST(ID AS UNSIGNED)) as maxId FROM SERVICES", [], false, apiName, port, conn);
        const newId = (Number(((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.maxId) || 0) + 1).toString().padStart(3, '0');
        const { city_id, service_name, description, image_url, status, created_by } = req.body;
        const insertQuery = `INSERT INTO SERVICES (CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT) VALUES (?,?,?,?,?,?,?, NOW())`;
        const params = [city_id, newId, service_name, description, image_url, status, created_by];
        const result = yield (0, db_1.executeDbQuery)(insertQuery, params, false, apiName, port, conn);
        yield conn.commit();
        res.json({ status: 1, message: "Service created", serviceId: newId, affectedRows: result.affectedRows });
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
// Get All Services
router.get("/services", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const apiName = "service/read-all";
    const port = (_b = (_a = req.socket) === null || _a === void 0 ? void 0 : _a.localPort) !== null && _b !== void 0 ? _b : 3000;
    const query = "SELECT CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM SERVICES";
    try {
        const rows = yield (0, db_1.executeDbQuery)(query, [], false, apiName, port);
        res.json({ status: rows.length ? 1 : 0, data: rows });
    }
    catch (err) {
        res.json({ status: 0, error: err.toString() });
    }
}));
// Read service details
router.get("/services", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const apiName = "service/read";
    const port = req.socket.localPort;
    // Convert query parameter to a trimmed string.
    const id = (req.query.id || "").trim();
    const query = `SELECT CITY_ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM SERVICES WHERE ID = ?`;
    try {
        // Pass the parameter in an array.
        const rows = yield (0, db_1.executeDbQuery)(query, [id], false, apiName, port);
        console.log("Rows returned:", rows);
        res.json({ status: rows.length ? 1 : 0, data: rows });
    }
    catch (err) {
        console.error("Error executing query:", err);
        res.json({ status: 0, error: err.toString() });
    }
}));
// Update a service
router.put("/services", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const apiName = "service/update";
    const port = req.socket.localPort;
    const { id, city_id, service_name, description, image_url, status, edited_by } = req.body;
    const query = `UPDATE SERVICES SET CITY_ID=?, NAME=?, DESCRIPTION=?, IMAGE_URL=?, STATUS=?, UPDATED_BY=?, UPDATED_AT=NOW() WHERE ID = ?`;
    const params = [city_id, service_name, description, image_url, status, edited_by, id];
    try {
        const result = yield (0, db_1.executeDbQuery)(query, params, true, apiName, port);
        res.json({ status: result.affectedRows ? 1 : 0, message: "Service updated" });
    }
    catch (err) {
        res.json({ status: 0, error: err.toString() });
    }
}));
exports.default = router;
