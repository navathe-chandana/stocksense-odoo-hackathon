import { useEffect, useState } from "react";
import {
  getProducts,
  getLocations,
  getStock,
} from "../../mock/operationsData";
import {
  getCurrentStock,
  recordAdjustment,
} from "./stockLedgerStore";
import StockLedger from "./StockLedger";

function StockAdjustment() {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [countedStock, setCountedStock] = useState("");
  const [reason, setReason] = useState("");

  const [recordedStock, setRecordedStock] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showLedger, setShowLedger] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [productData, locationData] = await Promise.all([
          getProducts(),
          getLocations(),
        ]);

        setProducts(productData);
        setLocations(locationData);

        if (productData.length > 0) {
          setSelectedProduct(String(productData[0].id));
        }

        if (locationData.length > 0) {
          setSelectedLocation(String(locationData[0].id));
        }
      } catch (err) {
        setError("Unable to load inventory data.");
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!selectedProduct || !selectedLocation) return;

    const productId = Number(selectedProduct);
    const locationId = Number(selectedLocation);

    const originalStock = getStock(productId, locationId);

    const currentStock = getCurrentStock(
      productId,
      locationId,
      originalStock
    );

    setRecordedStock(currentStock);
    setCountedStock(String(currentStock));
  }, [selectedProduct, selectedLocation]);

  const selectedProductData = products.find(
    (product) => product.id === Number(selectedProduct)
  );

  const selectedLocationData = locations.find(
    (location) => location.id === Number(selectedLocation)
  );

  const difference =
    countedStock === ""
      ? 0
      : Number(countedStock) - Number(recordedStock);

  function handleSubmit(event) {
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

    const entry = recordAdjustment({
      productId: Number(selectedProduct),
      locationId: Number(selectedLocation),
      productName: selectedProductData?.name || "Unknown Product",
      locationName: selectedLocationData?.name || "Unknown Location",
      unit: selectedProductData?.unit || "Units",
      previousStock: Number(recordedStock),
      countedStock: Number(countedStock),
      reason: reason.trim(),
    });

    setRecordedStock(Number(countedStock));
    setMessage(
      `${entry.id} saved successfully. Stock updated from ${entry.previousStock} to ${entry.newStock}.`
    );
    setReason("");
  }

  if (showLedger) {
    return (
      <StockLedger onBack={() => setShowLedger(false)} />
    );
  }

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

            <div className="ops-form-group">
              <label>Product</label>

              <select
                className="ops-input"
                value={selectedProduct}
                onChange={(event) =>
                  setSelectedProduct(event.target.value)
                }
              >
                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="ops-form-group">
              <label>Location</label>

              <select
                className="ops-input"
                value={selectedLocation}
                onChange={(event) =>
                  setSelectedLocation(event.target.value)
                }
              >
                {locations.map((location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.name} ({location.type})
                  </option>
                ))}
              </select>
            </div>

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
              >
                ✓ Update Stock
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