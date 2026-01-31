import { useState, useEffect } from 'react';
import { login } from '../api';

function Login({ onLogin }) {
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  // Загружаем только логин (пароль никогда не сохраняем!)
  useEffect(() => {
    const savedLogin = localStorage.getItem('savedLogin');
    if (savedLogin) {
      setLoginValue(savedLogin);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await login(loginValue, password, rememberMe);
      onLogin(data.user);
      
      // Сохраняем только логин, пароль не сохраняем никогда!
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
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Вход для оператора</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Логин"
          value={loginValue}
          onChange={(e) => setLoginValue(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          autoComplete="current-password"
        />
        
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Запомнить меня на этом устройстве
        </label>
        
        <button type="submit" style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Войти
        </button>
      </form>
      
      <small style={{ color: '#666', marginTop: '10px', display: 'block' }}>
        * Пароль никогда не сохраняется в браузере (только на сервере)
      </small>
    </div>
  );
}

export default Login;