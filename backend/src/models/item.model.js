import mongoose from "mongoose";

// Schema for each individual instance (e.g., a laptop unit)
const instanceSchema = new mongoose.Schema(
  {
    serialNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["Available", "Borrowed", "Reserved", "Maintenance"],
      default: "Available",
    },
  },
  { _id: false }
);

// Main Item schema
const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    totalQuantity: { type: Number, required: true },
    availableQuantity: { type: Number, required: true },
    lowStockThreshold: { type: Number, required: true },
    image: { type: String, default: "" },
    instances: [instanceSchema],
  },
  { timestamps: true }
);

const Item = mongoose.model("Item", itemSchema);

export default Item;
