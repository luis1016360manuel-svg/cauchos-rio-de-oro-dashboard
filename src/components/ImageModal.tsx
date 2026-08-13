import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ImageModalProps {
  url: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ url, onClose }) => {
  const isPdf = url.toLowerCase().endsWith('.pdf') || url.startsWith('data:application/pdf');

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        padding: '24px'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '-40px', right: '0px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}
        >
          <X size={28} />
        </button>

        <div style={{ width: '100%', height: 'calc(90vh - 80px)', background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPdf ? (
            <iframe src={url} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Document" />
          ) : (
            <img src={url} alt="Full Resolution Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          )}
        </div>

        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', background: 'var(--gold)', color: '#fff', 
            borderRadius: '8px', textDecoration: 'none', fontWeight: 600,
            transition: 'background 0.2s',
          }}
        >
          Open Original in New Tab <ExternalLink size={18} />
        </a>
      </div>
    </div>
  );
};
