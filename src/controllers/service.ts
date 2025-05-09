import express, { Request, Response, Application } from "express";
import { pool, executeDbQuery } from "../db";

export default class ServiceController {
  public router = express.Router();

  constructor(app: Application) {
    // Mount all service routes under /api
    app.use("/api/services", this.router);

    // CRUD routes for SERVICES
    this.router.post("/services", this.createService.bind(this));
    this.router.get("/services", this.getAllServices.bind(this));
    this.router.get("/servicesbyid", this.getServiceById.bind(this));
    this.router.put("/services", this.updateService.bind(this));
  }

  /**
   * Create a new service record.
   */
  async createService(req: Request, res: Response) {
    const apiName = "service/create";
    const port = req.socket.localPort!;
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Generate new 3-digit ID by finding the current max and incrementing
      const rows = await executeDbQuery(
        "SELECT MAX(CAST(ID AS UNSIGNED)) AS maxId FROM SERVICES",
        [],
        false,
        apiName,
        port,
        connection
      );
      const newId = (Number(rows[0]?.maxId || 0) + 1).toString().padStart(3, '0');

      const insertQuery = `
        INSERT INTO SERVICES
          (CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS, CREATED_BY, CREATED_AT)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      const { city_id, service_name, description, image_url, status, created_by } = req.body;
      const params = [city_id, newId, service_name, description, image_url, status, created_by];

      const result = await executeDbQuery(
        insertQuery,
        params,
        false,
        apiName,
        port,
        connection
      );

      await connection.commit();
      res.json({ status: 1, message: "Service created", serviceId: newId, affectedRows: result.affectedRows });

    } catch (err: any) {
      if (connection) await connection.rollback();
      res.json({ status: 0, error: err.toString() });
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Retrieve all service records.
   */
  async getAllServices(req: Request, res: Response) {
    const apiName = "service/read-all";
    const port = req.socket.localPort!;
    const query = `
      SELECT
        CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS,
        CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT
      FROM SERVICES
    `;

    try {
      const rows = await executeDbQuery(query, [], false, apiName, port);
      res.json({ status: 0, data: rows });
    } catch (err: any) {
      res.json({ status: 1, error: err.toString() });
    }
  }

  /**
   * Retrieve a service by its ID.
   */
  async getServiceById(req: Request, res: Response) {
    const apiName = "service/read";
    const port = req.socket.localPort!;
    const id = req.query.id || "";
    const query = `
      SELECT
        CITY_ID, ID, NAME, DESCRIPTION, IMAGE_URL, STATUS,
        CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT
      FROM SERVICES
      WHERE ID = ?
    `;

    try {
      const rows = await executeDbQuery(query, [id], false, apiName, port);
      res.json({ status: 0, data: rows });
    } catch (err: any) {
      res.status(500).json({ status: 0, error: err.toString() });
    }
  }

  /**
   * Update an existing service record.
   */
  async updateService(req: Request, res: Response) {
    const apiName = "service/update";
    const port = req.socket.localPort!;
    const { id, city_id, service_name, description, image_url, status, edited_by } = req.body;
    const query = `
      UPDATE SERVICES SET
        CITY_ID = ?,
        NAME = ?,
        DESCRIPTION = ?,
        IMAGE_URL = ?,
        STATUS = ?,
        UPDATED_BY = ?,
        UPDATED_AT = NOW()
      WHERE ID = ?
    `;
    const params = [city_id, service_name, description, image_url, status, edited_by, id];

    try {
      const result = await executeDbQuery(query, params, true, apiName, port);
      res.json({ status: result.affectedRows ? 1 : 0, message: "Service updated" });
    } catch (err: any) {
      res.json({ status: 1, error: err.toString() });
    }
  }
}

