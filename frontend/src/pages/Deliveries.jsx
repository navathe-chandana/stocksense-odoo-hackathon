import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getDeliveries, getProducts, mockCreateDelivery, getDeliveryById, mockValidateDelivery, mockUpdateDeliveryStatus } from '../mock/operationsData';

function DeliveryList() {
    const [deliveries, setDeliveries] = useState([]);

    useEffect(() => {
        getDeliveries().then(setDeliveries).catch(console.error);
    }, []);

    return (
        <div className="card">
            <h2>Deliveries</h2>
            <Link to="/deliveries/create" className="btn">Create New Delivery</Link>
            <table className="table-container" style={{ marginTop: '20px' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {deliveries.map(d => (
                        <tr key={d.id}>
                            <td>{d.id}</td>
                            <td>{d.customer_name}</td>
                            <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                            <td>{new Date(d.created_at).toLocaleString()}</td>
                            <td>
                                <Link to={`/deliveries/${d.id}`} className="btn btn-secondary" style={{ marginRight: '10px' }}>View</Link>
                            </td>
                        </tr>
                    ))}
                    {deliveries.length === 0 && <tr><td colSpan="5">No deliveries found.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

function CreateDelivery() {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState('');
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState(null);

    useEffect(() => {
        getProducts().then(setProducts).catch(console.error);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!customer) return setError('Customer name is required');
        if (!selectedProduct) return setError('Please select a product');
        if (quantity <= 0) return setError('Quantity must be greater than 0');

        try {
            await mockCreateDelivery(customer, [{ product_id: parseInt(selectedProduct), quantity: parseInt(quantity) }]);
            navigate('/deliveries');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="card">
            <h2>Create Delivery</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Customer Name</label>
                    <input type="text" className="form-control" value={customer} onChange={e => setCustomer(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Product</label>
                    <select className="form-control" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                        <option value="">Select a product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" className="form-control" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
                <button type="submit" className="btn">Save Draft</button>
                <button type="button" className="btn btn-secondary" style={{ marginLeft: '10px' }} onClick={() => navigate('/deliveries')}>Cancel</button>
            </form>
        </div>
    );
}

function DeliveryDetails() {
    const { id } = useParams();
    const [delivery, setDelivery] = useState(null);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);

    const loadData = async () => {
        try {
            const d = await getDeliveryById(id);
            if (!d) throw new Error('Delivery not found');
            setDelivery(d);
            const p = await getProducts();
            setProducts(p);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleAction = async (action) => {
        try {
            if (action === 'validate') {
                await mockValidateDelivery(id);
            } else if (action === 'pick') {
                await mockUpdateDeliveryStatus(id, 'picked');
            } else if (action === 'pack') {
                await mockUpdateDeliveryStatus(id, 'packed');
            }
            loadData(); // reload data
        } catch (err) {
            alert(err.message);
        }
    };

    const getProductName = (pid) => {
        const p = products.find(x => x.id === pid);
        return p ? `${p.name} (${p.sku})` : pid;
    };

    if (error) return <div className="error-message">{error}</div>;
    if (!delivery) return <div>Loading...</div>;

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Delivery #{delivery.id}</h2>
                <div><span className={`badge badge-${delivery.status}`}>{delivery.status}</span></div>
            </div>
            <p><strong>Customer:</strong> {delivery.customer_name}</p>
            <p><strong>Created At:</strong> {new Date(delivery.created_at).toLocaleString()}</p>
            {delivery.validated_at && <p><strong>Validated At:</strong> {new Date(delivery.validated_at).toLocaleString()}</p>}
            
            <h3 style={{ marginTop: '30px' }}>Lines</h3>
            <table className="table-container">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    {delivery.lines && delivery.lines.map((line, idx) => (
                        <tr key={idx}>
                            <td>{getProductName(line.product_id)}</td>
                            <td>{line.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: '30px' }}>
                {delivery.status === 'draft' && (
                    <button className="btn" style={{marginRight: '10px'}} onClick={() => handleAction('pick')}>Pick Items</button>
                )}
                {delivery.status === 'picked' && (
                    <button className="btn" style={{marginRight: '10px'}} onClick={() => handleAction('pack')}>Pack Items</button>
                )}
                {(delivery.status === 'packed' || delivery.status === 'draft') && delivery.status !== 'validated' && (
                    <button className="btn btn-success" onClick={() => handleAction('validate')}>Validate & Ship</button>
                )}
                <Link to="/deliveries" className="btn btn-secondary" style={{ marginLeft: '10px' }}>Back</Link>
            </div>
        </div>
    );
}

export default function Deliveries() {
    return (
        <Routes>
            <Route path="/" element={<DeliveryList />} />
            <Route path="/create" element={<CreateDelivery />} />
            <Route path="/:id" element={<DeliveryDetails />} />
        </Routes>
    );
}
