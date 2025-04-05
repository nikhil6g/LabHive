import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface Instance {
  serialNumber: string;
  status: ItemStatus;
}
export type ItemStatus = "Available" | "Maintenance" | "Borrowed" | "Reserved";

export interface Category {
  _id: string;
  name: string;
  description: string;
}

export interface NullableCategory {
  category?: Category;
}

// Add or update the Item interface to include the image field
export interface Item {
  _id: string;
  name: string;
  description: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  image?: string;
  instances: Instance[];
}

export interface appProps {
  backendURL: string;
  displayError(message: string): void;
  toggleLoader(switchOn: Boolean): void;
}
