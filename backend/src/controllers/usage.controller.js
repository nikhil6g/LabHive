import Item from "../models/item.model.js";
import { v4 as uuidv4 } from "uuid";
import User from "../models/user.model.js";
import UsageLog from "../models/usageLog.model.js";
import mongoose from "mongoose";

export const getUsageLogs = async (req, res) => {
  try {
    const logs = await UsageLog.find()
      .populate({
        path: "user",
        select: "name",
        transform: (doc) => doc?.name || "Deleted User",
      })
      .populate({
        path: "item",
        select: "_id",
        transform: (doc) => doc?._id.toString() || "Deleted Item",
      })
      .lean();

    const transformedLogs = logs.map((log) => ({
      ...log,
      user: log.user.toString(), // Type correction
      item: log.item.toString(), // Type correction
      date: log.date.toISOString(),
      expectedReturnDate: log.expectedReturnDate?.toISOString(),
    }));

    res.json(transformedLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
