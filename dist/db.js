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
exports.pool = void 0;
exports.executeDbQuery = executeDbQuery;
const promise_1 = __importDefault(require("mysql2/promise"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Use environment variables if available (you can set these for production)
const MYSQL_CONFIG = {
    host: "193.203.184.98",
    user: "u303037170_projectadmin",
    password: "Locate@2025",
    database: "u303037170_projectadmin",
    waitForConnections: true,
    connectionLimit: 10
};
exports.pool = promise_1.default.createPool(MYSQL_CONFIG);
// Pre-create the logs folder one time on startup.
const logsDir = path_1.default.join(__dirname, "../logs");
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir);
}
// Non‑blocking logging; we don’t await the file write.
function logToFile(data) {
    const fileName = path_1.default.join(logsDir, `logs_${new Date().toISOString().slice(0, 10)}.log`);
    const logEntry = JSON.stringify(data) + "\n";
    fs_1.default.appendFile(fileName, logEntry, (err) => {
        if (err)
            console.error("Logging error:", err);
    });
}
function executeDbQuery(query, params, useTransaction, apiName, port, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = Date.now();
        let conn;
        let localConnection = false;
        try {
            if (connection) {
                conn = connection;
            }
            else {
                conn = yield exports.pool.getConnection();
                localConnection = true;
                if (useTransaction)
                    yield conn.beginTransaction();
            }
            const [result] = yield conn.execute(query, params);
            if (!connection && useTransaction)
                yield conn.commit();
            // Log asynchronously to avoid delaying the response.
            logToFile({
                timestamp: new Date().toLocaleString(),
                apiName,
                queryExecuted: query,
                executionTime: Date.now() - start,
                resultCount: Array.isArray(result) ? result.length : result.affectedRows,
                port,
            });
            return result;
        }
        catch (err) {
            if (!connection && useTransaction && conn)
                yield conn.rollback();
            logToFile({
                timestamp: new Date().toLocaleString(),
                apiName,
                errorMessage: err.toString(),
                queryExecuted: query,
                executionTime: Date.now() - start,
                resultCount: 0,
                port,
            });
            throw err;
        }
        finally {
            if (localConnection && conn)
                conn.release();
        }
    });
}
