import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { checkAuth, logout } from './api';
import Home from './pages/Home';
import Login from './pages/Login';
import Operator from './pages/Operator';
import Track from './pages/Track';
import AdminPanel from './pages/AdminPanel';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Проверяем авторизацию при загрузке (через cookie)
  useEffect(() => {
    checkAuth()
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    
      <div>
        {user && (
          <div style={{ padding: '10px', background: '#f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
            <span>Оператор: {user.login}</span>
            <button onClick={handleLogout}>Выйти</button>
          </div>
        )}
        
        <Routes>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={
            user ? <Navigate to="/operator" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/operator" element={
            user ? <Operator /> : <Navigate to="/login" />
          } />
          <Route path="/track" element={<Track />} />
        </Routes>
      </div>
  );
}

export default App;