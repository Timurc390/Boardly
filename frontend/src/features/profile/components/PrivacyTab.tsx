import React from 'react';

type PrivacyContent = {
  paragraphs: string[];
  translationNotice?: string;
  summaryTitle: string;
};

type PrivacyTabProps = {
  privacyContent: PrivacyContent;
};

export const PrivacyTab: React.FC<PrivacyTabProps> = ({ privacyContent }) => {
  return (
    <div className="profile-privacy-layout">
      {privacyContent.paragraphs.map((paragraph, index) => (
        <p
          key={`privacy-paragraph-${index}`}
          className={`privacy-text-block${index === privacyContent.paragraphs.length - 1 ? ' short' : ''}`}
        >
          {paragraph}
        </p>
      ))}
      {privacyContent.translationNotice && (
        <p className="privacy-summary-line">{privacyContent.translationNotice}</p>
      )}
      <p className="privacy-summary-line">{privacyContent.summaryTitle}</p>
    </div>
  );
};
