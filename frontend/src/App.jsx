import { useState } from 'react'
import './App.css'
import Receipts from './pages/Receipts'
import Deliveries from './pages/Deliveries'
import Transfers from './pages/Transfers'
import StockAdjustment from './components/stock/StockAdjustment'

const initialProducts = [
  { id: 1, name: 'Steel Rods', sku: 'ST-001', category: 'Raw Materials', unit: 'Kg', stock: 150, minStock: 50, location: 'Main Warehouse' },
  { id: 2, name: 'Office Chairs', sku: 'CH-002', category: 'Furniture', unit: 'Units', stock: 8, minStock: 10, location: 'Warehouse 1' },
  { id: 3, name: 'Safety Helmets', sku: 'SH-003', category: 'Safety', unit: 'Units', stock: 0, minStock: 15, location: 'Warehouse 2' },
  { id: 4, name: 'Copper Wire', sku: 'CW-004', category: 'Raw Materials', unit: 'Meters', stock: 320, minStock: 100, location: 'Main Warehouse' },
]

const initialMovements = [
  { id: 'REC/001', product: 'Steel Rods', type: 'Receipt', quantity: '+50 Kg', status: 'Done' },
  { id: 'DEL/002', product: 'Office Chairs', type: 'Delivery', quantity: '-10 Units', status: 'Done' },
  { id: 'INT/003', product: 'Copper Wire', type: 'Internal Transfer', quantity: '80 Meters', status: 'Waiting' },
  { id: 'ADJ/004', product: 'Safety Helmets', type: 'Adjustment', quantity: '-2 Units', status: 'Done' },
]

function App() {
  const [page, setPage] = useState('Dashboard')
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '', sku: '', category: '', unit: 'Units',
    stock: '', minStock: '', location: 'Main Warehouse'
  })

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0)
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const outOfStock = products.filter(p => p.stock === 0).length

  const filteredProducts = products.filter(p =>
    `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(search.toLowerCase())
  )

  function openAddForm() {
    setEditingId(null)
    setForm({
      name: '', sku: '', category: '', unit: 'Units',
      stock: '', minStock: '', location: 'Main Warehouse'
    })
    setShowForm(true)
  }

  function openEditForm(product) {
    setEditingId(product.id)
    setForm({ ...product, stock: String(product.stock), minStock: String(product.minStock) })
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()

    const product = {
      ...form,
      id: editingId ?? Date.now(),
      stock: Number(form.stock),
      minStock: Number(form.minStock),
    }

    if (editingId !== null) {
      setProducts(prev => prev.map(p => p.id === editingId ? product : p))
    } else {
      setProducts(prev => [...prev, product])
    }

    setShowForm(false)
  }

  function deleteProduct(id) {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id))
    }
  }

  const navGroups = [
    {
      title: 'MAIN MENU',
      items: [
        { name: 'Dashboard', icon: '▦' },
        { name: 'Products', icon: '▣' },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Receipts', icon: '↓' },
        { name: 'Delivery Orders', icon: '↑' },
        { name: 'Internal Transfers', icon: '⇄' },
        { name: 'Stock Adjustments', icon: '±' },
        { name: 'Move History', icon: '↻' },
      ],
    },
    {
      title: 'CONFIGURATION',
      items: [{ name: 'Settings', icon: '⚙' }],
    },
  ]

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>StockSense</h2>
            <span>Inventory Management</span>
          </div>
        </div>

        <div className="workspace">
          <div className="workspace-avatar">W</div>
          <div className="workspace-info">
            <strong>My Warehouse</strong>
            <span>Inventory Workspace</span>
          </div>
          <span className="workspace-arrow">⌄</span>
        </div>

        {navGroups.map(group => (
          <div className="nav-group" key={group.title}>
            <p className="nav-heading">{group.title}</p>
            {group.items.map(item => (
              <button
                key={item.name}
                className={`nav-item ${page === item.name ? 'active' : ''}`}
                onClick={() => {
                  setPage(item.name)
                  setSearch('')
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.name}
                {item.name === 'Products' && (
                  <span className="nav-count">{products.length}</span>
                )}
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">?</div>
            <strong>Need help?</strong>
            <p>Check our inventory management guide.</p>
            <button onClick={() => alert('Help guide coming soon!')}>View Guide →</button>
          </div>

          <div className="profile">
            <div className="profile-avatar">DV</div>
            <div className="profile-info">
              <strong>Divya Varakala</strong>
              <span>Inventory Manager</span>
            </div>
            <button className="profile-menu" aria-label="Profile menu"
              onClick={() => alert('Profile and logout will be connected to authentication.')}>
              ⋯
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{page}</strong>
          </div>
          <div className="topbar-actions">
            <span className="live-indicator"><span /> Demo Data</span>
            <button className="icon-button" aria-label="Notifications"
              onClick={() => alert('Notifications will be connected later.')}>🔔</button>
            <div className="topbar-avatar">DV</div>
          </div>
        </header>

        <div className="page-content">
          {/* ── Dashboard ──────────────────────────────────────────────── */}
          {page === 'Dashboard' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">OVERVIEW</p>
                  <h1>Inventory Dashboard</h1>
                  <p className="page-subtitle">Here's what's happening with your inventory today.</p>
                </div>
                <button className="primary-button" onClick={() => {
                  setPage('Products')
                  openAddForm()
                }}>
                  <span>＋</span> Add Product
                </button>
              </div>

              <div className="welcome-banner">
                <div>
                  <span className="banner-label">INVENTORY OVERVIEW</span>
                  <h2>Good morning, Divya! 👋</h2>
                  <p>Stay on top of your stock and keep operations running smoothly.</p>
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
                  <div className="stat-footer purple-text">↑ {products.length} product types</div>
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
                  <h3>3</h3>
                  <p className="stat-caption">Incoming stock orders</p>
                  <div className="stat-footer blue-text">Awaiting validation</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Pending Deliveries</span>
                    <span className="stat-icon green">↑</span>
                  </div>
                  <h3>5</h3>
                  <p className="stat-caption">Outgoing stock orders</p>
                  <div className="stat-footer green-text">Ready for dispatch</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Internal Transfers</span>
                    <span className="stat-icon teal">⇄</span>
                  </div>
                  <h3>2</h3>
                  <p className="stat-caption">Transfers scheduled</p>
                  <div className="stat-footer teal-text">Across warehouses</div>
                </div>
              </div>

              <div className="section-heading movement-heading">
                <div>
                  <h2>Recent Stock Movements</h2>
                  <p>Latest inventory operations across your warehouse</p>
                </div>
                <button className="text-button" onClick={() => setPage('Move History')}>
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
                      {initialMovements.map(m => (
                        <tr key={m.id}>
                          <td className="reference">{m.id}</td>
                          <td>{m.product}</td>
                          <td>{m.type}</td>
                          <td className="quantity">{m.quantity}</td>
                          <td><span className={`status-badge ${m.status.toLowerCase()}`}>{m.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>

          /* ── Products ──────────────────────────────────────────────── */
          ) : page === 'Products' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">INVENTORY MANAGEMENT</p>
                  <h1>Products</h1>
                  <p className="page-subtitle">Manage your products, stock levels, and categories.</p>
                </div>
                <button className="primary-button" onClick={openAddForm}>
                  ＋ Add Product
                </button>
              </div>

              <div className="product-summary">
                <div><span>Total Products</span><strong>{products.length}</strong></div>
                <div><span>Low Stock</span><strong className="orange-text">{lowStock}</strong></div>
                <div><span>Out of Stock</span><strong className="red-text">{outOfStock}</strong></div>
              </div>

              <div className="table-card products-card">
                <div className="table-toolbar">
                  <div>
                    <h2>All Products</h2>
                    <p>View and manage your inventory catalog.</p>
                  </div>
                  <input
                    className="search-input"
                    placeholder="⌕  Search products or SKU..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th>SKU</th>
                        <th>CATEGORY</th>
                        <th>ON HAND</th>
                        <th>LOCATION</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => {
                        const status = p.stock === 0 ? 'Out of Stock' :
                          p.stock <= p.minStock ? 'Low Stock' : 'In Stock'
                        return (
                          <tr key={p.id}>
                            <td className="product-name">{p.name}<small>{p.unit}</small></td>
                            <td className="reference">{p.sku}</td>
                            <td>{p.category}</td>
                            <td className="quantity">{p.stock} {p.unit}</td>
                            <td>{p.location}</td>
                            <td><span className={`status-badge ${status === 'In Stock' ? 'done' : status === 'Low Stock' ? 'waiting' : 'cancelled'}`}>{status}</span></td>
                            <td>
                              <div className="action-buttons">
                                <button onClick={() => openEditForm(p)} title="Edit product">✎</button>
                                <button onClick={() => deleteProduct(p.id)} title="Delete product">×</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {filteredProducts.length === 0 && (
                        <tr><td colSpan="7" className="empty-state">No products found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {showForm && (
                <div className="modal-overlay">
                  <form className="product-modal" onSubmit={handleSubmit}>
                    <div className="modal-header">
                      <div>
                        <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                        <p>Enter the product details below.</p>
                      </div>
                      <button type="button" className="modal-close" onClick={() => setShowForm(false)}>×</button>
                    </div>

                    <label>Product Name<input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Steel Rods" /></label>
                    <label>SKU / Product Code<input required value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="e.g. ST-001" /></label>
                    <label>Category<input required value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Raw Materials" /></label>
                    <div className="form-row">
                      <label>Unit of Measure<select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                        <option>Units</option><option>Kg</option><option>Liters</option><option>Meters</option><option>Boxes</option>
                      </select></label>
                      <label>Initial Stock<input required type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} /></label>
                    </div>
                    <div className="form-row">
                      <label>Minimum Stock<input required type="number" min="0" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} /></label>
                      <label>Location<input required value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></label>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button>
                      <button type="submit" className="primary-button">{editingId ? 'Save Changes' : 'Create Product'}</button>
                    </div>
                  </form>
                </div>
              )}
            </>

          /* ── Friend 2: Receipts ─────────────────────────────────────── */
          ) : page === 'Receipts' ? (
            <Receipts />

          /* ── Friend 2: Delivery Orders ─────────────────────────────── */
          ) : page === 'Delivery Orders' ? (
            <Deliveries />

          /* ── Friend 2: Internal Transfers ──────────────────────────── */
          ) : page === 'Internal Transfers' ? (
            <Transfers />

          /* ── Friend 3: Stock Adjustments ───────────────────────────── */
          ) : page === 'Stock Adjustments' ? (
            <StockAdjustment />

          /* ── Placeholder for all other pages ───────────────────────── */
          ) : (
            <div className="placeholder-page">
              <div className="placeholder-icon">▦</div>
              <p className="eyebrow">STOCKSENSE WORKSPACE</p>
              <h1>{page}</h1>
              <p>This module will be implemented by the assigned team member.</p>
              <button className="secondary-button" onClick={() => setPage('Dashboard')}>← Back to Dashboard</button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
