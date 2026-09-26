function Dashboard({
  totalStock,
  products,
  lowStock,
  outOfStock,
  initialMovements,
  dashboardData,
  onAddProduct,
  onViewMovements,
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Inventory Dashboard</h1>
          <p className="page-subtitle">
            Here's what's happening with your inventory today.
          </p>
        </div>

        <button className="primary-button" onClick={onAddProduct}>
          <span>＋</span> Add Product
        </button>
      </div>

      <div className="welcome-banner">
        <div>
          <span className="banner-label">INVENTORY OVERVIEW</span>
          <h2>Good morning, Divya! 👋</h2>
          <p>
            Stay on top of your stock and keep operations running smoothly.
          </p>
        </div>
        <div className="banner-decoration">▦</div>
      </div>

      <div className="section-heading">
        <div>
          <h2>Stock Summary</h2>
          <p>Real-time snapshot of your inventory</p>
        </div>
        <span className="date-label">📅 Today</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Products in Stock</span>
            <span className="stat-icon purple">▣</span>
          </div>
          <h3>{totalStock.toLocaleString()}</h3>
          <p className="stat-caption">Units across all products</p>
          <div className="stat-footer purple-text">
            ↑ {products.length} product types
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Low Stock Items</span>
            <span className="stat-icon orange">⚠</span>
          </div>
          <h3>{lowStock}</h3>
          <p className="stat-caption">Items below minimum stock</p>
          <div className="stat-footer orange-text">Needs attention</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Out of Stock</span>
            <span className="stat-icon red">✖</span>
          </div>
          <h3>{outOfStock}</h3>
          <p className="stat-caption">Products with zero stock</p>
          <div className="stat-footer red-text">Restocking required</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Pending Receipts</span>
            <span className="stat-icon blue">↓</span>
          </div>
          <h3>{dashboardData?.pending_receipts ?? 0}</h3>
          <p className="stat-caption">Incoming stock orders</p>
          <div className="stat-footer blue-text">
            Awaiting validation
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Pending Deliveries</span>
            <span className="stat-icon green">↑</span>
          </div>
          <h3>{dashboardData?.pending_deliveries ?? 0}</h3>
          <p className="stat-caption">Outgoing stock orders</p>
          <div className="stat-footer green-text">
            Ready for dispatch
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Internal Transfers</span>
            <span className="stat-icon teal">⇄</span>
          </div>
          <h3><h3>{dashboardData?.pending_transfers ?? 0}</h3></h3>
          <p className="stat-caption">Transfers scheduled</p>
          <div className="stat-footer teal-text">
            Across warehouses
          </div>
        </div>
      </div>

      <div className="section-heading movement-heading">
        <div>
          <h2>Recent Stock Movements</h2>
          <p>Latest inventory operations across your warehouse</p>
        </div>

        <button className="text-button" onClick={onViewMovements}>
          View all movements →
        </button>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>REFERENCE</th>
                <th>PRODUCT</th>
                <th>OPERATION</th>
                <th>QUANTITY</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {initialMovements.map((m) => (
                <tr key={m.id}>
                  <td className="reference">{m.id}</td>
                  <td>{m.product}</td>
                  <td>{m.type}</td>
                  <td className="quantity">{m.quantity}</td>
                  <td>
                    <span
                      className={`status-badge ${m.status.toLowerCase()}`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Dashboard;