import express from "express";
import {
  addNakshatras,
  getNakshatras,
} from "../controllers/nakshatra.controller.mjs";
const router = express.Router();
router.post("/add-user-nakshatra", addNakshatras);
router.get("/get-user-nakshatra", getNakshatras);
export default router;
