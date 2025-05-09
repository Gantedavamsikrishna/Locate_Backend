import express, { Request, Response, Application } from "express";
import { pool, executeDbQuery } from "../db";

export default class ServiceController {
  public router = express.Router();

  constructor(app: Application) {
    app.use("/api/service", this.router);
    this.router.get("/services", this.getAllServices.bind(this));
    this.router.post("/services", this.createService.bind(this));
    this.router.put("/services", this.updateService.bind(this));
    this.router.get("/servicesbyid", this.getServiceById.bind(this));
  }

  async createService(req: Request, res: Response) {
    const apiName = "service/create";
    const port = req.socket.localPort!;
    let input = req.body;
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const rows = await executeDbQuery( "SELECT MAX(CAST(ID AS UNSIGNED)) AS maxId FROM SERVICES", [], false, apiName, port, connection );
      const newId = (Number(rows[0]?.maxId || 0) + 1).toString().padStart(3, '0');
      console.log('maxid :',rows[0]?.maxId );
      
console.log('newId',newId);

      const insertQuery = ` INSERT INTO SERVICES ( ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT) VALUES ( ?, ?, ?, ?, ?, ?, NOW()) `;
      const params = [ newId, input.NAME, input.DESCRIPTION, input.IMAGE_URL, input.STATUS, input.CREATED_BY];

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
    const query = ` SELECT  ID, NAME, DESCRIPTION, IMAGE_URL, STATUS FROM SERVICES `;

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
    const query = ` SELECT CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM SERVICES WHERE ID = ? `;

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
    const query = ` UPDATE SERVICES SET  NAME = ?, DESCRIPTION = ?, IMAGE_URL = ?, STATUS = ?, UPDATED_BY = ?, UPDATED_AT = NOW() WHERE ID = ? `;
    const params = [ input.NAME, input.DESCRIPTION, input.IMAGE_URL, input.STATUS, input.CREATED_BY, input.ID];

    try {
      const result = await executeDbQuery(query, params, true, apiName, port);
      const results={ message: "Service updated"}
      res.json({ status:  0, result:results });
    } catch (err: any) {
      res.json({ status: 1, error: err.toString() });
    }
  }
}
