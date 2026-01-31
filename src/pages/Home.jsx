import { useNavigate } from 'react-router-dom';


function Home() {
const navigate = useNavigate();


return (
<div className="center-page">
<button className="login-btn" onClick={() => navigate('/login')}>
Вход
</button>


<button className="main-btn" onClick={() => navigate('/track')}>
Отследить статус авто
</button>
</div>
);
}


export default Home;