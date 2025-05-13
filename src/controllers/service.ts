import express, { Request, Response, Application } from "express";
import { pool, executeDbQuery } from "../db";
import { uploadImage } from "../utils/cloudinaryUtil";
import { authenticateToken } from "../middleWare/authMiddleWare";

export default class ServiceController {
  public router = express.Router();

  constructor(app: Application) {
    app.use("/api/service", this.router);

    this.router.get("/services", authenticateToken as any, this.getAllServices.bind(this));
    this.router.get("/servicesbyid", this.getServiceById.bind(this));
    this.router.put("/services", this.updateService.bind(this));
    this.router.post("/services", this.createService.bind(this));

    this.router.get("/sub", this.getAllSubServices.bind(this));
    this.router.get("/subbyid", this.getSubServiceById.bind(this));
    this.router.put("/sub", this.updateSubService.bind(this));
    this.router.post("/sub", this.createSubService.bind(this));

    
  }

  async createService(req: Request, res: Response) {
    const apiName = "service/create";
    const port = req.socket.localPort!;
    let input = req.body;
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const chekdup = ` SELECT COUNT(*) as count FROM SERVICES WHERE NAME=? AND DESCRIPTION=?`;
        const dupResult = await executeDbQuery(chekdup, [input.NAME, input.DESCRIPTION], false, apiName, port, connection);
        if (Number(dupResult[0]?.count) > 0) {
            await connection.rollback();
            res.status(409).json({ status: 2, result: "Service already exists." });
            return;
        }

      const rows = await executeDbQuery( "SELECT MAX(CAST(ID AS UNSIGNED)) AS maxId FROM SERVICES", [], false, apiName, port, connection );
      const newId = (Number(rows[0]?.maxId || 0) + 1).toString().padStart(3, '0');
      console.log('maxid :',rows[0]?.maxId );
      const image_url = await uploadImage(input.IMAGE_URL);
      
      const insertQuery = ` INSERT INTO SERVICES ( ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY) VALUES ( ?, ?, ?, ?, ?, ?) `;
      const params = [ newId, input.NAME, input.DESCRIPTION, image_url, input.STATUS, input.CREATED_BY];

      const result = await executeDbQuery(insertQuery, params, false, apiName, port, connection);
      await connection.commit();
      const results={message: "Service created", serviceId: newId, affectedRows: result.affectedRows}
      res.json({ status: 0, result:results });

    } catch (err: any) {
      if (connection) await connection.rollback();
      res.json({ status: 1, result: err.toString() });
    } finally {
      if (connection) connection.release();
    }
  }

  async getAllServices(req: Request, res: Response) {
    const apiName = "service/read-all";
    const port = req.socket.localPort!;
    const query = ` SELECT CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, DATE_FORMAT(CREATED_AT, '%d/%m/%Y %H:%i') AS CREATED_ON, UPDATED_BY, DATE_FORMAT(UPDATED_AT, '%d/%m/%Y %H:%i') AS EDITED_ON FROM SERVICES `;

    try {
      const rows = await executeDbQuery(query, [], false, apiName, port);
      res.json({ status: 0, result: rows });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }

  async getServiceById(req: Request, res: Response) {
    const apiName = "service/read";
    const port = req.socket.localPort!;
    const id = req.query.id || "";
    const query = ` SELECT CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, DATE_FORMAT(CREATED_AT, '%d/%m/%Y %H:%i') AS CREATED_ON, UPDATED_BY, DATE_FORMAT(UPDATED_AT, '%d/%m/%Y %H:%i') AS EDITED_ON FROM SERVICES WHERE ID = ? `;

    try {
      const rows = await executeDbQuery(query, [id], false, apiName, port);
      res.json({ status: 0, result: rows });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }

  async updateService(req: Request, res: Response) {
    const apiName = "service/update";
    const port = req.socket.localPort!;
    let input = req.body;
     let connection: any;
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const chekdup = ` SELECT COUNT(*) as count FROM SERVICES WHERE NAME=? AND DESCRIPTION=?`;
        const dupResult = await executeDbQuery(chekdup, [input.NAME, input.DESCRIPTION], false, apiName, port, connection);
        if (Number(dupResult[0]?.count) > 0) {
            await connection.rollback();
            res.status(409).json({ status: 2, result: "Service already exists." });
            return;
        }
    const image_url = await uploadImage(input.IMAGE_URL);
    const query = ` UPDATE SERVICES SET  NAME = ?, DESCRIPTION = ?, IMAGE_URL = ?, STATUS = ?, UPDATED_BY = ? WHERE ID = ? `;
    const params = [ input.NAME, input.DESCRIPTION, image_url, input.STATUS, input.CREATED_BY, input.ID];

    try {
      const result = await executeDbQuery(query, params, true, apiName, port);
       const results={ message: "Service updated"}
      res.json({ status:  0, result:results });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }

  //----------------------------Sub Service End Points------------------------//
  async createSubService(req: Request, res: Response) {
    const apiName = "subservice/create";
    const port = req.socket.localPort!;
    let input = req.body;
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const chekdup = ` SELECT COUNT(*) as count FROM SUB_SERVICES WHERE SUB_SERVICES_NAME=? AND BUSINESS_NAME=?`;
        const dupResult = await executeDbQuery(chekdup, [input.SUB_SERVICES_NAME, input.BUSINESS_NAME], false, apiName, port, connection);
        if (Number(dupResult[0]?.count) > 0) {
            await connection.rollback();
            res.status(409).json({ status: 2, result: "Sub Service already exists." });
            return;
        }
        
      const rows = await executeDbQuery("SELECT MAX(CAST(SUB_SERVICE_ID AS UNSIGNED)) AS maxId FROM SUB_SERVICES", [], false, apiName, port, connection);
      const newId = (Number(rows[0]?.maxId || 0) + 1).toString().padStart(4, '0');
      const image_url1 = await uploadImage(input.IMAGE_URL1);
      const image_url2 = await uploadImage(input.IMAGE_URL2);
      const image_url3 = await uploadImage(input.IMAGE_URL3);
      const image_url4 = await uploadImage(input.IMAGE_URL4);
      const image_url5 = await uploadImage(input.IMAGE_URL5);
      const insertQuery = ` INSERT INTO SUB_SERVICES (CITY_ID, SUB_SERVICE_ID, SUB_SERVICES_NAME, BUSINESS_NAME, OWNER_NAME, BUSINESS_TYPE, MOBILE, ADDRESS, WEEKDAY_TIMINGS, SUNDAY_TIMINGS, WEBSITE_URL, EMAIL, DESCRIPTION, LATITUDE, LONGITUDE, DEFAULT_CONTACT, IMAGE_URL1, IMAGE_URL2, IMAGE_URL3, IMAGE_URL4, IMAGE_URL5, STATUS, CREATED_BY) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
      const params = [ input.CITY_ID, newId, input.SUB_SERVICES_NAME, input.BUSINESS_NAME, input.OWNER_NAME, input.BUSINESS_TYPE, input.MOBILE, input.ADDRESS, input.WEEKDAY_TIMINGS, input.SUNDAY_TIMINGS, input.WEBSITE_URL, input.EMAIL, input.DESCRIPTION, input.LATITUDE, input.LONGITUDE, input.DEFAULT_CONTACT, image_url1, image_url2, image_url3, image_url4, image_url5, input.STATUS, input.CREATED_BY ];

      const result = await executeDbQuery(insertQuery, params, false, apiName, port, connection);
      await connection.commit();
      const results = {message: "Sub-service created", subServiceId: newId, affectedRows: result.affectedRows};
      res.json({ status: 0, result:results });
    } catch (err: any) {
      if (connection) await connection.rollback();
      res.json({ status: 1, result: err.toString() });
    } finally {
      if (connection) connection.release();
    }
  }

  async getAllSubServices(req: Request, res: Response) {
    const apiName = "subservice/read-all";
    const port = req.socket.localPort!;
    const query = ` SELECT CITY_ID, SUB_SERVICE_ID, SUB_SERVICES_NAME, BUSINESS_NAME, OWNER_NAME, BUSINESS_TYPE, MOBILE, ADDRESS, WEEKDAY_TIMINGS, SUNDAY_TIMINGS, WEBSITE_URL, EMAIL, DESCRIPTION, LATITUDE, LONGITUDE, DEFAULT_CONTACT, IMAGE_URL1, IMAGE_URL2, IMAGE_URL3, IMAGE_URL4, IMAGE_URL5, STATUS, CREATED_BY, DATE_FORMAT(CREATED_ON, '%d/%m/%Y %H:%i') AS CREATED_ON, EDITED_BY, DATE_FORMAT(EDITED_ON, '%d/%m/%Y %H:%i') AS EDITED_ON FROM SUB_SERVICES`;

    try {
      const rows = await executeDbQuery(query, [], false, apiName, port);
      res.json({ status: 0, result: rows });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }

  async getSubServiceById(req: Request, res: Response) {
    const apiName = "subservice/read";
    const port = req.socket.localPort!;
    const subServiceId = req.query.id || "";

    const query = ` SELECT CITY_ID, SUB_SERVICE_ID, SUB_SERVICES_NAME, BUSINESS_NAME, OWNER_NAME, BUSINESS_TYPE, MOBILE, ADDRESS, WEEKDAY_TIMINGS, SUNDAY_TIMINGS, WEBSITE_URL, EMAIL, DESCRIPTION, LATITUDE, LONGITUDE, DEFAULT_CONTACT, IMAGE_URL1, IMAGE_URL2, IMAGE_URL3, IMAGE_URL4, IMAGE_URL5, STATUS, CREATED_BY, DATE_FORMAT(CREATED_ON, '%d/%m/%Y %H:%i') AS CREATED_ON, EDITED_BY, DATE_FORMAT(EDITED_ON, '%d/%m/%Y %H:%i') AS EDITED_ON FROM SUB_SERVICES WHERE SUB_SERVICE_ID = ?`;

    try {
      const rows = await executeDbQuery(query, [subServiceId], false, apiName, port);
      res.json({ status: 0, result: rows });
    } catch (err: any) {
      res.status(500).json({ status: 1, result: err.toString() });
    }
  }

  async updateSubService(req: Request, res: Response) {
    const apiName = "subservice/update";
    const port = req.socket.localPort!;
    let input = req.body;
    let connection: any;
    connection = await pool.getConnection();
      await connection.beginTransaction();

      const chekdup = ` SELECT COUNT(*) as count FROM SUB_SERVICES WHERE SUB_SERVICES_NAME=? AND BUSINESS_NAME=?`;
        const dupResult = await executeDbQuery(chekdup, [input.SUB_SERVICES_NAME, input.BUSINESS_NAME], false, apiName, port, connection);
        if (Number(dupResult[0]?.count) > 0) {
            await connection.rollback();
            res.status(409).json({ status: 2, result: "Sub Service already exists." });
            return;
        }

      const image_url1 = await uploadImage(input.IMAGE_URL1);
      const image_url2 = await uploadImage(input.IMAGE_URL2);
      const image_url3 = await uploadImage(input.IMAGE_URL3);
      const image_url4 = await uploadImage(input.IMAGE_URL4);
      const image_url5 = await uploadImage(input.IMAGE_URL5);
    const query = ` UPDATE SUB_SERVICES SET CITY_ID = ?, SUB_SERVICES_NAME = ?, BUSINESS_NAME = ?, OWNER_NAME = ?, BUSINESS_TYPE = ?, MOBILE = ?, ADDRESS = ?, WEEKDAY_TIMINGS = ?, SUNDAY_TIMINGS = ?, WEBSITE_URL = ?, EMAIL = ?, DESCRIPTION = ?, LATITUDE = ?, LONGITUDE = ?, DEFAULT_CONTACT = ?, IMAGE_URL1 = ?, IMAGE_URL2 = ?, IMAGE_URL3 = ?, IMAGE_URL4 = ?, IMAGE_URL5 = ?, STATUS=?, EDITED_BY = ? WHERE SUB_SERVICE_ID = ?`;

    const params = [ input.CITY_ID, input.SUB_SERVICES_NAME, input.BUSINESS_NAME, input.OWNER_NAME, input.BUSINESS_TYPE, input.MOBILE, input.ADDRESS, input.WEEKDAY_TIMINGS, input.SUNDAY_TIMINGS, input.WEBSITE_URL, input.EMAIL, input.DESCRIPTION, input.LATITUDE, input.LONGITUDE, input.DEFAULT_CONTACT, image_url1, image_url2, image_url3, image_url4, image_url5, input.STATUS, input.EDITED_BY, input.SUB_SERVICE_ID ];

    try {
      const result = await executeDbQuery(query, params, true, apiName, port);
      const reults = {message: "Sub-service updated"};
      res.json({ status: 0, result:reults });
    } catch (err: any) {
      res.json({ status: 1, error: err.toString() });
    }
  }
}
