import { InvoiceDashboard } from './components/InvoiceDashboard';

function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <InvoiceDashboard />
      </main>
    </div>
  );
}

export default App;
