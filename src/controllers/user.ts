import express, { Request, Response } from "express";
import { pool, executeDbQuery } from "../db";
import { request } from "http";

class UserController {
  public router = express.Router();

  constructor(app: any) {
    app.use("/api/", this.router);
    this.router.post("users", this.createUser.bind(this));
    this.router.get("users", this.getAllUsers.bind(this));
    this.router.get("/usersid", this.getUserById.bind(this));
    this.router.put("/", this.updateUser.bind(this));
    this.router.post("/login", this.Login.bind(this));
  }

  async Login(Request: Request, Response: Response) {
    const apiName = "user/Login";
    let input=Request.body;
    try {
      // conn = await
      let query=`select U.USER_ID, U.NAME, U.EMAIL, R.ROLE_NAME FROM USERS U LEFT JOIN ROLES R ON R.ROLE_ID=U.ROLE WHERE U.EMAIL=? and U.PASSWORD=? `;
      const params=[input.email,input.password];
      console.log(input);
      
let connection = await pool.getConnection();
      const result = await executeDbQuery(query, params, false, apiName);
      if(result.length>=1){
        Response.json({ status: 0, result: result });
      }else{
      Response.json({ status: 2, result: {message:'user not fund'} });

      }
      
    } catch (err:any) {
      Response.json({ status: 1, result: err.toString()});
    }
  }

  async createUser(req: Request, res: Response) {
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
      const insertQuery = "INSERT INTO USERS (CITY_ID, USER_ID, NAME, SURNAME, FATHER_NAME, GENDER, DOB, MOBILE_NUMBER, ALTERNATE_NUMBER, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_AT) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())";
      const params = [city_id, newUserId, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, created_by];
      const result = await executeDbQuery(insertQuery, params, false, apiName, port, conn);
      await conn.commit();
      res.json({ status: 1, message: "User created", userId: newUserId, affectedRows: result.affectedRows });
    } catch (err: any) {
      if (conn) await conn.rollback();
      res.json({ status: 1, error: err.toString() });
    } finally {
      if (conn) conn.release();
    }
  }

  async getAllUsers(req: Request, res: Response) {
    const apiName = "user/read-all";
    const port: number = req.socket?.localPort ?? 3000;
    const query = "SELECT CITY_ID, USER_ID, NAME, SURNAME, FATHER_NAME, GENDER, DOB, MOBILE_NUMBER, ALTERNATE_NUMBER, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM USERS";
    try {
      const rows = await executeDbQuery(query, [], false, apiName, port);
      res.json({ status: 0, data: rows });
    } catch (err: any) {
      res.json({ status: 1, error: err.toString() });
    }
  }

  async getUserById(req: Request, res: Response) {
    const apiName = "user/read";
    const port: number = req.socket.localPort!;
    const id = req.query.id;
    const query = "SELECT CITY_ID, USER_ID, NAME, SURNAME, FATHER_NAME, GENDER, DOB, MOBILE_NUMBER, ALTERNATE_NUMBER, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM USERS WHERE USER_ID = ?";
    try {
      const rows = await executeDbQuery(query, [id], false, apiName, port);
      res.json({ status: 0, data: rows });
    } catch (err: any) {
      res.json({ status: 1, error: err.toString() });
    }
  }

  async updateUser(req: Request, res: Response) {
    const apiName = "user/update";
    const port: number = req.socket.localPort!;
    const { id, city_id, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, edited_by } = req.body;
    const updateQuery = "UPDATE USERS SET CITY_ID = ?, NAME = ?, SURNAME = ?, FATHER_NAME = ?, GENDER = ?, DOB = ?, MOBILE_NUMBER = ?, ALTERNATE_NUMBER = ?, EMAIL = ?, ROLE = ?, ADDRESS = ?, STATUS = ?, IMAGE_URL = ?, UPDATED_BY = ?, UPDATED_AT = NOW() WHERE USER_ID = ?";
    const params = [city_id, first_name, sur_name, father_name, gender, dob, mobile, alternate_mobile, email, role, address, status, image_url, edited_by, id];
    try {
      const result = await executeDbQuery(updateQuery, params, true, apiName, port);
      res.json({ status: 0, message: "User updated" });
    } catch (err: any) {
      res.json({ status: 1, error: err.toString() });
    }
  }
}

export default UserController;
