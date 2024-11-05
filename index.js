import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

//bookdata

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});