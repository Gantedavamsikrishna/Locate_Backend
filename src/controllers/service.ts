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

    const rows = await executeDbQuery("SELECT MAX(CAST(ID AS UNSIGNED)) as maxId FROM SERVICES", [], false, apiName, port, conn);
    const newId = (Number(rows[0]?.maxId || 0) + 1).toString().padStart(3, '0');


    const { city_id, service_name, description, image_url, status, created_by } = req.body;
    const insertQuery = `INSERT INTO SERVICES (CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT) VALUES (?,?,?,?,?,?,?, NOW())`;
    const params = [city_id, newId, service_name, description, image_url, status, created_by];
    const result = await executeDbQuery(insertQuery, params, false, apiName, port, conn);
    await conn.commit();

    res.json({ status: 1, message: "Service created", serviceId: newId, affectedRows: result.affectedRows });
  } catch (err: any) {
    if (conn) await conn.rollback();
    res.json({ status: 1, error: err.toString() });
  } finally {
    if (conn) conn.release();
  }
});

// Get All Services
router.get("/services", async (req: Request, res: Response): Promise<void> => {
  const apiName = "service/read-all";
  const port: number = req.socket?.localPort ?? 3000;
  const query = "SELECT CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM SERVICES";
  try {
    const rows = await executeDbQuery(query, [], false, apiName, port);
    res.json({ status:  0, data: rows });
  } catch (err: any) {
    res.json({ status: 1, error: err.toString() });
  }
});

// Read service details
router.get("/services/:id", async (req: Request, res: Response) => {
  const apiName = "service/read";
  const port: number = req.socket.localPort!;
  // Extract the id value from req.params
  const id: string = (req.params.id || "").trim();

  const query = ` SELECT CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM SERVICES WHERE ID = ?`;
  try { 
    // Pass the id as an array
    const rows = await executeDbQuery(query, [id], false, apiName, port);
    res.json({ status:  0, data: rows });
  } catch (err: any) {
    res.status(500).json({ status: 0, error: err.toString() }); 
  }
});

// Update a service
router.put("/services", async (req: Request, res: Response) => {
  const apiName = "service/update";
  const port: number = req.socket.localPort!;
  const { id, city_id, service_name, description, image_url, status, edited_by } = req.body;
  const query = `UPDATE SERVICES SET CITY_ID=?, NAME=?, DESCRIPTION=?, IMAGE_URL=?, STATUS=?, UPDATED_BY=?, UPDATED_AT=NOW() WHERE ID = ?`;
  const params = [city_id, service_name, description, image_url, status, edited_by, id];
  try {
    const result = await executeDbQuery(query, [params], true, apiName, port);
    res.json({ status: result.affectedRows ? 1 : 0, message: "Service updated" });
  } catch (err: any) {
    res.json({ status: 1, error: err.toString() });
  }
});

export default router;
