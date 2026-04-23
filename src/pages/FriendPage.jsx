import { useState, useEffect, useContext } from 'react';
import apiClient from '../api/apiClient';
import { UserContext } from '../contexts/UserContext';
import FriendBingoModal from '../components/FriendBingoModal';
import './FriendPage.css';

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

    const formatStatusLabel = (status) => {
        if (status === 'PENDING') return '대기 중';
        if (status === 'ACCEPTED') return '수락됨';
        if (status === 'REJECTED') return '거절됨';
        return status || '-';
    };

    return (
        <div className="friend-page">
            <section className="friend-page__card friend-page__card--search">
                <div className="friend-page__card-head">
                    <span className="friend-page__card-icon-wrap" aria-hidden="true">
                        <i className="fa-solid fa-magnifying-glass friend-page__card-icon" />
                    </span>
                    <h3 className="friend-page__card-title">친구 찾기</h3>
                </div>

                <div className="friend-page__search-row">
                    <input
                        type="text"
                        placeholder="닉네임 검색"
                        value={searchNickname}
                        onChange={(e) => setSearchNickname(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="friend-page__search-input"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className={`friend-page__search-btn${isSearching ? ' friend-page__search-btn--busy' : ''}`}
                    >
                        {isSearching ? '검색 중...' : '검색'}
                    </button>
                </div>

                {searchResults.length > 0 && (
                    <ul className="friend-page__list">
                        {searchResults.map((result) => (
                            <li key={result.id} className="friend-page__list-item">
                                <div className="friend-page__user">
                                    {result.profile_image_url ? (
                                        <img src={result.profile_image_url} alt={result.nickname} className="friend-page__avatar" />
                                    ) : (
                                        <span className="friend-page__avatar friend-page__avatar--fallback">👤</span>
                                    )}
                                    <span className="friend-page__nickname">{result.nickname}</span>
                                </div>
                                <button
                                    onClick={() => handleRequestFriend(result.id)}
                                    className="friend-page__action-btn"
                                >
                                    친구 신청
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="friend-page__card friend-page__card--friends">
                <div className="friend-page__card-head">
                    <span className="friend-page__card-icon-wrap" aria-hidden="true">
                        <i className="fa-solid fa-user-group friend-page__card-icon" />
                    </span>
                    <h3 className="friend-page__card-title">현재 친구 목록</h3>
                </div>
                {isLoading ? (
                    <p className="friend-page__empty-text">친구 목록을 불러오는 중...</p>
                ) : friends.length > 0 ? (
                    <ul className="friend-page__list">
                        {friends.map((friend, idx) => (
                            <li
                                key={idx}
                                className="friend-page__list-item friend-page__list-item--clickable"
                                onClick={() => setSelectedFriend(friend)}
                            >
                                <span className="friend-page__avatar friend-page__avatar--fallback">👤</span>
                                <span className="friend-page__nickname">{friend.nickname || '이름 없음'}</span>
                                <span className="friend-page__link-text">빙고 보기</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="friend-page__empty-text">등록된 친구가 없습니다.</p>
                )}
            </section>

            <div className="friend-page__split">
                <section className="friend-page__card friend-page__card--sent">
                    <div className="friend-page__card-head friend-page__card-head--small">
                        <span className="friend-page__card-icon-wrap" aria-hidden="true">
                            <i className="fa-solid fa-paper-plane friend-page__card-icon" />
                        </span>
                        <h4 className="friend-page__card-title friend-page__card-title--small">내가 보낸 요청</h4>
                    </div>
                    {!sentRequests ? (
                        <p className="friend-page__empty-text friend-page__empty-text--small">로딩 중...</p>
                    ) : sentRequests.error ? (
                        <p className="friend-page__error-text">{sentRequests.error}</p>
                    ) : Array.isArray(sentRequests) && sentRequests.length > 0 ? (
                        <ul className="friend-page__list">
                            {sentRequests.map((req, idx) => (
                                <li key={idx} className="friend-page__list-item friend-page__list-item--compact">
                                    <span className="friend-page__nickname">{req.fetchedNickname}</span>
                                    <span className="friend-page__status-chip">{formatStatusLabel(req.status)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="friend-page__empty-text friend-page__empty-text--small">보낸 요청이 없습니다.</p>
                    )}
                </section>

                <section className="friend-page__card friend-page__card--received">
                    <div className="friend-page__card-head friend-page__card-head--small">
                        <span className="friend-page__card-icon-wrap" aria-hidden="true">
                            <i className="fa-solid fa-inbox friend-page__card-icon" />
                        </span>
                        <h4 className="friend-page__card-title friend-page__card-title--small">받은 요청</h4>
                    </div>
                    {!receivedRequests ? (
                        <p className="friend-page__empty-text friend-page__empty-text--small">로딩 중...</p>
                    ) : receivedRequests.error ? (
                        <p className="friend-page__error-text">{receivedRequests.error}</p>
                    ) : Array.isArray(receivedRequests) && receivedRequests.length > 0 ? (
                        <ul className="friend-page__list">
                            {receivedRequests.map((req, idx) => (
                                <li key={idx} className="friend-page__list-item friend-page__list-item--column">
                                    <div className="friend-page__request-row">
                                        <div className="friend-page__request-user">
                                            <span className="friend-page__nickname">{req.nickname}</span>
                                            <span className="friend-page__status-chip">{formatStatusLabel(req.status)}</span>
                                        </div>
                                        {req.status === 'PENDING' && (
                                            <div className="friend-page__request-actions">
                                                <button
                                                    onClick={() => handleRespondRequest(req.friendship_id, 'ACCEPTED')}
                                                    className="friend-page__mini-btn friend-page__mini-btn--accept"
                                                >
                                                    수락
                                                </button>
                                                <button
                                                    onClick={() => handleRespondRequest(req.friendship_id, 'REJECTED')}
                                                    className="friend-page__mini-btn friend-page__mini-btn--reject"
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
                        <p className="friend-page__empty-text friend-page__empty-text--small">받은 요청이 없습니다.</p>
                    )}
                </section>
            </div>

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
