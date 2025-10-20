import express from "express";
const router = express.Router();
import { addCastes } from "../controllers/caste.controller.mjs";

router.post("/castes/bulk", addCastes);
export default router;
