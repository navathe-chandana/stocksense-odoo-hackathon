import { useState, useEffect } from 'react';
import {
  getDeliveries, getProducts, getLocations, mockCreateDelivery,
  getDeliveryById, mockValidateDelivery, mockUpdateDeliveryStatus
} from '../mock/operationsData';

// ─── Delivery List ──────────────────────────────────────────────────────────
function DeliveryList({ setSubPage }) {
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    getDeliveries().then(setDeliveries).catch(console.error);
  }, []);

  return (
    <div className="ops-module">
      <div className="page-heading">
        <div>
          <p className="eyebrow">OUTGOING STOCK</p>
          <h1>Delivery Orders</h1>
          <p className="page-subtitle">Manage outgoing delivery orders to customers.</p>
        </div>
        <button className="primary-button" onClick={() => setSubPage('create')}>
          ＋ Create Delivery
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
              {deliveries.map(d => (
                <tr key={d.id}>
                  <td className="reference">DEL/{String(d.id).padStart(3, '0')}</td>
                  <td>{d.location_name || `Location #${d.location_id}`}</td>
                  <td>
                    <span className={`status-badge ${d.status === 'validated' ? 'done' : 'waiting'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="ops-view-btn" onClick={() => setSubPage(`view-${d.id}`)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr><td colSpan="5" className="empty-state">No deliveries found. Create your first delivery.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Create Delivery ─────────────────────────────────────────────────────────
function CreateDelivery({ setSubPage }) {
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
      await mockCreateDelivery({
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
          <p className="eyebrow">DELIVERIES</p>
          <h1>Create Delivery</h1>
        </div>
        <button className="secondary-button" onClick={() => setSubPage('list')}>← Back to Deliveries</button>
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

// ─── Delivery Details ─────────────────────────────────────────────────────────
function DeliveryDetails({ deliveryId, setSubPage }) {
  const [delivery, setDelivery] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [uiStatus, setUiStatus] = useState('draft');

  const loadData = async () => {
    try {
      const d = await getDeliveryById(deliveryId);
      if (!d) throw new Error('Delivery not found');
      setDelivery({ ...d });
      setUiStatus(d.status === 'validated' ? 'validated' : 'draft');
      const p = await getProducts();
      setProducts(p);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { loadData(); }, [deliveryId]);

  const handleAction = async (action) => {
    try {
      if (action === 'pick') {
        setUiStatus('picked');
        return;
      }
      if (action === 'pack') {
        setUiStatus('packed');
        return;
      }
      if (action === 'validate') {
        await mockValidateDelivery(deliveryId);
      }
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getProductName = (pid) => {
    const p = products.find(x => x.id === pid);
    return p ? `${p.name} (${p.sku})` : `Product #${pid}`;
  };

  const effectiveStatus = delivery && delivery.status === 'validated' ? 'validated' : uiStatus;
  const statusClass = effectiveStatus === 'validated' ? 'done' : effectiveStatus === 'picked' || effectiveStatus === 'packed' ? 'waiting' : 'draft-badge';

  if (error) return <div className="ops-error">{error}</div>;
  if (!delivery) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div className="ops-module">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DELIVERIES</p>
          <h1>Delivery DEL/{String(delivery.id).padStart(3, '0')}</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className={`status-badge ${statusClass}`} style={{ fontSize: 14, padding: '6px 14px' }}>
            {effectiveStatus.toUpperCase()}
          </span>
          <button className="secondary-button" onClick={() => setSubPage('list')}>← Back</button>
        </div>
      </div>

      <div className="ops-status-flow">
        {['draft', 'picked', 'packed', 'validated'].map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`ops-step ${effectiveStatus === step ? 'active' : ['draft','picked','packed','validated'].indexOf(effectiveStatus) > i ? 'done' : ''}`}>
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </span>
            {i < 3 && <span style={{ color: '#ccc' }}>→</span>}
          </div>
        ))}
      </div>

      <div className="table-card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '20px 24px' }}>
          <p><strong>Location:</strong> {delivery.location_name || `Location #${delivery.location_id}`}</p>
          <p><strong>Created:</strong> {new Date(delivery.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="table-card">
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Delivery Lines</h2>
        </div>
        <div className="table-responsive">
          <table>
            <thead><tr><th>PRODUCT</th><th>QUANTITY</th></tr></thead>
            <tbody>
              {delivery.items && delivery.items.map((line, idx) => (
                <tr key={idx}>
                  <td>{getProductName(line.product_id)}</td>
                  <td className="quantity">{line.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
        {effectiveStatus === 'draft' && (
          <button className="primary-button" onClick={() => handleAction('pick')}>📦 Pick Items</button>
        )}
        {effectiveStatus === 'picked' && (
          <button className="primary-button" onClick={() => handleAction('pack')}>🗃 Pack Items</button>
        )}
        {(effectiveStatus === 'packed' || effectiveStatus === 'draft') && effectiveStatus !== 'validated' && (
          <button className="primary-button" style={{ background: '#16a34a' }} onClick={() => handleAction('validate')}>
            ✓ Validate &amp; Ship
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Root: Deliveries Page ────────────────────────────────────────────────────
export default function Deliveries() {
  const [subPage, setSubPage] = useState('list');

  if (subPage === 'create') return <CreateDelivery setSubPage={setSubPage} />;
  if (subPage.startsWith('view-')) {
    const id = parseInt(subPage.replace('view-', ''));
    return <DeliveryDetails deliveryId={id} setSubPage={setSubPage} />;
  }
  return <DeliveryList setSubPage={setSubPage} />;
}
