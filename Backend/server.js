require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db"); // mysql2/promise connection
const authMiddleware = require("./authMiddleware");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json()); // parses JSON bodies

// Test route
app.get("/", (req, res) => {
  res.send("Node + MySQL is working 🚀");
});

// ---------------- SIGN UP ----------------
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body; // <- no await here

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    const [existing] = await db.query("SELECT * FROM signup_info WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const createdAt = new Date(); // current date and time
    const [result] = await db.query(
    "INSERT INTO signup_info (name, email, password, created_at) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, createdAt]
    );


    res.status(201).json({ message: 'User signed up successfully', userId: result.insertId ,status : 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message ,status : 0});
  }
});

// ---------------- LOGIN ----------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body; // <- no await here

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const [users] = await db.query("SELECT * FROM signup_info WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials",status : 0 });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password); // await here
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials",status : 0 });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    await db.query("INSERT INTO login_info (email, status) VALUES (?, ?)",[email, 1]);
    res.json({ message: "Login successful", token ,status : 1});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message,status : 0 });
  }
});


                                                            //Tasks relates queries
                                                                
                                                                    //create task
app.post("/tasks", authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const [result] = await db.query(
      "INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)",
      [req.user.id, title, description]
    );

    res.status(201).json({
      message: "Task created",
      taskId: result.insertId,
      status:1
    });
  } catch (err) {
    res.status(500).json({ error: err.message , status:0 });
  }
});


                                                        //filter + pagination + search
app.get("/tasks", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { status, search } = req.query;

    let sql = "SELECT * FROM tasks WHERE user_id = ?";
    let params = [req.user.id];

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }

    if (search) {
      sql += " AND title LIKE ?";
      params.push(`%${search}%`);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [tasks] = await db.query(sql, params);

    res.json({
      page,
      limit,
      tasks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

                                                            //get particular task 
app.get("/tasks/:id", authMiddleware, async (req, res) => {
  const [tasks] = await db.query(
    "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id]
  );

  if (tasks.length === 0) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json(tasks[0]);
});


                                                            //Update task 
app.patch("/tasks/:id", authMiddleware, async (req, res) => {
  const { title, description, status } = req.body;

  const [result] = await db.query(
    `UPDATE tasks 
     SET title = COALESCE(?, title),
         description = COALESCE(?, description),
         status = COALESCE(?, status)
     WHERE id = ? AND user_id = ?`,
    [title, description, status, req.params.id, req.user.id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json({ message: "Task updated" });
});



                                                    //Toggle task
app.patch("/tasks/:id/toggle", authMiddleware, async (req, res) => {
  const [result] = await db.query(
    `UPDATE tasks
     SET status = IF(status = 'pending', 'completed', 'pending')
     WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json({ message: "Task status toggled" });
});


                                                    //delete particular task
app.delete("/tasks/:id", authMiddleware, async (req, res) => {
  const [result] = await db.query(
    "DELETE FROM tasks WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json({ message: "Task deleted" });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
