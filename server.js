const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
const port = 3000;

// MongoDB URI with retryWrites and w=majority parameters for stability
const uri = "mongodb+srv://softwarep828:m3Ys5kfxBlITF2JZ@cluster0.c4nc4.mongodb.net/academia?retryWrites=true&w=majority";

// Create MongoClient instance
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ssl: true,  // Ensure SSL is enabled
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
(async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
})();

const db = client.db("academia");

// Route to get all users
app.get("/users", async (req, res) => {
    try {
        const users = await db.collection("users").find().toArray();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get a specific user by userid
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

// Route to add a new user
app.post("/users", async (req, res) => {
    try {
        const { name, email, password, courses = [], events = [], messages = [] } = req.body;

        // Check for existing email
        const existingUser = await db.collection("users").findOne({ email });
        if (existingUser) return res.status(409).json({ error: "Email already exists" });

        // Get the new user ID
        const lastUser = await db.collection("users").find().sort({ userid: -1 }).limit(1).toArray();
        const newUserId = lastUser.length > 0 ? lastUser[0].userid + 1 : 1;

        const user = { userid: newUserId, name, email, password, courses, events, messages };
        await db.collection("users").insertOne(user);
        res.status(201).json({ message: "User added successfully", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to add a course for a specific user
app.post("/users/:userid/courses", async (req, res) => {
    try {
        const userid = Number(req.params.userid);
        const { courseid, coursename } = req.body;

        // Add course to user's course list
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

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
