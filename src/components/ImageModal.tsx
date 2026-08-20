import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { t } from '../translations';

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
            <iframe src={url} style={{ width: '100%', height: '100%', border: 'none' }} title={t.pdfDocument} />
          ) : (
            <img src={url} alt={t.fullResPreview} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', 
              borderRadius: '8px', textDecoration: 'none', fontWeight: 600,
              transition: 'background 0.2s', border: '1px solid rgba(255,255,255,0.2)'
            }}
            onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.2)'}
            onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
          >
            {t.openOriginal} <ExternalLink size={18} />
          </a>
          
          <button
            onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({
                    title: 'Comprobante / Documento',
                    text: 'Mira este comprobante adjunto:',
                    url: url
                  });
                } else {
                  // Fallback to WhatsApp web if Web Share API is not supported
                  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Revisa este comprobante: ' + url)}`;
                  window.open(whatsappUrl, '_blank');
                }
              } catch (err) {
                console.error('Error sharing:', err);
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
              padding: '12px 24px', background: '#25D366', color: '#fff', 
              borderRadius: '8px', border: 'none', fontWeight: 700,
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background='#1da851'}
            onMouseOut={e => e.currentTarget.style.background='#25D366'}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            Compartir
          </button>
        </div>
      </div>
    </div>
  );
};
