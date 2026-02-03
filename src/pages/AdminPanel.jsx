import { useState, useEffect } from 'react';
import { api } from '../api';
import '../styles/AdminPanel.css';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      if (err.response?.status === 401) {
        setError('Ошибка авторизации. Перелогиньтесь.');
      } else if (err.response?.status === 403) {
        setError('Нет прав администратора.');
      } else {
        setError(err.response?.data?.error || 'Ошибка загрузки');
      }
      setLoading(false);
    }
  };

  const handleDelete = async (id, login) => {
    if (!window.confirm(`Удалить аккаунт ${login}?`)) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleExtend = async (id) => {
    const days = prompt('На сколько дней продлить?');
    if (!days || isNaN(days)) return;
    try {
      await api.post(`/api/admin/users/${id}/extend`, { days: parseInt(days) });
      fetchUsers();
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLoginRedirect = () => {
    window.location.href = '/#/login';
  };

  const getStatus = (subEnd) => {
    if (!subEnd) return { text: 'Нет подписки', class: 'expired' };
    const end = new Date(subEnd);
    const now = new Date();
    const daysLeft = Math.floor((end - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { text: `Истекла ${Math.abs(daysLeft)} дн. назад`, class: 'expired' };
    if (daysLeft < 7) return { text: `Осталось ${daysLeft} дн.`, class: 'warning' };
    return { text: `Активна (${daysLeft} дн.)`, class: 'active' };
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.login?.toLowerCase().includes(search.toLowerCase()) ||
                         u.carwash_name?.toLowerCase().includes(search.toLowerCase()) ||
                         u.owner_name?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    
    const status = getStatus(u.subscription_end);
    if (filter === 'active') return status.class !== 'expired';
    if (filter === 'expired') return status.class === 'expired';
    return true;
  });

  if (loading) return <div className="loading">Загрузка...</div>;
  
  if (error) return (
    <div className="error">
      <p>❌ {error}</p>
      <button onClick={handleLoginRedirect}>Войти</button>
    </div>
  );

  return (
    <div className="admin-panel">
      <h2>🛠 Админ-панель</h2>
      
      <div className="controls">
        <input 
          type="text" 
          placeholder="Поиск..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
          <option value="all">Все аккаунты</option>
          <option value="active">Активные</option>
          <option value="expired">Истекшие/нет</option>
        </select>
        
        <span className="count">Всего: {filteredUsers.length}</span>
        <button onClick={fetchUsers} className="btn-refresh">🔄 Обновить</button>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Логин</th>
            <th>Автомойка</th>
            <th>Владелец</th>
            <th>Статус</th>
            <th>Подписка до</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(u => {
            const status = getStatus(u.subscription_end);
            return (
              <tr key={u.id} className={status.class}>
                <td>{u.id}</td>
                <td><code>{u.login}</code></td>
                <td>{u.carwash_name || '-'}</td>
                <td>{u.owner_name || '-'}</td>
                <td><span className={`status-badge ${status.class}`}>{status.text}</span></td>
                <td>{u.subscription_end ? new Date(u.subscription_end).toLocaleDateString('ru-RU') : 'Нет'}</td>
                <td className="actions">
                  <button className="btn-extend" onClick={() => handleExtend(u.id)} title="Продлить">
                    ⏱
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(u.id, u.login)} title="Удалить">
                    🗑
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPanel;