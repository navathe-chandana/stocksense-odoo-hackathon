import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getTransfers, getProducts, getLocations, mockCreateTransfer, getTransferById, mockCompleteTransfer } from '../mock/operationsData';

function TransferList() {
    const [transfers, setTransfers] = useState([]);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        getTransfers().then(setTransfers).catch(console.error);
        getLocations().then(setLocations).catch(console.error);
    }, []);

    const getLocationName = (id) => {
        const l = locations.find(x => x.id === id);
        return l ? l.name : id;
    };

    return (
        <div className="card">
            <h2>Internal Transfers</h2>
            <Link to="/transfers/create" className="btn">Create New Transfer</Link>
            <table className="table-container" style={{ marginTop: '20px' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Source Location</th>
                        <th>Destination Location</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {transfers.map(t => (
                        <tr key={t.id}>
                            <td>{t.id}</td>
                            <td>{getLocationName(t.source_location_id)}</td>
                            <td>{getLocationName(t.destination_location_id)}</td>
                            <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                            <td>{new Date(t.created_at).toLocaleString()}</td>
                            <td>
                                <Link to={`/transfers/${t.id}`} className="btn btn-secondary" style={{ marginRight: '10px' }}>View</Link>
                            </td>
                        </tr>
                    ))}
                    {transfers.length === 0 && <tr><td colSpan="6">No transfers found.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

function CreateTransfer() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [sourceLocation, setSourceLocation] = useState('');
    const [destinationLocation, setDestinationLocation] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState(null);

    useEffect(() => {
        getProducts().then(setProducts).catch(console.error);
        getLocations().then(setLocations).catch(console.error);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!selectedProduct) return setError('Please select a product');
        if (!sourceLocation || !destinationLocation) return setError('Please select both source and destination locations');
        if (sourceLocation === destinationLocation) return setError('Source and destination cannot be the same');
        if (quantity <= 0) return setError('Quantity must be greater than 0');

        try {
            await mockCreateTransfer(parseInt(sourceLocation), parseInt(destinationLocation), [{ product_id: parseInt(selectedProduct), quantity: parseInt(quantity) }]);
            navigate('/transfers');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="card">
            <h2>Create Transfer</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Product</label>
                    <select className="form-control" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                        <option value="">Select a product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Source Location</label>
                    <select className="form-control" value={sourceLocation} onChange={e => setSourceLocation(e.target.value)}>
                        <option value="">Select source...</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.type})</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Destination Location</label>
                    <select className="form-control" value={destinationLocation} onChange={e => setDestinationLocation(e.target.value)}>
                        <option value="">Select destination...</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.type})</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" className="form-control" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
                <button type="submit" className="btn">Save Draft</button>
                <button type="button" className="btn btn-secondary" style={{ marginLeft: '10px' }} onClick={() => navigate('/transfers')}>Cancel</button>
            </form>
        </div>
    );
}

function TransferDetails() {
    const { id } = useParams();
    const [transfer, setTransfer] = useState(null);
    const [products, setProducts] = useState([]);
    const [locations, setLocations] = useState([]);
    const [error, setError] = useState(null);

    const loadData = async () => {
        try {
            const t = await getTransferById(id);
            if (!t) throw new Error('Transfer not found');
            setTransfer(t);
            const p = await getProducts();
            setProducts(p);
            const l = await getLocations();
            setLocations(l);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleComplete = async () => {
        try {
            await mockCompleteTransfer(id);
            loadData(); // reload data
        } catch (err) {
            alert(err.message);
        }
    };

    const getProductName = (pid) => {
        const p = products.find(x => x.id === pid);
        return p ? `${p.name} (${p.sku})` : pid;
    };

    const getLocationName = (lid) => {
        const l = locations.find(x => x.id === lid);
        return l ? l.name : lid;
    };

    if (error) return <div className="error-message">{error}</div>;
    if (!transfer) return <div>Loading...</div>;

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Transfer #{transfer.id}</h2>
                <div><span className={`badge badge-${transfer.status}`}>{transfer.status}</span></div>
            </div>
            <p><strong>Source Location:</strong> {getLocationName(transfer.source_location_id)}</p>
            <p><strong>Destination Location:</strong> {getLocationName(transfer.destination_location_id)}</p>
            <p><strong>Created At:</strong> {new Date(transfer.created_at).toLocaleString()}</p>
            {transfer.completed_at && <p><strong>Completed At:</strong> {new Date(transfer.completed_at).toLocaleString()}</p>}
            
            <h3 style={{ marginTop: '30px' }}>Lines</h3>
            <table className="table-container">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    {transfer.lines && transfer.lines.map((line, idx) => (
                        <tr key={idx}>
                            <td>{getProductName(line.product_id)}</td>
                            <td>{line.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: '30px' }}>
                {transfer.status === 'draft' && (
                    <button className="btn btn-success" onClick={handleComplete}>Complete Transfer</button>
                )}
                <Link to="/transfers" className="btn btn-secondary" style={{ marginLeft: '10px' }}>Back</Link>
            </div>
        </div>
    );
}

export default function Transfers() {
    return (
        <Routes>
            <Route path="/" element={<TransferList />} />
            <Route path="/create" element={<CreateTransfer />} />
            <Route path="/:id" element={<TransferDetails />} />
        </Routes>
    );
}
