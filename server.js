const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const uri = "mongodb+srv://softwarep828:m3Ys5kfxBlITF2JZ@cluster0.c4nc4.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.json());

let db;

async function connectDB() {
    try {
        if (!db) {
            await client.connect();
            db = client.db("academia");
            console.log("Connected to database");
        }
    } catch (error) {
        console.error("Failed to connect to database:", error);
        process.exit(1);
    }
}

function getCollection(collectionName) {
    return db.collection(collectionName);
}

app.get("/users", async (req, res) => {
    try {
        const users = await getCollection("users").find().toArray();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/users/:userid", async (req, res) => {
    try {
        const { userid } = req.params;
        const user = await getCollection("users").findOne({ userid: parseInt(userid) });

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/users", async (req, res) => {
    try {
        const { name, email, password, courses, events, messages } = req.body;
        const existingUser = await getCollection("users").findOne({ email });

        if (existingUser) {
            return res.status(409).json({ error: "Email already exists" });
        }

        const lastUser = await getCollection("users").find().sort({ userid: -1 }).limit(1).toArray();
        const newUserId = lastUser.length > 0 ? lastUser[0].userid + 1 : 1;

        const user = { userid: newUserId, name, email, password, courses, events, messages };
        const result = await getCollection("users").insertOne(user);

        res.status(201).json({ message: "User added successfully", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await getCollection("users").findOne({ email, password });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const { userid, name, email: userEmail, courses, events, messages } = user;

        res.json({ userid, name, email: userEmail, courses, events, messages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/events", async (req, res) => {
    try {
        const events = await getCollection("events").find().toArray();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/users/:userid/courses", async (req, res) => {
    try {
        const { userid } = req.params;
        const { course } = req.body;

        if (!course) {
            return res.status(400).json({ error: "Course is required" });
        }

        const user = await getCollection("users").findOne({ userid: parseInt(userid) });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.courses && user.courses.includes(course)) {
            return res.status(400).json({ error: "Course already added" });
        }

        await getCollection("users").updateOne({ userid: parseInt(userid) }, { $addToSet: { courses: course } });
        res.json({ message: "Course added successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function startServer() {
    await connectDB();

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

startServer();
