import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

function Layout() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="layout">
            <main className="layout__content">
                <Outlet />
            </main>

            <nav className="layout__nav" aria-label="하단 메뉴">
                <div className="layout__nav-inner">
                    <button
                        type="button"
                        className={`layout__nav-item ${location.pathname === '/main' ? 'layout__nav-item--active' : ''}`}
                        onClick={() => navigate('/main')}
                    >
                        <i className="fa-solid fa-house-chimney" aria-hidden />
                        Home
                    </button>
                    <button
                        type="button"
                        className={`layout__nav-item ${location.pathname === '/friend' ? 'layout__nav-item--active' : ''}`}
                        onClick={() => navigate('/friend')}
                    >
                        <i className="fa-solid fa-user-group" aria-hidden />
                        Friend
                    </button>
                    <button
                        type="button"
                        className={`layout__nav-item ${location.pathname === '/mypage' ? 'layout__nav-item--active' : ''}`}
                        onClick={() => navigate('/mypage')}
                    >
                        <i className="fa-solid fa-user" aria-hidden />
                        MyPage
                    </button>
                    <button
                        type="button"
                        className={`layout__nav-item ${location.pathname === '/admin' ? 'layout__nav-item--active' : ''}`}
                        onClick={() => navigate('/admin')}
                    >
                        <i className="fa-solid fa-shield-halved" aria-hidden />
                        Admin
                    </button>
                    <button
                        type="button"
                        className={`layout__nav-item ${location.pathname === '/contact-us' ? 'layout__nav-item--active' : ''}`}
                        onClick={() => navigate('/contact-us')}
                    >
                        <i className="fa-solid fa-envelope" aria-hidden />
                        Contact
                    </button>
                </div>
            </nav>
        </div>
    );
}

export default Layout;
