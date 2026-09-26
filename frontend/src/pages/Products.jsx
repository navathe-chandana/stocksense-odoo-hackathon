
function Products({
  products,
  lowStock,
  outOfStock,
  filteredProducts,
  search,
  setSearch,
  openAddForm,
  openEditForm,
  deleteProduct,
  showForm,
  setShowForm,
  editingId,
  form,
  setForm,
  handleSubmit,
  categories = [],
  locations = [],
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">INVENTORY MANAGEMENT</p>
          <h1>Products</h1>
          <p className="page-subtitle">
            Manage your products, stock levels, and categories.
          </p>
        </div>

        <button className="primary-button" onClick={openAddForm}>
          ＋ Add Product
        </button>
      </div>

      <div className="product-summary">
        <div>
          <span>Total Products</span>
          <strong>{products.length}</strong>
        </div>
        <div>
          <span>Low Stock</span>
          <strong className="orange-text">{lowStock}</strong>
        </div>
        <div>
          <span>Out of Stock</span>
          <strong className="red-text">{outOfStock}</strong>
        </div>
      </div>

      <div className="table-card products-card">
        <div className="table-toolbar">
          <div>
            <h2>All Products</h2>
            <p>View and manage your inventory catalog.</p>
          </div>

          <input
            className="search-input"
            placeholder="Search products or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              {filteredProducts.map((p) => {
                const status =
                  p.stock === 0
                    ? "Out of Stock"
                    : p.stock <= p.minStock
                    ? "Low Stock"
                    : "In Stock";

                return (
                  <tr key={p.id}>
                    <td className="product-name">
                      {p.name}
                      <small>{p.unit}</small>
                    </td>

                    <td className="reference">{p.sku}</td>

                    <td>{p.category || '-'}</td>

                    <td className="quantity">
                      {p.stock} {p.unit}
                    </td>

                    <td>{p.location}</td>

                    <td>
                      <span
                        className={`status-badge ${
                          status === "In Stock"
                            ? "done"
                            : status === "Low Stock"
                            ? "waiting"
                            : "cancelled"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => openEditForm(p)}
                          title="Edit product"
                        >
                          ✎
                        </button>

                        <button
                          onClick={() => deleteProduct(p.id)}
                          title="Delete product"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No products found.
                  </td>
                </tr>
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
                <h2>
                  {editingId ? "Edit Product" : "Add New Product"}
                </h2>
                <p>Enter the product details below.</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <label>
              Product Name
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="e.g. Steel Rods"
              />
            </label>

            <label>
              SKU / Product Code
              <input
                required
                value={form.sku}
                onChange={(e) =>
                  setForm({ ...form, sku: e.target.value })
                }
                placeholder="e.g. ST-001"
              />
            </label>

            <label>
              Category
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                <option value="">Select Category (Optional)</option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={String(category.id)}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-row">
              <label>
                Unit of Measure
                <select
                  value={form.unit}
                  onChange={(e) =>
                    setForm({ ...form, unit: e.target.value })
                  }
                >
                  <option>Units</option>
                  <option>Kg</option>
                  <option>Liters</option>
                  <option>Meters</option>
                  <option>Boxes</option>
                  <option>Pieces</option>
                </select>
              </label>

              <label>
                Initial Stock
                <input
                  required
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value })
                  }
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Minimum Stock
                <input
                  required
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={(e) =>
                    setForm({ ...form, minStock: e.target.value })
                  }
                />
              </label>

              <label>
                Location
                <select
                  required
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                >
                  <option value="">Select Location</option>

                  {locations.map((location) => (
                    <option
                      key={location.id}
                      value={String(location.id)}
                    >
                      {location.name} ({location.warehouse_name})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button type="submit" className="primary-button">
                {editingId ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default Products;