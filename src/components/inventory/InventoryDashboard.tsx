import React, { useState, useEffect, useMemo } from 'react';
import { PackageSearch, ArrowUpRight, PlusCircle, ArrowDownRight, Trash2, Search, Printer, Layers } from 'lucide-react';
import type { InventoryItem, DischargedItem } from './InventoryTypes';
import { fetchInventory, deleteInventoryItem, fetchDischargedHistory, fetchLoadedHistory, dischargeInventory, quickAddOrUpdateInventoryItem } from './inventoryApi';
import { QuickAddModal } from './QuickAddModal';
import { DischargeStockModal } from './DischargeStockModal';
import { AddStockModal } from './AddStockModal';
import { InventoryMovementsDrawer } from './InventoryMovementsDrawer';
import { generateInventoryPDF } from './pdfGenerator';

export const InventoryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'HISTORY_IN' | 'HISTORY_OUT'>('CURRENT');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<DischargedItem[]>([]);
  const [loadedHistory, setLoadedHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMovementsDrawerOpen, setIsMovementsDrawerOpen] = useState(false);
  const [dischargingItem, setDischargingItem] = useState<InventoryItem | null>(null);
  const [loadingItem, setLoadingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');



  const filteredItems = useMemo(() => {
    let result = items;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = items.filter(item => 
        item.brand.toLowerCase().includes(query) || 
        item.model.toLowerCase().includes(query) || 
        item.size.toLowerCase().includes(query) ||
        (item.rim && item.rim.toString().includes(query))
      );
    }

    const parseTireSize = (measure: string) => {
      const upper = measure.toUpperCase();
      const parts = upper.split('R');
      const beforeR = parts[0] || '';
      const afterR = parts[1] || '';
      
      const subParts = beforeR.split('/');
      const width = parseFloat(subParts[0]) || 0;
      const profile = parseFloat(subParts[1]) || 80;
      
      const rimMatch = afterR.match(/\d+/);
      const rim = rimMatch ? parseFloat(rimMatch[0]) : 0;
      
      return { width, profile, rim };
    };

    return [...result].sort((a, b) => {
      const parsedA = parseTireSize(a.size);
      const parsedB = parseTireSize(b.size);
      
      if (parsedA.width !== parsedB.width) return parsedA.width - parsedB.width;
      if (parsedA.profile !== parsedB.profile) return parsedA.profile - parsedB.profile;
      if (parsedA.rim !== parsedB.rim) return parsedA.rim - parsedB.rim;
      return a.brand.localeCompare(b.brand);
    });
  }, [items, searchQuery]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [inventoryData, historyData, loadedData] = await Promise.all([
          fetchInventory(),
          fetchDischargedHistory(),
          fetchLoadedHistory()
        ]);
        
        if (!mounted) return;

        setItems(inventoryData);
        setHistory(historyData);
        setLoadedHistory(loadedData);
      } catch (e) {
        if (!mounted) return;
        alert('Error cargando inventario. Revisa tu conexión a internet.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleQuickAdd = async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'quantity'>, quantityToAdd: number) => {
    try {
      const savedItem = await quickAddOrUpdateInventoryItem(itemData, quantityToAdd);
      setItems(prev => {
        const exists = prev.find(i => i.id === savedItem.id);
        if (exists) {
          return prev.map(i => i.id === savedItem.id ? savedItem : i);
        } else {
          return [...prev, savedItem];
        }
      });
      // Refresh loaded history to show it in the table immediately
      const newLoadedHistory = await fetchLoadedHistory();
      setLoadedHistory(newLoadedHistory);
    } catch (e) {
      alert('Error guardando inventario');
      throw e;
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este artículo de forma permanente?')) {
      try {
        await deleteInventoryItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
      } catch (e) {
        alert('Error al eliminar el artículo');
      }
    }
  };

  const handleDischargeSubmit = async (quantity: number, clientName: string = '', invoiceReference: string = '') => {
    if (!dischargingItem) return;
    try {
      const { updatedItem, dischargedRecord } = await dischargeInventory(dischargingItem, quantity, clientName, invoiceReference);
      if (updatedItem) {
        setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      }
      setHistory(prev => [dischargedRecord, ...prev]);
    } catch (e) {
      alert('Error en la descarga');
    }
  };

  const handleStockLoadSubmit = async (quantityToAdd: number) => {
    if (!loadingItem) return;
    try {
      const savedItem = await quickAddOrUpdateInventoryItem(loadingItem, quantityToAdd);
      setItems(prev => prev.map(i => i.id === savedItem.id ? savedItem : i));
      
      // Refresh loaded history to show it in the table immediately
      const newLoadedHistory = await fetchLoadedHistory();
      setLoadedHistory(newLoadedHistory);
    } catch (e) {
      alert('Error guardando la carga de inventario');
      throw e;
    }
  };


  // -------------------------------------



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--gold-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '8px' }}>
            Inventario <span className="gradient-text">Río de Oro</span>
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona tu stock de llantas y mercancía</p>
        </div>

        {/* KPI Card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-secondary)',
          padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          cursor: 'pointer', transition: 'transform 0.2s'
        }}
        onClick={() => setIsMovementsDrawerOpen(true)}
        onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
        onMouseOut={e=>e.currentTarget.style.transform='none'}
        title="Ver flujo de inventario (cargas y descargas)"
        >
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
            <Layers size={28} color="var(--gold-light)" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gold-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Unidades en Inventario
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                {filteredItems.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                en {new Set(filteredItems.map(i => i.size)).size} medidas
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => generateInventoryPDF(filteredItems)}
            title="Imprimir / Exportar PDF"
            style={{ 
              padding: '10px 16px', borderRadius: 'var(--radius-full)', 
              background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)', 
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            <Printer size={18} />
            <span className="hide-on-mobile">Exportar</span>
          </button>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            style={{ 
              padding: '10px 24px', borderRadius: 'var(--radius-full)', 
              background: 'var(--gold-gradient)', color: '#07090e', border: 'none', 
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <PlusCircle size={18} />
            Ingreso Rápido
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('CURRENT')}
          style={{
            padding: '8px 24px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.95rem',
            background: activeTab === 'CURRENT' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'CURRENT' ? 'var(--gold-light)' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <PackageSearch size={18} />
          Inventario Actual
        </button>
        <button
          onClick={() => setActiveTab('HISTORY_IN')}
          style={{
            padding: '8px 24px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.95rem',
            background: activeTab === 'HISTORY_IN' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'HISTORY_IN' ? 'var(--gold-light)' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <ArrowUpRight size={18} />
          Historial de Cargas
        </button>
        <button
          onClick={() => setActiveTab('HISTORY_OUT')}
          style={{
            padding: '8px 24px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.95rem',
            background: activeTab === 'HISTORY_OUT' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'HISTORY_OUT' ? 'var(--gold-light)' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <ArrowDownRight size={18} />
          Historial de Descargas
        </button>
      </div>

      {/* Content */}
      <div className="glass-card" style={{ flex: 1, padding: '24px', overflowX: 'auto' }}>
        
        {activeTab === 'CURRENT' && (
          <>
            <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '500px' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Buscar por medida o marca (ej. Kumho, 265/60R18)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', padding: '12px 16px 12px 48px', borderRadius: 'var(--radius-full)', 
                  border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', 
                  color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none'
                }}
              />
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Artículo</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Medida</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Rin</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Costo</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Precio</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Stock</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Search size={48} color="var(--text-dim)" style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
                    <p>{searchQuery ? 'No se encontraron cauchos con ese criterio de búsqueda.' : 'No hay artículos en el inventario'}</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.brand}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{item.model}</div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-main)' }}>{item.size}</td>
                    <td style={{ padding: '16px', color: 'var(--text-main)' }}>{item.rim ? `R${item.rim}` : '-'}</td>
                    <td style={{ padding: '16px', color: 'var(--text-main)' }}>{formatCurrency(item.unitCost)}</td>
                    <td style={{ padding: '16px', color: 'var(--gold-light)', fontWeight: 600 }}>{formatCurrency(item.sellingPrice)}</td>
                    <td style={{ padding: '16px' }}>
                      <div 
                        onClick={() => setLoadingItem(item)}
                        title="Haz clic para cargar más stock"
                        style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '8px', 
                          cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
                          background: item.quantity === 0 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                          border: '1px solid transparent',
                          transition: 'border-color 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                      >
                        <span style={{ 
                          fontWeight: 700, 
                          color: item.quantity === 0 ? '#ef4444' : (item.quantity < 5 ? '#f59e0b' : 'var(--text-main)') 
                        }}>
                          {item.quantity} u.
                        </span>
                        {item.quantity === 0 && (
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#ef4444', color: '#fff', borderRadius: '4px', fontWeight: 600 }}>AGOTADO</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setLoadingItem(item)}
                          title="Cargar (Ingresar nueva mercancía)"
                          style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', cursor: 'pointer' }}
                        >
                          <ArrowUpRight size={16} />
                        </button>
                        <button 
                          onClick={() => setDischargingItem(item)}
                          title="Descargar (Vender)"
                          disabled={item.quantity === 0}
                          style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'none', cursor: item.quantity > 0 ? 'pointer' : 'not-allowed', opacity: item.quantity > 0 ? 1 : 0.5 }}
                        >
                          <ArrowDownRight size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          title="Eliminar"
                          style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </>
        )}

        {activeTab === 'HISTORY_IN' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Fecha</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Artículo Cargado</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {loadedHistory.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay historial de cargas</td></tr>
              ) : (
                loadedHistory.map(record => (
                  <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '16px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                      {new Date(record.loadedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{record.brand}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{record.size}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowUpRight size={14} /> {record.quantityLoaded} u.
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'HISTORY_OUT' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Fecha</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Artículo Descargado</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Cantidad</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Cliente / Referencia</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay historial de descargas</td></tr>
              ) : (
                history.map(record => (
                  <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '16px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                      {new Date(record.dischargedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{record.brand} {record.model}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{record.size}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowDownRight size={14} /> {record.quantityDischarged} u.
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-dim)' }}>
                      <div>{record.clientName || '-'}</div>
                      <div style={{ fontSize: '0.8rem' }}>{record.invoiceReference || ''}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isAddModalOpen && (
        <QuickAddModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleQuickAdd}
          existingItems={items}
        />
      )}

      {loadingItem && (
        <AddStockModal
          item={loadingItem}
          onClose={() => setLoadingItem(null)}
          onConfirm={handleStockLoadSubmit}
        />
      )}

      {dischargingItem && (
        <DischargeStockModal
          item={dischargingItem}
          onClose={() => setDischargingItem(null)}
          onDischarge={handleDischargeSubmit}
        />
      )}

      <InventoryMovementsDrawer 
        isOpen={isMovementsDrawerOpen} 
        onClose={() => setIsMovementsDrawerOpen(false)} 
      />
    </div>
  );
};
