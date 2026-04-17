function LoginSuccessPage() {
    // 저장된 로컬스토리지를 확인해볼 수 있는 임시 페이지
    const nickname = (() => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            return user ? user.nickname : '고객';
        } catch {
            return '고객';
        }
    })();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <h1>로그인 성공</h1>
            <p>환영합니다, {nickname}님</p>
            <a href="/" style={{ marginTop: '20px', padding: '10px 20px', background: '#FEE500', color: 'black', textDecoration: 'none', borderRadius: '5px' }}>
                메인으로 가기
            </a>
        </div>
    );
}

export default LoginSuccessPage;
