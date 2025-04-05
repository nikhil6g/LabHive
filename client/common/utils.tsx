import { Item, ItemStatus } from "./types";

export function getStatusBadgeColor(status: ItemStatus): string {
  switch (status) {
    case "Available":
      return "green";
    case "Maintenance":
      return "orange";
    case "Borrowed":
      return "pink";
    case "Reserved":
      return "violet";
    default:
      return "violet";
  }
}

export const placeholderItem: Item = {
  _id: "",
  name: "Item name",
  description:
    "This is a sample description that contains many alphanumeric characters.",
  lowStockThreshold: 3,
  image: "https://placehold.co/600x400?text=Image",
  availableQuantity: 10,
  totalQuantity: 10,
  category: "",
  instances: [],
};

export const ERROR = {
  SERVER_CONNECTION: "Unable to connect to server. Please try again later.",
  EMPTY_CATEGORY_LIST:
    "No categories exist. Please create at least one category before proceeding.",
  MISSING_ITEM_ID: "Invalid URL: Item ID is missing.",
};
