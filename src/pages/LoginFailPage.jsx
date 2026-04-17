function LoginFailPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <h1 style={{ color: 'red' }}>로그인 실패</h1>
            <p>로그인 도중 문제가 발생했습니다.</p>
            <a href="/" style={{ marginTop: '20px', padding: '10px 20px', background: '#333', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                다시 로그인하기
            </a>
        </div>
    );
}

export default LoginFailPage;
