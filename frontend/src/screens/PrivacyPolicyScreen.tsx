import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicyScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="privacy-page">
      <div className="privacy-header">
        <div className="privacy-header-inner">
           <div className="privacy-brand">Boardly</div>
        <button className="privacy-back" type="button" onClick={() => navigate(-1)}>
          ← Назад
        </button>
        </div>
      </div>
      <div className="privacy-content">
        <h1>Політика конфіденційності</h1>
        <p>
          Ваша приватність важлива для нас. У цій політиці ми пояснюємо, як Boardly та наші
          афілійовані компанії збирають, використовують, передають і захищають вашу інформацію під
          час користування нашими продуктами, сервісами та вебсайтом.
        </p>
        <p>
          Також ми описуємо ваші права і можливості керування даними: як заперечити певні способи
          використання інформації, отримати доступ до даних і оновити їх.
        </p>
        <h3>Ця політика допоможе вам зрозуміти:</h3>
        <ul>
          <li>Яку інформацію ми збираємо</li>
          <li>Як і для чого ми її використовуємо</li>
          <li>Як ми зберігаємо та захищаємо інформацію</li>
          <li>Як отримати доступ і керувати своїми даними</li>
          <li>Як ми повідомляємо про зміни в політиці</li>
          <li>Як з нами зв’язатися</li>
        </ul>
      </div>
      <div className="privacy-footer">
        <div className="privacy-footer-inner">
          <span>© 2026 Boardly</span>
          <div className="privacy-footer-links">
            <span>Доступність</span>
            <span>Ваш вибір конфіденційності</span>
            <span>Політика конфіденційності</span>
            <span>Умови</span>
            <span>Вихідні дані</span>
            <span>Безпека</span>
          </div>
        </div>
      </div>
    </div>
  );
};
