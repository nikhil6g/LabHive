import mongoose from "mongoose";

const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true,
    maxLength: 100,
    minLength: 3,
  },
  description: { type: String, required: true, maxLength: 100 },
});

CategorySchema.virtual("url").get(function () {
  return `/category/${this._id}`;
});

const Category = mongoose.model("Category", CategorySchema);

export default Category;
