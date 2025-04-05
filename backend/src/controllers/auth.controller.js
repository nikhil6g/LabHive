import User from "../models/user.model.js";
import { generateToken } from "../lib/utils.js";

export const signup = async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    if (!email || !name || !password) {
      return res.status(400).json({ message: "all fields required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password must be atleast 6 characters long" });
    }
    if (await User.findOne({ email })) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }
    let maxBorrowLimit = 7;
    if (role === "Researcher") {
      maxBorrowLimit = 10;
    }
    // Create new user
    const newUser = new User({ name, email, password, role, maxBorrowLimit });

    if (newUser) {
      // Save user to DB
      await newUser.save();

      // Generate JWT token
      generateToken(newUser._id, res);

      return res.status(201).json({
        _id: newUser._id,
        email: newUser.email,
        name: newUser.fullName,
        role: newUser.role,
        maxBorrowLimit: newUser.maxBorrowLimit,
        token: generateToken(newUser._id, res),
      });
    } else {
      return res.status(400).json({ message: "User could not be created" });
    }
  } catch (error) {
    console.log("error in signup", error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare provided password with hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user._id, res);

    return res.status(200).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      maxBorrowLimit: user.maxBorrowLimit,
      token,
    });
  } catch (error) {
    console.log("error in login", error);
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "logged out successfully" });
  } catch (error) {
    console.log("error in logout", error);
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    return res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
