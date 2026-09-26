
import { useState } from 'react'
import './App.css'
import Receipts from './pages/Receipts'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
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
        {page === 'Dashboard' ? (
  <Dashboard
    totalStock={totalStock}
    products={products}
    lowStock={lowStock}
    outOfStock={outOfStock}
    initialMovements={initialMovements}
    onAddProduct={() => {
      setPage('Products')
      openAddForm()
    }}
    onViewMovements={() => setPage('Move History')}
  />
) : page === 'Products' ? (
  <Products
    products={products}
    lowStock={lowStock}
    outOfStock={outOfStock}
    filteredProducts={filteredProducts}
    search={search}
    setSearch={setSearch}
    openAddForm={openAddForm}
    openEditForm={openEditForm}
    deleteProduct={deleteProduct}
    showForm={showForm}
    setShowForm={setShowForm}
    editingId={editingId}
    form={form}
    setForm={setForm}
    handleSubmit={handleSubmit}
  />

          ) : page === 'Receipts' ? (
            <Receipts />
          ) : page === 'Delivery Orders' ? (
            <Deliveries />
          ) : page === 'Internal Transfers' ? (
            <Transfers />
          ) : page === 'Stock Adjustments' ? (
            <StockAdjustment />
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