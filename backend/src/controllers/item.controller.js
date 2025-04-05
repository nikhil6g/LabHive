import Item from "../models/item.model.js";
import { v4 as uuidv4 } from "uuid";
import User from "../models/user.model.js";
import UsageLog from "../models/usageLog.model.js";
import mongoose from "mongoose";
import { scheduleReturnReminder, sendLowStockEmail } from "../lib/email.js";

export const addNewItem = async (req, res) => {
  try {
    const {
      name,
      description,
      lowStockThreshold,
      totalQuantity,
      image,
      category,
    } = req.body;
    // Validate required fields
    if (
      !name ||
      !description ||
      !category ||
      !totalQuantity ||
      !lowStockThreshold
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Generate instances array with unique serial numbers for each item instance
    const instances = [];
    for (let i = 0; i < totalQuantity; i++) {
      // Create a unique serial number using a prefix (first 3 letters of the name) and a UUID
      const serialNumber = `${name.substring(0, 3).toUpperCase()}-${uuidv4()}`;
      instances.push({ serialNumber, status: "Available" });
    }
    console.log(req.body);
    // Create the new item with availableQuantity set equal to totalQuantity
    const newItem = new Item({
      name,
      description,
      category,
      totalQuantity,
      availableQuantity: totalQuantity,
      lowStockThreshold,
      image,
      instances,
    });
    console.log(newItem);
    await newItem.save();

    return res
      .status(201)
      .json({ message: "Item created successfully", newItem });
  } catch (error) {
    console.error("Error in addNewItem controller:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAllItems = async (req, res) => {
  try {
    const items = await Item.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          status: 1,
          stock: 1,
          image: 1,
          category: { $first: "$category.name" },
        },
      },
    ]);
    return res.status(200).json(items);
  } catch (error) {
    console.error("Error in getAllItems controller:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getItem = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    return res.status(200).json(item);
  } catch (error) {
    console.error("Error in getItem controller:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const incrementInstances = async (req, res) => {
  try {
    const { itemId, additionalQuantity } = req.body;

    // Validate required fields
    if (!itemId || !additionalQuantity) {
      return res
        .status(400)
        .json({ message: "Item ID and additional quantity are required." });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Generate new instances for the additional quantity
    const newInstances = [];
    for (let i = 0; i < additionalQuantity; i++) {
      // Create a unique serial number: a prefix based on the item name and a UUID
      const serialNumber = `${item.name
        .substring(0, 3)
        .toUpperCase()}-${uuidv4()}`;
      newInstances.push({ serialNumber, status: "available" });
    }

    // Add new instances to the existing instances array
    item.instances.push(...newInstances);

    // Update the total and available quantities accordingly
    item.totalQuantity += additionalQuantity;
    item.availableQuantity += additionalQuantity;

    // Save the updated item document
    await item.save();

    return res
      .status(200)
      .json({ message: "Instances added successfully", item });
  } catch (error) {
    console.error("Error incrementing instances:", error);
    return res.status(500).json({ message: error.message });
  }
};
export const item_by_status = async (req, res) => {
  // get number of items for each status
  const groupItemsByStatus = await Item.aggregate([
    { $unwind: "$instances" }, // Flatten instances array
    {
      $group: {
        _id: "$instances.status",
        totalItems: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        totalItems: 1,
      },
    },
    { $sort: { totalItems: -1 } },
  ]);
  res.json(groupItemsByStatus);
};

export const item_by_category = async (req, res, next) => {
  try {
    // Group items based on their category field
    const groupItemsByCategory = await Item.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $group: {
          _id: "$category.name",
          totalItems: { $sum: "$totalQuantity" },
        },
      },
      {
        $project: {
          _id: 0,
          category: { $first: "$_id" },
          totalItems: 1,
        },
      },
      { $sort: { totalItems: -1 } },
    ]);

    res.json(groupItemsByCategory);
  } catch (error) {
    console.error("Error grouping items by category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateStatus = async (req, res) => {
  const { serialNumber } = req.params;
  const { status } = req.body;

  // Validate status
  const validStatuses = ["available", "borrowed", "reserved", "maintenance"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    // Find the item that contains this instance
    const item = await Item.findOne({ "instances.serialNumber": serialNumber });

    if (!item) {
      return res.status(404).json({ error: "Instance not found" });
    }

    // Find the specific instance and update its status
    const instance = item.instances.find(
      (inst) => inst.serialNumber === serialNumber
    );
    if (!instance) {
      return res.status(404).json({ error: "Instance not found inside item" });
    }

    instance.status = status;
    await item.save();

    res.status(200).json({ message: "Status updated successfully", instance });
  } catch (error) {
    console.error("Error updating instance status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const allocateItem = async (req, res) => {
  const { itemId } = req.params;
  const userId = req.body.userId ? req.body.userId : req.user._id;
  const serialNumber = req.body.serialNumber;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Find the item by ID
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    let availableInstance;

    if (serialNumber) {
      availableInstance = item.instances.find(
        (inst) => inst.serialNumber === serialNumber
      );
      if (availableInstance.status !== "Available") {
        availableInstance = null;
      }
    } else {
      availableInstance = item.instances.find(
        (inst) => inst.status === "Available"
      );
    }

    if (!availableInstance) {
      return res.status(400).json({ error: "No available instances" });
    }

    // Update instance status to "borrowed"
    availableInstance.status = "Borrowed";
    item.availableQuantity--;

    await item.save();

    // Create a usage log entry
    const usageLog = new UsageLog({
      user: userId,
      item: itemId,
      serialNumbers: [availableInstance.serialNumber],
      action: "Borrowed",
      expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7-day return period
    });

    await usageLog.save();

    res.status(200).json({
      message: "Item allocated successfully",
      instance: availableInstance,
    });
    if (item.availableQuantity <= item.lowStockThreshold) {
      await sendLowStockEmail(item);
    }
    await scheduleReturnReminder(usageLog, user);
  } catch (error) {
    console.error("Error allocating item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const returnItem = async (req, res) => {
  const { serialForReturn } = req.params;
  const itemId = req.body.itemId;
  const userId = req.body.userId ? req.body.userId : req.user._id;

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(itemId)
  ) {
    return res.status(400).json({ error: "Invalid user or item ID" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const instance = item.instances.find(
      (inst) => inst.serialNumber === serialForReturn
    );

    if (!instance) {
      return res.status(404).json({ error: "Instance not found" });
    }

    if (instance.status !== "Borrowed") {
      return res.status(400).json({ error: "Instance is not borrowed" });
    }

    const usageLog = await UsageLog.findOne({
      user: userId,
      item: itemId,
      serialNumbers: [serialForReturn],
      action: "Borrowed",
    });

    if (!usageLog) {
      return res.status(400).json({ error: "No active borrow record found" });
    }

    const returnedUsageLog = new UsageLog({
      user: userId,
      item: itemId,
      serialNumbers: [serialForReturn],
      action: "Returned",
    });

    instance.status = "Available";
    item.availableQuantity++;

    await item.save();
    await returnedUsageLog.save();

    res.status(200).json({ message: "Item returned successfully", instance });
  } catch (error) {
    console.error("Error returning item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTotalItemCount = async (req, res) => {
  try {
    const totalItems = await Item.countDocuments();
    res.status(200).json(totalItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to get total item count" });
  }
};

export const getRecentAddedItems = async (req, res) => {
  try {
    const limit = parseInt(req.params.count, 10); // number of items to fetch

    const allItems = await Item.aggregate([
      {
        $sort: {
          _id: -1,
        },
      },
      { $limit: limit },
    ]);
    res.json(allItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent used items" });
  }
};

export const getInstanceDetails = async (req, res) => {
  const { itemId, serialNumber } = req.params;

  try {
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const instance = item.instances.find(
      (inst) => inst.serialNumber === serialNumber
    );

    if (!instance) {
      return res.status(404).json({ message: "Instance not found" });
    }

    return res.status(200).json({
      item,
      instance,
    });
  } catch (error) {
    console.error("Error fetching instance details:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
