import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { checkAuth, logout } from './api';
import Home from './pages/Home';
import Login from './pages/Login';
import Operator from './pages/Operator';
import Track from './pages/Track';
import AdminPanel from './pages/AdminPanel';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Проверка админа по логину (из env или конкретный логин)
  const isAdmin = user?.login === process.env.REACT_APP_ADMIN_LOGIN;

  return (
    <Router>
      <div>
        {user && (
          <div style={{ padding: '10px', background: '#f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Оператор: {user.login} {isAdmin && '(Админ)'}</span>
            <div>
              {isAdmin && (
                <Link to="/admin" style={{ marginRight: '15px' }}>🛠 Админ</Link>
              )}
              <Link to="/operator" style={{ marginRight: '15px' }}>Оператор</Link>
              <button onClick={handleLogout}>Выйти</button>
            </div>
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={
            user ? <Navigate to="/operator" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/operator" element={
            user ? <Operator /> : <Navigate to="/login" />
          } />
          <Route path="/track" element={<Track />} />
          <Route path="/admin" element={
            isAdmin ? <AdminPanel /> : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;