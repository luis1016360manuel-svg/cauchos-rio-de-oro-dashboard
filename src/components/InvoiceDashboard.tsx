import React, { useState, useMemo, useEffect } from 'react';
import { FileText, CheckCircle2, AlertCircle, Clock, Search, Filter, PlusCircle, Building2 } from 'lucide-react';
import { fetchInvoices, addInvoice, updateInvoice, deleteInvoice, fetchCompanies, addCompany, deleteCompany } from '../api';
import type { Company } from '../api';
import { AddInvoiceForm } from './AddInvoiceForm';
import { EditInvoiceModal } from './EditInvoiceModal';
import { ImageModal } from './ImageModal';
import { CompanyManagerModal } from './CompanyManagerModal';
import { t } from '../translations';

// --- TypeScript Interfaces ---

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'PARTIALLY_PAID';
export type PaymentMethod = 'Zelle' | 'Cash' | 'Wire';

export interface Invoice {
  id: string;
  invoiceCode: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  pendingBalance: number;
  status: InvoiceStatus;
  dueDate: string;
  receiptImage?: string;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  paymentProofImage?: string;
}

// --- Component ---

export const InvoiceDashboard: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [invData, compData] = await Promise.all([
          fetchInvoices().catch(() => null),
          fetchCompanies().catch(() => null)
        ]);

        if (invData && invData.length > 0) {
          setInvoices(invData);
        } else {
          setInvoices([]);
        }

        if (compData) {
          setCompanies(compData);
        }
      } catch (e) {
        console.error('Failed to load data', e);
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddInvoice = async (newInvoice: Invoice, receiptFile: File | null, proofFile: File | null) => {
    try {
      setIsLoading(true);
      const savedInvoice = await addInvoice(newInvoice, receiptFile, proofFile);
      setInvoices(prev => [savedInvoice, ...prev]);
      setIsFormOpen(false);
    } catch (e) {
      console.error('Failed to add', e);
      alert('Failed to save to cloud.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInvoice = async (updatedInvoice: Invoice, receiptFile: File | null, proofFile: File | null) => {
    try {
      setIsLoading(true);
      const savedInvoice = await updateInvoice(updatedInvoice, receiptFile, proofFile);
      setInvoices(prev => prev.map(inv => inv.id === savedInvoice.id ? savedInvoice : inv));
      setSelectedInvoice(null);
    } catch (e) {
      console.error('Failed to update', e);
      alert('Failed to update in cloud.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      setIsLoading(true);
      const invToDelete = invoices.find(inv => inv.id === id);
      await deleteInvoice(invToDelete || id);
      
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      setSelectedInvoice(null);
    } catch (e) {
      console.error('Failed to delete', e);
      alert('Failed to delete in cloud. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompany = async (newComp: Omit<Company, 'id'>) => {
    const tempId = `COMP-${Date.now()}`;
    const compToSave = { ...newComp, id: tempId };
    const saved = await addCompany(compToSave);
    setCompanies(prev => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleDeleteCompany = async (id: string) => {
    await deleteCompany(id);
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  // Filtering Logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesStatus = activeFilter === 'ALL' || invoice.status === activeFilter;
      const matchesSearch = invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            invoice.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  // Categorize for rendering if 'ALL' is selected
  const sortByDate = (a: Invoice, b: Invoice) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

  const unpaidInvoices = filteredInvoices.filter(inv => inv.status === 'UNPAID').sort(sortByDate);
  const partiallyPaidInvoices = filteredInvoices.filter(inv => inv.status === 'PARTIALLY_PAID').sort(sortByDate);
  const paidInvoices = filteredInvoices.filter(inv => inv.status === 'PAID');

  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle2 size={16} />, label: 'Paid' };
      case 'PARTIALLY_PAID':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <Clock size={16} />, label: 'Partially Paid' };
      case 'UNPAID':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <AlertCircle size={16} />, label: 'Unpaid' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const renderInvoiceCard = (invoice: Invoice) => {
    const config = getStatusConfig(invoice.status);
    const statusColor = config.color;

    // Calculate urgency for non-paid invoices
    const isPending = invoice.status !== 'PAID';
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    // Reset time for accurate day comparison
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let urgencyBadge = null;
    if (isPending) {
      if (diffDays < 0) {
        urgencyBadge = <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{t.overdue} ({Math.abs(diffDays)} {t.days})</span>;
      } else if (diffDays === 0) {
        urgencyBadge = <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{t.dueToday}</span>;
      } else if (diffDays <= 7) {
        urgencyBadge = <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{t.dueInDays} {diffDays} {t.days}</span>;
      }
    }

    return (
      <div key={invoice.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', border: (isPending && diffDays < 0) ? '1px solid rgba(239, 68, 68, 0.3)' : undefined }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{invoice.invoiceCode}</span>
              <div className="badge">
                <span className="badge-dot" style={{ 
                  backgroundColor: statusColor, 
                  boxShadow: `0 0 8px ${statusColor}`,
                  animation: invoice.status === 'UNPAID' ? 'none' : undefined 
                }} />
                <span style={{ color: statusColor }}>{t.status[invoice.status]}</span>
              </div>
              {urgencyBadge}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{invoice.clientName}</h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', margin: '8px 0' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{t.totalAmount}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{formatCurrency(invoice.totalAmount)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{t.paidAmount}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{formatCurrency(invoice.paidAmount)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (isPending && diffDays < 0) ? '#ef4444' : 'var(--text-dim)', fontSize: '0.85rem' }}>
            <Clock size={14} /> {t.dueDate}: <span style={{ color: (isPending && diffDays < 0) ? '#ef4444' : 'var(--text-main)', fontWeight: (isPending && diffDays < 0) ? 600 : 400 }}>{invoice.dueDate}</span>
          </div>
          <button 
            onClick={() => setSelectedInvoice(invoice)}
            style={{ background: 'none', border: 'none', color: 'var(--gold-light)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
          >
            {t.viewDetails} &rarr;
          </button>
        </div>
      </div>
    );
  };

  const uniqueClients = useMemo(() => {
    const clients = invoices.map(inv => inv.clientName);
    return Array.from(new Set(clients)).sort();
  }, [invoices]);

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--gold-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'var(--text-muted)' }}>{t.loading}</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <section id="invoices" style={{ background: 'var(--bg-primary)', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', gap: '24px' }}>
          <div>
            <div className="badge" style={{ marginBottom: '16px' }}>
              <FileText size={14} color="var(--gold-light)" />
              <span>{t.financialOperations}</span>
            </div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '8px' }}>
              {t.invoiceManagement.split(' ')[0]} <span className="gradient-text">{t.invoiceManagement.split(' ').slice(1).join(' ')}</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              {t.dashboardSubtitle}
            </p>
            <button 
              onClick={() => setIsCompanyModalOpen(true)}
              style={{ 
                marginTop: '16px', padding: '10px 24px', borderRadius: 'var(--radius-full)', 
                background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)', 
                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Building2 size={18} />
              {t.manageCompanies}
            </button>
            <button 
              onClick={() => setIsFormOpen(true)}
              style={{ 
                marginTop: '16px', marginLeft: '10px', padding: '10px 24px', borderRadius: 'var(--radius-full)', 
                background: 'var(--gold-gradient)', color: '#07090e', border: 'none', 
                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <PlusCircle size={18} />
              {t.addInvoice}
            </button>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '10px 16px 10px 38px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  minWidth: '220px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', padding: '4px' }}>
              {(['ALL', 'UNPAID', 'PARTIALLY_PAID', 'PAID'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: activeFilter === filter ? 'var(--gold-gradient)' : 'transparent',
                    color: activeFilter === filter ? '#07090e' : 'var(--text-muted)',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: activeFilter === filter ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {t.status[filter]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {(activeFilter === 'ALL' || activeFilter === 'UNPAID') && (
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}/>
                {t.unpaidInvoices} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}>({unpaidInvoices.length})</span>
              </h3>
              {unpaidInvoices.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                  {unpaidInvoices.map(renderInvoiceCard)}
                </div>
              ) : (
                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={20} color="var(--gold-light)" opacity={0.5} />
                  {t.emptyCategory}
                </div>
              )}
            </div>
          )}

          {(activeFilter === 'ALL' || activeFilter === 'PARTIALLY_PAID') && (
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}/>
                {t.partiallyPaidInvoices} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}>({partiallyPaidInvoices.length})</span>
              </h3>
              {partiallyPaidInvoices.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                  {partiallyPaidInvoices.map(renderInvoiceCard)}
                </div>
              ) : (
                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={20} color="var(--gold-light)" opacity={0.5} />
                  {t.emptyCategory}
                </div>
              )}
            </div>
          )}

          {(activeFilter === 'ALL' || activeFilter === 'PAID') && (
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}/>
                {t.paidInvoices} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}>({paidInvoices.length})</span>
              </h3>
              {paidInvoices.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                  {paidInvoices.map(renderInvoiceCard)}
                </div>
              ) : (
                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={20} color="var(--gold-light)" opacity={0.5} />
                  {t.emptyCategory}
                </div>
              )}
            </div>
          )}

          {filteredInvoices.length === 0 && (
            <div className="glass-panel" style={{ padding: '64px 24px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
              <Filter size={48} color="var(--text-dim)" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
              <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '8px' }}>{t.noInvoices}</h4>
              <p style={{ color: 'var(--text-muted)' }}>{t.dashboardSubtitle}</p>
            </div>
          )}

        </div>

      </div>

      {isFormOpen && (
        <AddInvoiceForm 
          onAdd={handleAddInvoice}
          onClose={() => setIsFormOpen(false)}
          existingClients={uniqueClients}
          companies={companies}
        />
      )}

      {selectedInvoice && (
        <EditInvoiceModal
          invoice={selectedInvoice}
          onUpdate={handleUpdateInvoice}
          onDelete={handleDeleteInvoice}
          onClose={() => setSelectedInvoice(null)}
          onImageClick={setViewerUrl}
          existingClients={uniqueClients}
          companies={companies}
        />
      )}

      {isCompanyModalOpen && (
        <CompanyManagerModal
          companies={companies}
          onAdd={handleAddCompany}
          onDelete={handleDeleteCompany}
          onClose={() => setIsCompanyModalOpen(false)}
        />
      )}

      {viewerUrl && (
        <ImageModal url={viewerUrl} onClose={() => setViewerUrl(null)} />
      )}
    </section>
  );
};
