import { useEffect, useState } from "react";
import StockLedger from "./StockLedger";

const API_BASE_URL = "http://localhost:5000/api";

function StockAdjustment() {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stockRecords, setStockRecords] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [countedStock, setCountedStock] = useState("");
  const [reason, setReason] = useState("");

  const [recordedStock, setRecordedStock] = useState(0);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [showLedger, setShowLedger] = useState(false);

  // --------------------------------------------------
  // LOAD PRODUCTS, LOCATIONS AND CURRENT STOCK
  // --------------------------------------------------
  async function loadInventoryData() {
    try {
      setLoadingData(true);
      setError("");

      const [productsResponse, locationsResponse, stockResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/products`),
          fetch(`${API_BASE_URL}/locations`),
          fetch(`${API_BASE_URL}/stock`),
        ]);

      if (!productsResponse.ok) {
        throw new Error("Failed to load products.");
      }

      if (!locationsResponse.ok) {
        throw new Error("Failed to load locations.");
      }

      if (!stockResponse.ok) {
        throw new Error("Failed to load stock.");
      }

      const productData = await productsResponse.json();
      const locationData = await locationsResponse.json();
      const stockData = await stockResponse.json();

      setProducts(productData);
      setLocations(locationData);
      setStockRecords(stockData);

      // Select first product/location automatically
      if (productData.length > 0 && !selectedProduct) {
        setSelectedProduct(String(productData[0].id));
      }

      if (locationData.length > 0 && !selectedLocation) {
        setSelectedLocation(String(locationData[0].id));
      }
    } catch (err) {
      console.error("Inventory loading error:", err);
      setError(
        err.message ||
          "Unable to load inventory data. Make sure the backend is running."
      );
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadInventoryData();
  }, []);

  // --------------------------------------------------
  // UPDATE RECORDED STOCK WHEN PRODUCT/LOCATION CHANGES
  // --------------------------------------------------
  useEffect(() => {
    if (!selectedProduct || !selectedLocation) {
      return;
    }

    const productId = Number(selectedProduct);
    const locationId = Number(selectedLocation);

    const stockRecord = stockRecords.find(
      (stock) =>
        Number(stock.product_id) === productId &&
        Number(stock.location_id) === locationId
    );

    const currentStock = stockRecord
      ? Number(stockRecord.quantity)
      : 0;

    setRecordedStock(currentStock);
    setCountedStock(String(currentStock));
  }, [selectedProduct, selectedLocation, stockRecords]);

  // --------------------------------------------------
  // SELECTED PRODUCT / LOCATION
  // --------------------------------------------------
  const selectedProductData = products.find(
    (product) => Number(product.id) === Number(selectedProduct)
  );

  const selectedLocationData = locations.find(
    (location) => Number(location.id) === Number(selectedLocation)
  );

  // --------------------------------------------------
  // DIFFERENCE
  // --------------------------------------------------
  const difference =
    countedStock === ""
      ? 0
      : Number(countedStock) - Number(recordedStock);

  // --------------------------------------------------
  // SUBMIT STOCK ADJUSTMENT
  // --------------------------------------------------
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    if (!selectedLocation) {
      setError("Please select a location.");
      return;
    }

    if (countedStock === "" || Number(countedStock) < 0) {
      setError("Please enter a valid physical count.");
      return;
    }

    if (!reason.trim()) {
      setError("Please enter a reason for the adjustment.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/adjustments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_id: Number(selectedLocation),
          product_id: Number(selectedProduct),
          physical_quantity: Number(countedStock),
          reason: reason.trim(),
          created_by: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create stock adjustment."
        );
      }

      const adjustment = data.adjustment;

      setRecordedStock(Number(adjustment.physical_quantity));
      setCountedStock(String(adjustment.physical_quantity));
      setReason("");

      setMessage(
        `ADJ/${String(adjustment.id).padStart(3, "0")} saved successfully. ` +
          `Stock updated from ${adjustment.system_quantity} to ${adjustment.physical_quantity}.`
      );

      // Refresh stock from database
      await loadInventoryData();
    } catch (err) {
      console.error("Stock adjustment error:", err);

      setError(
        err.message ||
          "Failed to save stock adjustment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // LEDGER VIEW
  // --------------------------------------------------
  if (showLedger) {
    return (
      <StockLedger
        onBack={() => setShowLedger(false)}
      />
    );
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loadingData) {
    return (
      <div className="ops-module">
        <div className="page-heading">
          <div>
            <p className="eyebrow">INVENTORY OPERATIONS</p>
            <h1>Stock Adjustment</h1>
            <p className="page-subtitle">
              Fix mismatches between recorded stock and physical count.
            </p>
          </div>
        </div>

        <div className="table-card">
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#8993a6",
            }}
          >
            Loading inventory data...
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="ops-module">

      <div className="page-heading">
        <div>
          <p className="eyebrow">INVENTORY OPERATIONS</p>

          <h1>Stock Adjustment</h1>

          <p className="page-subtitle">
            Fix mismatches between recorded stock and physical count.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => setShowLedger(true)}
        >
          View Stock Ledger →
        </button>
      </div>

      {error && (
        <div className="ops-error">
          {error}
        </div>
      )}

      {message && (
        <div
          style={{
            background: "#e7f8f0",
            border: "1px solid #b7ead4",
            color: "#16845d",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "18px",
          }}
        >
          ✓ {message}
        </div>
      )}

      <div
        className="table-card"
        style={{ maxWidth: "720px" }}
      >
        <div style={{ padding: "24px" }}>

          <div
            style={{
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid #edf0f5",
            }}
          >
            <h2
              style={{
                margin: "0 0 6px",
                fontSize: "18px",
                color: "#29344a",
              }}
            >
              Physical Stock Count
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "#8993a6",
              }}
            >
              Select the product and location, then enter the actual
              physical quantity.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* PRODUCT */}
            <div className="ops-form-group">
              <label>Product</label>

              <select
                className="ops-input"
                value={selectedProduct}
                onChange={(event) =>
                  setSelectedProduct(event.target.value)
                }
              >
                <option value="">
                  Select a product...
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
              {products.length === 0 && (
                <p style={{ margin: "6px 0 0", color: "#8993a6", fontSize: "12px" }}>
                  No products are available for adjustment.
                </p>
              )}
            </div>

            {/* LOCATION */}
            <div className="ops-form-group">
              <label>Location</label>

              <select
                className="ops-input"
                value={selectedLocation}
                onChange={(event) =>
                  setSelectedLocation(event.target.value)
                }
              >
                <option value="">
                  Select a location...
                </option>

                {locations.map((location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.name}
                    {location.warehouse_name
                      ? ` (${location.warehouse_name})`
                      : ""}
                  </option>
                ))}
              </select>
              {locations.length === 0 && (
                <p style={{ margin: "6px 0 0", color: "#8993a6", fontSize: "12px" }}>
                  No locations are available for adjustment.
                </p>
              )}
            </div>

            {/* STOCK COUNTS */}
            <div className="form-row">

              <div className="ops-form-group">
                <label>Recorded Stock</label>

                <input
                  className="ops-input"
                  type="number"
                  value={recordedStock}
                  readOnly
                />
              </div>

              <div className="ops-form-group">
                <label>Physical Count</label>

                <input
                  className="ops-input"
                  type="number"
                  min="0"
                  value={countedStock}
                  onChange={(event) =>
                    setCountedStock(event.target.value)
                  }
                />
              </div>

            </div>

            {/* DIFFERENCE */}
            <div
              style={{
                background: "#f7f8fc",
                border: "1px solid #e9edf4",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#778398",
                  }}
                >
                  Adjustment Difference
                </span>

                <strong
                  style={{
                    fontSize: "20px",
                    color:
                      difference > 0
                        ? "#22966c"
                        : difference < 0
                        ? "#d65e65"
                        : "#59667d",
                  }}
                >
                  {difference > 0 ? "+" : ""}
                  {difference}{" "}
                  {selectedProductData?.unit || "Units"}
                </strong>
              </div>
            </div>

            {/* REASON */}
            <div className="ops-form-group">
              <label>Reason</label>

              <input
                className="ops-input"
                type="text"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                placeholder="e.g. Damaged items, physical count mismatch"
              />
            </div>

            {/* ACTIONS */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <button
                type="submit"
                className="primary-button"
                disabled={loading || products.length === 0 || locations.length === 0}
              >
                {loading ? "Updating..." : "✓ Update Stock"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setCountedStock(String(recordedStock));
                  setReason("");
                  setError("");
                  setMessage("");
                }}
                disabled={loading}
              >
                Reset
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}

export default StockAdjustment;