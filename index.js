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
    const user = await db.query("SELECT username FROM users WHERE id = $1", [currentUser]);
    const currentUsername = user.rows[0].username;
    res.render("index.ejs", { userBookList, currentUsername });
});

app.post("/submit", async (req, res) => {
    const title = req.body.bookTitle;
    const notes = req.body.notes;
    const rating = req.body.starRating;
    const date = req.body.date_read;
    const result = await axios.get(`https://openlibrary.org/search.json?title=${title}`);
    const coverId = result.data.docs[0].cover_i;
    await db.query("INSERT INTO books (user_id, title, notes, rating, date_read, cover_id) VALUES ($1, $2, $3, $4, $5, $6)", [currentUser, title, notes, rating, date, coverId]);
    console.log(coverId);
    userBookList = await getData();
    res.redirect("/");
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});