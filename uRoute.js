import { Router } from "express";
import prosesHalaman from "./konfigurasi/prosesHalaman.js";

const route = Router();

route.get("/", (req,res) => {
    res.send(prosesHalaman('homepage'))
})

route.get("/catatan", (req,res) => {
    res.send(prosesHalaman('catatan'))
})

export default route