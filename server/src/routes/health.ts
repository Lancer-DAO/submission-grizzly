import { Router } from "express";
import { DB } from "../db";

const router = Router();

router.get("/db-connection", async (req, res) => {
  try {
    await DB.raw("SELECT 1+1 as result");
    res.send("successfully connected to db.");
  } catch (err) {
    console.log(err)
    res.send("error connecting to db.");
  }
});

export default router;
