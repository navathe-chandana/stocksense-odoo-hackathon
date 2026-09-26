const API_BASE_URL = "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = payload && (payload.message || payload.error)
      ? payload.message || payload.error
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export const getProducts = async () => request("/api/products");
export const getStock = async () => request("/api/stock");
export const getWarehouses = async () => request("/api/warehouses");
export const getLocations = async () => request("/api/locations");

export const getReceipts = async () => request("/api/receipts");
export const getReceiptById = async (id) => request(`/api/receipts/${id}`);
export const mockCreateReceipt = async (payload) => request("/api/receipts", {
  method: "POST",
  body: JSON.stringify(payload)
});
export const mockValidateReceipt = async (id) => request(`/api/receipts/${id}/validate`, {
  method: "PATCH"
});

export const getDeliveries = async () => request("/api/deliveries");
export const getDeliveryById = async (id) => request(`/api/deliveries/${id}`);
export const mockCreateDelivery = async (payload) => request("/api/deliveries", {
  method: "POST",
  body: JSON.stringify(payload)
});
export const mockValidateDelivery = async (id) => request(`/api/deliveries/${id}/validate`, {
  method: "PATCH"
});
export const mockUpdateDeliveryStatus = async (id, newStatus) => ({ id, status: newStatus });

export const getTransfers = async () => request("/api/transfers");
export const getTransferById = async (id) => request(`/api/transfers/${id}`);
export const mockCreateTransfer = async (payload) => request("/api/transfers", {
  method: "POST",
  body: JSON.stringify(payload)
});
export const mockValidateTransfer = async (id) => request(`/api/transfers/${id}/validate`, {
  method: "PATCH"
});
export const mockCompleteTransfer = async (id) => mockValidateTransfer(id);

export const createReceipt = mockCreateReceipt;
export const validateReceipt = mockValidateReceipt;
export const createDelivery = mockCreateDelivery;
export const validateDelivery = mockValidateDelivery;
export const createTransfer = mockCreateTransfer;
export const validateTransfer = mockValidateTransfer;
