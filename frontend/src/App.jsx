import { useState, useEffect } from 'react'
import { apiRequest } from './api'
import './App.css'

import Receipts from './pages/Receipts'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Deliveries from './pages/Deliveries'
import Transfers from './pages/Transfers'
import StockAdjustment from './components/stock/StockAdjustment'

function App() {
  const [page, setPage] = useState('Dashboard')

  // Backend data
  const [products, setProducts] = useState([])
  const [stockRecords, setStockRecords] = useState([])
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [dashboardData, setDashboardData] = useState({})
  const [movements, setMovements] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Product page state
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'Units',
    stock: '',
    minStock: '',
    location: '',
  })

  // Fetch data from backend
  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [
        productsData,
        stockData,
        categoriesData,
        locationsData,
        dashboard,
        movementsData,
      ] = await Promise.all([
        apiRequest('/products'),
        apiRequest('/stock'),
        apiRequest('/categories'),
        apiRequest('/locations'),
        apiRequest('/dashboard'),
        apiRequest('/movements'),
      ])

      setProducts(productsData)
      setStockRecords(stockData)
      setCategories(categoriesData)
      setLocations(locationsData)
      setDashboardData(dashboard)

      // Real stock movements from the backend
      setMovements(Array.isArray(movementsData) ? movementsData : [])
    } catch (err) {
      console.error('Failed to load backend data:', err)
      setError(err.message || 'Unable to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  // Load data when the application opens
  useEffect(() => {
    loadData()
  }, [])

  // Combine product data with its stock records
  const displayProducts = products.map((product) => {
    const records = stockRecords.filter(
      (item) => Number(item.product_id) === Number(product.id)
    )

    const quantity = records.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    )

    return {
      ...product,
      stock: quantity,
      minStock: Number(product.reorder_level || 0),
      location: records.map((item) => item.location_name).join(', ') || '-',
      stockRecords: records,
    }
  })

  // Dashboard calculations
  const totalStock = stockRecords.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  )

  const lowStock = Number(dashboardData.low_stock || 0)
  const outOfStock = Number(dashboardData.out_of_stock || 0)

  const filteredProducts = displayProducts.filter((product) =>
    `${product.name} ${product.sku} ${product.category || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  // Open Add Product form
  function openAddForm() {
    setEditingId(null)

    setForm({
      name: '',
      sku: '',
      category: '',
      unit: 'Units',
      stock: '',
      minStock: '',
      location: locations.length ? String(locations[0].id) : '',
    })

    setShowForm(true)
  }

  // Edit is not supported by the current backend API
  function openEditForm() {
    alert('Product editing API is not available yet.')
  }

  // Create product and optionally create its stock record
  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setError('')

      const product = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          category_id: form.category
            ? Number(form.category)
            : null,
          unit: form.unit,
          reorder_level: Number(form.minStock || 0),
        }),
      })

      // Create stock record if quantity and location are provided
      if (form.stock !== '' && form.location) {
        await apiRequest('/stock', {
          method: 'POST',
          body: JSON.stringify({
            product_id: product.id,
            location_id: Number(form.location),
            quantity: Number(form.stock),
          }),
        })
      }

      setShowForm(false)
      setEditingId(null)

      await loadData()

      alert('Product added successfully!')
    } catch (err) {
      console.error('Error adding product:', err)
      alert(err.message || 'Failed to add product')
    }
  }

  // Delete is not supported by the current backend API
  function deleteProduct() {
    alert('Product deletion API is not available yet.')
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

        {navGroups.map((group) => (
          <div className="nav-group" key={group.title}>
            <p className="nav-heading">{group.title}</p>

            {group.items.map((item) => (
              <button
                key={item.name}
                className={`nav-item ${
                  page === item.name ? 'active' : ''
                }`}
                onClick={() => {
                  setPage(item.name)
                  setSearch('')
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.name}

                {item.name === 'Products' && (
                  <span className="nav-count">
                    {products.length}
                  </span>
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
            <button onClick={() => alert('Help guide coming soon!')}>
              View Guide →
            </button>
          </div>

          <div className="profile">
            <div className="profile-avatar">DV</div>
            <div className="profile-info">
              <strong>Divya Varakala</strong>
              <span>Inventory Manager</span>
            </div>

            <button
              className="profile-menu"
              aria-label="Profile menu"
              onClick={() =>
                alert('Profile and logout will be connected to authentication.')
              }
            >
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
            <span className="live-indicator">
              <span /> Live Data
            </span>

            <button
              className="icon-button"
              aria-label="Notifications"
              onClick={() =>
                alert('Notifications will be connected later.')
              }
            >
              🔔
            </button>

            <div className="topbar-avatar">DV</div>
          </div>
        </header>

        <div className="page-content">
          {loading ? (
            <div className="placeholder-page">
              <h2>Loading StockSense data...</h2>
            </div>
          ) : error ? (
            <div className="placeholder-page">
              <h2>Unable to load backend data</h2>
              <p>{error}</p>

              <button
                className="secondary-button"
                onClick={loadData}
              >
                Retry
              </button>
            </div>
          ) : page === 'Dashboard' ? (
            <Dashboard
              totalStock={totalStock}
              products={displayProducts}
              lowStock={lowStock}
              outOfStock={outOfStock}
              initialMovements={movements}
              dashboardData={dashboardData}
              onAddProduct={() => {
                setPage('Products')
                openAddForm()
              }}
              onViewMovements={() => setPage('Move History')}
            />
          ) : page === 'Products' ? (
            <Products
              products={displayProducts}
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
              categories={categories}
              locations={locations}
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
              <p>
                This module will be implemented by the assigned team member.
              </p>

              <button
                className="secondary-button"
                onClick={() => setPage('Dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App