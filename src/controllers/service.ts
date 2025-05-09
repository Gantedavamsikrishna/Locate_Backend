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

      const insertQuery = ` INSERT INTO SERVICES (CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT) VALUES (?, ?, ?, ?, ?, ?, ?, NOW()) `;
      const params = [input.city_id, newId, input.service_name, input.description, input.image_url, input.status, input.created_by];

      const result = await executeDbQuery(insertQuery, params, false, apiName, port, connection);
      await connection.commit();
      res.json({ status: 1, message: "Service created", serviceId: newId, affectedRows: result.affectedRows });

    } catch (err: any) {
      if (connection) await connection.rollback();
      res.json({ status: 0, error: err.toString() });
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
      res.json({ status: 0, data: rows });
    } catch (err: any) {
      res.json({ status: 1, error: err.toString() });
    }
  }

  async getServiceById(req: Request, res: Response) {
    const apiName = "service/read";
    const port = req.socket.localPort!;
    const id = req.query.id || "";
    const query = ` SELECT CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT FROM SERVICES WHERE ID = ? `;

    try {
      const rows = await executeDbQuery(query, [id], false, apiName, port);
      res.json({ status: 0, data: rows });
    } catch (err: any) {
      res.status(500).json({ status: 0, error: err.toString() });
    }
  }

  async updateService(req: Request, res: Response) {
    const apiName = "service/update";
    const port = req.socket.localPort!;
    let input = req.body;
    const query = ` UPDATE SERVICES SET CITY_ID = ?, NAME = ?, DESCRIPTION = ?, IMAGE_URL = ?, STATUS = ?, UPDATED_BY = ?, UPDATED_AT = NOW() WHERE ID = ? `;
    const params = [input.city_id, input.service_name, input.description, input.image_url, input.status, input.updated_by, input.id];

    try {
      const result = await executeDbQuery(query, params, true, apiName, port);
      res.json({ status: result.affectedRows ? 1 : 0, message: "Service updated" });
    } catch (err: any) {
      res.json({ status: 1, error: err.toString() });
    }
  }
}
