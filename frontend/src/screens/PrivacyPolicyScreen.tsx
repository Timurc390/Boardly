import React from 'react';

export const PrivacyPolicyScreen: React.FC = () => {
  return (
    <div className="privacy-page">
      <div className="privacy-header">
        {/* Прибрали justifyContent: 'center', щоб логотип був зліва */}
        <div className="privacy-header-inner">
           <div className="privacy-brand">Boardly</div>
        </div>
      </div>
      <div className="privacy-content">
        <h1>Privacy Policy</h1>
        <p>
          Your privacy matters to us. This privacy policy explains how Boardly, and our corporate affiliates collect, use,
          share, and protect your information when you use our products, services, websites, or otherwise interact
          with us (a list of Atlassian’s corporate affiliates can be found in the List of Subsidiaries section of Atlassian’s
          most recent Form 10-K, available under the SEC Filings tab by selecting the “Annual Filings” filter on the page
          located here). We offer a wide range of products,including our cloud and software products.
          We refer to all of these products, together with our other services and websites, as "Services"
          in this privacy policy.
        </p>
        <p>
          This privacy policy also explains your choices surrounding how we use information about you,
          which includes how you can object to certain uses of information about you and how you can access
          and update certain information about you. If you do not agree with this privacy policy, do not access
          or use our Services or interact with any other aspect of our business.
        </p>
        
        <h3>This privacy policy is intended to help you understand:</h3>
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
