const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const userExists = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username],
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, hashedPassword, email],
    );

    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Неверные данные" });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password_hash,
    );
    if (!validPassword) {
      return res.status(400).json({ message: "Неверные данные" });
    }

    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        email: user.rows[0].email,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [req.user.id],
    );
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { username, email, newPassword } = req.body;
    let query = "UPDATE users SET username = $1, email = $2";
    let params = [username, email, req.user.id];

    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      query += ", password_hash = $4 WHERE id = $3";
      params.push(hashedPassword);
    } else {
      query += " WHERE id = $3";
    }

    const result = await pool.query(
      query + " RETURNING id, username, email",
      params,
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
