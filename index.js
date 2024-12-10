import express from "express";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 6543;

app.use(express.urlencoded({ extended: true })); //bodyParser
app.use(express.static("public"));

////////// local connection //////////
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "my.Bookshelf",
    password: "$5D21o80n$",
    port: "5432",
});

//remote connection (supabase.com)
// const db = new pg.Client({
//     user: "postgres.gaqrzvbspireqzthsptb",
//     host: "aws-0-us-west-1.pooler.supabase.com",
//     database: "postgres",
//     password: "jZUFk1zuXEL#eB",
//     port: "6543",
// });

db.connect();

let currentUser = 1;

//////////bookdata//////////
let userBookList = await getData();
//function to retreive currentUser bookdata if it exists
async function getData() {
    try {
        const userBooksQuery = await db.query("SELECT * FROM books WHERE user_id = $1", [currentUser]);
        if (userBooksQuery.rows.length > 0) {
            return userBooksQuery.rows;
        } else {
            console.log("No books associated with current user id");
            return userBooksQuery.rows;
        }
        console.log(userBooksQuery.rows)
    } catch (err) {
        console.log(err);
    }
};

//homepage: initial data fetch and render of user & books tables
app.get("/", async (req, res) => {
    userBookList = await getData();
    const user = await db.query("SELECT username FROM users WHERE id = $1", [currentUser]);
    const currentUsername = user.rows[0].username;
    res.render("index.ejs", { userBookList, currentUsername });
});

//add a book to database: receives from addBookForm.ejs (modal)
app.post("/submit", async (req, res) => {
    const title = req.body.bookTitle;
    const notes = req.body.notes;
    const rating = req.body.starRating;
    const date = req.body.date_read;
    const result = await axios.get(`https://openlibrary.org/search.json?title=${title}`);
    const coverId = result.data.docs[0].cover_i;
    await db.query("INSERT INTO books (user_id, title, notes, rating, date_read, cover_id) VALUES ($1, $2, $3, $4, $5, $6)", [currentUser, title, notes, rating, date, coverId]);
    res.redirect("/");
});

//update existing book on database: receives from editBookForm.ejs (modal)
app.post("/edit", async (req, res) => {
    const bookId = req.body.bookId;
    const title = req.body.bookTitle;
    const notes = req.body.notes;
    const rating = req.body.starRating;
    const date = req.body.date_read;
    const result = await axios.get(`https://openlibrary.org/search.json?title=${title}`);
    const coverId = result.data.docs[0].cover_i;
    await db.query("UPDATE books SET title = $1, notes = $2, rating = $3, date_read = $4, cover_id = $5 WHERE book_id = $6", [title, notes, rating, date, coverId, bookId]);
    res.redirect("/");
});

//Delete a book: receives from index.ejs delete book button
app.post("/deleteBook", async (req, res) => {
    await db.query("DELETE FROM books WHERE title = $1", [req.body.bookTitle]);
    res.redirect("/");
});

//Login into or Register user account
app.post("/login", async (req, res) => {
    try {
        if (req.body.action === 'register') {
            //register user account to db if username does not exist
            const result = await db.query("SELECT * FROM users WHERE username = $1", [req.body.username]);
            if (result.rows.length > 0) {
                res.send("Username already exists. Please go back and choose another username or login.");
            } else {
                await db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [req.body.username, req.body.password])
                console.log(req.body.username, "has been registered!");
                const usernameQuery = await db.query("SELECT id FROM users WHERE username = $1", [req.body.username]);
                currentUser = usernameQuery.rows[0].id;
                res.redirect("/");
            }
        } else if (req.body.action === 'login') {
            //login with db user account
            const result = await db.query("SELECT * FROM users WHERE username = $1", [req.body.username]);
            if (result.rows.length > 0) {
                //check password
                if (result.rows[0].password === req.body.password) {
                    currentUser = result.rows[0].id;
                    res.redirect("/");
                } else {
                    res.send("Password Incorrect, please go back and try again.");
                }
            } else {
                res.send("Username not found. Please go back and register, or try logging in again.");
            }
        }
    } catch (err) {
        console.log(err);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});