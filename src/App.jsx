import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MainPage from './pages/MainPage'
import FriendPage from './pages/FriendPage'
import MyPage from './pages/MyPage'
import AdminPage from './pages/AdminPage'
import KakaoCallbackPage from './pages/KakaoCallbackPage'
import LoginSuccessPage from './pages/LoginSuccessPage'
import LoginFailPage from './pages/LoginFailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/friend" element={<FriendPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
        <Route path="/login-success" element={<LoginSuccessPage />} />
        <Route path="/login-fail" element={<LoginFailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App