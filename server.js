const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
const port = 3000;
const uri = "mongodb+srv://softwarep828:m3Ys5kfxBlITF2JZ@cluster0.c4nc4.mongodb.net/";
const client = new MongoClient(uri);

app.use(cors());
app.use(express.json());

(async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
})();

const db = client.db("academia");

app.get("/users", async (req, res) => {
    try {
        const users = await db.collection("users").find().toArray();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/users/:userid", async (req, res) => {
    try {
        const userid = Number(req.params.userid);
        const user = await db.collection("users").findOne({ userid });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/users", async (req, res) => {
    try {
        const { name, email, password, courses = [], events = [], messages = [] } = req.body;
        const existingUser = await db.collection("users").findOne({ email });
        if (existingUser) return res.status(409).json({ error: "Email already exists" });
        const lastUser = await db.collection("users").find().sort({ userid: -1 }).limit(1).toArray();
        const newUserId = lastUser.length > 0 ? lastUser[0].userid + 1 : 1;
        const user = { userid: newUserId, name, email, password, courses, events, messages };
        await db.collection("users").insertOne(user);
        res.status(201).json({ message: "User added successfully", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/users/:userid/courses", async (req, res) => {
    try {
        const userid = Number(req.params.userid);
        const { courseid, coursename } = req.body;
        const result = await db.collection("users").updateOne(
            { userid },
            { $push: { courses: { courseid, coursename } } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "Course added successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
