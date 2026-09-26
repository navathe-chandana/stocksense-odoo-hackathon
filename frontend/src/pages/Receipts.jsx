import { useState, useEffect } from 'react';
import {
  getReceipts, getProducts, getLocations, mockCreateReceipt,
  getReceiptById, mockValidateReceipt
} from '../mock/operationsData';

// ─── Receipt List ───────────────────────────────────────────────────────────
function ReceiptList({ setSubPage }) {
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    getReceipts().then(setReceipts).catch(console.error);
  }, []);

  return (
    <div className="ops-module">
      <div className="page-heading">
        <div>
          <p className="eyebrow">INCOMING STOCK</p>
          <h1>Receipts</h1>
          <p className="page-subtitle">Manage incoming stock receipts from suppliers.</p>
        </div>
        <button className="primary-button" onClick={() => setSubPage('create')}>
          ＋ Create Receipt
        </button>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>LOCATION</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map(r => (
                <tr key={r.id}>
                  <td className="reference">REC/{String(r.id).padStart(3, '0')}</td>
                  <td>{r.location_name || `Location #${r.location_id}`}</td>
                  <td>
                    <span className={`status-badge ${r.status === 'validated' ? 'done' : 'waiting'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="ops-view-btn" onClick={() => setSubPage(`view-${r.id}`)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {receipts.length === 0 && (
                <tr><td colSpan="5" className="empty-state">No receipts found. Create your first receipt.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Create Receipt ─────────────────────────────────────────────────────────
function CreateReceipt({ setSubPage }) {
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLocations().then(setLocations).catch(console.error);
    getProducts().then(setProducts).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!selectedLocation) return setError('Please select a location');
    if (!selectedProduct) return setError('Please select a product');
    if (quantity <= 0) return setError('Quantity must be greater than 0');

    setLoading(true);
    try {
      await mockCreateReceipt({
        location_id: Number(selectedLocation),
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
          <p className="eyebrow">RECEIPTS</p>
          <h1>Create Receipt</h1>
        </div>
        <button className="secondary-button" onClick={() => setSubPage('list')}>← Back to Receipts</button>
      </div>

      <div className="table-card" style={{ maxWidth: 600 }}>
        <div style={{ padding: '24px' }}>
          {error && <div className="ops-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="ops-form-group">
              <label>Location</label>
              <select className="ops-input" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
                <option value="">Select a location...</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name} {l.warehouse_name ? `(${l.warehouse_name})` : ''}</option>)}
              </select>
            </div>
            <div className="ops-form-group">
              <label>Product</label>
              <select className="ops-input" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                <option value="">Select a product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
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

// ─── Receipt Details ─────────────────────────────────────────────────────────
function ReceiptDetails({ receiptId, setSubPage }) {
  const [receipt, setReceipt] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      const r = await getReceiptById(receiptId);
      if (!r) throw new Error('Receipt not found');
      setReceipt({ ...r });
      const p = await getProducts();
      setProducts(p);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { loadData(); }, [receiptId]);

  const handleValidate = async () => {
    try {
      await mockValidateReceipt(receiptId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getProductName = (pid) => {
    const p = products.find(x => x.id === pid);
    return p ? `${p.name} (${p.sku})` : `Product #${pid}`;
  };

  if (error) return <div className="ops-error">{error}</div>;
  if (!receipt) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div className="ops-module">
      <div className="page-heading">
        <div>
          <p className="eyebrow">RECEIPTS</p>
          <h1>Receipt REC/{String(receipt.id).padStart(3, '0')}</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className={`status-badge ${receipt.status === 'validated' ? 'done' : 'waiting'}`} style={{ fontSize: 14, padding: '6px 14px' }}>
            {receipt.status.toUpperCase()}
          </span>
          <button className="secondary-button" onClick={() => setSubPage('list')}>← Back</button>
        </div>
      </div>

      <div className="table-card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '20px 24px' }}>
          <p><strong>Location:</strong> {receipt.location_name || `Location #${receipt.location_id}`}</p>
          <p><strong>Created:</strong> {new Date(receipt.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="table-card">
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Receipt Lines</h2>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr><th>PRODUCT</th><th>QUANTITY</th></tr>
            </thead>
            <tbody>
              {receipt.items && receipt.items.map((line, idx) => (
                <tr key={idx}>
                  <td>{getProductName(line.product_id)}</td>
                  <td className="quantity">{line.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {receipt.status === 'draft' && (
        <div style={{ marginTop: 20 }}>
          <button className="primary-button" onClick={handleValidate}>
            ✓ Validate Receipt
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Root: Receipts Page ──────────────────────────────────────────────────────
export default function Receipts() {
  const [subPage, setSubPage] = useState('list');

  if (subPage === 'create') return <CreateReceipt setSubPage={setSubPage} />;
  if (subPage.startsWith('view-')) {
    const id = parseInt(subPage.replace('view-', ''));
    return <ReceiptDetails receiptId={id} setSubPage={setSubPage} />;
  }
  return <ReceiptList setSubPage={setSubPage} />;
}
