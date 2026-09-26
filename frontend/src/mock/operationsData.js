// Mock Data for StockSense (Friend 2 Operations)

let products = [
    { id: 1, name: 'Steel Rod', sku: 'ST-001' },
    { id: 2, name: 'Wooden Chair', sku: 'CH-002' },
    { id: 3, name: 'Glass Table', sku: 'GL-003' }
];

let locations = [
    { id: 1, name: 'Main Warehouse', type: 'warehouse' },
    { id: 2, name: 'Storage Rack A', type: 'rack' },
    { id: 3, name: 'Storage Rack B', type: 'rack' }
];

// Initial Stock State: location_id -> { product_id -> quantity }
let stock = {
    1: { 1: 100, 2: 150, 3: 50 }, // Main Warehouse
    2: { 1: 20 }, // Rack A
    3: { 2: 30 }  // Rack B
};

let receipts = [
    { id: 1, supplier_name: 'Acme Corp', status: 'validated', created_at: '2026-09-20T10:00:00Z', lines: [{ product_id: 1, quantity: 50 }] }
];
let receiptIdCounter = 2;

let deliveries = [
    { id: 1, customer_name: 'John Doe', status: 'draft', created_at: '2026-09-21T11:00:00Z', lines: [{ product_id: 2, quantity: 10 }] }
];
let deliveryIdCounter = 2;

let transfers = [];
let transferIdCounter = 1;

// Helper to get total stock across all locations (or specific)
export const getStock = (productId, locationId = null) => {
    if (locationId) {
        return (stock[locationId] && stock[locationId][productId]) || 0;
    }
    let total = 0;
    for (let loc in stock) {
        if (stock[loc][productId]) total += stock[loc][productId];
    }
    return total;
};

// Data getters
export const getProducts = async () => [...products];
export const getLocations = async () => [...locations];

export const getReceipts = async () => [...receipts];
export const getReceiptById = async (id) => receipts.find(r => r.id === parseInt(id));

export const getDeliveries = async () => [...deliveries];
export const getDeliveryById = async (id) => deliveries.find(d => d.id === parseInt(id));

export const getTransfers = async () => [...transfers];
export const getTransferById = async (id) => transfers.find(t => t.id === parseInt(id));


// RECEIPTS
export const mockCreateReceipt = async (supplier_name, lines) => {
    const newReceipt = {
        id: receiptIdCounter++,
        supplier_name,
        status: 'draft',
        created_at: new Date().toISOString(),
        lines
    };
    receipts.push(newReceipt);
    return newReceipt;
};

export const mockValidateReceipt = async (id) => {
    const receipt = receipts.find(r => r.id === parseInt(id));
    if (!receipt) throw new Error('Receipt not found');
    if (receipt.status === 'validated') throw new Error('Already validated');

    // Add stock (Assume default receiving location is Main Warehouse - ID 1)
    const defaultLocation = 1;
    receipt.lines.forEach(line => {
        if (!stock[defaultLocation]) stock[defaultLocation] = {};
        if (!stock[defaultLocation][line.product_id]) stock[defaultLocation][line.product_id] = 0;
        stock[defaultLocation][line.product_id] += line.quantity;
    });

    receipt.status = 'validated';
    receipt.validated_at = new Date().toISOString();
    return receipt;
};


// DELIVERIES
export const mockCreateDelivery = async (customer_name, lines) => {
    const newDelivery = {
        id: deliveryIdCounter++,
        customer_name,
        status: 'draft',
        created_at: new Date().toISOString(),
        lines
    };
    deliveries.push(newDelivery);
    return newDelivery;
};

export const mockUpdateDeliveryStatus = async (id, newStatus) => {
    const delivery = deliveries.find(d => d.id === parseInt(id));
    if (!delivery) throw new Error('Delivery not found');
    delivery.status = newStatus;
    return delivery;
};

export const mockValidateDelivery = async (id) => {
    const delivery = deliveries.find(d => d.id === parseInt(id));
    if (!delivery) throw new Error('Delivery not found');
    if (delivery.status === 'validated') throw new Error('Already validated');

    // Check and deduct stock (Assume shipping from Main Warehouse - ID 1)
    const defaultLocation = 1;
    delivery.lines.forEach(line => {
        const available = getStock(line.product_id, defaultLocation);
        if (available < line.quantity) {
            throw new Error(`Insufficient stock for product ID ${line.product_id}`);
        }
    });

    delivery.lines.forEach(line => {
        stock[defaultLocation][line.product_id] -= line.quantity;
    });

    delivery.status = 'validated';
    delivery.validated_at = new Date().toISOString();
    return delivery;
};


// TRANSFERS
export const mockCreateTransfer = async (source_location_id, destination_location_id, lines) => {
    const newTransfer = {
        id: transferIdCounter++,
        source_location_id,
        destination_location_id,
        status: 'draft',
        created_at: new Date().toISOString(),
        lines
    };
    transfers.push(newTransfer);
    return newTransfer;
};

export const mockCompleteTransfer = async (id) => {
    const transfer = transfers.find(t => t.id === parseInt(id));
    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status === 'completed') throw new Error('Already completed');

    transfer.lines.forEach(line => {
        const available = getStock(line.product_id, transfer.source_location_id);
        if (available < line.quantity) {
            throw new Error(`Insufficient stock at source location for product ID ${line.product_id}`);
        }
    });

    transfer.lines.forEach(line => {
        // deduct from source
        stock[transfer.source_location_id][line.product_id] -= line.quantity;
        
        // add to dest
        if (!stock[transfer.destination_location_id]) stock[transfer.destination_location_id] = {};
        if (!stock[transfer.destination_location_id][line.product_id]) stock[transfer.destination_location_id][line.product_id] = 0;
        stock[transfer.destination_location_id][line.product_id] += line.quantity;
    });

    transfer.status = 'completed';
    transfer.completed_at = new Date().toISOString();
    return transfer;
};
