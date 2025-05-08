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
// src/routes/service.ts
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
// Create a new service record.
router.post("/services", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const apiName = "service/create";
    const port = req.socket.localPort;
    let conn;
    try {
        conn = yield db_1.pool.getConnection();
        yield conn.beginTransaction();
        // Retrieve the maximum numeric service ID.
        // (Using the provided SQL: SELECT MAX(CAST(ID AS UNSIGNED)) as maxId FROM SERVICES)
        const rows = yield (0, db_1.executeDbQuery)("SELECT MAX(CAST(ID AS UNSIGNED)) as maxId FROM SERVICES", [], false, apiName, port, conn);
        let maxId = rows[0].maxId;
        const newIdNum = (maxId ? Number(maxId) : 0) + 1;
        // Generate a new service ID, for example "SVC001"
        const newServiceId = "SVC" + newIdNum.toString().padStart(3, "0");
        const { district_id, service_name, description, image_url, status, created_by } = req.body;
        const insertQuery = `INSERT INTO SERVICES (CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT) VALUES (?,?,?,?,?,?,?, NOW())`;
        const params = [district_id, newServiceId, service_name, description, image_url, status, created_by];
        const result = yield (0, db_1.executeDbQuery)(insertQuery, params, false, apiName, port, conn);
        yield conn.commit();
        res.json({
            message: "Service created",
            serviceId: newServiceId,
            affectedRows: result.affectedRows,
        });
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
//Get All Services
router.get("/services", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const apiName = "service/read-all";
    const port = (_b = (_a = req.socket) === null || _a === void 0 ? void 0 : _a.localPort) !== null && _b !== void 0 ? _b : 3000;
    const query = "SELECT CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM SERVICES";
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
// Read service details.
router.get("/services/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const apiName = "service/read";
    const port = req.socket.localPort;
    const { id } = req.body;
    const query = "SELECT CITY_ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM SERVICES WHERE ID = ?";
    try {
        const rows = yield (0, db_1.executeDbQuery)(query, id, false, apiName, port);
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ error: err.toString() });
    }
}));
// Update an existing service.
router.put("/services/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const apiName = "service/update";
    const port = req.socket.localPort;
    const { id, service_name, description, image_url, status, edited_by } = req.body;
    const query = `UPDATE SERVICES SET NAME=?, DESCRIPTION=?, IMAGE_URL=?, STATUS=?, UPDATED_BY=?, UPDATED_AT=NOW() WHERE ID = ?`;
    const params = [service_name, description, image_url, status, edited_by, id];
    try {
        const result = yield (0, db_1.executeDbQuery)(query, params, true, apiName, port);
        res.json({ message: "Service updated", affectedRows: result.affectedRows });
    }
    catch (err) {
        res.status(500).json({ error: err.toString() });
    }
}));
exports.default = router;
