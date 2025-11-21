import { Router } from "express";
import prosesHalaman from "./konfigurasi/prosesHalaman.js";

const route = Router();

route.get("/", (req, res) => {
    // default to dashboard
    res.send(prosesHalaman('dashboard'));
});

route.get("/catatan", (req, res) => {
    res.send(prosesHalaman('catatan'));
});

route.get("/games", (req, res) => {
    res.send(prosesHalaman('games'));
});

route.get("/teman", (req, res) => {
    res.send(prosesHalaman('teman'));
});

route.get("/jadwal", (req, res) => {
    res.send(prosesHalaman('jadwal'));
});

route.get("/lomba", (req, res) => {
    res.send(prosesHalaman('lomba'));
});

route.get("/admin", (req, res) => {
    res.send(prosesHalaman('admin'));
});

route.get("/quiz", (req, res) => {
    res.send(prosesHalaman('quiz'));
});

route.get("/quiz-results", (req, res) => {
    res.send(prosesHalaman('quiz-results'));
});

route.get("/quiz-match-waiting", (req, res) => {
    res.send(prosesHalaman('quiz-match-waiting'));
});

export default route