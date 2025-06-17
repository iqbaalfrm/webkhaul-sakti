import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import FormInput from './pages/FormInput';
import Dashboard from './pages/Dashboard';
import RTDetailPage from './pages/RTDetailPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/rt/:rtNumber" element={<RTDetailPage />} />
            <Route path="/form" element={<FormInput />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;