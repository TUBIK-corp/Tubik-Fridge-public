import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/api';
import './CodePage.css';

function CodePage() {
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState(null);

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: userApi.getMe,
  });

  const generateCodeMutation = useMutation({
    mutationFn: userApi.generateCode,
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], (old) => ({ ...old, code: data.code, code_expires: data.expires }));
      startCountdown(new Date(data.expires));
    },
  });

  const startCountdown = (expiryDate) => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const userTimezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
      const correctExpiryTime = expiryDate.getTime() - userTimezoneOffset;
      const distance = correctExpiryTime - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft(null);
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${minutes}m ${seconds}s`);
    }, 1000);
  };

  return (
    <div className="code-page-container">
      <div className="code-page-section">
        <div className="code-page-telegram-info">
          <h1>Подключение Telegram-уведомлений</h1>
          <p className="code-page-telegram-instruction">
            Чтобы получать уведомления, выполните следующие шаги:
          </p>
          <ol>
            <li>Перейдите к боту <a href="https://t.me/TUBIKchain_bot" target="_blank" rel="noopener noreferrer">@TUBIKchain_bot</a></li>
            <li>Нажмите кнопку "Start" или отправьте команду /start</li>
            <li>Сгенерируйте код верификации</li>
            <li>Отправьте сгенерированный код боту</li>
          </ol>
        </div>

        {userData?.chat_id && (
          <div className="code-page-chat-id-section">
            <h2>Ваш Chat ID</h2>
            <div className="code-page-chat-id-box">
              <span className="code-page-chat-id">{userData.chat_id}</span>
              <button
                className="code-page-copy-button"
                onClick={() => navigator.clipboard.writeText(userData.chat_id)}
              >
                Копировать
              </button>
            </div>
          </div>
        )}

        <div className="code-page-verification-section">
          <h2>Код верификации</h2>
          <div className="code-page-code-generation-box">
            {userData?.code ? (
              <>
                <div className="code-page-code-display">
                  <span className="code-page-code">{userData.code}</span>
                  <span className="code-page-timer">{timeLeft || 'Истек'}</span>
                </div>
                <p className="code-page-expiry-info">
                  Код действителен до: {new Date(new Date(userData.code_expires).getTime() - (new Date().getTimezoneOffset() * 60 * 1000)).toLocaleString()}
                </p>
              </>
            ) : (
              <>
                <p className="code-page-no-code">Код не сгенерирован</p>
                <button
                  className="code-page-generate-button"
                  onClick={() => generateCodeMutation.mutate()}
                  disabled={generateCodeMutation.isLoading}
                >
                  {generateCodeMutation.isLoading ? 'Генерация...' : 'Сгенерировать код'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodePage;