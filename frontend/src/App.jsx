
import { useState, useEffect } from 'react'
import {
  apiRequest,
  getStoredUser,
  setStoredAuth,
  clearStoredAuth,
} from './api'
import './App.css'

import Receipts from './pages/Receipts'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Deliveries from './pages/Deliveries'
import Transfers from './pages/Transfers'
import StockAdjustment from './components/stock/StockAdjustment'

const initialMovements = [
  { id: 'REC/001', product: 'Steel Rods', type: 'Receipt', quantity: '+50 Kg', status: 'Done' },
  { id: 'DEL/002', product: 'Office Chairs', type: 'Delivery', quantity: '-10 Units', status: 'Done' },
  { id: 'INT/003', product: 'Copper Wire', type: 'Internal Transfer', quantity: '80 Meters', status: 'Waiting' },
  { id: 'ADJ/004', product: 'Safety Helmets', type: 'Adjustment', quantity: '-2 Units', status: 'Done' },
]

function getInitials(name = '', email = '') {
  const source = name || email || 'U'
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || 'U'
}

function App() {
  const [page, setPage] = useState('Dashboard')
  const [currentUser, setCurrentUser] = useState(getStoredUser())
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getStoredUser()))
  const [authLoading, setAuthLoading] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Backend data
  const [products, setProducts] = useState([])
  const [stockRecords, setStockRecords] = useState([])
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [dashboardData, setDashboardData] = useState({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginState, setLoginState] = useState({ loading: false, error: '' })

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
    location: ''
  })

  async function loadData() {
    if (!isAuthenticated) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const [
        productsData,
        stockData,
        categoriesData,
        locationsData,
        dashboard
      ] = await Promise.all([
        apiRequest('/products'),
        apiRequest('/stock'),
        apiRequest('/categories'),
        apiRequest('/locations'),
        apiRequest('/dashboard')
      ])

      setProducts(productsData)
      setStockRecords(stockData)
      setCategories(categoriesData)
      setLocations(locationsData)
      setDashboardData(dashboard)

    } catch (err) {
      console.error('Failed to load backend data:', err)
      setError(err.message || 'Unable to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  async function verifySession() {
    try {
      const profile = await apiRequest('/auth/me')
      const user = profile.user || getStoredUser()

      setCurrentUser(user)
      setStoredAuth(localStorage.getItem('stocksense_token') || '', user)
      setIsAuthenticated(true)
    } catch (err) {
      console.error('Session verification failed:', err)
      clearStoredAuth()
      setCurrentUser(null)
      setIsAuthenticated(false)
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('stocksense_token')

    if (!token) {
      setCurrentUser(null)
      setIsAuthenticated(false)
      setAuthLoading(false)
      return
    }

    verifySession()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  async function handleLogin(event) {
    event.preventDefault()

    try {
      setLoginState({ loading: true, error: '' })

      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
        })
      })

      const user = response.user || null
      const token = response.token || ''

      if (!token) {
        throw new Error('Authentication token missing from server response')
      }

      setStoredAuth(token, user)
      setCurrentUser(user)
      setIsAuthenticated(true)
      setPage('Dashboard')
      setLoginForm({ email: '', password: '' })
      setShowProfileMenu(false)
    } catch (err) {
      setLoginState({
        loading: false,
        error: err.message || 'Unable to sign in. Please try again.'
      })
    } finally {
      setLoginState(prev => ({ ...prev, loading: false }))
    }
  }

  function handleLogout() {
    clearStoredAuth()
    setCurrentUser(null)
    setIsAuthenticated(false)
    setPage('Dashboard')
    setShowProfileMenu(false)
    setLoginForm({ email: '', password: '' })
    setLoginState({ loading: false, error: '' })
    setError('')
  }

  const displayProducts = products.map(product => {
    const records = stockRecords.filter(
      item => Number(item.product_id) === Number(product.id)
    )

    const quantity = records.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    )

    return {
      ...product,
      stock: quantity,
      minStock: Number(product.reorder_level || 0),
      location: records.map(item => item.location_name).join(', ') || '-',
      stockRecords: records
    }
  })

  const totalStock = stockRecords.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  )

  const lowStock = Number(dashboardData.low_stock || 0)
  const outOfStock = Number(dashboardData.out_of_stock || 0)

  const filteredProducts = displayProducts.filter(product =>
    `${product.name} ${product.sku} ${product.category || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  function openAddForm() {
    setEditingId(null)

    setForm({
      name: '',
      sku: '',
      category: '',
      unit: 'Units',
      stock: '',
      minStock: '',
      location: locations.length ? String(locations[0].id) : ''
    })

    setShowForm(true)
  }

  function openEditForm() {
    alert('Product editing API is not available yet.')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setError('')

      const product = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          category_id: form.category ? Number(form.category) : null,
          unit: form.unit,
          reorder_level: Number(form.minStock || 0)
        })
      })

      if (form.stock !== '' && form.location) {
        await apiRequest('/stock', {
          method: 'POST',
          body: JSON.stringify({
            product_id: product.id,
            location_id: Number(form.location),
            quantity: Number(form.stock)
          })
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

  if (authLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h2>Loading session...</h2>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="brand-icon">S</div>
            <div>
              <p className="auth-kicker">STOCKSENSE</p>
              <h1>Sign in</h1>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={loginForm.email}
                onChange={event =>
                  setLoginForm(current => ({ ...current, email: event.target.value }))
                }
                placeholder="user@company.com"
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={event =>
                  setLoginForm(current => ({ ...current, password: event.target.value }))
                }
                placeholder="Enter your password"
                required
              />
            </label>

            {loginState.error && (
              <p className="auth-error">{loginState.error}</p>
            )}

            <button className="primary-button auth-submit" type="submit" disabled={loginState.loading}>
              {loginState.loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    )
  }

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
            <button onClick={() => alert('Help guide coming soon!')}>
              View Guide →
            </button>
          </div>

          <div className="profile">
            <div className="profile-avatar">{getInitials(currentUser?.name, currentUser?.email)}</div>
            <div className="profile-info">
              <strong>{currentUser?.name || 'User'}</strong>
              <span>{currentUser?.role || currentUser?.email || 'Workspace User'}</span>
            </div>

            <div className="profile-menu-wrapper">
              <button
                className="profile-menu"
                aria-label="Profile menu"
                onClick={() => setShowProfileMenu(current => !current)}
              >
                ⋯
              </button>

              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <strong>{currentUser?.name || 'User'}</strong>
                    <span>{currentUser?.email || 'No email available'}</span>
                  </div>
                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
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
              onClick={() => alert('Notifications will be connected later.')}
            >
              🔔
            </button>

            <div className="topbar-avatar">{getInitials(currentUser?.name, currentUser?.email)}</div>
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

              <button className="secondary-button" onClick={loadData}>
                Retry
              </button>
            </div>
          ) : page === 'Dashboard' ? (
            <Dashboard
              totalStock={totalStock}
              products={displayProducts}
              lowStock={lowStock}
              outOfStock={outOfStock}
              initialMovements={initialMovements}
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

              <button className="secondary-button" onClick={() => setPage('Dashboard')}>
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