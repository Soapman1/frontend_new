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
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: '400px',
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          color: '#333',
          fontSize: '24px'
        }}>
          Вход для оператора
        </h2>
        
        {error && (
          <div style={{ 
            color: '#721c24', 
            background: '#f8d7da',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: '500',
              color: '#555'
            }}>
              Логин
            </label>
            <input
              type="text"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: '500',
              color: '#555'
            }}>
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Введите пароль"
            />
          </div>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '25px', 
            cursor: 'pointer',
            fontSize: '14px',
            color: '#666'
          }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Запомнить логин
          </label>
          
          <button 
            type="submit"
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Войти
          </button>
        </form>
        
        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <Link to="/" style={{ 
            color: '#666', 
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            ← На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;