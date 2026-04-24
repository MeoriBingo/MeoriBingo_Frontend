import { useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import LoadingOverlay from '../components/LoadingOverlay';
import './ContactUsPage.css';

function ContactUsPage() {
    const { user } = useContext(UserContext);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) {
            alert('메시지 내용을 입력해주세요.');
            return;
        }

        setIsLoading(true);

        // Simulate sending email
        setTimeout(() => {
            setIsLoading(false);
            alert('메일이 발송되었습니다.');
            setMessage('');
        }, 2000);
    };

    return (
        <div className="contact-us">
            <h1 className="contact-us__title">Contact Us</h1>

            <div className="contact-us__card contact-us__card--form">
                <div className="contact-us__card-head">
                    <div className="contact-us__card-icon-wrap">
                        <i className="fa-solid fa-paper-plane contact-us__card-icon"></i>
                    </div>
                    <h2 className="contact-us__card-title">문의하기</h2>
                </div>

                <form className="contact-us__form" onSubmit={handleSubmit}>
                    <div className="contact-us__field">
                        <label className="contact-us__label">보내는 사람</label>
                        <input
                            type="text"
                            className="contact-us__input contact-us__input--disabled"
                            value={user?.nickname || '사용자'}
                            readOnly
                        />
                    </div>

                    <div className="contact-us__field">
                        <label className="contact-us__label">메시지 내용</label>
                        <textarea
                            className="contact-us__textarea"
                            placeholder="관리자에게 전달할 내용을 입력해주세요."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="contact-us__submit-btn">
                        보내기
                    </button>
                </form>
            </div>

            {isLoading && <LoadingOverlay message="메일을 발송 중입니다..." />}
        </div>
    );
}

export default ContactUsPage;
