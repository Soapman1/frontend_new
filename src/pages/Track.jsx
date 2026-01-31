import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://car-status-backend.onrender.com';

const normalizePlate = (plate) => {
  if (!plate) return '';
  const map = {'А':'A','В':'B','Е':'E','К':'K','М':'M','Н':'H','О':'O','Р':'P','С':'C','Т':'T','У':'Y','Х':'X'};
  return plate.toString().toUpperCase().replace(/\s/g, '').replace(/-/g, '').replace(/[АВЕКМНОРСТУХ]/g, char => map[char] || char);
};

const formatTime = (ms) => {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

function Track() {
  const [searchPlate, setSearchPlate] = useState('');
  const [trackedCars, setTrackedCars] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('trackedCars');
    if (saved) {
      try {
        setTrackedCars(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved cars', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('trackedCars', JSON.stringify(trackedCars));
  }, [trackedCars]);

  useEffect(() => {
    if (trackedCars.length === 0) return;

    const checkStatuses = async () => {
      const updated = await Promise.all(
        trackedCars.map(async (car) => {
          try {
            const normalized = normalizePlate(car.plate_number);
            const res = await axios.get(`${API_URL}/api/public/car-status?plate=${normalized}`);
            
            const data = res.data;
            
            // Активна если не "Завершено" (не найдена в БД)
            const isActive = true;
            
            return { 
              ...car, 
              ...data, 
              isActive,
              lastCheck: Date.now()
            };
          } catch (err) {
            // 404 = статус "Завершено" (удалена из БД)
            if (err.response?.status === 404) {
              return { 
                ...car, 
                status: 'Завершено', 
                isActive: false,
                lastCheck: Date.now()
              };
            }
            return car;
          }
        })
      );
      setTrackedCars(updated);
    };

    checkStatuses();
    const interval = setInterval(checkStatuses, 5000);
    return () => clearInterval(interval);
  }, [trackedCars.map(c => c.plate_number).join(',')]);

  const addToTrack = async () => {
    if (!searchPlate.trim()) return;
    
    const normalized = normalizePlate(searchPlate);
    
    if (trackedCars.some(c => normalizePlate(c.plate_number) === normalized)) {
      alert('Этот номер уже отслеживается');
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/api/public/car-status?plate=${normalized}`);
      const data = res.data;
      
      const newCar = {
        plate_number: data.plate_number || searchPlate.toUpperCase(),
        status: data.status || 'В очереди',
        wait_time: data.wait_time,
        created_at: data.created_at,
        isActive: true,
        addedAt: Date.now()
      };
      
      setTrackedCars([...trackedCars, newCar]);
      setSearchPlate('');
    } catch (err) {
      if (err.response?.status === 404) {
        setTrackedCars([...trackedCars, {
          plate_number: searchPlate.toUpperCase(),
          status: 'Не найдено',
          isActive: false,
          addedAt: Date.now()
        }]);
        setSearchPlate('');
      } else {
        alert('Ошибка при поиске');
      }
    }
  };

  const removeCar = (plate) => {
    setTrackedCars(trackedCars.filter(c => c.plate_number !== plate));
  };

  const getRemainingTime = (car) => {
    if (!car.created_at || !car.wait_time) return null;
    const endTime = new Date(car.created_at).getTime() + car.wait_time * 60000;
    return endTime - currentTime;
  };

  // Разделение: активные все кроме "Завершено"
  const activeCars = trackedCars.filter(c => c.status !== 'Завершено');
  const inactiveCars = trackedCars.filter(c => c.status === 'Завершено');

  return (
    <div className="page">
      <h2>Отслеживание авто</h2>
      
      <div className="search-block">
        <input
          placeholder="Введите номер авто"
          value={searchPlate}
          onChange={e => setSearchPlate(e.target.value.toUpperCase())}
        />
        <button onClick={addToTrack}>Добавить к отслеживанию</button>
      </div>

      {/* АКТИВНЫЕ */}
      {activeCars.length > 0 && (
        <div className="section-active">
          <h3 className="section-title section-title-active">
            🟢 Активные ({activeCars.length})
          </h3>
          <ul className="car-list">
            {activeCars.map(car => {
              const remaining = getRemainingTime(car);
              const isTimeOver = remaining !== null && remaining <= 0;
              const isReady = car.status === 'Готово';
              
              return (
                <li key={car.plate_number} className="car-item car-active">
                  <div className="car-content">
                    <div className="car-plate">{car.plate_number}</div>
                    <div className="car-status">
                      Статус: <span className={isReady ? 'status-active-text' : 'status-active-text'}>{car.status}</span>
                    </div>
                    
                    {/* Таймер только если не "Готово" */}
                    {!isReady && (
                      <div className="timer-block">
                        <div className="timer-header">
                          <span>Осталось:</span>
                          {isTimeOver ? (
                            <span className="timer-waiting">Ещё чуть-чуть...</span>
                          ) : (
                            <span className={`timer-value ${remaining < 60000 ? 'timer-value-urgent' : 'timer-value-normal'}`}>
                              {formatTime(remaining)}
                            </span>
                          )}
                        </div>
                        
                        {/* Прогресс-бар только если время не вышло */}
                        {!isTimeOver && (
                          <div className="timer-bar-bg">
                            <div className="timer-bar-fill" style={{
                              width: `${Math.max(0, (remaining / (car.wait_time * 60000)) * 100)}%`,
                              background: remaining < 60000 ? '#ef4444' : '#22c55e'
                            }} />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Когда Готово - показываем сообщение */}
                    {isReady && (
                      <div style={{ marginTop: '10px', color: '#16a34a', fontWeight: '600', fontSize: '14px' }}>
                        ✅ Можно забирать! (Таймер остановлен)
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => removeCar(car.plate_number)}
                    className="btn-delete"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* НЕАКТИВНЫЕ */}
      {inactiveCars.length > 0 && (
        <div className="section-inactive">
          <h3 className="section-title section-title-inactive">
            ⚪ Завершенные ({inactiveCars.length})
          </h3>
          <ul className="car-list">
            {inactiveCars.map(car => (
              <li key={car.plate_number} className="car-item car-inactive">
                <div className="car-content">
                  <div className="car-plate car-plate-muted">{car.plate_number}</div>
                  <div className="car-status">
                    <span className="status-done">✅ Завершено (выдано клиенту)</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => removeCar(car.plate_number)}
                  className="btn-delete"
                  style={{ opacity: 0.6 }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {trackedCars.length === 0 && (
        <div className="empty-state">
          Добавьте номер авто для отслеживания
        </div>
      )}
    </div>
  );
}

export default Track;