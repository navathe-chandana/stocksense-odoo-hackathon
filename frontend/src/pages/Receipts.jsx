import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getReceipts, getProducts, mockCreateReceipt, getReceiptById, mockValidateReceipt } from '../mock/operationsData';

function ReceiptList() {
    const [receipts, setReceipts] = useState([]);

    useEffect(() => {
        getReceipts().then(setReceipts).catch(console.error);
    }, []);

    return (
        <div className="card">
            <h2>Receipts</h2>
            <Link to="/receipts/create" className="btn">Create New Receipt</Link>
            <table className="table-container" style={{ marginTop: '20px' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Supplier</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {receipts.map(r => (
                        <tr key={r.id}>
                            <td>{r.id}</td>
                            <td>{r.supplier_name}</td>
                            <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                            <td>{new Date(r.created_at).toLocaleString()}</td>
                            <td>
                                <Link to={`/receipts/${r.id}`} className="btn btn-secondary" style={{ marginRight: '10px' }}>View</Link>
                            </td>
                        </tr>
                    ))}
                    {receipts.length === 0 && <tr><td colSpan="5">No receipts found.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

function CreateReceipt() {
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState('');
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
        if (!supplier) return setError('Supplier name is required');
        if (!selectedProduct) return setError('Please select a product');
        if (quantity <= 0) return setError('Quantity must be greater than 0');

        try {
            await mockCreateReceipt(supplier, [{ product_id: parseInt(selectedProduct), quantity: parseInt(quantity) }]);
            navigate('/receipts');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="card">
            <h2>Create Receipt</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Supplier Name</label>
                    <input type="text" className="form-control" value={supplier} onChange={e => setSupplier(e.target.value)} />
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
                <button type="button" className="btn btn-secondary" style={{ marginLeft: '10px' }} onClick={() => navigate('/receipts')}>Cancel</button>
            </form>
        </div>
    );
}

function ReceiptDetails() {
    const { id } = useParams();
    const [receipt, setReceipt] = useState(null);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);

    const loadData = async () => {
        try {
            const r = await getReceiptById(id);
            if (!r) throw new Error('Receipt not found');
            setReceipt(r);
            const p = await getProducts();
            setProducts(p);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleValidate = async () => {
        try {
            await mockValidateReceipt(id);
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
    if (!receipt) return <div>Loading...</div>;

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Receipt #{receipt.id}</h2>
                <div><span className={`badge badge-${receipt.status}`}>{receipt.status}</span></div>
            </div>
            <p><strong>Supplier:</strong> {receipt.supplier_name}</p>
            <p><strong>Created At:</strong> {new Date(receipt.created_at).toLocaleString()}</p>
            {receipt.validated_at && <p><strong>Validated At:</strong> {new Date(receipt.validated_at).toLocaleString()}</p>}
            
            <h3 style={{ marginTop: '30px' }}>Lines</h3>
            <table className="table-container">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    {receipt.lines && receipt.lines.map((line, idx) => (
                        <tr key={idx}>
                            <td>{getProductName(line.product_id)}</td>
                            <td>{line.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: '30px' }}>
                {receipt.status === 'draft' && (
                    <button className="btn btn-success" onClick={handleValidate}>Validate</button>
                )}
                <Link to="/receipts" className="btn btn-secondary" style={{ marginLeft: '10px' }}>Back</Link>
            </div>
        </div>
    );
}

export default function Receipts() {
    return (
        <Routes>
            <Route path="/" element={<ReceiptList />} />
            <Route path="/create" element={<CreateReceipt />} />
            <Route path="/:id" element={<ReceiptDetails />} />
        </Routes>
    );
}
