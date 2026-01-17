import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { LanguageSelect } from './components/LanguageSelect';
import { ProfileScreen } from './screens/ProfileScreen';
import { LegacyBoardScreen } from './screens/LegacyBoardScreen';
import { MyCardsScreen } from './screens/MyCardsScreen';
import { FaqScreen } from './screens/FaqScreen';

// --- КОНФІГУРАЦИЯ ---
const API_URL = process.env.REACT_APP_API_URL || '/api';
// ВАШ CLIENT ID
const GOOGLE_CLIENT_ID = '374249918192-fq8ktn1acvuhsr3ecmfq1fd861afcj1d.apps.googleusercontent.com';

declare global {
  interface Window {
    google: any;
  }
}

// --- ГЛОБАЛЬНІ СТИЛІ (DARK MODERN SAAS - KANBAN PREVIEW) ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* 1. CSS Variables */
  :root {
    --bg-main: #1f1f1f;
    --bg-surface: #2a2a2a;
    --bg-input: #3a3a3a;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    --text-muted: #7a7a7a;
    
    /* Kanban Accents */
    --accent-todo: #ffc233;
    --accent-progress: #b6b3ff;
    --accent-done: #9e9e9e;
    --accent-link: #8f8cff;
    --accent-danger: #ff6b6b;

    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 20px;
    --font-main: 'Inter', system-ui, sans-serif;
    --border-subtle: rgba(255,255,255,0.08);
    --ghost-hover: rgba(255,255,255,0.05);
    --skeleton-start: #2f2f2f;
    --skeleton-mid: #3b3b3b;
    --board-overlay: linear-gradient(180deg, rgba(10,12,16,0.78) 0%, rgba(10,12,16,0.55) 55%, rgba(10,12,16,0.35) 100%);
    --toolbar-bg: rgba(17,24,39,0.88);
  }

  :root[data-theme='dark'] {
    color-scheme: dark;
  }

  :root[data-theme='light'] {
    color-scheme: light;
    --bg-main: #f5f7fb;
    --bg-surface: #ffffff;
    --bg-input: #eef2f6;
    --text-primary: #1e2330;
    --text-secondary: #4b5563;
    --text-muted: #6b7280;
    --accent-link: #3b5bdb;
    --accent-danger: #e03131;
    --border-subtle: rgba(15,23,42,0.12);
    --ghost-hover: rgba(15,23,42,0.06);
    --skeleton-start: #e6e9f0;
    --skeleton-mid: #f4f6fb;
    --board-overlay: linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(248,250,252,0.88) 60%, rgba(248,250,252,0.8) 100%);
    --toolbar-bg: rgba(248,250,252,0.92);
  }

  * { box-sizing: border-box; }
  
  body {
    margin: 0;
    font-family: var(--font-main);
    background-color: var(--bg-main);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
  }

  /* 3. Layout */
  .page {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    min-height: 100vh;
    padding: 40px 0 40px 40px; 
    gap: 0;
    max-width: 100%;
    margin: 0;
    overflow: hidden; 
  }

  .auth-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 480px;
    width: 100%;
    margin: 0 auto;
    padding: 20px 40px 20px 0;
  }

  .auth-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
    padding-right: 0;
  }

  @media (max-width: 1024px) {
    .page {
      grid-template-columns: 1fr;
      padding: 32px;
    }
    .auth-left {
      padding: 0;
      max-width: 520px;
    }
    .auth-right { display: none; }
  }

  /* Typography */
  h1 { font-size: 48px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.1; }
  h2 { font-size: 32px; font-weight: 600; margin: 0 0 24px 0; }
  p { font-size: 16px; line-height: 1.6; color: var(--text-secondary); margin: 0 0 32px 0; }
  .label { display: block; font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 500; }

  /* Forms */
  .form-group { margin-bottom: 20px; }
  .input {
    width: 100%; padding: 14px 16px; background-color: var(--bg-input);
    border: 1px solid transparent; border-radius: var(--radius-sm);
    color: var(--text-primary); font-size: 15px; transition: all 0.2s ease;
  }
  .input:focus { outline: none; background-color: #454545; border-color: var(--accent-link); }

  /* Buttons */
  .btn-primary {
    width: 100%; padding: 14px; background-color: #ffffff; color: #1f1f1f;
    border: none; border-radius: var(--radius-sm); font-size: 15px; font-weight: 600;
    cursor: pointer; margin-top: 8px; transition: opacity 0.2s;
  }
  .btn-primary:hover { opacity: 0.9; }
  
  .btn-icon {
    background: none; border: none; cursor: pointer; color: var(--text-secondary); 
    padding: 4px; transition: color 0.2s;
  }
  .btn-icon:hover { color: var(--text-primary); }
  .btn-icon.danger:hover { color: var(--accent-danger); }

  .google-wrapper { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--bg-input); }
  .link { color: var(--accent-link); text-decoration: none; font-size: 14px; cursor: pointer; background: none; border: none; }
  .link:disabled { opacity: 0.6; cursor: not-allowed; }
  .link.danger { color: var(--accent-danger); }
  .auth-footer { margin-top: 24px; font-size: 14px; color: var(--text-muted); text-align: center; }

  /* --- KANBAN BOARD STYLES --- */
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-main);
  }

  .board-surface {
    position: relative;
    background-size: cover;
    background-position: center;
  }

  .board-surface::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--board-overlay);
    pointer-events: none;
    z-index: 0;
  }

  .board-surface > * {
    position: relative;
    z-index: 1;
  }

  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 0 24px;
    height: 64px;
    background: var(--toolbar-bg);
    border-bottom: 1px solid var(--border-subtle);
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  }

  .board-surface .top-nav {
    position: sticky;
    top: 0;
    z-index: 30;
    background: var(--toolbar-bg);
    backdrop-filter: blur(10px);
  }

  .nav-logo {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.2px;
    color: var(--text-primary);
    text-decoration: none;
    max-width: 55vw;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .nav-greeting {
    font-size: 13px;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .nav-actions { display: flex; gap: 8px; align-items: center; justify-content: flex-end; flex-wrap: wrap; white-space: nowrap; }

  .nav-actions .link,
  .nav-actions button.link {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(148,163,184,0.2);
    transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  }

  .nav-actions .link:hover,
  .nav-actions button.link:hover {
    background: var(--ghost-hover);
  }

  .language-select {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .language-label {
    font-size: 12px;
    color: var(--text-muted);
  }

  .language-select .input {
    height: 32px;
    padding: 6px 10px;
    min-width: 120px;
    font-size: 12px;
  }

  .nav-menu-button {
    border: 1px solid var(--border-subtle);
    background: var(--bg-input);
    color: var(--text-primary);
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 12px;
    cursor: pointer;
    display: none;
  }

  .nav-menu-button:hover { background: var(--ghost-hover); }

  @media (max-width: 960px) {
    .nav-menu-button { display: inline-flex; }
    .nav-actions {
      display: none;
      position: absolute;
      right: 16px;
      left: 16px;
      top: 64px;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      padding: 12px;
      border-radius: 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 12px 24px rgba(0,0,0,0.35);
      white-space: normal;
      max-height: calc(100vh - 96px);
      overflow-y: auto;
    }
    .nav-actions.mobile-open { display: flex; }
    .nav-actions .link,
    .nav-actions button.link {
      width: 100%;
      justify-content: space-between;
    }
    .language-select { width: 100%; }
    .language-select .input { width: 100%; min-width: 0; }
  }

  .board-layout {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 18px;
    padding: 18px 24px 32px;
    overflow-x: auto;
    overflow-y: hidden;
    align-items: flex-start;
    scroll-snap-type: x proximity;
  }

  .board-layout::-webkit-scrollbar {
    height: 12px;
  }

  .board-layout::-webkit-scrollbar-thumb {
    background: rgba(148,163,184,0.35);
    border-radius: 999px;
  }

  .board-layout::-webkit-scrollbar-track {
    background: transparent;
  }

  .kanban-column {
    flex: 0 0 300px;
    width: 300px;
    min-width: 300px;
    background: var(--bg-surface);
    border: 1px solid rgba(148,163,184,0.2);
    border-radius: 16px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    scroll-snap-align: start;
    box-shadow: 0 12px 28px rgba(15,23,42,0.18);
  }

  .kanban-column.drag-over {
    border-color: rgba(143,140,255,0.6);
    box-shadow: 0 12px 24px rgba(0,0,0,0.25);
  }

  .kanban-column.dragging {
    opacity: 0.85;
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(148,163,184,0.18);
    position: sticky;
    top: 0;
    background: var(--bg-surface);
    z-index: 1;
  }

  .list-header[draggable="true"] { cursor: grab; }

  .list-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .list-title {
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .list-title span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .list-badge {
    min-width: 24px;
    height: 20px;
    border-radius: 999px;
    background: rgba(148,163,184,0.18);
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }

  .column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .column-title {
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .count-badge {
    min-width: 24px;
    height: 20px;
    border-radius: 999px;
    background: var(--bg-input);
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }

  .task-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-right: 6px;
    padding-bottom: 12px; /* Space for add button */
  }

  .task-list::-webkit-scrollbar {
    width: 8px;
  }

  .task-list::-webkit-scrollbar-thumb {
    background: rgba(148,163,184,0.3);
    border-radius: 999px;
  }

  .task-card {
    background: var(--bg-input);
    border-radius: 14px;
    padding: 12px 12px 10px;
    cursor: pointer;
    transition: background 0.2s, box-shadow 0.2s, transform 0.2s, border-color 0.2s;
    border: 1px solid rgba(148,163,184,0.18);
  }
  .task-card:hover { background: var(--bg-input); box-shadow: 0 10px 24px rgba(15,23,42,0.2); transform: translateY(-1px); }
  .task-card[draggable="true"] { cursor: grab; }
  .task-card.dragging { opacity: 0.5; cursor: grabbing; }
  .task-card.drag-over { border-color: rgba(143,140,255,0.6); box-shadow: 0 12px 20px rgba(15,23,42,0.25); }
  .task-card.highlight { border-color: rgba(143,140,255,0.8); box-shadow: 0 0 0 2px rgba(143,140,255,0.25); }

  .card-color-bar {
    height: 6px;
    border-radius: 999px;
    margin-bottom: 8px;
  }

  .list-highlight {
    border-color: rgba(143,140,255,0.8);
    box-shadow: 0 0 0 2px rgba(143,140,255,0.25);
  }

  .search-highlight {
    background: rgba(250,204,21,0.25);
    color: #fde68a;
    padding: 0 2px;
    border-radius: 4px;
  }
  
  .task-title { font-size: 14px; font-weight: 600; margin-bottom: 6px; line-height: 1.35; }
  .task-desc { font-size: 12px; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.5; }
  
  .task-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
  .task-controls { display: flex; gap: 8px; }
  
  .move-btn { font-size: 10px; padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); color: var(--text-secondary); border: none; cursor: pointer; }
  .move-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }

  /* Legacy board UI */
  .board-toolbar {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 24px 16px;
    background: var(--toolbar-bg);
    border-bottom: 1px solid var(--border-subtle);
    box-shadow: 0 8px 20px rgba(0,0,0,0.18);
  }

  .board-surface .board-toolbar {
    position: sticky;
    top: 64px;
    z-index: 25;
    backdrop-filter: blur(10px);
  }

  .toolbar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .toolbar-group-primary {
    flex: 1 1 520px;
  }

  .toolbar-group-actions {
    justify-content: flex-end;
  }

  .members-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    line-height: 1;
  }

  .members-label {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }

  .member-avatars {
    display: flex;
    align-items: center;
  }

  .member-avatar {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-input);
    color: var(--text-primary);
    font-size: 11px;
    font-weight: 700;
    border: 1px solid var(--border-subtle);
    margin-left: -6px;
    overflow: hidden;
  }

  .member-avatar:first-child {
    margin-left: 0;
  }

  .member-info .member-avatar {
    margin-left: 0;
  }

  .member-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .member-avatar-more {
    background: rgba(59,91,219,0.2);
    color: var(--accent-link);
  }

  .toolbar-select {
    min-width: 220px;
    max-width: 260px;
    height: 36px;
    padding: 8px 12px;
  }

  .board-selector-button {
    display: none;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    height: 36px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(148,163,184,0.2);
    background: var(--bg-input);
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .board-selector-title {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .board-selector-caret {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .toolbar-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 10px;
    border-radius: var(--radius-sm);
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(148,163,184,0.2);
    flex: 1;
    min-width: 200px;
  }

  .toolbar-search:focus-within {
    border-color: rgba(59,91,219,0.55);
    box-shadow: 0 0 0 2px rgba(59,91,219,0.2);
  }

  .toolbar-search .input {
    border: none;
    background: transparent;
    padding: 8px 4px;
    width: min(280px, 40vw);
    min-width: 160px;
  }

  .toolbar-search .input:focus {
    outline: none;
    border: none;
    box-shadow: none;
  }

  .toolbar-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(148,163,184,0.18);
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .toolbar-pill.active {
    border-color: rgba(143,140,255,0.45);
    background: rgba(143,140,255,0.12);
    color: var(--text-primary);
  }

  .toolbar-pill input {
    accent-color: var(--accent-link);
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: var(--border-subtle);
    align-self: stretch;
  }

  .mobile-action-bar {
    display: none;
  }

  .mobile-action-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .mobile-action-row::-webkit-scrollbar { display: none; }

  .mobile-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 10px;
    min-width: 40px;
    border-radius: 12px;
    border: 1px solid rgba(148,163,184,0.2);
    background: var(--bg-input);
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .mobile-action-btn.primary {
    background: var(--accent-link);
    color: #fff;
    border-color: transparent;
  }

  .mobile-action-btn.active {
    border-color: rgba(143,140,255,0.45);
    background: rgba(143,140,255,0.12);
    color: var(--text-primary);
  }

  .mobile-action-icon {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .mobile-action-text { display: none; }

  .toolbar-meta {
    font-size: 12px;
    color: var(--text-muted);
  }

  .toolbar-progress {
    height: 2px;
    width: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, var(--accent-link), transparent);
    animation: shimmer 1.2s infinite;
  }

  .toolbar-panel {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--border-subtle);
    background: var(--bg-input);
  }

  .toolbar-panel .input {
    height: 36px;
    padding: 8px 12px;
  }

  .toolbar-panel .board-btn {
    height: 36px;
  }

  .background-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 200px;
  }

  .background-title {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .background-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .background-section-title {
    font-size: 11px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .background-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .background-swatch {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    border: 1px solid rgba(148,163,184,0.35);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .background-swatch.default {
    background: repeating-linear-gradient(
      45deg,
      rgba(148,163,184,0.3) 0,
      rgba(148,163,184,0.3) 6px,
      transparent 6px,
      transparent 12px
    );
  }

  .background-swatch.active {
    outline: 2px solid var(--accent-link);
    outline-offset: 2px;
  }

  .background-swatch .swatch-check {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 12px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  }

  .background-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .background-upload input {
    display: none;
  }

  .background-preview {
    width: 140px;
    height: 48px;
    border-radius: 10px;
    border: 1px solid var(--border-subtle);
    position: relative;
    overflow: hidden;
  }

  .background-preview::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.45) 100%);
  }

  .background-preview-label {
    position: absolute;
    bottom: 6px;
    left: 8px;
    font-size: 11px;
    color: #fff;
    z-index: 1;
  }

  .card-color-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .card-color-swatch {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(148,163,184,0.35);
    cursor: pointer;
    position: relative;
  }

  .card-color-swatch.default {
    background: repeating-linear-gradient(
      45deg,
      rgba(148,163,184,0.3) 0,
      rgba(148,163,184,0.3) 6px,
      transparent 6px,
      transparent 12px
    );
  }

  .card-color-swatch.active {
    outline: 2px solid var(--accent-link);
    outline-offset: 2px;
  }

  .card-color-swatch .swatch-check {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 12px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  }

  .card-color-reset {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(226,232,240,0.9);
    font-size: 14px;
  }

  .board-btn {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(148,163,184,0.2);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    background: var(--bg-input);
    color: var(--text-primary);
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    min-height: 32px;
    line-height: 1;
    white-space: nowrap;
  }

  .board-btn.primary {
    background: var(--accent-link);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 8px 16px rgba(59,91,219,0.28);
  }

  .board-btn.secondary {
    background: transparent;
    border-color: rgba(148,163,184,0.3);
  }

  .board-btn.ghost {
    background: transparent;
    border-color: transparent;
    color: var(--text-secondary);
  }

  .board-btn.active {
    background: var(--ghost-hover);
    border-color: var(--border-subtle);
    color: var(--text-primary);
  }

  .board-btn.danger {
    background: transparent;
    border-color: rgba(255,107,107,0.5);
    color: var(--accent-danger);
  }

  .board-btn.small {
    padding: 6px 10px;
    font-size: 12px;
  }

  .board-btn.icon {
    width: 32px;
    height: 32px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
  }

  .board-btn:disabled,
  .board-btn.disabled,
  .board-btn[aria-disabled='true'] {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

  .board-btn:hover { background: var(--ghost-hover); }
  .board-btn.primary:hover { filter: brightness(0.95); }
  .board-btn.danger:hover { background: rgba(255,107,107,0.12); }

  .empty-state {
    font-size: 12px;
    color: var(--text-muted);
    padding: 10px;
    border-radius: 12px;
    background: rgba(148,163,184,0.08);
    border: 1px dashed rgba(148,163,184,0.3);
  }

  .skeleton-column {
    width: 300px;
    min-width: 300px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .skeleton-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .skeleton-line {
    height: 12px;
    width: 60%;
  }

  .skeleton-badge {
    width: 36px;
    height: 20px;
    border-radius: 999px;
  }

  .skeleton-card {
    height: 72px;
    border-radius: 12px;
  }

  .kanban-column.empty-column {
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 8px;
  }

  .empty-state-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .empty-state-subtitle {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .page-state {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
    color: var(--text-secondary);
    padding: 24px;
  }

  .page-state-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .page-state-subtitle {
    font-size: 14px;
    max-width: 480px;
  }

  .page-state-actions {
    margin-top: 8px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .list-menu,
  .card-menu,
  .board-menu {
    position: relative;
  }

  .list-menu-button,
  .card-menu-button {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(148,163,184,0.16);
    background: rgba(148,163,184,0.08);
    color: var(--text-primary);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    line-height: 1;
  }

  .list-menu-button:hover,
  .card-menu-button:hover {
    background: rgba(148,163,184,0.2);
    border-color: rgba(148,163,184,0.3);
  }

  .list-menu-panel,
  .card-menu-panel,
  .board-menu-panel {
    position: absolute;
    right: 0;
    top: 36px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 10px;
    min-width: 220px;
    box-shadow: 0 16px 32px rgba(0,0,0,0.28);
    z-index: 25;
  }

  .menu-item {
    width: 100%;
    text-align: left;
    padding: 8px 10px;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 13px;
    border-radius: 8px;
    cursor: pointer;
  }

  .menu-item:hover { background: var(--bg-input); }
  .menu-item.danger { color: var(--accent-danger); }
  .menu-item:disabled { opacity: 0.5; cursor: not-allowed; }

  .menu-divider {
    height: 1px;
    background: var(--border-subtle);
    margin: 6px 0;
  }

  .menu-label {
    display: grid;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
    padding: 6px 4px;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }

  .card-badge {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(148,163,184,0.18);
    border: 1px solid rgba(148,163,184,0.22);
    color: var(--text-secondary);
  }

  .card-badge.due {
    background: rgba(255, 193, 7, 0.15);
    color: #ffc107;
    border-color: rgba(255,193,7,0.35);
  }

  .card-badge.progress {
    background: rgba(143,140,255,0.2);
    color: var(--text-primary);
    border-color: rgba(143,140,255,0.35);
  }

  .card-labels {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .card-label {
    width: 30px;
    height: 7px;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    z-index: 50;
  }

  .modal {
    background: var(--bg-surface);
    border-radius: 16px;
    width: min(980px, 96vw);
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 50px rgba(0,0,0,0.35);
    border: 1px solid var(--border-subtle);
    overflow: hidden;
  }

  .modal-header {
    padding: 18px 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .modal-subtitle {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .modal-close {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    border: 1px solid var(--border-subtle);
    background: var(--bg-input);
  }

  .modal-body {
    padding: 18px 22px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 16px;
    align-items: start;
  }

  .modal-main,
  .modal-sidebar {
    display: grid;
    gap: 16px;
  }

  .modal-section {
    display: grid;
    gap: 8px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid var(--border-subtle);
    background: rgba(255,255,255,0.03);
  }

  .section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .progress-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    border-radius: 999px;
    background: var(--bg-input);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent-link);
  }

  .progress-text {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .checklist-block {
    background: var(--bg-input);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 10px;
    display: grid;
    gap: 8px;
  }

  .checklist-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .checklist-item {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr) 28px;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .checklist-item input {
    accent-color: var(--accent-link);
  }

  .checklist-item span {
    overflow-wrap: anywhere;
  }

  .label-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .label-chip {
    border: none;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 10px;
    border-radius: 999px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s ease, box-shadow 0.2s ease;
  }

  .label-chip.active {
    opacity: 1;
    box-shadow: 0 0 0 2px rgba(255,255,255,0.25);
  }

  .modal-hint {
    font-size: 12px;
    color: var(--text-muted);
  }

  .attachment-list {
    display: grid;
    gap: 10px;
  }

  .attachment-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px 12px;
    padding: 10px;
    border-radius: 12px;
    background: var(--bg-input);
    border: 1px solid var(--border-subtle);
  }

  .attachment-info {
    display: grid;
    gap: 4px;
  }

  .attachment-link {
    color: var(--text-primary);
    text-decoration: none;
    font-weight: 600;
  }

  .attachment-link:hover { text-decoration: underline; }

  .attachment-meta {
    font-size: 12px;
    color: var(--text-muted);
  }

  .attachment-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .file-input {
    display: none;
  }

  .comment-list {
    display: grid;
    gap: 12px;
  }

  .comment-item {
    display: grid;
    gap: 6px;
    padding: 10px;
    border-radius: 12px;
    background: var(--bg-input);
    border: 1px solid var(--border-subtle);
  }

  .comment-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .comment-author {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .comment-avatar {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: rgba(59,91,219,0.2);
    color: var(--accent-link);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .comment-actions {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .comment-meta {
    font-size: 12px;
    color: var(--text-muted);
  }

  .comment-body {
    font-size: 13px;
    color: var(--text-secondary);
    white-space: pre-wrap;
  }

  .comment-form {
    display: grid;
    gap: 8px;
  }

  .comment-form textarea {
    min-height: 80px;
    resize: vertical;
  }

  .members-modal {
    width: min(760px, 96vw);
  }

  .members-modal .modal-body {
    grid-template-columns: 1fr;
  }

  .board-picker-modal {
    width: min(520px, 92vw);
  }

  .board-picker-modal .modal-body {
    grid-template-columns: 1fr;
  }

  .board-picker-list {
    display: grid;
    gap: 8px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .board-picker-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--border-subtle);
    background: var(--bg-input);
    color: var(--text-primary);
    text-align: left;
    cursor: pointer;
  }

  .board-picker-item.active {
    border-color: rgba(143,140,255,0.45);
    background: rgba(143,140,255,0.12);
  }

  .board-picker-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
    font-size: 13px;
  }

  .member-search {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 140px;
    gap: 8px;
    align-items: center;
  }

  .member-invite {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .member-invite .input {
    flex: 1;
    min-width: 220px;
  }

  .member-results,
  .member-list {
    display: grid;
    gap: 10px;
  }

  .member-result-item,
  .member-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 140px 110px;
    gap: 10px;
    align-items: center;
    padding: 10px;
    border-radius: 12px;
    background: var(--bg-input);
    border: 1px solid var(--border-subtle);
  }

  .member-result-item {
    grid-template-columns: minmax(0, 1fr) 120px;
  }

  .member-info {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .member-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .member-meta {
    font-size: 12px;
    color: var(--text-muted);
    word-break: break-word;
  }

  .member-role {
    display: flex;
    align-items: center;
  }

  .member-role .input {
    width: 100%;
  }

  .member-badge {
    font-size: 12px;
    color: var(--text-secondary);
    padding: 6px 10px;
    background: rgba(148,163,184,0.15);
    border-radius: 999px;
  }

  .member-actions {
    display: flex;
    justify-content: flex-end;
  }

  .member-empty {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  @media (max-width: 720px) {
    .member-search {
      grid-template-columns: 1fr;
    }

    .member-result-item,
    .member-row {
      grid-template-columns: 1fr;
      justify-items: start;
    }

    .member-actions {
      width: 100%;
      justify-content: flex-start;
    }
  }

  .modal-footer {
    padding: 14px 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border-subtle);
    gap: 12px;
  }

  .modal-footer-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  @media (max-width: 900px) {
    .modal-body {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .modal-header,
    .modal-body,
    .modal-footer {
      padding: 14px 16px;
    }
  }

  .command-backdrop {
    background: rgba(0,0,0,0.7);
  }

  .command-modal {
    background: var(--bg-surface);
    border-radius: 16px;
    width: min(520px, 90vw);
    padding: 16px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.35);
  }

  @media (max-width: 960px) {
    .board-layout { padding: 12px 16px 24px; }
    .kanban-column { flex: 0 0 260px; width: 260px; min-width: 260px; }
  }

  /* Specific accents for live board */
  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot.col-0 { background: var(--accent-todo); }
  .dot.col-1 { background: var(--accent-progress); }
  .dot.col-2 { background: var(--accent-done); }

  /* Auth Preview (Keep existing) */
  .board-wrapper {
    background-color: #2b2b2b;
    border-top-left-radius: 56px; border-bottom-left-radius: 56px;
    padding: 64px 0 64px 64px;
    display: flex; gap: 40px; width: 100%; height: 60vh;
    align-self: center; box-shadow: -20px 0 80px rgba(0,0,0,0.4); overflow: hidden;
  }
  .column-preview { width: 280px; min-width: 280px; border-radius: var(--radius-lg); padding: 24px; display: flex; flex-direction: column; gap: 20px; }
  .column-preview.todo { background-color: var(--accent-todo); }
  .column-preview.progress { background-color: var(--accent-progress); }
  .column-preview.done { background-color: var(--accent-done); }
  .card-preview { border-radius: 16px; padding: 18px; font-size: 15px; font-weight: 600; color: #1a1a1a; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .column-preview.todo .card-preview { background-color: #ffe19a; }
  .column-preview.progress .card-preview { background-color: #e3e2ff; }
  .column-preview.done .card-preview { background-color: #dcdcdc; }

  /* --- My Cards --- */
  .mycards-page {
    padding: 32px 40px 48px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .mycards-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .mycards-header h2 {
    margin: 0;
  }

  .mycards-section {
    margin-bottom: 24px;
  }

  .mycards-section-title {
    margin: 0 0 12px 0;
  }

  .mycards-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }

  .mycards-info {
    color: var(--text-secondary);
    margin-bottom: 12px;
  }

  .mycards-error {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .mycards-error-text {
    color: var(--accent-danger);
    margin: 0;
  }

  .content-page {
    padding: 32px 40px 48px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .faq-list {
    display: grid;
    gap: 16px;
  }

  .faq-item {
    padding: 16px;
    border-radius: 12px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
  }

  .faq-item strong {
    display: block;
    margin-bottom: 6px;
  }

  .faq-item p {
    margin: 0;
  }

  /* --- Profile Screen --- */
  .profile-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-main);
  }

  .profile-page {
    flex: 1;
    padding: 32px 40px 48px;
    overflow-y: auto;
  }

  .profile-shell {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 32px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .profile-card {
    background: var(--bg-surface);
    border-radius: var(--radius-lg);
    padding: 24px;
    display: grid;
    gap: 16px;
    box-shadow: 0 12px 30px rgba(0,0,0,0.25);
  }

  .profile-avatar {
    width: 108px;
    height: 108px;
    border-radius: 50%;
    background: var(--bg-input);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    font-weight: 600;
    overflow: hidden;
  }

  .profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .profile-name {
    font-size: 22px;
    font-weight: 700;
  }

  .profile-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .profile-meta span {
    word-break: break-word;
  }

  .profile-role {
    font-size: 12px;
    color: var(--text-muted);
    background: var(--bg-input);
    padding: 6px 10px;
    border-radius: 999px;
    width: fit-content;
  }

  .profile-actions {
    display: grid;
    gap: 10px;
  }

  .profile-actions button {
    width: 100%;
  }

  .profile-card .btn-ghost {
    width: 100%;
  }

  .profile-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .profile-tabs {
    display: flex;
    gap: 18px;
    border-bottom: 1px solid var(--bg-input);
  }

  .profile-tab {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 600;
    padding: 10px 0;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }

  .profile-tab.active {
    color: var(--text-primary);
    border-color: var(--accent-link);
  }

  .profile-panel {
    background: var(--bg-surface);
    border-radius: var(--radius-md);
    padding: 24px;
    box-shadow: 0 10px 24px rgba(0,0,0,0.2);
  }

  .profile-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 24px;
  }

  .profile-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .profile-label {
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .profile-hint {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 12px;
  }

  .profile-actions-row {
    display: flex;
    gap: 12px;
    margin-top: 18px;
  }

  .btn-secondary {
    padding: 10px 14px;
    background: var(--bg-input);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;
  }
  .btn-secondary:hover { background: var(--bg-input); border-color: var(--text-muted); }
  .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-danger {
    padding: 10px 14px;
    background: transparent;
    color: var(--accent-danger);
    border: 1px solid rgba(255,107,107,0.5);
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
  .btn-danger:hover { background: rgba(255,107,107,0.12); border-color: var(--accent-danger); }
  .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-ghost {
    padding: 10px 14px;
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    font-size: 14px;
    cursor: pointer;
    transition: color 0.2s ease, background 0.2s ease;
  }
  .btn-ghost:hover { color: var(--text-primary); background: var(--ghost-hover); }
  .btn-ghost:disabled { opacity: 0.6; cursor: not-allowed; }

  .focus-ring:focus-visible {
    outline: 2px solid var(--accent-link);
    outline-offset: 2px;
  }

  .activity-list {
    display: grid;
    gap: 12px;
    margin-top: 12px;
  }

  .activity-item {
    background: var(--bg-input);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    display: grid;
    grid-template-columns: 36px 1fr auto;
    gap: 12px;
    align-items: center;
  }

  .activity-icon {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: var(--bg-input);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: var(--text-primary);
  }

  .activity-title { font-weight: 600; }
  .activity-meta { font-size: 12px; color: var(--text-muted); }
  .activity-item > .activity-meta { justify-self: end; }

  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    color: var(--text-secondary);
  }
  .toggle input { display: none; }
  .toggle-track {
    width: 42px;
    height: 24px;
    border-radius: 999px;
    background: var(--bg-input);
    position: relative;
    transition: background 0.2s ease;
  }
  .toggle-track::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease;
  }
  .toggle input:checked + .toggle-track { background: var(--accent-link); }
  .toggle input:checked + .toggle-track::after { transform: translateX(18px); }

  .toast {
    position: fixed;
    right: 24px;
    bottom: 24px;
    background: #111;
    color: #fff;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    box-shadow: 0 12px 30px rgba(0,0,0,0.35);
    z-index: 20;
  }

  .skeleton {
    background: linear-gradient(90deg, var(--skeleton-start), var(--skeleton-mid), var(--skeleton-start));
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite;
    border-radius: var(--radius-sm);
  }

  @keyframes shimmer {
    0% { background-position: 0% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 900px) {
    .profile-page { padding: 24px; }
    .profile-shell { grid-template-columns: 1fr; }
    .profile-grid { grid-template-columns: 1fr; }
    .profile-actions-row { flex-direction: column; align-items: stretch; }
    .activity-item { grid-template-columns: 36px 1fr; }
    .activity-item > .activity-meta { justify-self: start; }
    .toolbar-row { flex-direction: column; align-items: stretch; }
    .toolbar-group { width: 100%; }
    .toolbar-select { width: 100%; min-width: 0; }
    .toolbar-search { width: 100%; }
    .toolbar-search .input { width: 100%; }
    .toolbar-group-actions { justify-content: flex-start; }
    .toolbar-divider { display: none; }
  }

  @media (max-width: 640px) {
    h1 { font-size: 36px; }
    .page { padding: 24px 16px; }
    .top-nav { padding: 0 16px; }
    .nav-logo { font-size: 16px; max-width: 60vw; }
    .nav-greeting { display: none; }
    .board-toolbar { padding: 10px 16px 14px; }
    .toolbar-search .input { width: 100%; }
    .board-layout { padding: 12px 16px calc(20px + env(safe-area-inset-bottom)); gap: 12px; }
    .kanban-column { flex: 0 0 240px; width: 240px; min-width: 240px; }
    .members-label { display: none; }
    .member-avatar { width: 26px; height: 26px; font-size: 10px; }
    .toolbar-panel { flex-direction: column; align-items: stretch; }
    .toolbar-panel .input { max-width: none; width: 100%; }
    .background-picker { width: 100%; min-width: 0; }
    .mycards-page { padding: 16px; }
    .mycards-header { flex-direction: column; align-items: flex-start; }
    .content-page { padding: 16px; }
    .profile-page { padding: 20px 16px 32px; }
    .profile-tabs {
      flex-wrap: nowrap;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 6px;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }
    .profile-tabs::-webkit-scrollbar { display: none; }
    .profile-tab { white-space: nowrap; }
    .toolbar-pill { width: 100%; justify-content: space-between; }
    .modal-footer { flex-direction: column; align-items: flex-start; }
    .modal-footer-actions { width: 100%; }
  }

  @media (max-width: 520px) {
    .modal-backdrop {
      align-items: flex-start;
      padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
    }
    .modal {
      width: 100%;
      max-height: calc(100vh - 24px);
      border-radius: 14px;
    }
    .modal-header {
      flex-wrap: wrap;
      gap: 10px;
    }
    .modal-title { font-size: 16px; }
    .modal-subtitle { font-size: 11px; }
    .board-toolbar { padding: 8px 12px 10px; gap: 6px; }
    .mycards-grid { grid-template-columns: 1fr; }
    .profile-shell { gap: 20px; }
    .profile-card { padding: 18px; gap: 12px; }
    .profile-avatar { width: 84px; height: 84px; font-size: 32px; }
    .profile-name { font-size: 18px; }
    .profile-panel { padding: 18px; }
    .profile-grid { gap: 12px; }
    .profile-hint { font-size: 12px; }
    .faq-item { padding: 14px; }
    .toolbar-row { flex-direction: column; align-items: stretch; gap: 6px; }
    .toolbar-group { gap: 6px; }
    .toolbar-group-primary { flex: 1 1 100%; display: grid; gap: 4px; }
    .toolbar-group-actions,
    .toolbar-divider { display: none; }
    .toolbar-select { display: none; }
    .board-selector-button { display: flex; }
    .toolbar-search { flex: 1 1 100%; min-width: 0; padding: 0 6px; }
    .toolbar-search .input { min-width: 0; width: 100%; padding: 6px 2px; }
    .toolbar-pill { padding: 4px 8px; font-size: 11px; }
    .toolbar-meta { font-size: 11px; }
    .toolbar-panel { padding: 8px 10px; gap: 8px; }
    .members-trigger { padding: 4px 8px; }
    .board-btn { padding: 6px 10px; font-size: 12px; min-height: 30px; }
    .board-btn.icon { width: 30px; height: 30px; }
    .board-layout { padding-bottom: calc(20px + 64px + env(safe-area-inset-bottom)); }
    .mobile-action-bar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 28;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
      background: var(--toolbar-bg);
      border-top: 1px solid var(--border-subtle);
      box-shadow: 0 -12px 28px rgba(0,0,0,0.3);
    }
    .mobile-action-bar .board-menu-panel {
      top: auto;
      bottom: 44px;
      right: 0;
    }
  }
`;

// --- TYPES ---
// Оновлені інтерфейси відповідно до бекенду (models.py)
export interface Board {
  id: number;
  title: string;
  description: string;
  background_url?: string;
  is_archived?: boolean;
  invite_link?: string;
  owner?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    profile?: { avatar_url?: string | null };
  };
  members?: Array<{
    id: number;
    role: 'admin' | 'member';
    user: {
      id: number;
      username: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      profile?: { avatar_url?: string | null };
    };
  }>;
}

export interface List {
  id: number;
  title: string;
  board: number;
  order: number;
}

export interface Card {
  id: number;
  title: string;
  description: string;
  list: number; // ID списку
}

// --- COMPONENT: AUTH SIDEBAR (PREVIEW) ---
const KanbanPreview: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="auth-right">
      <div className="board-wrapper">
        <div className="column-preview todo">
          <h3>{t('auth.preview.todoTitle')}</h3>
          <div className="card-preview">{t('auth.preview.todoCard')}</div>
        </div>
        <div className="column-preview progress">
          <h3>{t('auth.preview.progressTitle')}</h3>
          <div className="card-preview">{t('auth.preview.progressCard')}</div>
        </div>
        <div className="column-preview done">
          <h3>{t('auth.preview.doneTitle')}</h3>
          <div className="card-preview">{t('auth.preview.doneCard')}</div>
        </div>
      </div>
    </div>
  );
};

const ThemeSync: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const theme = user?.profile?.theme || 'dark';
    document.documentElement.dataset.theme = theme;
  }, [user?.profile?.theme]);

  return null;
};

// --- COMPONENT: AUTH SCREEN ---
const AuthScreen: React.FC = () => {
  const { login, register, googleLogin, isAuthenticated } = useAuth();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isAuthenticated) navigate('/board', { replace: true }); }, [isAuthenticated, navigate]);

  useEffect(() => {
    const googleLocale = ['uk', 'en', 'de', 'pl', 'fr', 'es'].includes(locale) ? locale : 'en';
    const handleCredentialResponse = async (response: any) => {
      try { await googleLogin(response.credential); } 
      catch (err) { setError(t('auth.googleError')); }
    };
    const initBtn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse, locale: googleLocale });
        const p = document.getElementById("googleSignInDiv");
        if (p) {
          p.innerHTML = '';
          window.google.accounts.id.renderButton(p, { theme: "filled_blue", size: "large", width: "400", shape: "rectangular", locale: googleLocale });
        }
      }
    };
    const scriptId = 'google-client-script';
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing && existing.dataset.locale !== googleLocale) {
      existing.remove();
    }
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.src = `https://accounts.google.com/gsi/client?hl=${googleLocale}`;
      s.id = scriptId;
      s.async = true;
      s.defer = true;
      s.dataset.locale = googleLocale;
      s.onload = initBtn;
      document.body.appendChild(s);
    } else {
      initBtn();
    }
  }, [googleLogin, isRegistering, locale, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isRegistering) await register(formData);
      else await login({ username: formData.username, password: formData.password });
    } catch (err: any) {
      if (err.response?.data) {
         const d = err.response.data; const k = Object.keys(d)[0]; setError(`${k}: ${d[k]}`);
      } else setError(t('auth.loginError'));
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="auth-left">
        <h1>{isRegistering ? t('auth.createAccount') : t('auth.welcome')}</h1>
        <p>{isRegistering ? t('auth.joinBoardly') : t('auth.enterDetails')}</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group"><label className="label">{t('auth.firstName')}</label><input className="input" type="text" placeholder={t('auth.placeholderFirstName')} value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required={isRegistering} /></div>
              <div className="form-group"><label className="label">{t('auth.lastName')}</label><input className="input" type="text" placeholder={t('auth.placeholderLastName')} value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required={isRegistering} /></div>
            </div>
          )}
          <div className="form-group"><label className="label">{t('auth.username')}</label><input className="input" type="text" placeholder={t('auth.placeholderUsername')} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required /></div>
          <div className="form-group"><label className="label">{t('auth.password')}</label><input className="input" type="password" placeholder={t('auth.placeholderPassword')} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required /></div>
          {!isRegistering && <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}><Link to="/forgot-password" className="link">{t('auth.forgotPassword')}</Link></div>}
          <button type="submit" disabled={loading} className="btn-primary">{loading ? t('auth.processing') : (isRegistering ? t('auth.signUp') : t('auth.signIn'))}</button>
        </form>
        <div className="auth-footer"><span>{isRegistering ? `${t('auth.hasAccount')} ` : `${t('auth.noAccount')} `}</span><button className="link" onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>{isRegistering ? t('auth.signIn') : t('auth.createAccount')}</button></div>
        <div className="google-wrapper"><div id="googleSignInDiv" style={{ height: '44px' }}></div></div>
      </div>
      <KanbanPreview />
    </div>
  );
};

// --- COMPONENT: MAIN KANBAN BOARD (FIXED) ---
const KanbanBoardScreen: React.FC = () => {
  const { authToken, user, logout, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [showMobileNav, setShowMobileNav] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingToListId, setAddingToListId] = useState<number | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false); // Флаг для запобігання подвійному завантаженню

  // 1. Auth check
  useEffect(() => { if (!isAuthenticated) navigate('/auth'); }, [isAuthenticated, navigate]);

  // 2. Fetch Board & Lists (ONE TIME ONLY)
  useEffect(() => {
    if (authToken && !hasInitialized.current) {
      hasInitialized.current = true;
      
      // Отримуємо дошки
      axios.get(`${API_URL}/boards/`, { headers: { Authorization: `Token ${authToken}` } })
        .then(async (res) => {
          if (res.data.length > 0) {
            const board = res.data[0];
            setActiveBoard(board);
            
            // Завантажуємо дані для цієї дошки
            try {
              const listsRes = await axios.get(`${API_URL}/lists/?board_id=${board.id}`, { headers: { Authorization: `Token ${authToken}` } });
              setLists(listsRes.data.sort((a: List, b: List) => a.order - b.order));

              const cardsRes = await axios.get(`${API_URL}/cards/?board_id=${board.id}`, { headers: { Authorization: `Token ${authToken}` } });
              setCards(cardsRes.data);
            } catch (err: any) {
              setError(`Помилка завантаження даних: ${err.message}`);
            }
          } else {
            // Створюємо дефолтну дошку
            try {
                const newBoard = await axios.post(`${API_URL}/boards/`, { title: 'Моя перша дошка' }, { headers: { Authorization: `Token ${authToken}` } });
                setActiveBoard(newBoard.data);
                
                // Створюємо дефолтні списки
                const boardId = newBoard.data.id;
                await Promise.all([
                  axios.post(`${API_URL}/lists/`, { title: 'До виконання', board: boardId, order: 0 }, { headers: { Authorization: `Token ${authToken}` } }),
                  axios.post(`${API_URL}/lists/`, { title: 'У процесі', board: boardId, order: 1 }, { headers: { Authorization: `Token ${authToken}` } }),
                  axios.post(`${API_URL}/lists/`, { title: 'Готово', board: boardId, order: 2 }, { headers: { Authorization: `Token ${authToken}` } })
                ]);
                
                // Завантажуємо дані
                const listsRes = await axios.get(`${API_URL}/lists/?board_id=${boardId}`, { headers: { Authorization: `Token ${authToken}` } });
                setLists(listsRes.data.sort((a: List, b: List) => a.order - b.order));

                const cardsRes = await axios.get(`${API_URL}/cards/?board_id=${boardId}`, { headers: { Authorization: `Token ${authToken}` } });
                setCards(cardsRes.data);
            } catch (err: any) {
                setError(`Помилка створення дошки: ${err.message || 'Невідома помилка'}`);
            }
          }
        })
        .catch((err: any) => {
            setError(`Помилка завантаження дошок: ${err.response?.status} ${err.response?.statusText || err.message}`);
        });
    }
  }, [authToken]);

  // Actions
  const handleAddTask = async (e: FormEvent, listId: number) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !authToken) return;
    try {
      // Створюємо картку в конкретному списку (List ID), а не зі статусом
      const res = await axios.post(`${API_URL}/cards/`, { title: newTaskTitle, list: listId }, { headers: { Authorization: `Token ${authToken}` } });
      setCards([...cards, res.data]);
      setNewTaskTitle('');
      setAddingToListId(null);
    } catch (err: any) { 
        alert(`Помилка створення задачі: ${JSON.stringify(err.response?.data || err.message)}`);
    }
  };

  const handleMoveCard = async (card: Card, targetListId: number) => {
    try {
      // Optimistic update
      const updatedCards = cards.map(c => c.id === card.id ? { ...c, list: targetListId } : c);
      setCards(updatedCards);
      
      // Patch request with new LIST ID
      await axios.patch(`${API_URL}/cards/${card.id}/`, { list: targetListId }, { headers: { Authorization: `Token ${authToken}` } });
    } catch (err: any) { 
      alert(`Помилка переміщення: ${JSON.stringify(err.response?.data || err.message)}`);
      // Re-fetch to sync
      if (activeBoard) {
         axios.get(`${API_URL}/cards/?board_id=${activeBoard.id}`, { headers: { Authorization: `Token ${authToken}` } })
          .then(res => setCards(res.data));
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Видалити задачу?")) return;
    try {
      setCards(cards.filter(c => c.id !== id));
      await axios.delete(`${API_URL}/cards/${id}/`, { headers: { Authorization: `Token ${authToken}` } });
    } catch { alert('Помилка видалення'); }
  };

  const closeMobileNav = () => setShowMobileNav(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="app-container">
        <div className="page-state">
          <div className="page-state-title">Завантаження...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="app-container">
        <div className="page-state">
          <div className="page-state-title" style={{ color: 'var(--accent-danger)' }}>Виникла помилка</div>
          <div className="page-state-subtitle">{error}</div>
          <div className="page-state-actions">
            <button className="btn-primary" onClick={() => window.location.reload()} style={{ width: 'auto' }}>
              Спробувати ще раз
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeBoard) {
    return (
      <div className="app-container">
        <div className="page-state">
          <div className="page-state-title">Створення вашої дошки...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="top-nav">
        <Link to="/" className="nav-logo" onClick={closeMobileNav}>Boardly / {activeBoard.title}</Link>
        <button
          className="nav-menu-button"
          onClick={() => setShowMobileNav(!showMobileNav)}
          aria-label={t('nav.menu')}
        >
          {t('nav.menu')}
        </button>
        <div className={`nav-actions ${showMobileNav ? 'mobile-open' : ''}`}>
          <span className="nav-greeting">Привіт, {user.first_name || user.username}</span>
          <Link to="/my-cards" className="link" onClick={closeMobileNav}>{t('nav.myCards')}</Link>
          <Link to="/profile" className="link" onClick={closeMobileNav}>{t('nav.profile')}</Link>
          <Link to="/faq" className="link" onClick={closeMobileNav}>{t('nav.faq')}</Link>
          <button onClick={() => { closeMobileNav(); logout(); }} className="link" style={{color: 'var(--accent-danger)'}}>{t('nav.logout')}</button>
        </div>
      </nav>


      {/* Board Area */}
      <div className="board-layout">
        {lists.map((list, index) => (
          <div key={list.id} className="kanban-column">
            <div className="column-header">
              <div className="column-title">
                <div className={`dot col-${index % 3}`}></div>
                {list.title}
              </div>
              <span className="count-badge">{cards.filter(c => c.list === list.id).length}</span>
            </div>

            <div className="task-list">
              {cards.filter(c => c.list === list.id).map(card => (
                <div key={card.id} className="task-card">
                  <div className="task-title">{card.title}</div>
                  {card.description && <div className="task-desc">{card.description}</div>}
                  
                  <div className="task-footer">
                    <div className="task-controls">
                      {/* Move Logic: Find other lists */}
                      {lists.filter(l => l.id !== list.id).map(targetList => (
                         <button key={targetList.id} onClick={() => handleMoveCard(card, targetList.id)} className="move-btn">
                           → {targetList.title}
                         </button>
                      ))}
                    </div>
                    <button onClick={() => handleDelete(card.id)} className="btn-icon danger">×</button>
                  </div>
                </div>
              ))}
              
              {/* Add Task Button */}
              {addingToListId === list.id ? (
                <form onSubmit={(e) => handleAddTask(e, list.id)} style={{marginTop: 12}}>
                  <input autoFocus className="input" style={{marginBottom: 8}} placeholder="Назва задачі..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                  <div style={{display:'flex', gap: 8}}>
                    <button type="submit" className="btn-primary" style={{padding: '8px 12px', fontSize: 13}}>Додати</button>
                    <button type="button" onClick={() => { setAddingToListId(null); setNewTaskTitle(''); }} className="link">Скасувати</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => { setAddingToListId(list.id); setNewTaskTitle(''); }} className="btn-primary" style={{background: 'transparent', border: '1px dashed var(--bg-input)', color: 'var(--text-muted)', marginTop: 12}}>+ Нова задача</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- COMPONENT: PROFILE ---
const ProfileLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const displayName = user ? (user.first_name || user.username) : '';
  const [showMobileNav, setShowMobileNav] = useState(false);
  const closeMobileNav = () => setShowMobileNav(false);

  return (
    <div className="profile-layout">
      <nav className="top-nav">
        <Link to="/board" className="nav-logo" onClick={closeMobileNav}>Boardly</Link>
        <button
          className="nav-menu-button"
          onClick={() => setShowMobileNav(!showMobileNav)}
          aria-label={t('nav.menu')}
        >
          {t('nav.menu')}
        </button>
        <div className={`nav-actions ${showMobileNav ? 'mobile-open' : ''}`}>
          <Link to="/board" className="link" onClick={closeMobileNav}>{t('nav.board')}</Link>
          <Link to="/my-cards" className="link" onClick={closeMobileNav}>{t('nav.myCards')}</Link>
          <Link to="/profile" className="link" onClick={closeMobileNav}>{t('nav.profile')}</Link>
          <Link to="/faq" className="link" onClick={closeMobileNav}>{t('nav.faq')}</Link>
          {user && <span className="nav-greeting">{t('nav.greeting', { name: displayName })}</span>}
          <button onClick={() => { closeMobileNav(); logout(); }} className="link" style={{color: 'var(--accent-danger)'}}>{t('nav.logout')}</button>
        </div>
      </nav>
      <ProfileScreen />
    </div>
  );
};

// --- PASSWORD RESET ---
const ForgotPasswordScreen: React.FC = () => {
  const { resetPassword } = useAuth();
  const { t, locale } = useI18n();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      await resetPassword(email);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMsg(t('passwordReset.error'));
    }
  };

  return (
    <div className="page">
      <div className="auth-left">
        <h1>{t('passwordReset.title')}</h1>
        {status === 'success' ? (
          <>
            <h2 style={{ marginTop: 0 }}>{t('passwordReset.successTitle')}</h2>
            <p>{t('passwordReset.successHint')}</p>
            <Link
              to="/auth"
              className="btn-primary"
              style={{ display: 'inline-block', textDecoration: 'none', width: 'auto', padding: '12px 20px' }}
            >
              {t('passwordReset.backToLogin')}
            </Link>
          </>
        ) : (
          <>
            <p>{t('passwordReset.description')}</p>
            {status === 'error' && <div className="error-message">{errorMsg}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">{t('passwordReset.emailLabel')}</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder={t('passwordReset.emailPlaceholder')}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={status === 'loading'}>
                {status === 'loading' ? t('passwordReset.sending') : t('passwordReset.submit')}
              </button>
            </form>
            <Link to="/auth" className="link" style={{ display: 'inline-block', marginTop: '16px' }}>
              {t('passwordReset.remembered')}
            </Link>
          </>
        )}
      </div>
      <KanbanPreview />
    </div>
  );
};

const ResetPasswordConfirmScreen: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const { resetPasswordConfirm } = useAuth();
  const { t, locale } = useI18n();
  const [newPassword, setNewPassword] = useState('');
  const [reNewPassword, setReNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (newPassword !== reNewPassword) {
      setErrorMessage(t('resetConfirm.errorMismatch'));
      return;
    }

    setStatus('loading');
    try {
      await resetPasswordConfirm({
        uid,
        token,
        new_password: newPassword,
        re_new_password: reNewPassword,
      });
      setStatus('success');
      setTimeout(() => navigate('/auth'), 3000);
    } catch (error: any) {
      setStatus('error');
      if (error.response && error.response.data) {
        const data = error.response.data;
        const firstKey = Object.keys(data)[0];
        const errorText = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
        if (firstKey === 'new_password' || firstKey === 're_new_password') {
          setErrorMessage(t('resetConfirm.errorPassword', { message: errorText }));
        } else if (firstKey === 'token') {
          setErrorMessage(t('resetConfirm.errorInvalidLink'));
        } else {
          setErrorMessage(`${firstKey}: ${errorText}`);
        }
      } else {
        setErrorMessage(t('resetConfirm.errorUnknown'));
      }
    }
  };

  return (
    <div className="page">
      <div className="auth-left">
        <h1>{t('resetConfirm.title')}</h1>
        {status === 'success' ? (
          <>
            <h2 style={{ marginTop: 0 }}>{t('resetConfirm.successTitle')}</h2>
            <p>{t('resetConfirm.successHint')}</p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <div className="form-group">
              <label className="label">{t('resetConfirm.newPasswordLabel')}</label>
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
                placeholder={t('resetConfirm.newPasswordPlaceholder')}
              />
            </div>
            <div className="form-group">
              <label className="label">{t('resetConfirm.confirmPasswordLabel')}</label>
              <input
                className="input"
                type="password"
                value={reNewPassword}
                onChange={(event) => setReNewPassword(event.target.value)}
                required
                placeholder={t('resetConfirm.confirmPasswordPlaceholder')}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? t('resetConfirm.saving') : t('resetConfirm.submit')}
            </button>
          </form>
        )}
      </div>
      <KanbanPreview />
    </div>
  );
};

// --- LEGACY BOARD LOADER (handles data fetching) ---
const LegacyBoardLoader: React.FC = () => {
  const { authToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (authToken && !hasInitialized.current) {
      hasInitialized.current = true;
      
      axios.get(`${API_URL}/boards/`, { headers: { Authorization: `Token ${authToken}` } })
        .then(async (res) => {
          setBoards(res.data);
          if (res.data.length > 0) {
            const params = new URLSearchParams(location.search);
            const boardParam = Number(params.get('board'));
            const storedId = Number(localStorage.getItem('lastBoardId'));
            const preferred = res.data.find((b: Board) => b.id === boardParam)
              || res.data.find((b: Board) => b.id === storedId)
              || res.data[0];
            setActiveBoard(preferred);
          }
        })
        .catch((err: any) => {
          console.error('[LegacyBoardLoader] Error loading boards:', err.message);
        });
    }
  }, [authToken]);

  useEffect(() => {
    if (!boards.length) return;
    const params = new URLSearchParams(location.search);
    const boardParam = Number(params.get('board'));
    if (!boardParam || activeBoard?.id === boardParam) return;
    const match = boards.find((b: Board) => b.id === boardParam);
    if (match) {
      setActiveBoard(match);
    }
  }, [activeBoard?.id, boards, location.search]);

  return <LegacyBoardScreen activeBoard={activeBoard} boards={boards} />;
};

// --- APP ROUTER ---
export default function App() {
  return (
    <>
      <style>{globalStyles}</style>
      <BrowserRouter>
        <AuthProvider>
          <I18nProvider>
            <ThemeSync />
            <Routes>
              <Route path="/auth" element={<AuthScreen />} />
              <Route path="/login" element={<AuthScreen />} />
              <Route path="/" element={<Navigate to="/board" replace />} />
              <Route path="/board" element={<LegacyBoardLoader />} />
              <Route path="/profile" element={<ProfileLayout />} />
              <Route path="/my-cards" element={<MyCardsScreen />} />
              <Route path="/faq" element={<FaqScreen />} />
              <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
              <Route path="/password-reset/:uid/:token" element={<ResetPasswordConfirmScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </I18nProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}
