const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const User = require("./models/User");
const path = require("path");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const uri =
  "mongodb+srv://vijaysp242387:x1FdqAbRPxAmvnqP@wizard.degcq.mongodb.net/wizard2?retryWrites=true&w=majority";

// MongoDB connection
// MongoDB connection
mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Dummy token for authentication
const DUMMY_TOKEN_ADMIN = "wizard_admin_token";
const DUMMY_TOKEN_USER = "wizard_user_token";

// Middleware to check token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.sendStatus(403); // Forbidden if no token is provided
  }

  // Check if the token is for admin
  if (token === `Bearer ${DUMMY_TOKEN_ADMIN}`) {
    req.role = "admin"; // Optionally set a role for further checks
    return next();
  }

  // Check if the token is for user
  if (token === `Bearer ${DUMMY_TOKEN_USER}`) {
    req.role = "user"; // Optionally set a role for further checks
    return next();
  }

  return res.sendStatus(403); // Forbidden if token is invalid
};

// POST route to create a new user
app.post("/api/users", authenticateToken, async (req, res) => {
  if (req.role !== "admin") {
    return res.sendStatus(403); // Forbidden if not admin
  }
  const {
    Firstname,
    Lastname,
    countryName,
    country_code,
    phone,
    phonecc,
    promotions,
    terms,
    Email,
    provider,
  } = req.body;

  // Check if the email already exists
  const existingUser = await User.findOne({ Email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists." });
  }

  // console.log(req.body);

  const newUser = new User({
    Firstname,
    Lastname,
    countryName,
    country_code,
    phone,
    phonecc,
    promotions,
    terms,
    Email,
    provider,
  });

  // console.log(newUser);

  try {
    await newUser.save();
    res
      .status(201)
      .json({ message: "User created successfully", User: newUser });
  } catch (err) {
    console.error("Error saving user:", err); // Log the error
    res.status(500).json({ message: "Error saving user", error: err.message });
  }
});

// GET route to retrieve users
// app.get("/api/users", authenticateToken, async (req, res) => {
//   try {
//     const users = await User.find();
//     res.status(200).json(users);
//   } catch (err) {
//     res.status(500).json({ message: "Error retrieving users" });
//   }
// });

app.get("/api/users", authenticateToken, async (req, res) => {
  const { country, provider } = req.query;

  try {
    const query = {};
    if (country) query.countryName = country;
    if (provider) query.provider = provider;

    // If no query parameters are provided, fetch all users
    const users = await User.find(query);
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }
    res.status(200).json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving users", error: err.message });
  }
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Optional: Set up a route to serve your HTML file
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
