import { useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { UserContext } from '../contexts/UserContext';
import './LoginPage.css';

function KakaoCallbackPage() {
    const navigate = useNavigate();
    const { login } = useContext(UserContext);
    const isProcessed = useRef(false);

    useEffect(() => {
        if (isProcessed.current) return;
        isProcessed.current = true;

        const code = new URL(window.location.href).searchParams.get("code");

        if (code) {
            const sendCodeToBackend = async () => {
                try {
                    const response = await apiClient.post('/api/auth/login', {
                        "authorizationCode": code
                    });
                    const result = response.data;

                    if (result.status === "success") {
                        // 로컬 스토리지에 토큰 및 유저 정보 저장
                        localStorage.setItem('accessToken', result.data.accessToken);
                        login(result.data.user);

                        // 닉네임 설정 필요 등의 로직은 추후 추가
                        navigate('/main');
                    } else {
                        alert(`로그인에 실패했습니다: ${result.message}`);
                        navigate('/login-fail');
                    }
                } catch (error) {
                    console.error('Error connecting to backend server', error);
                    alert('서버 연결 중 오류가 발생했습니다. 다시 시도해주세요.');
                    navigate('/login-fail');
                }
            };

            sendCodeToBackend();
        } else {
            console.error('인가 코드가 없습니다.');
            alert('로그인 인가 코드가 없습니다.');
            navigate('/');
        }
    }, [navigate, login]);

    return (
        <div className="auth-page">
            <div className="auth-page__narrow">
                <h2>카카오 로그인 처리 중...</h2>
                <p>잠시만 기다려주세요.</p>
            </div>
        </div>
    );
}

export default KakaoCallbackPage;
