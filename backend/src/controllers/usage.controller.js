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

export const getUserBorrowedItems = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all "borrowed" logs for the user where there's no corresponding "returned" log
    const borrowedLogs = await UsageLog.find({
      user: userId,
      action: "Borrowed",
    })
      .populate({
        path: "item",
        select: "name description image",
      })
      .lean();

    // For each borrowed item, check if it has been returned
    const activeBorrowedItems = [];
    
    for (const log of borrowedLogs) {
      // Check if there's a return log for each serial number
      for (const serial of log.serialNumbers) {
        const returnLog = await UsageLog.findOne({
          user: userId,
          action: "Returned",
          serialNumbers: serial
        });
        
        // If no return log exists, this item is still borrowed
        if (!returnLog) {
          activeBorrowedItems.push({
            ...log,
            serialNumber: serial,
            borrowDate: log.date,
            dueDate: log.expectedReturnDate
          });
        }
      }
    }

    res.json(activeBorrowedItems);
  } catch (error) {
    console.error("Error fetching user borrowed items:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserReturnedItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = 5; // Show only the 5 most recent returns

    // Find the most recent "Returned" logs for this user
    const returnedLogs = await UsageLog.find({
      user: userId,
      action: "Returned",
    })
      .populate({
        path: "item",
        select: "name description image",
      })
      .sort({ date: -1 }) // Sort by most recent first
      .limit(limit)
      .lean();

    const formattedReturnedItems = returnedLogs.map(log => {
      // For each returned item, get the original borrow date by finding the corresponding "Borrowed" log
      return {
        ...log,
        serialNumber: log.serialNumbers[0], // Assuming one serial number per log for simplicity
        returnDate: log.date
      };
    });

    res.json(formattedReturnedItems);
  } catch (error) {
    console.error("Error fetching user returned items:", error);
    res.status(500).json({ message: error.message });
  }
};
