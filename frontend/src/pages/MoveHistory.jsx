import { useEffect, useState } from 'react';
import { apiRequest } from '../api';

const movementLabels = {
  receipt: 'Receipt',
  delivery: 'Delivery',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  adjustment: 'Adjustment',
};

function formatMovementType(value) {
  return movementLabels[value] || value || '—';
}

function formatReference(movement) {
  if (movement.reference_id == null) return '—';

  const type = movement.reference_type
    ? movement.reference_type.charAt(0).toUpperCase() + movement.reference_type.slice(1)
    : 'Document';

  return `${type} #${movement.reference_id}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

function movementLocalDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function MoveHistory() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  async function loadMovements() {
    try {
      const data = await apiRequest('/movements');
      setMovements(data);
    } catch (err) {
      console.error('Failed to load movement history:', err);
      setError(err.message || 'Unable to load movement history.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    apiRequest('/movements')
      .then((data) => {
        if (!cancelled) setMovements(data);
      })
      .catch((err) => {
        console.error('Failed to load movement history:', err);
        if (!cancelled) setError(err.message || 'Unable to load movement history.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function showMovementDetails(id) {
    try {
      setSelectedMovement(null);
      setDetailError('');
      setDetailLoading(true);
      const data = await apiRequest(`/movements/${id}`);
      setSelectedMovement(data);
    } catch (err) {
      setDetailError(err.message || 'Unable to load movement details.');
    } finally {
      setDetailLoading(false);
    }
  }

  const productOptions = [...new Map(
    movements.map((movement) => [movement.product_id, movement])
  ).values()];
  const locationOptions = [...new Map(
    movements.map((movement) => [movement.location_id, movement])
  ).values()];

  const filteredMovements = movements.filter((movement) =>
    (typeFilter === 'All' || movement.movement_type === typeFilter) &&
    (productFilter === 'All' || String(movement.product_id) === productFilter) &&
    (locationFilter === 'All' || String(movement.location_id) === locationFilter) &&
    (!dateFilter || movementLocalDate(movement.created_at) === dateFilter)
  );

  return (
    <div className="ops-module">
      <div className="page-heading">
        <div>
          <p className="eyebrow">INVENTORY OPERATIONS</p>
          <h1>Move History</h1>
          <p className="page-subtitle">History of stock movements across locations.</p>
        </div>
      </div>

      {error && (
        <div className="ops-error" role="alert">
          <p>{error}</p>
          <button
            className="secondary-button"
            onClick={() => {
              setLoading(true);
              setError('');
              loadMovements();
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="table-card">
        <div className="table-toolbar" style={{ flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16 }}>Stock Movement History</h2>
            <p style={{ margin: '5px 0 0', color: '#8993a6', fontSize: 11 }}>
              {filteredMovements.length} of {movements.length} movements
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="ops-input"
              aria-label="Filter by movement type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="All">All types</option>
              {[...new Set(movements.map((movement) => movement.movement_type))].map((type) => (
                <option key={type} value={type}>{formatMovementType(type)}</option>
              ))}
            </select>

            <select
              className="ops-input"
              aria-label="Filter by product"
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
            >
              <option value="All">All products</option>
              {productOptions.map((movement) => (
                <option key={movement.product_id} value={movement.product_id}>
                  {movement.product_name}
                </option>
              ))}
            </select>

            <select
              className="ops-input"
              aria-label="Filter by location"
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
            >
              <option value="All">All locations</option>
              {locationOptions.map((movement) => (
                <option key={movement.location_id} value={movement.location_id}>
                  {movement.location_name}
                </option>
              ))}
            </select>

            <input
              className="ops-input"
              type="date"
              aria-label="Filter by date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>TYPE</th>
                <th>PRODUCT</th>
                <th>LOCATION</th>
                <th>QUANTITY</th>
                <th>REFERENCE / DOCUMENT</th>
                <th>DATE &amp; TIME</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="empty-state">Loading movement history...</td></tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    {error
                      ? 'Movement data could not be loaded.'
                      : movements.length === 0
                      ? 'No stock movements recorded yet.'
                      : 'No movements match these filters.'}
                  </td>
                </tr>
              ) : filteredMovements.map((movement) => {
                const quantity = Number(movement.quantity) || 0;

                return (
                  <tr key={movement.id}>
                    <td>{formatMovementType(movement.movement_type)}</td>
                    <td>
                      <strong>{movement.product_name || '—'}</strong>
                      <small style={{ display: 'block', color: '#9ba4b4', marginTop: 3 }}>
                        {movement.sku || '—'}
                      </small>
                    </td>
                    <td>{movement.location_name || '—'}</td>
                    <td className="quantity" style={{ color: quantity < 0 ? '#d65e65' : '#22966c' }}>
                      {quantity > 0 ? '+' : ''}{quantity}
                    </td>
                    <td>{formatReference(movement)}</td>
                    <td>{formatDate(movement.created_at)}</td>
                    <td>
                      <button className="ops-view-btn" onClick={() => showMovementDetails(movement.id)}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(detailLoading || detailError || selectedMovement) && (
        <div className="modal-overlay" onClick={() => {
          if (!detailLoading) {
            setSelectedMovement(null);
            setDetailError('');
          }
        }}>
          <div
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="movement-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">MOVEMENT DETAILS</p>
                <h2 id="movement-detail-title">Stock Movement</h2>
              </div>
              <button
                className="modal-close"
                aria-label="Close movement details"
                onClick={() => {
                  setSelectedMovement(null);
                  setDetailError('');
                }}
              >
                ×
              </button>
            </div>

            {detailLoading ? (
              <p>Loading movement details...</p>
            ) : detailError ? (
              <div className="ops-error" role="alert">{detailError}</div>
            ) : selectedMovement && (
              <dl className="movement-details">
                <div><dt>Type</dt><dd>{formatMovementType(selectedMovement.movement_type)}</dd></div>
                <div><dt>Product</dt><dd>{selectedMovement.product_name || '—'}</dd></div>
                <div><dt>SKU</dt><dd>{selectedMovement.sku || '—'}</dd></div>
                <div><dt>Location</dt><dd>{selectedMovement.location_name || '—'}</dd></div>
                <div><dt>Quantity</dt><dd>{Number(selectedMovement.quantity) > 0 ? '+' : ''}{Number(selectedMovement.quantity) || 0}</dd></div>
                <div><dt>Reference / document</dt><dd>{formatReference(selectedMovement)}</dd></div>
                <div><dt>Date &amp; time</dt><dd>{formatDate(selectedMovement.created_at)}</dd></div>
              </dl>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
