import React, { useState } from 'react';
import './BingoGenerateModal.css';

function IconBack() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

const CATEGORIES = [
  { id: 'PRODUCTIVITY', label: '생산성' },
  { id: 'ACTIVITY', label: '활동성' },
  { id: 'MINDSET', label: '마인드셋' },
  { id: 'GROWTH', label: '성장성' },
  { id: 'CREATIVITY', label: '창의성' }
];

const MODES = [
  { id: 'NORMAL', label: '노멀모드' },
  { id: 'CHALLENGE', label: '챌린지모드' }
];

function BingoGenerateModal({ onClose, onGenerate }) {
  const [selectedCategory, setSelectedCategory] = useState('PRODUCTIVITY');
  const [selectedMode, setSelectedMode] = useState('NORMAL');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const categoryLabel = CATEGORIES.find(cat => cat.id === selectedCategory)?.label || selectedCategory;
      await onGenerate({
        category: categoryLabel,
        mode: selectedMode
      });
      onClose();
    } catch (error) {
      console.error('빙고 생성 실패:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bingo-modal">
      <header className="bingo-modal__header">
        <button className="bingo-modal__back" onClick={onClose} aria-label="뒤로가기">
          <IconBack />
        </button>
        <h2 className="bingo-modal__title">빙고 생성하기</h2>
      </header>

      <div className="bingo-modal__content">
        <section className="bingo-modal__section">
          <h3 className="bingo-modal__section-title">원하는 범주 선택하기</h3>
          <div className="bingo-modal__radio-group">
            {CATEGORIES.map((cat) => (
              <label key={cat.id} className="bingo-modal__radio-label">
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  checked={selectedCategory === cat.id}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                />
                <span className="bingo-modal__radio-text">{cat.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="bingo-modal__section">
          <h3 className="bingo-modal__section-title">도전 모드</h3>
          <div className="bingo-modal__radio-group">
            {MODES.map((mode) => (
              <label key={mode.id} className="bingo-modal__radio-label">
                <input
                  type="radio"
                  name="mode"
                  value={mode.id}
                  checked={selectedMode === mode.id}
                  onChange={(e) => setSelectedMode(e.target.value)}
                />
                <span className="bingo-modal__radio-text">{mode.label}</span>
              </label>
            ))}
          </div>
        </section>

        <button
          className="bingo-modal__generate-btn"
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? '생성 중...' : '빙고 생성하기'}
        </button>
      </div>
    </div>
  );
}

export default BingoGenerateModal;
