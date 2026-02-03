import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminPanel.css';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, expired

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки');
      setLoading(false);
    }
  };

  const deleteUser = async (id, login) => {
    if (!window.confirm(`Удалить аккаунт ${login}?`)) return;
    
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      alert('Ошибка удаления: ' + err.response?.data?.error);
    }
  };

  const extendSubscription = async (id, days) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/users/${id}/extend`,
        { days },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      alert('Ошибка: ' + err.response?.data?.error);
    }
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

  // Фильтрация
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.login.toLowerCase().includes(search.toLowerCase()) ||
                         u.carwash_name?.toLowerCase().includes(search.toLowerCase()) ||
                         u.owner_name?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === 'all') return true;
    
    const status = getStatus(u.subscription_end);
    if (filter === 'active') return status.class === 'active' || status.class === 'warning';
    if (filter === 'expired') return status.class === 'expired';
    
    return true;
  });

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;

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
          <option value="active">Активные подписки</option>
          <option value="expired">Истекшие/нет подписки</option>
        </select>
        
        <span className="count">Всего: {filteredUsers.length}</span>
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
                  <button 
                    className="btn-extend"
                    onClick={() => {
                      const days = prompt('На сколько дней продлить?');
                      if (days) extendSubscription(u.id, days);
                    }}
                    title="Продлить подписку"
                  >
                    ⏱
                  </button>
                  
                  <button 
                    className="btn-delete"
                    onClick={() => deleteUser(u.id, u.login)}
                    title="Удалить аккаунт"
                  >
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