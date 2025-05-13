import express, { Request, Response } from "express";
import { pool, executeDbQuery } from "../db";
import { request } from "http";
import { uploadImage } from "../utils/cloudinaryUtil";
import  jwt  from "jsonwebtoken";
import { authenticateToken } from "../middleWare/authMiddleWare";

//token
const secretKey =
  (process.env.ACCESS_TOKEN_KEY as string) || "'your_secret_key";
class UserController {  
  public router = express.Router();

  constructor(app: any) {
    app.use("/api/user", this.router);
    
    this.router.get("/users",this.getAllUsers.bind(this));
    this.router.get("/usersbyid", this.getUserById.bind(this));
    this.router.put("/users", this.updateUser.bind(this));
    this.router.post("/users", this.createUser.bind(this));
    this.router.post("/login", this.Login.bind(this));

    this.router.get("/roles", authenticateToken as any, this.getAllRoles.bind(this));
    this.router.put("/roles", this.updateRole.bind(this));
    this.router.post("/roles", this.createRole.bind(this));
  }

  // async Login(Request: Request, Response: Response) {
  //   const apiName = "user/Login";
  //   let input=Request.body;
  //   try {
      
  //     let query=`select U.USER_ID, U.NAME, U.EMAIL, U.IMAGE_URL, R.ROLE_NAME FROM USERS U LEFT JOIN ROLES R ON R.ROLE_ID=U.ROLE WHERE U.EMAIL=? and U.PASSWORD=? `;
  //     const params=[input.email,input.password];
      
  //     let connection = await pool.getConnection();
  //     const result = await executeDbQuery(query, params, false, apiName);
  //     if(result.length>=1){
  //       Response.json({ status: 0, result: result });
  //     }else{
  //     Response.json({ status: 2, result: {message:'user not fund'} });

  //     }
      
  //   } catch (err:any) {
  //     Response.json({ status: 1, result: err.toString()});
  //   }
  // }
  async Login(Request: Request, Response: Response) {
    const apiName = "user/Login";
    console.log(secretKey);
    let input = Request.body;
    try {
      let query = `
        SELECT U.USER_ID, U.NAME, U.EMAIL, R.ROLE_NAME 
        FROM USERS U 
        LEFT JOIN ROLES R ON R.ROLE_ID = U.ROLE 
        WHERE U.EMAIL = ? AND U.PASSWORD = ?
      `;
      const params = [input.email, input.password];

      const result = await executeDbQuery(query, params, false, apiName);
      if (result.length >= 1) {
        const user = result[0];

        // Generate JWT access token only
        const accessToken = jwt.sign(
          { userId: user.USER_ID, role: user.ROLE_NAME },
          secretKey,
          // { expiresIn: "15m" }
        );

        Response.json({
          status: 0,
          message: "login success",
          accessToken,result:result
        });
      } else {
        Response.json({ status: 2, result: { message: "user not found" } });
      }
    } catch (err: any) {
      Response.json({ status: 1, result: err.toString() });
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
    
      const chekdup = ` SELECT COUNT(*) as count FROM USERS WHERE EMAIL=? AND MOBILE_NUMBER=?`;
          const dupResult = await executeDbQuery(chekdup, [input.EMAIL, input.MOBILE_NUMBER], false, apiName, port, connection);
          if (Number(dupResult[0]?.count) > 0) {
              await connection.rollback();
              res.status(409).json({ status: 2, result: "User already exists." });
              return;
          }
        
    await executeDbQuery("CALL GenerateUserId(@id)", [], false, apiName, port, connection);
    
    const idRows = await executeDbQuery("SELECT @id as newUserId", [], false, apiName, port, connection);
    const newUserId = idRows[0]?.newUserId;
    const image_url = await uploadImage(input.IMAGE_URL);
    const insertQuery = ` INSERT INTO USERS ( CITY_ID, USER_ID, NAME, SURNAME, FATHER_NAME, GENDER, DOB, MOBILE_NUMBER, ALTERNATE_NUMBER, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
      
    const params = [ input.CITY_ID, newUserId, input.NAME, input.SURNAME, input.FATHER_NAME, input.GENDER, input.DOB, input.MOBILE_NUMBER, input.ALTERNATE_NUMBER, input.EMAIL, input.ROLE, input.ADDRESS, input.STATUS, image_url, input.CREATED_BY ];
      
    const result = await executeDbQuery(insertQuery, params, false, apiName, port, connection);
    await connection.commit();
    const results = {message: "User created", userId: newUserId, affectedRows: result.affectedRows}
    res.json({ status: 0, result:results });  
  } catch (err: any) {
    if (connection) await connection.rollback();
    res.json({ status: 1, result: err.toString() });
  } finally {
    if (connection) connection.release();
  }
}


  async getAllUsers(req: Request, res: Response) {
    const apiName = "user/read-all";
    const port: number = req.socket?.localPort ?? 3000;
    const query = "SELECT CITY_ID, USER_ID, NAME, SURNAME, FATHER_NAME, GENDER, DOB, MOBILE_NUMBER, ALTERNATE_NUMBER, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, DATE_FORMAT(CREATED_AT, '%d/%m/%Y %H:%i') AS CREATED_ON, UPDATED_BY, DATE_FORMAT(UPDATED_AT, '%d/%m/%Y %H:%i') AS EDITED_ON FROM USERS";
    try {
      const rows = await executeDbQuery(query, [], false, apiName, port);
      res.json({ status: 0, result: rows });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }

  async getUserById(req: Request, res: Response) {
    const apiName = "user/read";
    const port: number = req.socket.localPort!;
    const id = req.query.id;
    const query = "SELECT CITY_ID, USER_ID, NAME, SURNAME, FATHER_NAME, GENDER, DOB, MOBILE_NUMBER, ALTERNATE_NUMBER, EMAIL, ROLE, ADDRESS, STATUS, IMAGE_URL, CREATED_BY, DATE_FORMAT(CREATED_AT, '%d/%m/%Y %H:%i') AS CREATED_ON, UPDATED_BY, DATE_FORMAT(UPDATED_AT, '%d/%m/%Y %H:%i') AS EDITED_ON FROM USERS WHERE USER_ID = ?";
    try {
      const rows = await executeDbQuery(query, [id], false, apiName, port);
      res.json({ status: 0, result: rows });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }

  async updateUser(req: Request, res: Response) {
    const apiName = "user/update";
    const port: number = req.socket.localPort!;
    let input=req.body;
    let connection: any;
    connection = await pool.getConnection();
      await connection.beginTransaction();

    const chekdup = ` SELECT COUNT(*) as count FROM USERS WHERE EMAIL=? AND MOBILE_NUMBER=?`;
          const dupResult = await executeDbQuery(chekdup, [input.EMAIL, input.MOBILE_NUMBER], false, apiName, port, connection);
          if (Number(dupResult[0]?.count) > 0) {
              await connection.rollback();
              res.status(409).json({ status: 2, result: "User already exists." });
              return;
          }

    const image_url = await uploadImage(input.IMAGE_URL);
    const updateQuery = "UPDATE USERS SET CITY_ID = ?, NAME = ?, SURNAME = ?, FATHER_NAME = ?, GENDER = ?, DOB = ?, MOBILE_NUMBER = ?, ALTERNATE_NUMBER = ?, EMAIL = ?, ROLE = ?, ADDRESS = ?, STATUS = ?, IMAGE_URL = ?, UPDATED_BY = ? WHERE USER_ID = ?";
    const params = [ input.CITY_ID, input.NAME, input.SURNAME, input.FATHER_NAME, input.GENDER, input.DOB, input.MOBILE_NUMBER, input.ALTERNATE_NUMBER, input.EMAIL, input.ROLE, input.ADDRESS, input.STATUS, image_url, input.CREATED_BY, input.USER_ID ];
    try {
      const result = await executeDbQuery(updateQuery, params, true, apiName, port);
      const results = {message: "User updated"}
      res.json({ status: 0, result:results });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }

//----------------------Role End Points----------------------------//
//   async createRole(req: Request, res: Response) {
//     const apiName = "role/create"; const port = req.socket.localPort!; const input = req.body; let connection;
//     try {
//       connection = await pool.getConnection(); await connection.beginTransaction();

//        const chekdup = ` SELECT COUNT(*) as count FROM ROLES WHERE ROLE_NAME=? AND DESCRIPTION=?`;
//           const dupResult = await executeDbQuery(chekdup, [input.ROLE_NAME, input.DESCRIPTION], false, apiName, port, connection);
//           if (Number(dupResult[0]?.count) > 0) {
//               await connection.rollback();
//               res.status(409).json({ status: 2, result: "Role already exists." });
//               return;
//           }

//       const maxIdResult = await executeDbQuery("SELECT IFNULL(MAX(ROLE_ID), 1110) AS maxId FROM ROLES", [], false, apiName, port, connection);
//       const newId = Number(maxIdResult[0]?.maxId || 1110) + 1;
//       const insertQuery = `INSERT INTO ROLES (CITY_ID, ROLE_ID, ROLE_NAME, DESCRIPTION, STATUS, CREATED_BY) VALUES (?, ?, ?, ?, ?, ?)`;
//       const params = [input.CITY_ID, newId, input.ROLE_ID, input.DESCRIPTION, input.STATUS, input.CREATED_BY];
//       const result = await executeDbQuery(insertQuery, params, false, apiName, port, connection);
//       await connection.commit();
//       const results = {message: "Role created", roleId: newId, affectedRows: result.affectedRows};
//       res.json({ status: 0, results:result });
//     } catch (err: any) {
//       if (connection) await connection.rollback(); res.json({ status: 1, result: err.toString() });
//     } finally {
//       if (connection) connection.release();
//     }
//   }

//   async getAllRoles(req: Request, res: Response) {
//     const apiName = "role/read-all"; const port = req.socket.localPort!;
//     const query = `SELECT CITY_ID, ROLE_ID, ROLE_NAME, DESCRIPTION, STATUS, DATE_FORMAT(CREATED_AT, '%d/%m/%Y %H:%i') AS CREATED_ON, CREATED_BY, DATE_FORMAT(UPDATED_AT, '%d/%m/%Y %H:%i') AS EDITED_ON, UPDATED_BY FROM ROLES`;
//     try {
//       const rows = await executeDbQuery(query, [], false, apiName, port);
//       res.json({ status: 0, result: rows });
//     } catch (err: any) {
//       res.json({ status: 1, result: err.toString() });
//     }
//   }


//   async updateRole(req: Request, res: Response) {
//     const apiName = "role/update"; const port = req.socket.localPort!; const input = req.body;
//     let connection: any;
//     connection = await pool.getConnection();
//       await connection.beginTransaction();
//     const chekdup = ` SELECT COUNT(*) as count FROM ROLES WHERE ROLE_NAME=? AND DESCRIPTION=?`;
//           const dupResult = await executeDbQuery(chekdup, [input.ROLE_NAME, input.DESCRIPTION], false, apiName, port, connection);
//           if (Number(dupResult[0]?.count) > 0) {
//               await connection.rollback();
//               res.status(409).json({ status: 2, result: "Role already exists." });
//               return;
//           }

//     const query = `UPDATE ROLES SET CITY_ID = ?, ROLE_NAME = ?, DESCRIPTION = ?, STATUS = ?, UPDATED_BY = ? WHERE ROLE_ID = ?`;
//     const params = [input.CITY_ID, input.ROLE_NAME, input.DESCRIPTION, input.STATUS, input.UPDATED_BY, input.ROLE_ID];
//     try {
//       const result = await executeDbQuery(query, params, true, apiName, port);
//       const results = {message: "Role updated"};
//       res.json({ status: 0, result:results });
//     } catch (err: any) {
//       res.json({ status: 1, error: err.toString() });
//     }
//   }

// }

// export default UserController;


  async createRole(req: Request, res: Response) {
    const apiName = "role/create";
    const port = req.socket.localPort!;
    const input = req.body;
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const maxIdResult = await executeDbQuery(
        "SELECT IFNULL(MAX(ROLE_ID), 1110) AS maxId FROM ROLES",
        [],
        false,
        apiName,
        port,
        connection
      );
      const newId = Number(maxIdResult[0]?.maxId || 1110) + 1;
      const insertQuery = `INSERT INTO ROLES (CITY_ID, ROLE_ID, ROLE_NAME, DESCRIPTION, STATUS, CREATED_BY, CREATED_AT) VALUES (?, ?, ?, ?, ?, ?, NOW())`;
      const params = [
        input.CITY_ID,
        newId,
        input.ROLE_NAME,
        input.DESCRIPTION,
        input.STATUS,
        input.CREATED_BY,
      ];
      const result = await executeDbQuery(
        insertQuery,
        params,
        false,
        apiName,
        port,
        connection
      );
      await connection.commit();
      const results = {
        message: "Role created",
        ROLE_ID: newId,
        affectedRows: result.affectedRows,
      };
      res.json({ status: 0, results: result });
    } catch (err: any) {
      if (connection) await connection.rollback();
      res.json({ status: 1, result: err.toString() });
    } finally {
      if (connection) connection.release();
    }
  }

  async getAllRoles(req: Request, res: Response) {
    const apiName = "role/read-all";
    const port = req.socket.localPort!;
    const query = `SELECT CITY_ID, ROLE_ID, ROLE_NAME, DESCRIPTION, STATUS, CREATED_AT, CREATED_BY, UPDATED_AT, UPDATED_BY, UPDATED_AT FROM ROLES`;
    try {
      const rows = await executeDbQuery(query, [], false, apiName, port);
      res.json({ status: 0, result: rows });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }

  async updateRole(req: Request, res: Response) {
    const apiName = "role/update";
    const port = req.socket.localPort!;
    const input = req.body;
    const query = `UPDATE ROLES SET CITY_ID = ?, ROLE_NAME = ?, DESCRIPTION = ?, STATUS = ?, UPDATED_BY = ?, UPDATED_AT = NOW() WHERE ROLE_ID = ?`;
    const params = [
      input.CITY_ID,
      input.ROLE_NAME,
      input.DESCRIPTION,
      input.STATUS,
      input.CREATED_BY,
      input.ROLE_ID,
    ];
    try {
      const result = await executeDbQuery(query, params, true, apiName, port);
      const results = { message: "Role updated" };
      res.json({ status: 0, result: results });
    } catch (err: any) {
      res.json({ status: 1, error: err.toString() });
    }
  }
}

export default UserController;
