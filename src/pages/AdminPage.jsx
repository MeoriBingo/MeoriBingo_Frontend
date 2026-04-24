import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import './AdminPage.css';

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [grantAmount, setGrantAmount] = useState('');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/admin/user/all');
      setUsers(response.data);
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      alert('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleGrantClick = (userId) => {
    setEditingUserId(userId);
    setGrantAmount('');
  };

  const handleConfirmGrant = async (userId) => {
    if (!grantAmount || isNaN(grantAmount)) {
      alert('올바른 포인트를 입력해주세요.');
      return;
    }

    try {
      await apiClient.post(`/api/admin/point/${userId}`, {
        amount: parseInt(grantAmount, 10),
        reason: '관리자 수동 부여'
      });
      alert('포인트가 성공적으로 부여되었습니다.');
      setEditingUserId(null);
      fetchUsers();
    } catch (error) {
      console.error('포인트 부여 실패:', error);
      alert('포인트 부여 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setGrantAmount('');
  };

  return (
    <div className="admin-page">
      <section className="admin-page__card" aria-labelledby="admin-page-users-title">
        <div className="admin-page__card-head">
          <span className="admin-page__card-icon-wrap" aria-hidden="true">
            <i className="fa-solid fa-coins admin-page__card-icon" />
          </span>
          <h2 id="admin-page-users-title" className="admin-page__card-title">포인트 관리</h2>
        </div>

        {isLoading ? (
          <div className="admin-page__skeleton" aria-busy="true" aria-live="polite">
            <div className="admin-page__skeleton-line admin-page__skeleton-line--short" />
            <div className="admin-page__skeleton-line" />
            <div className="admin-page__skeleton-line" />
            <span className="admin-page__sr-only">사용자 정보를 불러오는 중입니다.</span>
          </div>
        ) : (
          <div className="admin-page__table-scroll">
            <table className="admin-page__table">
              <thead>
                <tr>
                  <th scope="col">닉네임</th>
                  <th scope="col">이메일</th>
                  <th scope="col">포인트</th>
                  <th scope="col">관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.nickname}</td>
                    <td>{user.email}</td>
                    <td>{Number(user.point ?? 0).toLocaleString()} P</td>
                    <td>
                      {editingUserId === user.id ? (
                        <div className="admin-page__grant-form">
                          <input
                            type="number"
                            className="admin-page__input"
                            placeholder="포인트"
                            value={grantAmount}
                            onChange={(e) => setGrantAmount(e.target.value)}
                            autoFocus
                            aria-label="부여할 포인트"
                          />
                          <div className="admin-page__grant-actions">
                            <button
                              type="button"
                              className="admin-page__btn admin-page__btn--confirm"
                              onClick={() => handleConfirmGrant(user.id)}
                            >
                              확인
                            </button>
                            <button
                              type="button"
                              className="admin-page__btn admin-page__btn--cancel"
                              onClick={handleCancel}
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="admin-page__btn admin-page__btn--grant"
                          onClick={() => handleGrantClick(user.id)}
                        >
                          포인트 부여
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminPage;
