import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_URL = 'https://car-status-backend.onrender.com';

const normalizePlate = (plate) => {
  if (!plate) return '';
  const map = {'А':'A','В':'B','Е':'E','К':'K','М':'M','Н':'H','О':'O','Р':'P','С':'C','Т':'T','У':'Y','Х':'X'};
  return plate.toString().toUpperCase().replace(/\s/g, '').replace(/-/g, '').replace(/[АВЕКМНОРСТУХ]/g, char => map[char] || char);
};

// Форматирование оставшегося времени
const formatTime = (ms) => {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Получение цвета в зависимости от оставшегося времени
const getTimeColor = (percent) => {
  if (percent <= 0) return '#a5a5a5'; // Красное (время вышло)
  if (percent < 20) return '#fd7e14'; // Оранжевое (< 20%)
  if (percent < 50) return '#ffc107'; // Желтое (< 50%)
  return '#28a745'; // Зеленое (> 50%)
};

function Track() {
  const [searchPlate, setSearchPlate] = useState('');
  const [trackingCars, setTrackingCars] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now()); // ✅ Один таймер на все машины

  // ✅ Один setInterval для всех 100+ машин (не нагружает систему)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Обновление каждую секунду
    
    return () => clearInterval(timer);
  }, []);

  // Расчет оставшегося времени для машины
  const getCarTimeInfo = (car) => {
    if (!car.created_at || !car.wait_time) return null;
    
    const created = new Date(car.created_at).getTime();
    const duration = car.wait_time * 60 * 1000; // минуты → миллисекунды
    const endTime = created + duration;
    const remaining = endTime - currentTime;
    const percent = Math.max(0, (remaining / duration) * 100);
    
    return {
      remaining,
      percent,
      isExpired: remaining <= 0,
      formatted: formatTime(remaining)
    };
  };

  const findCar = async () => {
    if (!searchPlate.trim()) return;

    try {
      const normalized = normalizePlate(searchPlate);
      const res = await axios.get(`${API_URL}/api/public/car-status?plate=${normalized}`);

      if (!res.data?.plate_number) {
        return alert('Авто не найдено');
      }

      // Проверяем не добавлено ли уже
      const exists = trackingCars.some(car => car.plate_number === res.data.plate_number);
      if (!exists) {
        setTrackingCars(prev => [...prev, res.data]);
        setSearchPlate('');
      } else {
        alert('Это авто уже в списке');
      }
    } catch (err) {
      alert('Авто не найдено');
    }
  };

  // Автообновление статусов с сервера (каждые 10 сек для снижения нагрузки)
  useEffect(() => {
    if (trackingCars.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const updated = await Promise.all(
          trackingCars.map(async car => {
            if (!car.plate_number || car.status === 'Готово') return car; // Не обновляем готовые
            
            try {
              const res = await axios.get(
                `${API_URL}/api/public/car-status?plate=${car.plate_number}`
              );
              return { ...res.data, addedAt: car.addedAt };
            } catch (err) {
              if (err.response?.status === 404) return null;
              return car;
            }
          })
        );
        setTrackingCars(updated.filter(Boolean));
      } catch (e) {
        console.error('Ошибка обновления', e);
      }
    }, 10000); // ✅ Раз в 10 секунд (не каждую секунду), чтобы не грузить сервер

    return () => clearInterval(interval);
  }, [trackingCars]);

  // Удаление машины из списка
  const removeCar = (plate) => {
    setTrackingCars(prev => prev.filter(c => c.plate_number !== plate));
  };

  return (
    <div className="page" style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h2>Отследить авто</h2>

      <div className="search-block" style={{ marginBottom: '20px' }}>
        <input
          placeholder="Введите номер авто"
          value={searchPlate}
          onChange={e => setSearchPlate(e.target.value.toUpperCase())}
          style={{ padding: '10px', fontSize: '16px', marginRight: '10px' }}
        />
        <button 
          onClick={findCar}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          Найти авто
        </button>
      </div>

      <ul className="tracking-list" style={{ listStyle: 'none', padding: 0 }}>
        {trackingCars.map(car => {
          const timeInfo = getCarTimeInfo(car);
          
          return (
            <li 
              key={car.plate_number} 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px', 
                marginBottom: '10px',
                backgroundColor: timeInfo?.isExpired ? '#f8f9fa' : '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{car.plate_number}</h3>
                  <div style={{ 
                    color: car.status === 'Готово' ? '#28a745' : '#666',
                    fontWeight: car.status === 'Готово' ? 'bold' : 'normal'
                  }}>
                    Статус: {car.status}
                  </div>
                </div>
                
                <button 
                  onClick={() => removeCar(car.plate_number)}
                  style={{ 
                    background: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    padding: '5px 10px', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* ✅ Таймер обратного отсчета */}
              {car.status !== 'Готово' && timeInfo && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '5px',
                    fontSize: '14px'
                  }}>
                    <span>Оставшееся время:</span>
                    <span style={{ 
                      fontWeight: 'bold', 
                      fontSize: '18px',
                      color: getTimeColor(timeInfo.percent)
                    }}>
                      {timeInfo.formatted}
                    </span>
                  </div>
                  
                  {/* Прогресс бар */}
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: '#e9ecef', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(100, timeInfo.percent)}%`,
                      height: '100%',
                      backgroundColor: getTimeColor(timeInfo.percent),
                      transition: 'width 1s linear',
                      borderRadius: '4px'
                    }} />
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Всего: {car.wait_time} мин
                  </div>
                  
                  {timeInfo.isExpired && (
                    <div style={{ 
                      color: '#dc3545', 
                      fontWeight: 'bold', 
                      marginTop: '5px',
                      fontSize: '14px'
                    }}>
                      Еще чуть-чуть
                    </div>
                  )}
                </div>
              )}
              
              {car.status === 'Готово' && (
                <div style={{ 
                  marginTop: '10px', 
                  color: '#28a745', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  ✅ Мойка завершена
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {trackingCars.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
          Введите номер авто для отслеживания
        </div>
      )}
    </div>
  );
}

export default Track;