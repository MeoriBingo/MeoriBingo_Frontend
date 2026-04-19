import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

function MyPage() {
    const { updateUser } = useContext(UserContext);
    const [originalProfile, setOriginalProfile] = useState({ nickname: '', email: '' });
    const [currentProfile, setCurrentProfile] = useState({ nickname: '', email: '' });
    const [userId, setUserId] = useState(null);
    const [isNicknameEditing, setIsNicknameEditing] = useState(false);
    const [isEmailEditing, setIsEmailEditing] = useState(false);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user && user.id) {
                        setUserId(user.id);
                        const baseUrl = import.meta.env.VITE_API_BASE_URL;
                        const response = await fetch(`${baseUrl}/api/users/${user.id}`);
                        if (response.ok) {
                            const data = await response.json();
                            const profileData = {
                                nickname: data.nickname || '',
                                email: data.email || ''
                            };
                            setOriginalProfile(profileData);
                            setCurrentProfile(profileData);
                        } else {
                            console.error('Failed to fetch user info');
                            alert('유저 정보를 불러오는데 실패했습니다.');
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };

        fetchUserInfo();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!userId) return;

        const body = {};
        if (currentProfile.nickname !== originalProfile.nickname) {
            body.nickname = currentProfile.nickname;
        }
        if (currentProfile.email !== originalProfile.email) {
            body.email = currentProfile.email;
        }

        if (Object.keys(body).length === 0) {
            alert('수정된 정보가 없습니다.');
            return;
        }

        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${baseUrl}/api/users/me/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                alert('프로필이 성공적으로 수정되었습니다.');
                setOriginalProfile(currentProfile);
                setIsNicknameEditing(false);
                setIsEmailEditing(false);
                
                // localStorage에 저장된 닉네임 등을 동기화 (전역 상태 업데이트 포함)
                updateUser(body);
            } else {
                alert('프로필 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('프로필 수정 중 오류가 발생했습니다.');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px' }}>마이페이지</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label htmlFor="nickname">닉네임</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            type="text" 
                            id="nickname" 
                            name="nickname" 
                            value={currentProfile.nickname} 
                            onChange={handleChange} 
                            disabled={!isNicknameEditing}
                            style={{ padding: '8px', fontSize: '16px', flex: 1, backgroundColor: isNicknameEditing ? 'white' : '#f0f0f0', color: isNicknameEditing ? '#333' : '#666', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        <button 
                            type="button" 
                            onClick={() => {
                                if (isNicknameEditing) {
                                    setCurrentProfile(prev => ({ ...prev, nickname: originalProfile.nickname }));
                                }
                                setIsNicknameEditing(!isNicknameEditing);
                            }}
                            style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: isNicknameEditing ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
                        >
                            {isNicknameEditing ? '취소' : '수정'}
                        </button>
                    </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label htmlFor="email">이메일</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            value={currentProfile.email} 
                            onChange={handleChange} 
                            disabled={!isEmailEditing}
                            style={{ padding: '8px', fontSize: '16px', flex: 1, backgroundColor: isEmailEditing ? 'white' : '#f0f0f0', color: isEmailEditing ? '#333' : '#666', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        <button 
                            type="button" 
                            onClick={() => {
                                if (isEmailEditing) {
                                    setCurrentProfile(prev => ({ ...prev, email: originalProfile.email }));
                                }
                                setIsEmailEditing(!isEmailEditing);
                            }}
                            style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: isEmailEditing ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
                        >
                            {isEmailEditing ? '취소' : '수정'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        수정하기
                    </button>
                </div>
            </form>
        </div>
    );
}

export default MyPage;