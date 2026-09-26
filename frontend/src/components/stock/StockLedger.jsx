import { useEffect, useState } from "react";
import { getLedgerEntries } from "./stockLedgerStore";

function StockLedger({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    setEntries(getLedgerEntries());
  }, []);

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      `${entry.id} ${entry.product} ${entry.location} ${entry.reason}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || entry.operation === filter;

    return matchesSearch && matchesFilter;
  });

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

        <div className="table-toolbar">

          <div>
            <h2 style={{ margin: 0, fontSize: "16px" }}>
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
              style={{ width: "150px" }}
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
            >
              <option value="All">All Operations</option>
              <option value="Adjustment">Adjustment</option>
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

              {filteredEntries.map((entry) => (

                <tr key={entry.id}>

                  <td className="reference">
                    {entry.id}
                  </td>

                  <td>
                    <strong>{entry.product}</strong>
                    <small
                      style={{
                        display: "block",
                        color: "#9ba4b4",
                        marginTop: "3px",
                      }}
                    >
                      {entry.unit}
                    </small>
                  </td>

                  <td>
                    {entry.location}
                  </td>

                  <td>
                    {entry.previousStock}
                  </td>

                  <td
                    className="quantity"
                    style={{
                      color:
                        entry.quantity > 0
                          ? "#22966c"
                          : entry.quantity < 0
                            ? "#d65e65"
                            : "#68758a",
                    }}
                  >
                    {entry.quantity > 0 ? "+" : ""}
                    {entry.quantity}
                  </td>

                  <td>
                    <strong>
                      {entry.newStock}
                    </strong>
                  </td>

                  <td>
                    {entry.reason}
                  </td>

                  <td>
                    {new Date(entry.date).toLocaleString()}
                  </td>

                  <td>
                    <span className="status-badge done">
                      {entry.status}
                    </span>
                  </td>

                </tr>

              ))}

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