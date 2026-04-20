import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

function KakaoCallbackPage() {
    const navigate = useNavigate();
    const isProcessed = useRef(false);
    const viteApiBaseUrl = import.meta.env.VITE_API_BASE_URL
    console.log(viteApiBaseUrl)

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
                        localStorage.setItem('user', JSON.stringify(result.data.user));

                        // 닉네임 설정 필요 등의 로직은 추후 추가
                        navigate('/main');
                    } else {
                        console.error('Login failed logic:', result.message);
                        navigate('/login-fail');
                    }
                } catch (error) {
                    console.error('Error connecting to backend server', error);
                    navigate('/login-fail');
                }
            };

            sendCodeToBackend();
        } else {
            console.error('인가 코드가 없습니다.');
            navigate('/');
        }
    }, [navigate]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <h2>카카오 로그인 처리 중...</h2>
            <p>잠시만 기다려주세요.</p>
        </div>
    );
}

export default KakaoCallbackPage;
