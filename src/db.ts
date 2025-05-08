import mysql, { PoolConnection } from "mysql2/promise"; import fs from "fs"; import path from "path";

const MYSQL_CONFIG = { host: "193.203.184.98", user: "u303037170_projectadmin", password: "Locate@2025", database: "u303037170_projectadmin", waitForConnections: true, connectionLimit: 10 };
export const pool = mysql.createPool(MYSQL_CONFIG);

const logsDir = path.join(__dirname, "../logs"); if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

function logToFile(data: { timestamp: string; apiName: string; errorMessage?: string; queryExecuted?: string; executionTime?: number; resultCount?: number; port?: number; }): void {
  const fileName = path.join(logsDir, `logs_${new Date().toISOString().slice(0, 10)}.log`);
  fs.appendFile(fileName, JSON.stringify(data) + "\n", (err) => { if (err) console.error("Logging error:", err); });
}

export async function executeDbQuery(query: string, params: any[], useTransaction: boolean, apiName: string, port?: number, connection?: PoolConnection): Promise<any> {
  const start = Date.now(); let conn: PoolConnection | undefined; let localConnection = false;
  try {
    if (connection) { conn = connection; } else { conn = await pool.getConnection(); localConnection = true; if (useTransaction) await conn.beginTransaction(); }
    const [result] = await conn.execute(query, params); if (!connection && useTransaction) await conn.commit();
    logToFile({ timestamp: new Date().toLocaleString(), apiName, queryExecuted: query, executionTime: Date.now() - start, resultCount: Array.isArray(result) ? result.length : (result as any).affectedRows, port });
    return result;
  } catch (err: any) {
    if (!connection && useTransaction && conn) await conn.rollback();
    logToFile({ timestamp: new Date().toLocaleString(), apiName, errorMessage: err.toString(), queryExecuted: query, executionTime: Date.now() - start, resultCount: 0, port });
    throw err;
  } finally { if (localConnection && conn) conn.release(); }
}
