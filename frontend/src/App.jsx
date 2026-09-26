import { Routes, Route, Link } from 'react-router-dom';
import Receipts from './pages/Receipts';
import Deliveries from './pages/Deliveries';
import Transfers from './pages/Transfers';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <nav className="sidebar">
        <h2>StockSense</h2>
        <ul>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/receipts">Receipts</Link></li>
          <li><Link to="/deliveries">Deliveries</Link></li>
          <li><Link to="/transfers">Transfers</Link></li>
        </ul>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <div>
                <h1>Welcome to StockSense Dashboard</h1>
                <p>Dashboard is under construction by Friend 1.</p>
            </div>
          } />
          <Route path="/receipts/*" element={<Receipts />} />
          <Route path="/deliveries/*" element={<Deliveries />} />
          <Route path="/transfers/*" element={<Transfers />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
