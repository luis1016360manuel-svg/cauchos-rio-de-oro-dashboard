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

export const quickAddOrUpdateInventoryItem = async (
  itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'quantity'>,
  quantityToAdd: number
): Promise<InventoryItem> => {
  // 1. Check if the exact brand, model, and size already exists
  const { data: existingItems, error: searchError } = await supabase
    .from('inventory_items')
    .select('*')
    .ilike('size', itemData.size)
    .ilike('brand', itemData.brand)
    .limit(1);

  if (searchError) {
    console.error('Error searching for existing item:', searchError);
    throw new Error('Failed to verify existing inventory');
  }

  // 2. If it exists, update it
  if (existingItems && existingItems.length > 0) {
    const existing = existingItems[0] as InventoryItem;
    const { data: updated, error: updateError } = await supabase
      .from('inventory_items')
      .update({ 
        quantity: existing.quantity + quantityToAdd,
        unitCost: itemData.unitCost, // Update costs in case they changed
        sellingPrice: itemData.sellingPrice,
        rim: itemData.rim // Just in case it was 0 before
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) throw updateError;
    
    // Log the quick update
    await supabase.from('inventory_logs').insert([{
      id: `LOG-${Date.now()}`,
      item_id: existing.id,
      tipo_movimiento: 'entrada',
      cantidad_anterior: existing.quantity,
      cantidad_nueva: existing.quantity + quantityToAdd,
      createdAt: new Date().toISOString()
    }]);

    return updated as InventoryItem;
  }

  // 3. If it does not exist, insert it
  const id = `ITEM-${Date.now()}`;
  const newItem: InventoryItem = {
    ...itemData,
    quantity: quantityToAdd,
    id,
    createdAt: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('inventory_items')
    .insert([newItem])
    .select()
    .single();

  if (error) {
    console.error('Error adding new inventory item:', error);
    throw new Error('Failed to add new inventory item');
  }

  // Log the new item creation
  await supabase.from('inventory_logs').insert([{
    id: `LOG-${Date.now()}`,
    item_id: id,
    tipo_movimiento: 'entrada',
    cantidad_anterior: 0,
    cantidad_nueva: quantityToAdd,
    createdAt: new Date().toISOString()
  }]);

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

export const updateStockWithLog = async (item: InventoryItem, newStock: number): Promise<InventoryItem> => {
  // Update the inventory item
  const { data: updatedItem, error: updateError } = await supabase
    .from('inventory_items')
    .update({ quantity: newStock })
    .eq('id', item.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating stock:', updateError);
    throw new Error('Failed to update stock');
  }

  // Insert log
  const logId = `LOG-${Date.now()}`;
  const tipo = newStock > item.quantity ? 'entrada' : newStock < item.quantity ? 'salida' : 'ajuste_manual';
  const { error: logError } = await supabase
    .from('inventory_logs')
    .insert([{
      id: logId,
      item_id: item.id,
      tipo_movimiento: tipo,
      cantidad_anterior: item.quantity,
      cantidad_nueva: newStock,
      createdAt: new Date().toISOString()
    }]);

  if (logError) {
    console.error('Error logging stock update:', logError);
    // We don't throw here to avoid failing the stock update if log fails, but it should be noted
  }

  return updatedItem as InventoryItem;
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
    .order('dischargedAt', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching discharged history:', error);
    throw new Error('No se pudo cargar el historial de descargas');
  }
  return data as DischargedItem[];
};

export const deleteInventoryLog = async (id: string): Promise<void> => {
  const { error } = await supabase.from('inventory_logs').delete().eq('id', id);
  if (error) throw error;
};

export const deleteInventoryDischarge = async (id: string): Promise<void> => {
  const { error } = await supabase.from('inventory_discharges').delete().eq('id', id);
  if (error) throw error;
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
    dischargedAt: new Date().toISOString(),
    remainingQuantity: newQuantity > 0 ? newQuantity : 0
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

export interface LoadedItem {
  id: string;
  itemId: string;
  brand: string;
  size: string;
  quantityLoaded: number;
  loadedAt: string;
  cantidad_anterior: number;
  cantidad_nueva: number;
  createdAt: string;
}

export const fetchLoadedHistory = async (): Promise<LoadedItem[]> => {
  const { data, error } = await supabase
    .from('inventory_logs')
    .select('id, item_id, tipo_movimiento, cantidad_anterior, cantidad_nueva, createdAt, inventory_items(brand, size)')
    .eq('tipo_movimiento', 'entrada')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching loaded history:', error);
    return []; // Return empty array instead of throwing to prevent crashing the whole page
  }

  return (data || []).map(log => ({
    id: log.id,
    itemId: log.item_id,
    brand: (log.inventory_items as any)?.brand || 'Desconocido',
    size: (log.inventory_items as any)?.size || '',
    quantityLoaded: log.cantidad_nueva - log.cantidad_anterior,
    loadedAt: log.createdAt,
    cantidad_anterior: log.cantidad_anterior,
    cantidad_nueva: log.cantidad_nueva,
    createdAt: log.createdAt
  }));
};

export interface InventoryMovement {
  id: string;
  date: string;
  item: string;
  type: 'IN' | 'OUT';
  qty: number;
  reason: string;
  user: string;
}

export const fetchInventoryMovements = async (): Promise<InventoryMovement[]> => {
  // Fetch logs (entradas / ajustes)
  const { data: logs, error: logsError } = await supabase
    .from('inventory_logs')
    .select('*, inventory_items(brand, size)')
    .order('createdAt', { ascending: false })
    .limit(300);

  // Fetch discharges (salidas)
  const { data: discharges, error: dischargesError } = await supabase
    .from('inventory_discharges')
    .select('*')
    .order('dischargedAt', { ascending: false })
    .limit(300);

  if (logsError || dischargesError) {
    console.error('Error fetching movements:', logsError || dischargesError);
    return [];
  }

  const movements: InventoryMovement[] = [];

  if (logs) {
    logs.forEach(log => {
      const isEntry = log.cantidad_nueva > log.cantidad_anterior;
      const diff = Math.abs(log.cantidad_nueva - log.cantidad_anterior);
      if (diff === 0) return;
      
      const itemDesc = log.inventory_items ? `${(log.inventory_items as any).size} ${(log.inventory_items as any).brand}` : 'Artículo Desconocido';
      
      movements.push({
        id: log.id,
        date: log.createdAt || log.created_at || new Date().toISOString(),
        item: itemDesc,
        type: isEntry ? 'IN' : 'OUT',
        qty: diff,
        reason: log.tipo_movimiento === 'entrada' ? 'Ingreso/Compra' : 'Ajuste Manual',
        user: 'admin' // In a real app, join with users table
      });
    });
  }

  if (discharges) {
    discharges.forEach(d => {
      movements.push({
        id: d.id,
        date: d.dischargedAt,
        item: `${d.size} ${d.brand}`,
        type: 'OUT',
        qty: d.quantityDischarged,
        reason: d.invoiceReference ? `Factura ${d.invoiceReference}` : (d.clientName ? `Salida: ${d.clientName}` : 'Descarga Manual'),
        user: 'admin'
      });
    });
  }

  // Sort combined movements by date descending
  return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
