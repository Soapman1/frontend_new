import { useState, useEffect } from 'react';
import { login } from '../api';
import { Link } from 'react-router-dom';

function Login({ onLogin }) {
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedLogin = localStorage.getItem('savedLogin');
    if (savedLogin) {
      setLoginValue(savedLogin);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await login(loginValue, password, rememberMe);
      onLogin(data.user);
      
      if (rememberMe) {
        localStorage.setItem('savedLogin', loginValue);
      } else {
        localStorage.removeItem('savedLogin');
      }
    } catch (err) {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">
          Вход для оператора
        </h2>
        
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Логин"
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            className="login-input"
            autoFocus
          />
          
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          
          <label className="login-checkbox">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Запомнить логин
          </label>
          
          <button type="submit" className="login-btn-submit">
            Войти
          </button>
        </form>
        
        <Link to="/" className="back-link">
          ← На главную
        </Link>
      </div>
    </div>
  );
}

export default Login;