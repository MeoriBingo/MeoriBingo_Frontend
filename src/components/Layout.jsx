import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  )
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <path d="M3 3h2l.4 2M7 13h10l3-8H5.4M7 13 5.4 5M7 13l-1.5 6h11" />
    </svg>
  )
}

function Layout() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="layout">
            <header className="layout__header">
                <div className="layout__logo">BING-GOO</div>
            </header>

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
                        <IconHome />
                        Home
                    </button>
                    <button 
                        type="button" 
                        className={`layout__nav-item ${location.pathname === '/friend' ? 'layout__nav-item--active' : ''}`} 
                        onClick={() => navigate('/friend')}
                    >
                        <IconCart />
                        Friend
                    </button>
                    <button 
                        type="button" 
                        className={`layout__nav-item ${location.pathname === '/mypage' ? 'layout__nav-item--active' : ''}`} 
                        onClick={() => navigate('/mypage')}
                    >
                        <IconCart />
                        MyPage
                    </button>
                    <button 
                        type="button" 
                        className={`layout__nav-item ${location.pathname === '/admin' ? 'layout__nav-item--active' : ''}`} 
                        onClick={() => navigate('/admin')}
                    >
                        <IconCart />
                        ADMIN
                    </button>
                </div>
            </nav>
        </div>
    );
}

export default Layout;
