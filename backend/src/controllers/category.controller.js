import Item from "../models/item.model.js";
import User from "../models/user.model.js";
import UsageLog from "../models/usageLog.model.js";
import mongoose from "mongoose";
import Category from "../models/category.model.js";

export const category_list = async (req, res, next) => {
  try {
    const allCategories = await Category.find({}, { name: 1, description: 1 });
    res.json(allCategories);
  } catch (error) {
    console.error("Error fetching category list", error);
    return res.status(500).json({ message: error.message });
  }
};

export const create_category = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description)
      return res.status(400).json({ error: "All fields are required." });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ error: "Category exists." });

    const category = new Category({ name, description });
    await category.save();
    res.status(201).json({ message: "Category created.", category });
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
};

export const update_category = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.categoryId);

    if (!category)
      return res.status(404).json({ error: "Category not found." });

    category.name = name || category.name;
    category.description = description || category.description;

    await category.save();
    res.json({ message: "Category updated.", category });
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
};

export const delete_category = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id; // assuming you have middleware to decode JWT

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "User not found." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(403).json({ error: "Invalid password." });

    const categoryId = req.params.categoryId;

    const items = await Item.find({ category: categoryId });
    if (items.length > 0)
      return res.status(400).json({
        error: "Category is associated with items. Remove them first.",
      });

    await Category.findByIdAndDelete(categoryId);
    res.json({ message: "Category deleted." });
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
};

export const fetch_category = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    if (!mongoose.Types.ObjectId.isValid(categoryId))
      return res.status(400).json({ error: "Invalid category ID." });

    const category = await Category.findById(categoryId);
    if (!category)
      return res.status(404).json({ error: "Category not found." });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
};

export const getTotalCategoryCount = async (req, res) => {
  try {
    const categoriesTotal = await Category.countDocuments();
    res.status(200).json(categoriesTotal);
  } catch (error) {
    res.status(500).json({ error: "Failed to get total category count" });
  }
};
