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

    this.router.get("/SubServices", this.getAllSubServices.bind(this));
    this.router.get("/SubServicesbyid", this.getSubServiceById.bind(this));
    this.router.put("/SubServices", this.updateSubService.bind(this));
    this.router.post("/SubServices", this.createSubService.bind(this));

    this.router.get("/Servicesnames", this.Servicesnames.bind(this));
    this.router.get("/SubServicesnames", this.SubServicesnames.bind(this));

    this.router.get("/BussinessProfiles", this.getAllBusinessProfiles.bind(this));
    this.router.get("/BussinessProfilesbyid", this.getBusinessProfileById.bind(this));
    this.router.put("/BussinessProfiles", this.updateBusinessProfile.bind(this));
    this.router.post("/BussinessProfiles", this.createBusinessProfile.bind(this));

    
  }
  async Servicesnames(req: Request, res: Response) {
    const apiName = "service/read-all";
    const port = req.socket.localPort!;
    // console.log('headers is',headers);
    
    const query = ` SELECT  ID, NAME FROM SERVICES Where Status ='A' `;

    try {
      const rows = await executeDbQuery(query, [], false, apiName, port);
      res.json({ status: 0, result: rows });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }
 async SubServicesnames(req: Request, res: Response) {
    const apiName = "subservice/read-all";
    const port = req.socket.localPort!;
    const input = req.query;

    const query = "SELECT SUB_SERVICE_ID as ID, NAME FROM SUB_SERVICES WHERE STATUS='A' and SERVICE_ID = ? ";

    try {
      const rows = await executeDbQuery(query, [input.ID], false, apiName, port);
      res.json({ status: 0, result: rows });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }
  async createService(req: Request, res: Response) {
    const apiName = "service/create";
    const port = req.socket.localPort!;
    let input = req.body;
    const userId = req.headers["userid"] || "";

    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const chekdup = ` SELECT COUNT(*) as count FROM SERVICES WHERE NAME=? AND DESCRIPTION=?`;
        const dupResult = await executeDbQuery(chekdup, [input.NAME, input.DESCRIPTION], false, apiName, port, connection);
        if (Number(dupResult[0]?.count) > 0) {
            await connection.rollback();
            res.json({ status: 2, result: "Service already exists." });
            return;
        }

      const rows = await executeDbQuery( "SELECT MAX(CAST(ID AS UNSIGNED)) AS maxId FROM SERVICES", [], false, apiName, port, connection );
      const newId = (Number(rows[0]?.maxId || 0) + 1).toString().padStart(3, '0');
      // console.log('maxid :',rows[0]?.maxId );
      const image_url = await uploadImage(input.IMAGE_URL);
      
      const insertQuery = ` INSERT INTO SERVICES ( ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY) VALUES ( ?, ?, ?, ?, ?, ?) `;
      const params = [ newId, input.NAME, input.DESCRIPTION, image_url, input.STATUS, userId];

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
    // console.log('headers is',headers);
    
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
    const userId = req.headers["userid"] || "";
     let connection: any;
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const image_url = await uploadImage(input.IMAGE_URL);
    const query = ` UPDATE SERVICES SET  NAME = ?, DESCRIPTION = ?, IMAGE_URL = ?, STATUS = ?, UPDATED_BY = ? WHERE ID = ? `;
    const params = [ input.NAME, input.DESCRIPTION, image_url, input.STATUS, userId, input.ID];

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
    const userId = req.headers["userid"] || "";
    if(!input.CITY_ID){
      input.CITY_ID='001'
    }
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const checkDup = await executeDbQuery("SELECT COUNT(*) as count FROM SUB_SERVICES WHERE NAME = ? AND SERVICE_ID = ?", [input.NAME, input.ServiceID], false, apiName, port, connection);
      if (Number(checkDup[0]?.count) > 0) {
        await connection.rollback();
        res.json({ status: 2, result: "Sub Service already exists." });
        return;
      }

      const rows = await executeDbQuery("SELECT MAX(CAST(SUB_SERVICE_ID AS UNSIGNED)) AS maxId FROM SUB_SERVICES", [], false, apiName, port, connection);
      const newId = (Number(rows[0]?.maxId || 0) + 1).toString().padStart(4, '0');

      const imageUrl = await uploadImage(input.IMAGE_URL);

      const insertQuery = "INSERT INTO SUB_SERVICES (CITY_ID, SERVICE_ID, SUB_SERVICE_ID, NAME, DESCRIPTION, STATUS, IMAGE_URL, CREATED_BY) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      const params = [input.CITY_ID, input.ServiceID, newId, input.NAME, input.DESCRIPTION, input.STATUS, imageUrl, userId];

      const result = await executeDbQuery(insertQuery, params, false, apiName, port, connection);
      await connection.commit();

      res.json({ status: 0, result: { message: "Sub-service created", subServiceId: newId, affectedRows: result.affectedRows } });
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
    const query = "SELECT  S.NAME as Service_name, SUB.SERVICE_ID, SUB.SUB_SERVICE_ID as ID, SUB.NAME, SUB.DESCRIPTION, SUB.STATUS, SUB.IMAGE_URL, SUB.CREATED_BY, DATE_FORMAT(SUB.CREATED_ON, '%d/%m/%Y %H:%i') AS CREATED_ON, SUB.EDITED_BY, DATE_FORMAT(SUB.EDITED_ON, '%d/%m/%Y %H:%i') AS EDITED_ON FROM SUB_SERVICES SUB LEFT JOIN SERVICES S ON SUB.SERVICE_ID = S.ID";

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

    const query = "SELECT SUB.CITY_ID, S.ID, S.NAME, SUB.SERVICE_ID, SUB.SUB_SERVICE_ID, SUB.NAME, SUB.DESCRIPTION, SUB.STATUS, SUB.IMAGE_URL, SUB.CREATED_BY, DATE_FORMAT(SUB.CREATED_ON, '%d/%m/%Y %H:%i') AS CREATED_ON, SUB.EDITED_BY, DATE_FORMAT(SUB.EDITED_ON, '%d/%m/%Y %H:%i') AS EDITED_ON FROM SUB_SERVICES SUB LEFT JOIN SERVICES S ON SUB.SERVICE_ID = S.ID WHERE SUB.SUB_SERVICE_ID = ?";

    try {
      const rows = await executeDbQuery(query, [subServiceId], false, apiName, port);
      res.json({ status: 0, result: rows });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }

  async updateSubService(req: Request, res: Response) {
    const apiName = "subservice/update";
    const port = req.socket.localPort!;
    let input = req.body;
    let connection: any;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const editedby = req.headers["userid"] || "";
      const imageUrl = await uploadImage(input.IMAGE_URL);

      const query = "UPDATE SUB_SERVICES SET CITY_ID = ?, SERVICE_ID = ?, NAME = ?, DESCRIPTION = ?, STATUS = ?, IMAGE_URL = ?, EDITED_BY = ? WHERE SUB_SERVICE_ID = ?";
      const params = ['001', input.ServiceID, input.NAME, input.DESCRIPTION, input.STATUS, imageUrl, editedby, input.ID];

      const result = await executeDbQuery(query, params, true, apiName, port);
      await connection.commit();

      res.json({ status: 0, result: { message: "Sub-service updated" } });
    } catch (err: any) {
      if (connection) await connection.rollback();
      res.json({ status: 1, error: err.toString() });
    } finally {
      if (connection) connection.release();
    }
  }

 // ---------------------------- Business Profile Endpoints ---------------------------- //

async createBusinessProfile(req: Request, res: Response) {
  const apiName = "businessprofile/create";
  const port = req.socket.localPort!;
  const input = req.body;
  const userId = req.headers["userid"] || "";
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const checkDup = "SELECT COUNT(*) as count FROM BUSSINESS_PROFILE WHERE BUSINESS_NAME = ? AND MOBILE = ?";
    const dupResult = await executeDbQuery(checkDup, [input.BUSINESS_NAME, input.MOBILE], false, apiName, port, connection);
    if (Number(dupResult[0]?.count) > 0) {
      await connection.rollback();
      res.json({ status: 2, result: "Business Profile already exists." });
      return;
    }

    const rows = await executeDbQuery("SELECT MAX(CAST(SUB_SERVICE_ID AS UNSIGNED)) AS maxId FROM BUSSINESS_PROFILE", [], false, apiName, port, connection);
    const newId = (Number(rows[0]?.maxId || 0) + 1).toString().padStart(4, '0');

    const image_url1 = await uploadImage(input.IMAGE_URL1);
    const image_url2 = await uploadImage(input.IMAGE_URL2);
    const image_url3 = await uploadImage(input.IMAGE_URL3);
    const image_url4 = await uploadImage(input.IMAGE_URL4);
    const image_url5 = await uploadImage(input.IMAGE_URL5);

    const insertQuery = `INSERT INTO BUSSINESS_PROFILE (CITY_ID, SERVICE_ID, SUB_SERVICE_ID, BUSINESS_ID, BUSINESS_NAME, OWNER_NAME, BUSINESS_TYPE, MOBILE, ADDRESS, WEEKDAY_TIMINGS, SUNDAY_TIMINGS, WEBSITE_URL, EMAIL, DESCRIPTION, LATITUDE, LONGITUDE, DEFAULT_CONTACT, IMAGE_URL1, IMAGE_URL2, IMAGE_URL3, IMAGE_URL4, IMAGE_URL5, STATUS, CREATED_BY) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [input.CITY_ID, input.SERVICE_ID, newId, input.BUSINESS_ID, input.BUSINESS_NAME, input.OWNER_NAME, input.BUSINESS_TYPE, input.MOBILE, input.ADDRESS, input.WEEKDAY_TIMINGS, input.SUNDAY_TIMINGS, input.WEBSITE_URL, input.EMAIL, input.DESCRIPTION, input.LATITUDE, input.LONGITUDE, input.DEFAULT_CONTACT, image_url1, image_url2, image_url3, image_url4, image_url5, input.STATUS, userId];

    const result = await executeDbQuery(insertQuery, params, false, apiName, port, connection);
    await connection.commit();

    res.json({ status: 0, result: { message: "Business Profile created", subServiceId: newId, affectedRows: result.affectedRows } });
  } catch (err: any) {
    if (connection) await connection.rollback();
    res.json({ status: 1, result: err.toString() });
  } finally {
    if (connection) connection.release();
  }
}

async getAllBusinessProfiles(req: Request, res: Response) {
  const apiName = "businessprofile/read-all";
  const port = req.socket.localPort!;

  const query = `SELECT B.CITY_ID, B.SERVICE_ID, S.NAME SERVICE, B.SUB_SERVICE_ID, SUB.NAME AS SUB_SERVICE, B.BUSINESS_ID, B.BUSINESS_NAME, B.OWNER_NAME, B.BUSINESS_TYPE, B.MOBILE, B.ADDRESS, B.WEEKDAY_TIMINGS, B.SUNDAY_TIMINGS, B.WEBSITE_URL, B.EMAIL, B.DESCRIPTION, B.LATITUDE, B.LONGITUDE, B.DEFAULT_CONTACT, B.IMAGE_URL1, B.IMAGE_URL2, B.IMAGE_URL3, B.IMAGE_URL4, B.IMAGE_URL5, B.STATUS, B.CREATED_BY, DATE_FORMAT(B.CREATED_ON, '%d/%m/%Y %H:%i') AS CREATED_ON, B.EDITED_BY, DATE_FORMAT(B.EDITED_ON, '%d/%m/%Y %H:%i') AS EDITED_ON FROM BUSSINESS_PROFILE B LEFT JOIN SERVICES S ON S.ID=B.SERVICE_ID LEFT JOIN SUB_SERVICES SUB ON SUB.SUB_SERVICE_ID=B.SUB_SERVICE_ID`;

  try {
    const rows = await executeDbQuery(query, [], false, apiName, port);
    res.json({ status: 0, result: rows });
  } catch (err: any) {
    res.json({ status: 1, result: err.toString() });
  }
}

async getBusinessProfileById(req: Request, res: Response) {
  const apiName = "businessprofile/read";
  const port = req.socket.localPort!;
  const BusinessId = req.query.id || "";

  const query = `SELECT B.CITY_ID, B.SERVICE_ID, S.NAME SERVICE, B.SUB_SERVICE_ID, SUB.NAME AS SUB_SERVICE, B.BUSINESS_ID, B.BUSINESS_NAME, B.OWNER_NAME, B.BUSINESS_TYPE, B.MOBILE, B.ADDRESS, B.WEEKDAY_TIMINGS, B.SUNDAY_TIMINGS, B.WEBSITE_URL, B.EMAIL, B.DESCRIPTION, B.LATITUDE, B.LONGITUDE, B.DEFAULT_CONTACT, B.IMAGE_URL1, B.IMAGE_URL2, B.IMAGE_URL3, B.IMAGE_URL4, B.IMAGE_URL5, B.STATUS, B.CREATED_BY, DATE_FORMAT(B.CREATED_ON, '%d/%m/%Y %H:%i') AS CREATED_ON, B.EDITED_BY, DATE_FORMAT(B.EDITED_ON, '%d/%m/%Y %H:%i') AS EDITED_ON FROM BUSSINESS_PROFILE B LEFT JOIN SERVICES S ON S.ID=B.SERVICE_ID LEFT JOIN SUB_SERVICES SUB ON SUB.SUB_SERVICE_ID=B.SUB_SERVICE_ID WHERE B.BUSINESS_ID = ?`;

  try {
    const rows = await executeDbQuery(query, [BusinessId], false, apiName, port);
    res.json({ status: 0, result: rows });
  } catch (err: any) {
    res.json({ status: 1, result: err.toString() });
  }
}

async updateBusinessProfile(req: Request, res: Response) {
  const apiName = "businessprofile/update";
  const port = req.socket.localPort!;
  const input = req.body;
  const userId = req.headers["userid"] || "";
  let connection: any;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const image_url1 = await uploadImage(input.IMAGE_URL1);
    const image_url2 = await uploadImage(input.IMAGE_URL2);
    const image_url3 = await uploadImage(input.IMAGE_URL3);
    const image_url4 = await uploadImage(input.IMAGE_URL4);
    const image_url5 = await uploadImage(input.IMAGE_URL5);

    const query = `UPDATE BUSSINESS_PROFILE SET CITY_ID = ?, SERVICE_ID = ?, SUB_SERVICE_ID = ?, BUSINESS_NAME = ?, OWNER_NAME = ?, BUSINESS_TYPE = ?, MOBILE = ?, ADDRESS = ?, WEEKDAY_TIMINGS = ?, SUNDAY_TIMINGS = ?, WEBSITE_URL = ?, EMAIL = ?, DESCRIPTION = ?, LATITUDE = ?, LONGITUDE = ?, DEFAULT_CONTACT = ?, IMAGE_URL1 = ?, IMAGE_URL2 = ?, IMAGE_URL3 = ?, IMAGE_URL4 = ?, IMAGE_URL5 = ?, STATUS = ?, EDITED_BY = ? WHERE BUSINESS_ID = ?`;

    const params = [input.CITY_ID, input.SERVICE_ID, input.SUB_SERVICE_ID, input.BUSINESS_NAME, input.OWNER_NAME, input.BUSINESS_TYPE, input.MOBILE, input.ADDRESS, input.WEEKDAY_TIMINGS, input.SUNDAY_TIMINGS, input.WEBSITE_URL, input.EMAIL, input.DESCRIPTION, input.LATITUDE, input.LONGITUDE, input.DEFAULT_CONTACT, image_url1, image_url2, image_url3, image_url4, image_url5, input.STATUS, userId, input.BUSINESS_ID];

    const result = await executeDbQuery(query, params, true, apiName, port);
    await connection.commit();

    res.json({ status: 0, result: { message: "Business Profile updated" } });
  } catch (err: any) {
    if (connection) await connection.rollback();
    res.json({ status: 1, error: err.toString() });
  } finally {
    if (connection) connection.release();
  }
}

}
