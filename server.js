const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const User = require("./models/User");
const path = require("path");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.use("/api/auth", authRoutes);

const uri = process.env.MONGODB_URI;

// MongoDB connection
// MongoDB connection
mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Dummy token for authentication
const DUMMY_TOKEN_ADMIN = process.env.ADMIN_TOKEN;
const DUMMY_TOKEN_USER = process.env.USER_TOKEN;

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
    phone,
    phonecc,
    promotions,
    terms,
    Email,
    provider,
  } = req.body;

  // Validate phone number
  if (!phone || phone.replace(/\D/g, "").length < 8) {
    return res
      .status(400)
      .json({ message: "Phone number must contain at least 8 digits." });
  }

  // Check if the email already exists
  const existingUser = await User.findOne({ Email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists." });
  }

  // Combine phonecc and phone
  const combinedPhone = ` ${phonecc} ${phone}`;
  const IpAddress = req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0]
    : req.socket.remoteAddress;

  const newUser = new User({
    IpAddress,
    Firstname,
    Lastname,
    Email,
    provider,
    phone, // Store combined phone number
    phonecc,
    promotions,
    terms,
  });

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

app.get("/api/users", authenticateToken, async (req, res) => {
  const { country, provider } = req.query;

  try {
    const query = {};
    if (provider) query.provider = provider;

    // Get the token from the request headers
    const token = req.headers["authorization"];

    // Determine the projection based on the token
    let projection;
    if (token === `Bearer ${DUMMY_TOKEN_ADMIN}`) {
      projection = {}; // Admin sees all fields
    } else if (token === `Bearer ${DUMMY_TOKEN_USER}`) {
      projection = { Firstname: 1, Lastname: 1, phone: 1 }; // User sees limited fields
    } else {
      return res.sendStatus(403); // Forbidden if the token is invalid
    }

    // Fetch users with the specified query and projection
    const users = await User.find(query, projection);

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

// DELETE route to delete a user by _id
app.delete("/api/users/:id", authenticateToken, async (req, res) => {
  if (req.role !== "admin") {
    return res.sendStatus(403); // Forbidden if not admin
  }

  const { id } = req.params; // Extract the _id from the request parameters

  try {
    // Find the user by _id and delete
    const userToDelete = await User.findByIdAndDelete(id);

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("Error deleting user:", err); // Log the error
    res
      .status(500)
      .json({ message: "Error deleting user", error: err.message });
  }
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Optional: Set up a route to serve your HTML file
// Catch-all handler for any request that doesn't match an API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
