import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MainPage from './pages/MainPage'
import FriendPage from './pages/FriendPage'
import MyPage from './pages/MyPage'
import AdminPage from './pages/AdminPage'
import KakaoCallbackPage from './pages/KakaoCallbackPage'
import LoginFailPage from './pages/LoginFailPage'
import { UserProvider } from './contexts/UserContext'
import Layout from './components/Layout'
import PhotoUploadModal from './components/PhotoUploadModal'

function App() {
  const photoPreviewCell = {
    id: 1,
    mission_title: '샘플 미션',
  }

  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
          <Route path="/login-fail" element={<LoginFailPage />} />

          <Route element={<Layout />}>
            <Route path="/main" element={<MainPage />} />
            <Route path="/friend" element={<FriendPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}

export default App