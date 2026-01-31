import { useState, useEffect } from 'react';
import { getCars, addCar, updateCarStatus, deleteCar, updateCar } from '../api';

function Operator() {
  const [cars, setCars] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);

  const [brand, setBrand] = useState('');
  const [plate, setPlate] = useState('');
  const [waitTime, setWaitTime] = useState('');

  const fetchCars = async () => {
    const data = await getCars();
    setCars(data);
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const resetForm = () => {
    setBrand('');
    setPlate('');
    setWaitTime('');
    setEditingCar(null);
  };

  const isValidPlate = (plate) => {
    if (!plate || plate.length < 3) return false;
    const map = {'А':'A','В':'B','Е':'E','К':'K','М':'M','Н':'H','О':'O','Р':'P','С':'C','Т':'T','У':'Y','Х':'X'};
    const normalized = plate.toUpperCase().replace(/\s/g, '').replace(/-/g, '').replace(/[АВЕКМНОРСТУХ]/g, char => map[char] || char);
    return /^[A-Z0-9]+$/.test(normalized);
  };

  const handleAddCar = async () => {
    if (!brand || !plate || !waitTime) return alert('Заполни все поля');

    if (!isValidPlate(plate)) {
      return alert('Номер содержит недопустимые буквы. Разрешены только: A, B, E, K, M, H, O, P, C, T, Y, X (и русские аналоги)');
    }

    try {
      await addCar({ 
        brand: brand.toUpperCase(), 
        plate_number: plate.toUpperCase(), 
        wait_time: Number(waitTime) 
      });
      resetForm();
      setShowModal(false);
      fetchCars();
      alert('Авто добавлено!');
    } catch (error) {
      alert('Ошибка: ' + (error.response?.data?.error || 'Не удалось добавить'));
    }
  };

  const handleEditCar = async () => {
    if (!brand || !plate || !waitTime) return alert('Заполни все поля');

    if (!isValidPlate(plate)) {
      return alert('Номер содержит недопустимые буквы. Разрешены только: A, B, E, K, M, H, O, P, C, T, Y, X (и русские аналоги)');
    }

    try {
      await updateCar(editingCar.id, {
        brand: brand.toUpperCase(),
        plate_number: plate.toUpperCase(),
        wait_time: Number(waitTime)
      });
      resetForm();
      setShowModal(false);
      fetchCars();
    } catch (error) {
      alert('Ошибка: ' + (error.response?.data?.error || 'Не удалось обновить'));
    }
  };

  const handleDeleteCar = async (id) => {
    if (!window.confirm('Удалить авто?')) return;
    
    try {
      await deleteCar(id);
      fetchCars();
    } catch (error) {
      alert('Ошибка удаления');
    }
  };

  const openEditModal = (car) => {
    setEditingCar(car);
    setBrand(car.brand);
    setPlate(car.plate_number);
    setWaitTime(car.wait_time);
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleStatusChange = async (id, status) => {
    await updateCarStatus(id, status);
    fetchCars();
  };

  return (
    <div className="page">
      <h2>Личный кабинет</h2>
      <button onClick={openAddModal}>Добавить авто</button>

      <ul className="car-list">
        {cars.map(car => (
          <li key={car.id} className="car-item">
            <div>
              <div><b>{car.brand}</b> — {car.plate_number}</div>
              <div>Ожидание: {car.wait_time} мин | Статус: 
                <select 
                  value={car.status} 
                  onChange={e => handleStatusChange(car.id, e.target.value)}
                >
                  <option>В очереди</option>
                  <option>В работе</option>
                  <option>Готово</option>
                  <option>Завершено</option>
                </select>
              </div>
            </div>
            
            <div className="car-actions">
              <button 
                onClick={() => openEditModal(car)}
                className="btn-edit"
              >
                ✏️ Редактировать
              </button>
              <button 
                onClick={() => handleDeleteCar(car.id)}
                className="btn-delete"
              >
                🗑️ Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingCar ? 'Редактировать авто' : 'Добавить авто'}</h3>
            <input 
              placeholder="Марка авто" 
              value={brand} 
              onChange={e => setBrand(e.target.value.toUpperCase())} 
            />
            <input 
              placeholder="Номер авто" 
              value={plate} 
              onChange={e => setPlate(e.target.value.toUpperCase())} 
            />
            <input 
              placeholder="Время ожидания (мин)" 
              type="number"
              value={waitTime} 
              onChange={e => setWaitTime(e.target.value)} 
            />
            <button onClick={editingCar ? handleEditCar : handleAddCar}>
              {editingCar ? 'Сохранить' : 'Добавить'}
            </button>
            <button onClick={() => setShowModal(false)} className="btn-secondary">Отмена</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Operator;