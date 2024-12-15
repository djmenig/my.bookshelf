import express from "express";
import axios from "axios";
import pg from "pg";
import bcrypt from "bcrypt";
import env from "dotenv";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";

const app = express();
const port = 6543;
const saltRounds = 10;
env.config();

app.use(
    session({
       secret: process.env.SESSION_SECRET,
       resave: false,
       saveUninitialized: true, 
    })
);

app.use(express.urlencoded({ extended: true })); //bodyParser
app.use(express.static("public"));

////////// Using environment variable file for DB connection //////////
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
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
    const username = req.body.username;
    const loginPassword = req.body.password;

    try {
        if (req.body.action === 'register') {
            //register user account to db if username does not exist
            const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
            if (result.rows.length > 0) {
                res.send("Username already exists. Please go back and choose another username or login.");
            } else {
                //Password Hashing
                bcrypt.hash(loginPassword, saltRounds, async (err, hash) => {
                    if (err) {
                        console.log("Error hashing password:", err);
                    } else {
                        await db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hash])
                        console.log(username, "has been registered!");
                        const usernameQuery = await db.query("SELECT id FROM users WHERE username = $1", [username]);
                        currentUser = usernameQuery.rows[0].id;
                        res.redirect("/");
                    }
                });
            }
        } else if (req.body.action === 'login') {
            //login with db user account
            const result = await db.query("SELECT * FROM users WHERE username = $1", [req.body.username]);
            if (result.rows.length > 0) {
                //check password
                const user = result.rows[0];
                const storedHashedPassword = user.password;
                bcrypt.compare(loginPassword, storedHashedPassword, async (err, result) => {
                    if (err) {
                        console.log("Error comparing passwords:", err);
                    } else {
                        if (result) {
                            console.log(username, "has been logged in!");
                            const usernameQuery = await db.query("SELECT id FROM users WHERE username = $1", [username]);
                            currentUser = usernameQuery.rows[0].id;
                            res.redirect("/");
                        } else {
                            res.send("Password Incorrect, please go back and try again.");
                        }
                    }
                });
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