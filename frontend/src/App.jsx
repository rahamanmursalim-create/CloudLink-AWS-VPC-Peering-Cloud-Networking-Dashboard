import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home         from './pages/Home.jsx';
import Architecture from './pages/Architecture.jsx';
import Guide        from './pages/Guide.jsx';
import Resources    from './pages/Resources.jsx';
import Connectivity from './pages/Connectivity.jsx';

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/guide"        element={<Guide />} />
          <Route path="/resources"    element={<Resources />} />
          <Route path="/connectivity" element={<Connectivity />} />
          <Route path="*" element={
            <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: 120 }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
              <h1 style={{ color: '#FF9900', marginBottom: 8 }}>404 — Page not found</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>This route doesn't exist in the VPC.</p>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
