import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { checkAuth } from '../api';

function Home() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(null); // null = загрузка, false = не авторизован, true = авторизован

  useEffect(() => {
    checkAuth()
      .then(() => setIsAuth(true))
      .catch(() => setIsAuth(false));
  }, []);

  if (isAuth === null) return <div>Загрузка...</div>;

  return (
    <div className="center-page">
      {!isAuth && (
        <button className="login-btn" onClick={() => navigate('/login')}>
          Вход
        </button>
      )}

      {isAuth && (
        <button className="login-btn" onClick={() => navigate('/operator')}>
          К оператору
        </button>
      )}

      <button className="main-btn" onClick={() => navigate('/track')}>
        Отследить статус авто
      </button>
    </div>
  );
}

export default Home;