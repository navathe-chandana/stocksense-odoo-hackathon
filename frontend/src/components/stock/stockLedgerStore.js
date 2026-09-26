let adjustmentCounter = 1;

const adjustedStock = {};
let ledgerEntries = [];

const makeKey = (productId, locationId) =>
  `${locationId}-${productId}`;

export function getCurrentStock(productId, locationId, originalStock) {
  const key = makeKey(productId, locationId);

  if (Object.prototype.hasOwnProperty.call(adjustedStock, key)) {
    return adjustedStock[key];
  }

  return originalStock;
}

export function recordAdjustment({
  productId,
  locationId,
  productName,
  locationName,
  unit,
  previousStock,
  countedStock,
  reason,
}) {
  const difference = countedStock - previousStock;
  const key = makeKey(productId, locationId);

  adjustedStock[key] = countedStock;

  const entry = {
    id: `ADJ/${String(adjustmentCounter).padStart(3, "0")}`,
    productId,
    product: productName,
    locationId,
    location: locationName,
    operation: "Adjustment",
    previousStock,
    quantity: difference,
    newStock: countedStock,
    unit,
    reason,
    status: "Done",
    date: new Date().toISOString(),
  };

  adjustmentCounter += 1;
  ledgerEntries = [entry, ...ledgerEntries];

  return entry;
}

export function getLedgerEntries() {
  return [...ledgerEntries];
}