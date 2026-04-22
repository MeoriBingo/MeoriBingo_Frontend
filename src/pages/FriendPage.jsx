import { useState, useEffect, useContext } from 'react';
import apiClient from '../api/apiClient';
import { UserContext } from '../contexts/UserContext';
import FriendBingoModal from '../components/FriendBingoModal';

function FriendPage() {
    const { user } = useContext(UserContext);
    const [friends, setFriends] = useState([]);
    const [sentRequests, setSentRequests] = useState(null);
    const [receivedRequests, setReceivedRequests] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [searchNickname, setSearchNickname] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // 친구 빙고판 모달 상태
    const [selectedFriend, setSelectedFriend] = useState(null);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await apiClient.get('/api/social/friends');
                const result = response.data;
                const friendList = Array.isArray(result.data)
                    ? result.data
                    : (Array.isArray(result) ? result : Object.values(result).find(Array.isArray) || []);
                setFriends(friendList);
            } catch (error) {
                console.error('API error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchSentRequests = async () => {
            try {
                const response = await apiClient.get('/api/social/friends/requests/sent');
                const requests = Array.isArray(response.data) ? response.data : [];
                
                const detailedRequests = await Promise.all(
                    requests.map(async (req) => {
                        try {
                            const userRes = await apiClient.get(`/api/users/${req.user_id}`);
                            return {
                                ...req,
                                fetchedNickname: userRes.data.nickname
                            };
                        } catch (err) {
                            console.error(`User ${req.user_id} info fetch error:`, err);
                            return { ...req, fetchedNickname: '알 수 없음' };
                        }
                    })
                );
                
                setSentRequests(detailedRequests);
            } catch (error) {
                console.error('Sent requests API error:', error);
                setSentRequests({ error: '데이터를 불러오지 못했습니다.' });
            }
        };

        const fetchReceivedRequests = async () => {
            try {
                const response = await apiClient.get('/api/social/friends/requests/received');
                const requests = Array.isArray(response.data) ? response.data : [];
                setReceivedRequests(requests);
            } catch (error) {
                console.error('Received requests API error:', error);
                setReceivedRequests({ error: '데이터를 불러오지 못했습니다.' });
            }
        };

        fetchFriends();
        fetchSentRequests();
        fetchReceivedRequests();
    }, []);

    const handleSearch = async () => {
        if (!searchNickname.trim()) {
            alert('검색할 닉네임을 입력해주세요.');
            return;
        }
        setIsSearching(true);
        try {
            const response = await apiClient.get(`/api/social/friends/search?nickname=${searchNickname}`);
            setSearchResults(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Search API error:', error);
            alert('검색 중 오류가 발생했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleRequestFriend = async (targetId) => {
        if (!user || !user.id) {
            alert('로그인 정보가 없습니다.');
            return;
        }
        try {
            await apiClient.post('/api/social/friends/requests', {
                requester_id: user.id,
                addressee_id: targetId
            });
            alert('친구 신청을 보냈습니다.');
            window.location.reload();
        } catch (error) {
            console.error('Friend request error:', error);
            alert(error.response?.data?.message || '친구 신청에 실패했습니다.');
        }
    };

    const handleRespondRequest = async (friendshipId, status) => {
        if (!user || !user.id) {
            alert('로그인 정보가 없습니다.');
            return;
        }
        try {
            await apiClient.patch(`/api/social/friends/requests/${friendshipId}`, {
                user_id: user.id,
                status: status
            });
            alert(status === 'ACCEPTED' ? '친구 신청을 수락했습니다.' : '친구 신청을 거절했습니다.');
            window.location.reload();
        } catch (error) {
            console.error('Respond request error:', error);
            alert(error.response?.data?.message || '처리에 실패했습니다.');
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', boxSizing: 'border-box' }}>
            {/* 최상단: 친구 검색 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>친구 찾기</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                        type="text"
                        placeholder="닉네임 검색"
                        value={searchNickname}
                        onChange={(e) => setSearchNickname(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', backgroundColor: '#007bff', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {isSearching ? '검색 중...' : '검색'}
                    </button>
                </div>
                {searchResults.length > 0 && (
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                        {searchResults.map((result) => (
                            <li key={result.id} style={{ padding: '10px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {result.profile_image_url ? (
                                        <img src={result.profile_image_url} alt={result.nickname} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                    ) : (
                                        <span style={{ fontSize: '24px' }}>👤</span>
                                    )}
                                    <span style={{ fontWeight: 500 }}>{result.nickname}</span>
                                </div>
                                <button
                                    onClick={() => handleRequestFriend(result.id)}
                                    style={{ padding: '5px 12px', borderRadius: '4px', border: '1px solid #007bff', backgroundColor: '#fff', color: '#007bff', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    친구 신청
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 상단: 현재 친구 목록 */}
            <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eaeaea', paddingBottom: '10px', color: '#333' }}>현재 친구 목록</h3>
                {isLoading ? (
                    <p style={{ color: '#666' }}>친구 목록을 불러오는 중...</p>
                ) : friends.length > 0 ? (
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                        {friends.map((friend, idx) => (
                            <li 
                                key={idx} 
                                style={{ 
                                    padding: '12px 10px', 
                                    borderBottom: '1px solid #f0f0f0', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setSelectedFriend(friend)}
                            >
                                <span style={{ fontSize: '20px' }}>👤</span>
                                <span style={{ fontWeight: 500, color: '#444' }}>{friend.nickname || '이름 없음'}</span>
                                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#007bff' }}>빙고 보기</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>등록된 친구가 없습니다.</p>
                )}
            </div>

            {/* 하단: 친구 요청 현황 (좌/우 분할) */}
            <div style={{ flex: 1, display: 'flex', gap: '15px' }}>
                {/* 좌측: 내가 친구 요청한 목록 */}
                <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#555' }}>내가 보낸 요청</h4>
                    {!sentRequests ? (
                        <p style={{ color: '#666', fontSize: '14px' }}>로딩 중...</p>
                    ) : sentRequests.error ? (
                        <p style={{ color: '#ff4d4f', fontSize: '14px' }}>{sentRequests.error}</p>
                    ) : Array.isArray(sentRequests) && sentRequests.length > 0 ? (
                        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                            {sentRequests.map((req, idx) => (
                                <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #f9f9f9', fontSize: '14px', color: '#444' }}>
                                    <span style={{ marginRight: '8px' }}>📤</span>
                                    {req.fetchedNickname}
                                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999' }}>({req.status})</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '10px', fontSize: '14px' }}>보낸 요청이 없습니다.</p>
                    )}
                </div>

                {/* 우측: 내가 받은 친구 요청 목록 */}
                <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#555' }}>받은 요청</h4>
                    {!receivedRequests ? (
                        <p style={{ color: '#666', fontSize: '14px' }}>로딩 중...</p>
                    ) : receivedRequests.error ? (
                        <p style={{ color: '#ff4d4f', fontSize: '14px' }}>{receivedRequests.error}</p>
                    ) : Array.isArray(receivedRequests) && receivedRequests.length > 0 ? (
                        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                            {receivedRequests.map((req, idx) => (
                                <li key={idx} style={{ padding: '12px 0', borderBottom: '1px solid #f9f9f9', fontSize: '14px', color: '#444' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div>
                                            <span style={{ marginRight: '8px' }}>📥</span>
                                            <span style={{ fontWeight: 500 }}>{req.nickname}</span>
                                            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999' }}>({req.status})</span>
                                        </div>
                                        {req.status === 'PENDING' && (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button
                                                    onClick={() => handleRespondRequest(req.friendship_id, 'ACCEPTED')}
                                                    style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#28a745', color: '#fff', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    수락
                                                </button>
                                                <button
                                                    onClick={() => handleRespondRequest(req.friendship_id, 'REJECTED')}
                                                    style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#dc3545', color: '#fff', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    거절
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '10px', fontSize: '14px' }}>받은 요청이 없습니다.</p>
                    )}
                </div>
            </div>

            {/* 친구 빙고판 모달 */}
            {selectedFriend && (
                <FriendBingoModal 
                    friend={selectedFriend} 
                    onClose={() => setSelectedFriend(null)} 
                />
            )}
        </div>
    );
}

export default FriendPage;
