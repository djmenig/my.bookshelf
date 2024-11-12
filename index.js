import express from "express";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true })); //bodyParser
app.use(express.static("public"));

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "my.Bookshelf",
    password: "$5D21o80n$",
    port: "5432",
});
db.connect();

let currentUser = 1;

//bookdata
let userBookList = await getData();
async function getData() {
    const result = await db.query("SELECT * FROM users JOIN books ON users.id = books.user_id");
    return result.rows;
};

app.get("/", async (req, res) => {
    const userData = await getData();
    res.render("index.ejs", { userBookList });
});

app.post("/submit", async (req, res) => {
    const addBook = req.body;
    console.log(addBook);
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});