import { useState, useEffect } from 'react';
import {
  getTransfers, getProducts, getLocations,
  mockCreateTransfer, getTransferById, mockValidateTransfer
} from '../mock/operationsData';

// ─── Transfer List ───────────────────────────────────────────────────────────
function TransferList({ setSubPage }) {
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    getTransfers().then(setTransfers).catch(console.error);
  }, []);

  return (
    <div className="ops-module">
      <div className="page-heading">
        <div>
          <p className="eyebrow">STOCK MOVEMENTS</p>
          <h1>Internal Transfers</h1>
          <p className="page-subtitle">Move stock between warehouse locations.</p>
        </div>
        <button className="primary-button" onClick={() => setSubPage('create')}>
          ＋ Create Transfer
        </button>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>FROM</th>
                <th>TO</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id}>
                  <td className="reference">INT/{String(t.id).padStart(3, '0')}</td>
                  <td>{t.from_location_name || `Location #${t.from_location_id}`}</td>
                  <td>{t.to_location_name || `Location #${t.to_location_id}`}</td>
                  <td>
                    <span className={`status-badge ${t.status === 'validated' ? 'done' : 'waiting'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="ops-view-btn" onClick={() => setSubPage(`view-${t.id}`)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr><td colSpan="6" className="empty-state">No transfers found. Create your first transfer.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Create Transfer ─────────────────────────────────────────────────────────
function CreateTransfer({ setSubPage }) {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [sourceLocation, setSourceLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
    getLocations().then(setLocations).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!selectedProduct) return setError('Please select a product');
    if (!sourceLocation || !destinationLocation) return setError('Please select both source and destination locations');
    if (sourceLocation === destinationLocation) return setError('Source and destination must be different');
    if (quantity <= 0) return setError('Quantity must be greater than 0');

    setLoading(true);
    try {
      await mockCreateTransfer({
        from_location_id: Number(sourceLocation),
        to_location_id: Number(destinationLocation),
        items: [{ product_id: Number(selectedProduct), quantity: Number(quantity) }]
      });
      setSubPage('list');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ops-module">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TRANSFERS</p>
          <h1>Create Internal Transfer</h1>
        </div>
        <button className="secondary-button" onClick={() => setSubPage('list')}>← Back to Transfers</button>
      </div>

      <div className="table-card" style={{ maxWidth: 600 }}>
        <div style={{ padding: '24px' }}>
          {error && <div className="ops-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="ops-form-group">
              <label>Product</label>
              <select className="ops-input" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                <option value="">Select a product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div className="ops-form-group">
              <label>Source Location</label>
              <select className="ops-input" value={sourceLocation} onChange={e => setSourceLocation(e.target.value)}>
                <option value="">Select source location...</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name} {l.warehouse_name ? `(${l.warehouse_name})` : ''}</option>)}
              </select>
            </div>
            <div className="ops-form-group">
              <label>Destination Location</label>
              <select className="ops-input" value={destinationLocation} onChange={e => setDestinationLocation(e.target.value)}>
                <option value="">Select destination location...</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name} {l.warehouse_name ? `(${l.warehouse_name})` : ''}</option>)}
              </select>
            </div>
            <div className="ops-form-group">
              <label>Quantity</label>
              <input
                type="number"
                className="ops-input"
                min="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setSubPage('list')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Transfer Details ─────────────────────────────────────────────────────────
function TransferDetails({ transferId, setSubPage }) {
  const [transfer, setTransfer] = useState(null);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      const t = await getTransferById(transferId);
      if (!t) throw new Error('Transfer not found');
      setTransfer({ ...t });
      const p = await getProducts();
      setProducts(p);
      const l = await getLocations();
      setLocations(l);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { loadData(); }, [transferId]);

  const handleComplete = async () => {
    try {
      await mockValidateTransfer(transferId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getProductName = (pid) => {
    const p = products.find(x => x.id === pid);
    return p ? `${p.name} (${p.sku})` : `Product #${pid}`;
  };

  const getLocationName = (lid) => {
    const l = locations.find(x => x.id === lid);
    return l ? l.name : `Location #${lid}`;
  };

  if (error) return <div className="ops-error">{error}</div>;
  if (!transfer) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div className="ops-module">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TRANSFERS</p>
          <h1>Transfer INT/{String(transfer.id).padStart(3, '0')}</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className={`status-badge ${transfer.status === 'validated' ? 'done' : 'waiting'}`} style={{ fontSize: 14, padding: '6px 14px' }}>
            {transfer.status.toUpperCase()}
          </span>
          <button className="secondary-button" onClick={() => setSubPage('list')}>← Back</button>
        </div>
      </div>

      <div className="table-card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '20px 24px' }}>
          <p><strong>From:</strong> {transfer.from_location_name || getLocationName(transfer.from_location_id)}</p>
          <p><strong>To:</strong> {transfer.to_location_name || getLocationName(transfer.to_location_id)}</p>
          <p><strong>Created:</strong> {new Date(transfer.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="table-card">
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Transfer Lines</h2>
        </div>
        <div className="table-responsive">
          <table>
            <thead><tr><th>PRODUCT</th><th>QUANTITY</th></tr></thead>
            <tbody>
              {transfer.items && transfer.items.map((line, idx) => (
                <tr key={idx}>
                  <td>{getProductName(line.product_id)}</td>
                  <td className="quantity">{line.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {transfer.status === 'draft' && (
        <div style={{ marginTop: 20 }}>
          <button className="primary-button" style={{ background: '#16a34a' }} onClick={handleComplete}>
            ✓ Validate Transfer
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Root: Transfers Page ─────────────────────────────────────────────────────
export default function Transfers() {
  const [subPage, setSubPage] = useState('list');

  if (subPage === 'create') return <CreateTransfer setSubPage={setSubPage} />;
  if (subPage.startsWith('view-')) {
    const id = parseInt(subPage.replace('view-', ''));
    return <TransferDetails transferId={id} setSubPage={setSubPage} />;
  }
  return <TransferList setSubPage={setSubPage} />;
}
