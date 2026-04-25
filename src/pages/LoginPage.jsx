import { useEffect } from 'react';
import './LoginPage.css'

const KakaoLogoIcon = () => (
    <span className="social-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="social-icon__svg">
            <path
                d="M12 4C7.03 4 3 7.13 3 10.98c0 2.48 1.67 4.66 4.18 5.91l-.96 3.07a.45.45 0 0 0 .69.5l3.76-2.55c.44.05.89.08 1.33.08 4.97 0 9-3.13 9-6.98S16.97 4 12 4z"
                fill="#191919"
            />
        </svg>
    </span>
);

const NaverLogoIcon = () => (
    <span className="social-icon social-icon--naver" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="social-icon__svg">
            <path d="M16.273 12.845 7.377 0H0v24h7.727V11.154L16.623 24h7.377V0h-7.727z" fill="#FFFFFF" />
        </svg>
    </span>
);

const GoogleLogoIcon = () => (
    <span className="social-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="social-icon__svg">
            <path d="M21.6 12.23c0-.68-.06-1.33-.17-1.95H12v3.69h5.39a4.61 4.61 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.98-4.3 2.98-7.26z" fill="#4285F4" />
            <path d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.23-2.5c-.9.6-2.04.95-3.4.95-2.61 0-4.82-1.77-5.61-4.14H3.05v2.6A10 10 0 0 0 12 22z" fill="#34A853" />
            <path d="M6.39 13.87A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.87v-2.6H3.05A10 10 0 0 0 2 12c0 1.62.39 3.15 1.05 4.47l3.34-2.6z" fill="#FBBC05" />
            <path d="M12 5.99c1.47 0 2.8.51 3.84 1.51l2.88-2.88C16.96 2.98 14.69 2 12 2a10 10 0 0 0-8.95 5.53l3.34 2.6c.79-2.37 3-4.14 5.61-4.14z" fill="#EA4335" />
        </svg>
    </span>
);

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
            <div className="login-container__narrow">
                <div className="login-header">
                    <h1>BINGOO</h1>
                    <p className="login-subtitle">오늘의 미션을 완성해보세요</p>
                </div>

                <div className="login-actions">
                    <button className="login-btn login-btn--kakao" onClick={handleKakaoLogin}>
                        <span className="login-btn__row">
                            <span className="login-btn__icon-wrap">
                                <KakaoLogoIcon />
                            </span>
                            <span className="login-btn__label">카카오로 시작하기</span>
                        </span>
                    </button>
                    <button className="login-btn login-btn--naver">
                        <span className="login-btn__row">
                            <span className="login-btn__icon-wrap">
                                <NaverLogoIcon />
                            </span>
                            <span className="login-btn__label">네이버로 시작하기</span>
                        </span>
                    </button>
                    <button className="login-btn login-btn--google">
                        <span className="login-btn__row">
                            <span className="login-btn__icon-wrap">
                                <GoogleLogoIcon />
                            </span>
                            <span className="login-btn__label">구글로 시작하기</span>
                        </span>
                    </button>
                    <p className="login-caution">주의: 14세 미만 청소년은 보호자와 함께 이용하는 것을 권장합니다.</p>
                </div>
            </div>
        </div>
    )
}
export default LoginPage
