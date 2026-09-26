import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

function StockLedger({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // LOAD ADJUSTMENTS FROM BACKEND
  // --------------------------------------------------
  async function loadLedger() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/adjustments`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load stock ledger."
        );
      }

      setEntries(data);
    } catch (err) {
      console.error("Ledger loading error:", err);

      setError(
        err.message ||
          "Unable to load stock ledger. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLedger();
  }, []);

  // --------------------------------------------------
  // SEARCH + FILTER
  // --------------------------------------------------
  const filteredEntries = entries.filter((entry) => {
    const searchText = `
      ${entry.id}
      ${entry.product_name || ""}
      ${entry.sku || ""}
      ${entry.location_name || ""}
      ${entry.reason || ""}
    `.toLowerCase();

    const matchesSearch = searchText.includes(
      search.toLowerCase()
    );

    const matchesFilter =
      filter === "All" ||
      (filter === "Increase" && Number(entry.difference) > 0) ||
      (filter === "Decrease" && Number(entry.difference) < 0) ||
      (filter === "No Change" && Number(entry.difference) === 0);

    return matchesSearch && matchesFilter;
  });

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="ops-module">

        <div className="page-heading">
          <div>
            <p className="eyebrow">INVENTORY OPERATIONS</p>
            <h1>Stock Ledger</h1>
            <p className="page-subtitle">
              Complete history of stock adjustments.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={onBack}
          >
            ← Back to Adjustment
          </button>
        </div>

        <div className="table-card">
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#8993a6",
            }}
          >
            Loading stock ledger...
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
          <p className="eyebrow">
            INVENTORY OPERATIONS
          </p>

          <h1>Stock Ledger</h1>

          <p className="page-subtitle">
            Complete history of stock adjustments.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={onBack}
        >
          ← Back to Adjustment
        </button>

      </div>

      {error && (
        <div className="ops-error">
          {error}
        </div>
      )}

      <div className="table-card">

        <div className="table-toolbar">

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "16px",
              }}
            >
              Stock Movement History
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#8993a6",
                fontSize: "11px",
              }}
            >
              {entries.length} adjustment
              {entries.length === 1 ? "" : "s"} recorded
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >

            <input
              className="search-input"
              placeholder="⌕ Search product, location..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              className="ops-input"
              style={{ width: "160px" }}
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
            >
              <option value="All">
                All Adjustments
              </option>

              <option value="Increase">
                Stock Increase
              </option>

              <option value="Decrease">
                Stock Decrease
              </option>

              <option value="No Change">
                No Change
              </option>
            </select>

          </div>
        </div>

        <div className="table-responsive">

          <table>

            <thead>
              <tr>
                <th>REFERENCE</th>
                <th>PRODUCT</th>
                <th>LOCATION</th>
                <th>PREVIOUS</th>
                <th>CHANGE</th>
                <th>NEW STOCK</th>
                <th>REASON</th>
                <th>DATE</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>

              {filteredEntries.map((entry) => {

                const difference =
                  Number(entry.difference) || 0;

                const previousStock =
                  Number(entry.system_quantity) || 0;

                const newStock =
                  Number(entry.physical_quantity) || 0;

                return (
                  <tr key={entry.id}>

                    <td className="reference">
                      ADJ/
                      {String(entry.id).padStart(3, "0")}
                    </td>

                    <td>
                      <strong>
                        {entry.product_name}
                      </strong>

                      <small
                        style={{
                          display: "block",
                          color: "#9ba4b4",
                          marginTop: "3px",
                        }}
                      >
                        {entry.sku || "—"}
                      </small>
                    </td>

                    <td>
                      {entry.location_name}
                    </td>

                    <td>
                      {previousStock}
                    </td>

                    <td
                      className="quantity"
                      style={{
                        color:
                          difference > 0
                            ? "#22966c"
                            : difference < 0
                            ? "#d65e65"
                            : "#68758a",
                      }}
                    >
                      {difference > 0 ? "+" : ""}
                      {difference}
                    </td>

                    <td>
                      <strong>
                        {newStock}
                      </strong>
                    </td>

                    <td>
                      {entry.reason || "—"}
                    </td>

                    <td>
                      {entry.created_at
                        ? new Date(
                            entry.created_at
                          ).toLocaleString()
                        : "—"}
                    </td>

                    <td>
                      <span className="status-badge done">
                        Done
                      </span>
                    </td>

                  </tr>
                );
              })}

              {filteredEntries.length === 0 && (

                <tr>
                  <td
                    colSpan="9"
                    className="empty-state"
                  >
                    {entries.length === 0
                      ? "No stock adjustments recorded yet."
                      : "No matching ledger entries found."}
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default StockLedger;