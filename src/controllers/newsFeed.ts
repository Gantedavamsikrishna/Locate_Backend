import express, { Request, Response, Application } from "express";
import { pool, executeDbQuery } from "../db";

export default class NewsFeedController {
  public router = express.Router();

  constructor(app: Application) {
    app.use("/api/feed", this.router);

    this.router.post("/newsfeeds", this.createNewsFeed.bind(this));
    this.router.get("/newsfeeds", this.getAllNewsFeeds.bind(this));
    this.router.get("/newsfeedbyid", this.getNewsFeedById.bind(this));
    this.router.put("/newsfeeds", this.updateNewsFeed.bind(this));
  }

  async createNewsFeed(req: Request, res: Response) {
    const apiName = "newsfeed/create";
    const port = req.socket.localPort!;
    const input = req.body;
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const result = await executeDbQuery( "SELECT MAX(CAST(SUBSTRING(FEED_ID, 5) AS UNSIGNED)) AS maxId FROM NEWS_FEED", [], false, apiName, port, connection );
      const newId = "FEED" + String((Number(result[0]?.maxId || 0) + 1)).padStart(3, "0");

      const insertQuery = ` INSERT INTO NEWS_FEED (CITY_ID, FEED_ID, FEED_HEAD, FEED_MATTER, IMAGE_URL, FEED_DATE, STATUS, FEEDAPP_STATUS, CREATED_BY, CREATED_ON) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) `;
      const params = [ input.city_id, newId, input.feed_head, input.feed_matter, input.image_url, input.feed_date, input.status, input.feedapp_status, input.created_by ];

      const insertResult = await executeDbQuery(insertQuery, params, false, apiName, port, connection);
      await connection.commit();
     const results = {message: "News feed created", feedId: newId, affectedRows: insertResult.affectedRows};
      res.json({ status: 0, result:results });
    } catch (err: any) {
      if (connection) await connection.rollback();
      res.json({ status: 1, result: err.toString() });
    } finally {
      if (connection) connection.release();
    }
  }

  async getAllNewsFeeds(req: Request, res: Response) {
    const apiName = "newsfeed/read-all";
    const port = req.socket.localPort!;
    const query = `SELECT CITY_ID, FEED_ID, FEED_HEAD, FEED_MATTER, IMAGE_URL, FEED_DATE, STATUS, FEEDAPP_STATUS, CREATED_BY, CREATED_ON, EDITED_BY, EDITED_ON FROM NEWS_FEED`;

    try {
      const rows = await executeDbQuery(query, [], false, apiName, port);
      res.json({ status: 0, result: rows });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }

  async getNewsFeedById(req: Request, res: Response) {
    const apiName = "newsfeed/read";
    const port = req.socket.localPort!;
    const feedId = req.query.id || "";
    const query = `SELECT CITY_ID, FEED_ID, FEED_HEAD, FEED_MATTER, IMAGE_URL, FEED_DATE, STATUS, FEEDAPP_STATUS, CREATED_BY, CREATED_ON, EDITED_BY, EDITED_ON FROM NEWS_FEED WHERE FEED_ID = ?`;

    try {
      const rows = await executeDbQuery(query, [feedId], false, apiName, port);
      res.json({ status: 0, result: rows });
    } catch (err: any) {
      res.status(500).json({ status: 1, result: err.toString() });
    }
  }

  async updateNewsFeed(req: Request, res: Response) {
    const apiName = "newsfeed/update";
    const port = req.socket.localPort!;
    const input = req.body;

    const updateQuery = ` UPDATE NEWS_FEED SET CITY_ID = ?, FEED_HEAD = ?, FEED_MATTER = ?, IMAGE_URL = ?, FEED_DATE = ?, STATUS = ?, FEEDAPP_STATUS = ?, EDITED_BY = ?, EDITED_ON = NOW() WHERE FEED_ID = ? `;
    const params = [ input.city_id, input.feed_head, input.feed_matter, input.image_url, input.feed_date, input.status, input.feedapp_status, input.edited_by, input.feed_id ];

    try {
      const result = await executeDbQuery(updateQuery, params, true, apiName, port);
      const results = {message: "News feed updated"};
      res.json({ status: 0, result:results });
    } catch (err: any) {
      res.json({ status: 1, result: err.toString() });
    }
  }
}
