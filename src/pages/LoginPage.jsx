import './LoginPage.css'

function LoginPage() {
    return (
        <div className="login-container">
        <h1>BINGO</h1>
        <p>오늘의 미션을 완성해보세요</p>

        <button className="login-btn" style={{ background: '#FEE500' }}>
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