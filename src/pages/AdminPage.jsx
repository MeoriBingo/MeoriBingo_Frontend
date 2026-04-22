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
      const response = await apiClient.get('/api/admin/point/all');
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
      fetchUsers(); // 목록 새로고침
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
      <h1 className="admin-page__title">관리자 페이지 - 포인트 관리</h1>

      {isLoading ? (
        <div className="loading-text">사용자 정보를 불러오는 중...</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>닉네임</th>
              <th>이메일</th>
              <th>현재 포인트</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.nickname}</td>
                <td>{user.email}</td>
                <td>{user.point.toLocaleString()} P</td>
                <td>
                  {editingUserId === user.id ? (
                    <div className="point-grant-form">
                      <input
                        type="number"
                        className="point-input"
                        placeholder="포인트"
                        value={grantAmount}
                        onChange={(e) => setGrantAmount(e.target.value)}
                        autoFocus
                      />
                      <button 
                        className="confirm-btn"
                        onClick={() => handleConfirmGrant(user.id)}
                      >
                        확인
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={handleCancel}
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="point-btn"
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
      )}
    </div>
  );
}

export default AdminPage;
