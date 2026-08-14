import { supabase } from '../../supabaseClient';
import type { InventoryItem, DischargedItem } from './InventoryTypes';

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('brand', { ascending: true });

  if (error) {
    console.error('Error fetching inventory:', error);
    throw new Error('Failed to fetch inventory');
  }

  return data as InventoryItem[];
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'createdAt'>): Promise<InventoryItem> => {
  const id = `ITEM-${Date.now()}`;
  const newItem: InventoryItem = {
    ...item,
    id,
    createdAt: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('inventory_items')
    .insert([newItem])
    .select()
    .single();

  if (error) {
    console.error('Error adding inventory item:', error);
    throw new Error('Failed to add inventory item');
  }

  return data as InventoryItem;
};

export const updateInventoryItem = async (item: InventoryItem): Promise<InventoryItem> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(item)
    .eq('id', item.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating inventory item:', error);
    throw new Error('Failed to update inventory item');
  }

  return data as InventoryItem;
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting inventory item:', error);
    throw new Error('Failed to delete inventory item');
  }
};

export const fetchDischargedHistory = async (): Promise<DischargedItem[]> => {
  const { data, error } = await supabase
    .from('inventory_discharges')
    .select('*')
    .order('dischargedAt', { ascending: false });

  if (error) {
    console.error('Error fetching discharged history:', error);
    throw new Error('Failed to fetch discharged history');
  }

  return data as DischargedItem[];
};

export const dischargeInventory = async (
  item: InventoryItem,
  quantityToDischarge: number,
  clientName?: string,
  invoiceReference?: string
): Promise<{ updatedItem: InventoryItem | null, dischargedRecord: DischargedItem }> => {
  
  if (item.quantity < quantityToDischarge) {
    throw new Error('Not enough quantity in stock');
  }

  // 1. Update the quantity in inventory_items
  const newQuantity = item.quantity - quantityToDischarge;
  let updatedItem = null;

  if (newQuantity > 0) {
    const { data: updated, error: updateError } = await supabase
      .from('inventory_items')
      .update({ quantity: newQuantity })
      .eq('id', item.id)
      .select()
      .single();

    if (updateError) throw updateError;
    updatedItem = updated;
  } else {
    // If quantity is 0, we can either delete it or leave it at 0. Usually leaving it at 0 is better for restocking later.
    const { data: updated, error: updateError } = await supabase
      .from('inventory_items')
      .update({ quantity: 0 })
      .eq('id', item.id)
      .select()
      .single();

    if (updateError) throw updateError;
    updatedItem = updated;
  }

  // 2. Create the discharge log
  const dischargedRecord: DischargedItem = {
    id: `DIS-${Date.now()}`,
    itemId: item.id,
    brand: item.brand,
    model: item.model,
    size: item.size,
    quantityDischarged: quantityToDischarge,
    clientName,
    invoiceReference,
    dischargedAt: new Date().toISOString()
  };

  const { error: insertError } = await supabase
    .from('inventory_discharges')
    .insert([dischargedRecord]);

  if (insertError) {
    // Note: In a real system, you'd want transaction support here. 
    console.error('Error saving discharge record:', insertError);
    throw insertError;
  }

  return { updatedItem: updatedItem as InventoryItem, dischargedRecord };
};
