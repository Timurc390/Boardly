import React from 'react';
import { type BackgroundSectionProps } from './types';

const renderOptionButtonStyle = (isSelected: boolean, background: string): React.CSSProperties => ({
  height: 48,
  borderRadius: 10,
  border: isSelected ? '2px solid var(--primary-blue)' : '1px solid rgba(255,255,255,0.15)',
  background,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  cursor: 'pointer',
});

export const BackgroundSection: React.FC<BackgroundSectionProps> = ({
  t,
  board,
  colorOptions,
  gradientOptions,
  imageOptions,
  bgUrlInput,
  onBgUrlInputChange,
  onBackgroundSelect,
  onBackgroundFile,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: '0 12px' }}>
        <h4 style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{t('board.background.colors')}</h4>
        <div className="background-grid">
          {colorOptions.map((option) => {
            const isSelected = option.value === (board.background_url || '');
            return (
              <button
                key={option.key}
                type="button"
                className="btn-ghost"
                onClick={() => onBackgroundSelect(option.value)}
                title={option.label}
                style={renderOptionButtonStyle(
                  isSelected,
                  option.preview || option.value || 'linear-gradient(135deg, #1f1f1f 0%, #2c2c2c 100%)'
                )}
              />
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 12px' }}>
        <h4 style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{t('board.background.gradients')}</h4>
        <div className="background-grid">
          {gradientOptions.map((option) => {
            const isSelected = option.value === board.background_url;
            return (
              <button
                key={option.key}
                type="button"
                className="btn-ghost"
                onClick={() => onBackgroundSelect(option.value)}
                title={option.label}
                style={renderOptionButtonStyle(isSelected, option.value)}
              />
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 12px' }}>
        <h4 style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{t('board.background.images')}</h4>
        <div className="background-grid">
          {imageOptions.map((option) => {
            const isSelected = option.value === board.background_url;
            return (
              <button
                key={option.key}
                type="button"
                className="btn-ghost"
                onClick={() => onBackgroundSelect(option.value)}
                title={option.label}
                aria-label={option.label}
                style={{
                  ...renderOptionButtonStyle(isSelected, 'transparent'),
                  backgroundImage: `url(${option.value})`,
                }}
              />
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, color: '#888' }}>{t('board.background.imageSelected')}</label>
        <input
          className="form-input"
          placeholder={t('board.background.urlPlaceholder')}
          value={bgUrlInput}
          onChange={(e) => onBgUrlInputChange(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn-primary"
            style={{ width: 'auto' }}
            onClick={() => {
              if (bgUrlInput.trim()) onBackgroundSelect(bgUrlInput.trim());
            }}
          >
            {t('board.background.apply')}
          </button>
          <label className="btn-secondary" style={{ width: 'auto' }}>
            {t('board.background.upload')}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onBackgroundFile(e.target.files?.[0])}
              style={{ display: 'none' }}
            />
          </label>
          <button type="button" className="btn-ghost" onClick={() => onBackgroundSelect('')}>
            {t('board.background.reset')}
          </button>
        </div>
      </div>
    </div>
  );
};
