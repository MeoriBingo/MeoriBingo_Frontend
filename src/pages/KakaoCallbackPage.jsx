import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function KakaoCallbackPage() {
    const navigate = useNavigate();
    const isProcessed = useRef(false);

    useEffect(() => {
        if (isProcessed.current) return;
        isProcessed.current = true;

        const code = new URL(window.location.href).searchParams.get("code");

        if (code) {
            const sendCodeToBackend = async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            "authorizationCode": code
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();

                        if (result.status === "success") {
                            // 로컬 스토리지에 토큰 및 유저 정보 저장
                            localStorage.setItem('accessToken', result.data.accessToken);
                            localStorage.setItem('user', JSON.stringify(result.data.user));

                            // 닉네임 설정 필요 등의 로직은 추후 추가
                            navigate('/login-success');
                        } else {
                            console.error('Login failed logic:', result.message);
                            navigate('/login-fail');
                        }
                    } else {
                        console.error('Login failed with status:', response.status);
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
            <h2>카카오 로그인 처리 중입니다...</h2>
            <p>잠시만 기다려주세요.</p>
        </div>
    );
}

export default KakaoCallbackPage;
