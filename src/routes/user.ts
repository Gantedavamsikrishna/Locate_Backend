import express, { Request, Response } from "express";
import { pool, executeDbQuery } from "../db";

const router = express.Router();

// Create a new user
router.post("/users", async (req: Request, res: Response) => {
  const apiName = "user/create";
  const port: number = req.socket.localPort!;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await executeDbQuery("CALL GenerateUserId(@id)", [], false, apiName, port, conn);
    const idRows = await executeDbQuery("SELECT @id as newUserId", [], false, apiName, port, conn);
    const newUserId = idRows[0]?.newUserId;

    const { city_id, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, created_by } = req.body;
    const insertQuery = `INSERT INTO USERS (CITY_ID, USER_ID, FIRST_NAME, SUR_NAME, FATHER_NAME, GENDER, DOB, MOBILE, ALTERNATE_MOBILE, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_AT) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`;
    const params = [city_id, newUserId, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, created_by];
    const result = await executeDbQuery(insertQuery, params, false, apiName, port, conn);
    await conn.commit();

    res.json({ status: 1, message: "User created", userId: newUserId, affectedRows: result.affectedRows });
  } catch (err: any) {
    if (conn) await conn.rollback();
    res.json({ status: 0, error: err.toString() });
  } finally {
    if (conn) conn.release();
  }
});

// Get All Users
router.get("/users", async (req: Request, res: Response) => {
  const apiName = "user/read-all";
  const port: number = req.socket?.localPort ?? 3000;
  const query = "SELECT * FROM USERS";
  try {
    const rows = await executeDbQuery(query, [], false, apiName, port);
    res.json({ status: rows.length ? 1 : 0, data: rows });
  } catch (err: any) {
    res.json({ status: 0, error: err.toString() });
  }
});

// Get User Details
router.get("/users", async (req: Request, res: Response) => {
  const apiName = "user/read";
  const port: number = req.socket.localPort!;
  const id: any = req.query.id;

  const query = "SELECT * FROM USERS WHERE USER_ID = ?";
  try {
    const rows = await executeDbQuery(query, id, false, apiName, port);
    res.json({ status: rows.length ? 1 : 0, data: rows });
  } catch (err: any) {
    res.json({ status: 0, error: err.toString() });
  }
});

// Update User
router.put("/users", async (req: Request, res: Response) => {
  const apiName = "user/update";
  const port: number = req.socket.localPort!;
  const { id, city_id, first_name, sur_name, mobile, email, edited_by } = req.body;

  const query = `UPDATE USERS SET CITY_ID=?, FIRST_NAME=?, SUR_NAME=?, MOBILE=?, EMAIL=?, UPDATED_BY=?, UPDATED_AT=NOW() WHERE USER_ID = ?`;
  const params = [city_id, first_name, sur_name, mobile, email, edited_by, id];

  try {
    const result = await executeDbQuery(query, params, true, apiName, port);
    res.json({ status: result.affectedRows ? 1 : 0, message: "User updated" });
  } catch (err: any) {
    res.json({ status: 0, error: err.toString() });
  }
});

export default router;
