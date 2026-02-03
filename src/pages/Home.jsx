import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { checkAuth } from '../api';

function Home() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    checkAuth()
      .then(() => setIsAuth(true))
      .catch(() => setIsAuth(false));
  }, []);

  return (
    <div className="center-page">
      {!isAuth && (
        <button className="login-btn" onClick={() => navigate('/login')}>
          Вход
        </button>
      )}

      <button className="main-btn" onClick={() => navigate('/track')}>
        Отследить статус авто
      </button>
    </div>
  );
}

export default Home;