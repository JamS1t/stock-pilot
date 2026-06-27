import { Request, Response } from "express";
import { pool } from "../config/db";

export const healthHandler = async(req: Request, res: Response) => {
  let dbOK = false;

  try {
    const connection = await pool.getConnection();
    await connection.ping();

    dbOK = true;
    connection.release();
  }catch(err){
    console.error("Database health checked failed: ", err);
  }

  const health = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: dbOK ? "reachable" : "unreachable",
  }

  const statusCode = dbOK ? 200 : 500;
  res.status(statusCode).json(health);
};