import express from "express";
import { addRashi, getRashi } from "../controllers/rashi.controller.mjs";
const router = express.Router();

router.post('/add-user-rashi',addRashi)
router.get('/get-user-rashi',getRashi)

export default router

