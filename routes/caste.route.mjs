import express from "express";
const router = express.Router();
import { addCastes, getCastes, getGotraByCaste, getSubCasteByCaste } from "../controllers/caste.controller.mjs";

router.post("/add-user-castes", addCastes);
router.get("/get-user-castes",getCastes)
router.get("/get-user-subcaste",getSubCasteByCaste)
router.get("/get-user-gotra",getGotraByCaste)

export default router;
