import { Router } from "express";
import prosesHalaman from "./konfigurasi/prosesHalaman.js";

const route = Router();

route.get("/", (req,res) => {
    res.send(prosesHalaman('homepage'))
})

export default route