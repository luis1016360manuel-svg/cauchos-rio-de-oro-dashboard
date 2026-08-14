export interface InventoryItem {
  id: string;
  brand: string;
  model: string;
  size: string;
  rim: number;
  unitCost: number;
  sellingPrice: number;
  quantity: number;
  createdAt: string;
}

export interface DischargedItem {
  id: string;
  itemId: string;
  brand: string;
  model: string;
  size: string;
  quantityDischarged: number;
  clientName?: string;
  invoiceReference?: string;
  dischargedAt: string;
}
