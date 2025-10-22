import express from "express";
import { addHobbies, deleteHobbies, getHobbies } from "../controllers/hobbies.controller.mjs";
const router = express.Router();

router.post("/add-user-hobbies",addHobbies)
router.get("/get-user-hobbies",getHobbies)
router.delete("/delete-user-hobbies",deleteHobbies)


export default router;