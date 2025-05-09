import express, { Request, Response } from "express";
import { pool, executeDbQuery } from "../db";
import { request } from "http";

class UserController {  
  public router = express.Router();

  constructor(app: any) {
    app.use("/api/user", this.router);
    this.router.post("/users", this.createUser.bind(this));
    this.router.get("/users", this.getAllUsers.bind(this));
    this.router.get("/usersbyid", this.getUserById.bind(this));
    this.router.put("/users", this.updateUser.bind(this));
    this.router.post("/login", this.Login.bind(this));
  }

  async Login(Request: Request, Response: Response) {
    const apiName = "user/Login";
    let input=Request.body;
    try {
      // conn = await
      let query=`select U.USER_ID, U.NAME, U.EMAIL, R.ROLE_NAME FROM USERS U LEFT JOIN ROLES R ON R.ROLE_ID=U.ROLE WHERE U.EMAIL=? and U.PASSWORD=? `;
      const params=[input.email,input.password];
      
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
  let connection;
  let input = req.body;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    await executeDbQuery("CALL GenerateUserId(@id)", [], false, apiName, port, connection);
    
    const idRows = await executeDbQuery("SELECT @id as newUserId", [], false, apiName, port, connection);
    const newUserId = idRows[0]?.newUserId;
    
    const insertQuery = ` INSERT INTO USERS ( CITY_ID, USER_ID, NAME, SURNAME, FATHER_NAME, GENDER, DOB, MOBILE_NUMBER, ALTERNATE_NUMBER, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, CREATED_AT ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`;
      
    const params = [ input.city_id, newUserId, input.first_name, input.sur_name, input.father_name, input.gender, input.dob, input.mobile, input.alternate_mobile, input.email, input.role, input.address, input.status, input.image_url, input.created_by ];
      
    const result = await executeDbQuery(insertQuery, params, false, apiName, port, connection);
    await connection.commit();
    res.json({ status: 1, message: "User created", userId: newUserId, affectedRows: result.affectedRows });
  } catch (err: any) {
    if (connection) await connection.rollback();
    res.json({ status: 0, error: err.toString() });
  } finally {
    if (connection) connection.release();
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
    let input=req.body;
    const updateQuery = "UPDATE USERS SET CITY_ID = ?, NAME = ?, SURNAME = ?, FATHER_NAME = ?, GENDER = ?, DOB = ?, MOBILE_NUMBER = ?, ALTERNATE_NUMBER = ?, EMAIL = ?, ROLE = ?, ADDRESS = ?, STATUS = ?, IMAGE_URL = ?, UPDATED_BY = ?, UPDATED_AT = NOW() WHERE USER_ID = ?";
    const params = [ input.city_id, input.first_name, input.sur_name, input.father_name, input.gender, input.dob, input.mobile, input.alternate_mobile, input.email, input.role, input.address, input.status, input.image_url, input.updated_by, input.id ];
    try {
      const result = await executeDbQuery(updateQuery, params, true, apiName, port);
      res.json({ status: 0, message: "User updated" });
    } catch (err: any) {
      res.json({ status: 1, error: err.toString() });
    }
  }
}

export default UserController;
