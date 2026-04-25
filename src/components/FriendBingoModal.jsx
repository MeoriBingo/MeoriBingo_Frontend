import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import LoadingOverlay from './LoadingOverlay';
import './FriendBingoModal.css';

function IconBack() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function FriendBingoModal({ friend, onClose }) {
  const [bingoBoard, setBingoBoard] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const REACTION_ICONS = {
    HEART: '❤️',
    FIRE: '🔥',
    LIKE: '👍',
    SMILE: '😊',
    BAD: '👎',
    CRY: '😢',
  };

  const fetchReactions = async (boardId) => {
    try {
      const response = await apiClient.get(`/api/social/reactions/boards/${boardId}/reactions`);
      setReactions(response.data || []);
    } catch (error) {
      console.error('리액션 로드 실패:', error);
    }
  };

  const handleReactionSubmit = async (reactionType) => {
    if (!bingoBoard || !bingoBoard.board_id || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await apiClient.post('/api/social/reactions/friends/bingo/react', {
        bingo_board_id: bingoBoard.board_id,
        reaction_type: reactionType,
      });
      // 등록 성공 후 리액션 목록 새로고침
      await fetchReactions(bingoBoard.board_id);
    } catch (error) {
      console.error('리액션 등록 실패:', error);
      alert('리액션을 남기지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchFriendBingoData = async () => {
      try {
        setIsLoading(true);
        const boardResponse = await apiClient.get(`/api/bingo/active?user_id=${friend.user_id}`);
        
        if (isMounted) {
          const boardData = boardResponse.data;
          setBingoBoard(boardData);

          if (boardData && boardData.board_id) {
            await fetchReactions(boardData.board_id);
          }
        }
      } catch (error) {
        console.error('친구 빙고 데이터 로드 실패:', error);
        if (isMounted) {
          alert('친구의 빙고판 정보를 불러오지 못했습니다.');
          onClose();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (friend && friend.user_id) {
      fetchFriendBingoData();
    }

    return () => {
      isMounted = false;
    };
  }, [friend.user_id]);

  if (!friend) return null;

  return (
    <div className="friend-bingo-modal">
      <header className="friend-bingo-modal__header">
        <button className="friend-bingo-modal__back" onClick={onClose} aria-label="뒤로가기">
          <IconBack />
        </button>
        <h2 className="friend-bingo-modal__title">{friend.nickname}님의 빙고판</h2>
      </header>

      <div className="friend-bingo-modal__content">
        {isLoading ? (
          <LoadingOverlay message="친구의 빙고판을 불러오는 중..." />
        ) : bingoBoard ? (
          <>
            <div className="friend-bingo-modal__info">
              <span className="friend-bingo-modal__badge">{bingoBoard.category}</span>
              <span className="friend-bingo-modal__badge">{bingoBoard.mode}</span>
              <span className="friend-bingo-modal__status">달성: {bingoBoard.completed_count} / 9</span>
            </div>

            <div className="friend-bingo-grid">
              {(() => {
                const cells = bingoBoard.cells || [];
                const sortedCells = [...cells].sort((a, b) => a.position - b.position);

                return sortedCells.map((cell) => {
                  const hasImage = !!cell.proof_image_url;
                  let imageUrl = cell.proof_image_url;

                  if (hasImage && imageUrl.startsWith('/')) {
                    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
                    imageUrl = `${baseUrl}${imageUrl}`;
                  }

                  const bgStyle = hasImage
                    ? {
                        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75)), url(${imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : {};

                  const tileClass = [
                    'friend-bingo-tile',
                    cell.is_completed ? 'friend-bingo-tile--completed' : '',
                    hasImage ? 'friend-bingo-tile--with-image' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div
                      key={cell.id || cell.position}
                      className={tileClass}
                      style={bgStyle}
                    >
                      <span className="friend-bingo-tile__title">{cell.mission_title}</span>
                      {cell.is_completed && <span className="friend-bingo-tile__check">✅</span>}
                    </div>
                  );
                });
              })()}
            </div>

            <div className="friend-bingo-action">
              <p className="friend-bingo-action__label">반응 남기기</p>
              <div className="friend-bingo-picker">
                {Object.entries(REACTION_ICONS).map(([type, icon]) => (
                  <button
                    key={type}
                    className="friend-bingo-picker__button"
                    onClick={() => handleReactionSubmit(type)}
                    disabled={isSubmitting}
                    title={type}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {reactions.length > 0 && (
              <div className="friend-bingo-reactions">
                {reactions.map((reaction) => (
                  <span
                    key={reaction.id}
                    className="friend-bingo-reactions__item"
                    title={reaction.nickname}
                  >
                    {REACTION_ICONS[reaction.reaction_type] || '❓'}
                  </span>
                ))}
              </div>
            )}
            
            <p className="friend-bingo-modal__footer">
              친구의 빙고판은 조회만 가능합니다.
            </p>
          </>
        ) : (
          <p className="friend-bingo-modal__empty">활성화된 빙고판이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export default FriendBingoModal;
