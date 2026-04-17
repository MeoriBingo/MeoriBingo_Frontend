import { useEffect } from 'react';
import './LoginPage.css'

function LoginPage() {
    useEffect(() => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(import.meta.env.VITE_KAKAO_JS_KEY);
        }
    }, []);

    const handleKakaoLogin = () => {
        if (!window.Kakao) {
            console.error('Kakao SDK not loaded');
            return;
        }

        window.Kakao.Auth.authorize({
            redirectUri: import.meta.env.VITE_KAKAO_REDIRECT_URI
        });
    };

    return (
        <div className="login-container">
            <h1>BINGO</h1>
            <p>오늘의 미션을 완성해보세요</p>

            <button className="login-btn" style={{ background: '#FEE500', cursor: 'pointer' }} onClick={handleKakaoLogin}>
                카카오로 시작하기
            </button>
            <button className="login-btn" style={{ background: '#03C75A', color: 'white' }}>
                네이버로 시작하기
            </button>
            <button className="login-btn" style={{ background: 'white', border: '1px solid #ddd' }}>
                구글로 시작하기
            </button>
        </div>
    )
}
export default LoginPage