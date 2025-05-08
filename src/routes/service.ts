// src/routes/service.ts
import express, { Request, Response } from "express";
import { pool, executeDbQuery } from "../db";

const router = express.Router();

// Create a new service record.
router.post("/services", async (req: Request, res: Response) => {
  const apiName = "service/create";
  const port: number = req.socket.localPort!;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Retrieve the maximum numeric service ID.
    // (Using the provided SQL: SELECT MAX(CAST(ID AS UNSIGNED)) as maxId FROM SERVICES)
    const rows = await executeDbQuery("SELECT MAX(CAST(ID AS UNSIGNED)) as maxId FROM SERVICES", [], false, apiName, port, conn);
    let maxId = rows[0].maxId;
    const newIdNum = (maxId ? Number(maxId) : 0) + 1;
    // Generate a new service ID, for example "SVC001"
    // const newServiceId = "SVC" + newIdNum.toString().padStart(3, "0");

    const { city_id, service_name, description, image_url, status, created_by } = req.body;
    const insertQuery = `INSERT INTO SERVICES (CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT) VALUES (?,?,?,?,?,?,?, NOW())`;
    const params = [city_id, newIdNum, service_name, description, image_url, status, created_by];
    const result = await executeDbQuery(insertQuery, params, false, apiName, port, conn);
    await conn.commit();
    res.json({
      message: "Service created",
      serviceId: newIdNum,
      affectedRows: (result as any).affectedRows,
    });
  } catch (err: any) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: err.toString() });
  } finally {
    if (conn) conn.release();
  }
});

//Get All Services
router.get("/services", async (req: Request, res: Response): Promise<void> => {
  const apiName = "service/read-all";
  const port: number = req.socket?.localPort ?? 3000;
  const query = "SELECT CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM SERVICES";
  try {
    const rows = await executeDbQuery(query, [], false, apiName, port);

    if (!rows || rows.length === 0) {
      res.status(404).json({ message: "No users found." });
      return;
    }
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.toString() });
  }
});

// Read service details.
router.get("/services/:id", async (req: Request, res: Response) => {
  const apiName = "service/read";
  const port: number = req.socket.localPort!;
  const {id} = req.body;
  const query = "SELECT CITY_ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM SERVICES WHERE ID = ?";
  try {
    const rows = await executeDbQuery(query, id, false, apiName, port);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.toString() });
  }
});

// Update an existing service.
router.put("/services/:id", async (req: Request, res: Response) => {
  const apiName = "service/update";
  const port: number = req.socket.localPort!;
  const { id, city_id, service_name, description, image_url, status, edited_by } = req.body;
  const query = `UPDATE SERVICES SET CITY_ID=?, NAME=?, DESCRIPTION=?, IMAGE_URL=?, STATUS=?, UPDATED_BY=?, UPDATED_AT=NOW() WHERE ID = ?`;
  const params = [city_id, service_name, description, image_url, status, edited_by, id];
  try {
    const result = await executeDbQuery(query, params, true, apiName, port);
    res.json({ message: "Service updated", affectedRows: (result as any).affectedRows });
  } catch (err: any) {
    res.status(500).json({ error: err.toString() });
  }
});

export default router;
