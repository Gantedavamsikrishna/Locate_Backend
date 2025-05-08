// src/routes/user.ts
import express, { Request, Response } from "express";
import { pool, executeDbQuery } from "../db";

const router = express.Router();

// Create a new user endpoint that uses the stored procedure to generate a new user ID.
router.post("/users", async (req: Request, res: Response) => {
  const apiName = "user/create";
  const port = req.socket.localPort;
  let conn;
  try {
    // Manually acquire a connection and begin a transaction.
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const port: number = req.socket.localPort!;

    // Call stored procedure to generate a new user ID.
    await executeDbQuery("CALL GenerateUserId(@id)", [], false, apiName, port, conn);
    const idRows = await executeDbQuery("SELECT @id as newUserId", [], false, apiName, port, conn);
    const newUserId = idRows[0].newUserId; // e.g., 'USR006'
    
    // Destructure input fields from request body.
    const { city_id, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, created_by, } = req.body;
    const insertQuery = `INSERT INTO USERS (CITY_ID, USER_ID, FIRST_NAME, SUR_NAME, FATHER_NAME, GENDER, DOB, MOBILE, ALTERNATE_MOBILE, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_AT) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`;
    const params = [ city_id, newUserId, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, created_by ];
    const result = await executeDbQuery(insertQuery, params, false, apiName, port, conn);
    await conn.commit();
    res.json({ message: "User created", userId: newUserId, affectedRows: (result as any).affectedRows });
  } catch (err: any) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: err.toString() });
  } finally {
    if (conn) conn.release();
  }
});


// Get All Users
router.get("/users", async (req: Request, res: Response): Promise<void> => {
  const apiName = "user/read-all";
  const port: number = req.socket?.localPort ?? 3000;
  const query = "SELECT CITY_ID, USER_ID, FIRST_NAME, SUR_NAME, FATHER_NAME, GENDER, DOB, MOBILE, ALTERNATE_MOBILE, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_ON, UPDATED_BY, UPDATED_AT FROM USERS";
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


// Read user details.
router.get("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  const apiName = "user/read";
  const port: number = req.socket?.localPort ?? 3000;

  const query = "SELECT CITY_ID, USER_ID, FIRST_NAME, SUR_NAME, FATHER_NAME, GENDER, DOB, MOBILE, ALTERNATE_MOBILE, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_ON, UPDATED_BY, UPDATED_AT FROM USERS WHERE USER_ID = ?";
  try {
    const rows = await executeDbQuery(query, id, false, apiName, port);

    if (!rows || rows.length === 0) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.toString() });
  }
});


// Update user information.
router.put("/users/:id", async (req: Request, res: Response) => {
  const apiName = "user/update";
  const port: number = req.socket.localPort!;
  const { city_id, first_name, sur_name, mobile, email, edited_by, id } = req.body;
  const query = `UPDATE USERS SET CITY_ID ?, FIRST_NAME=?, SUR_NAME=?, MOBILE=?, EMAIL=?, UPDATED_BY=?, UPDATED_AT=NOW() WHERE USER_ID = ?`;
  const params = [city_id, first_name, sur_name, mobile, email, edited_by, id];
  try {
    const result = await executeDbQuery(query, params, true, apiName, port);
    res.json({ message: "User updated", affectedRows: (result as any).affectedRows });
  } catch (err: any) {
    res.status(500).json({ error: err.toString() });
  }
});


export default router;
