const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const cors = require('cors');
app.use(cors());

const port = 3000;
const uri = "mongodb+srv://softwarep828:m3Ys5kfxBlITF2JZ@cluster0.c4nc4.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function getAllUsers(req, res) {
    try {
        await client.connect();
        const db = client.db("academia");
        const users = await db.collection("users").find().toArray();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function getAllResearches(req, res) {
    try {
        await client.connect();
        const db = client.db("academia");
        const researches = await db.collection("researches").find().toArray();
        res.json(researches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


async function getAllEvents (req, res) {
    try {
        await client.connect();
        const db = client.db("academia");
        const events = await db.collection("events").find().toArray();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function getUserById(req, res) {
    try {
        await client.connect();
        const db = client.db("academia");
        const userid = parseInt(req.params.userid);
        const user = await db.collection("users").findOne({ userid });

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function getUserByEmail(req, res) {
    try {
        await client.connect();
        const db = client.db("academia");
        const email = req.params.email;
        const user = await db.collection("users").findOne({ email });

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function addCourse(req, res) {
    try {
        await client.connect();
        const db = client.db("academia");
        const userid = parseInt(req.params.userid);
        const { course } = req.body;


        if (course === undefined) {
            return res.status(400).json({ error: "معرف الدورة مطلوب" });
        }

        const user = await db.collection("users").findOne({ userid });

        if (!user) {
            return res.status(404).json({ error: "لم يتم العثور على المستخدم" });
        }

        if (user.courses && user.courses.includes(course)) {
            return res.status(400).json({ error: "الدورة مضافة بالفعل" });
        }

        const result = await db.collection("users").updateOne(
            { userid },
            { $addToSet: { courses: course } }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({ error: "لم يتم إضافة الدورة" });
        }

        res.json({ message: "تمت إضافة الدورة بنجاح" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function addService(req, res) {
    try {
        await client.connect();
        const db = client.db("academia");
        const userid = parseInt(req.params.userid);
        const { description, whatsappnumber, type } = req.body;
   
      
       

        const result = await db.collection("services").insertOne(
            { userid, description, whatsappnumber,type },
           
        );

        if (result.insertedId === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Service added successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function addEvent(req, res) {
    try {
        await client.connect();
        const db = client.db("academia");
        const userid = parseInt(req.params.userid);
        const { event } = req.body;

        if (event === undefined) {
            return res.status(400).json({ error: "Event ID is required" });
        }

        const result = await db.collection("users").updateOne(
            { userid },
            { $addToSet: { events: event } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Event added successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function addMessage(req, res) {
    try {
        await client.connect();
        const db = client.db("academia");
        const userid = parseInt(req.params.userid);
        const { senderid, msg } = req.body;

        if (senderid === undefined || !msg) {
            return res.status(400).json({ error: "Sender ID and message are required" });
        }

        const result = await db.collection("users").updateOne(
            { userid },
            { $push: { messages: { senderid, msg } } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Message added successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function addUser(req, res) {
    try {
        await client.connect();
        const db = client.db("academia");
        const { name, email, password, courses, events, messages } = req.body;
        const existingUser = await db.collection("users").findOne({ email });

        if (existingUser) {
            return res.status(409).json({ error: "Email already exists" });
        }

        const lastUser = await db.collection("users").find().sort({ userid: -1 }).limit(1).toArray();
        const lastUserId = lastUser.length > 0 ? lastUser[0].userid : 0;
        const newUserId = lastUser.length > 0 ? lastUserId + 1 : 0;


        const user = { userid: newUserId, name, email, password, courses, events, messages };
        const result = await db.collection("users").insertOne(user);

        res.status(201).json({ message: "User added successfully", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function removeEvent(req, res) {
    try {
        await client.connect();
        const db = client.db("academia");
        const userid = parseInt(req.params.userid);
        const { event } = req.body;

        if (event === undefined) {
            return res.status(400).json({ error: "Event ID is required" });
        }

        const result = await db.collection("users").updateOne(
            { userid },
            { $pull: { events: event } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Event removed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function authenticateUser(req, res) {
    try {
        await client.connect();
        const db = client.db("academia");

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }


        const user = await db.collection("users").findOne({ email, password });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const { userid, name, email: userEmail, courses, events, messages } = user;


        res.json({
            userid,
            name,
            email: userEmail,
            courses,
            events,
            messages
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function getAllCourses(req, res) {
    try {
        await client.connect();
        const db = client.db("academia");
        const courses = await db.collection("courses").find({}).toArray();

        if (courses.length === 0) {
            return res.status(404).json({ error: "No courses found" });
        }

        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
app.get("/users/:userid/courses", async (req, res) => {
    try {
        const { userid } = req.params;
        const db = client.db("academia");


        const User = db.collection("users");
        const user = await User.findOne({ userid: Number(userid) });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }


        const Course = db.collection("courses");
        const allCourses = await Course.find({}).toArray();


        const userCourses = allCourses.filter(course => user.courses.includes(course.id));

        res.json(userCourses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.get("/users", getAllUsers);
app.get("/users/:userid", getUserById);
app.get("/users/email/:email", getUserByEmail);
app.post("/users", express.json(), addUser);
app.post("/auth/login", express.json(), authenticateUser);
app.post("/users/:userid/courses", express.json(), addCourse);
app.post("/users/:userid/events", express.json(), addEvent);
app.post("/services/:userid", express.json(), addService);
app.post("/users/:userid/messages", express.json(), addMessage);
app.post("/users/:userid/events/remove", express.json(), removeEvent);
app.get("/events", getAllEvents);

app.get("/courses", getAllCourses);
app.get("/researches", getAllResearches);




app.listen(3000, () => {
    console.log(`Server running on http://localhost:${port}`);
});
