import express from "express";
import axios from "axios";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

//landing page
app.get("/", (req, res) => {
    res.render("index.ejs");
});

//selection page
app.post("/selection", async (req, res) => {
    try {
    //receives a user selected subject from form and uses that for a search that returns an array of books that are borrowable, limited to 100, and is sorted randomly
    let subject = req.body.selectedSubject;
    const randomBook = await axios.get(`https://openlibrary.org/search.json?q=subject%3A${subject}+AND+ebook_access%3Aborrowable&limit=100&sort=random`);
    
    //selects a random book from the above array
    const selection = randomBook.data.docs[Math.floor(Math.random() * randomBook.data.docs.length)];
    console.log("Selected Subject: " + req.body.selectedSubject);

    //renders the selection page with information on the selected book
    res.render("selection.ejs", {
        title: selection.title,
        author: selection.author_name,
        year: selection.first_publish_year,
        link: selection.key,
        cover: selection.cover_i,
    });
    } catch (error) {
        console.log(error.response.data);
        res.status(500);
    }    
});

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});