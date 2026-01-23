import React from 'react';

export const KanbanPreview: React.FC = () => {
    return (
        <div className="board-preview-container">
            {/* Column 1: To Do (Yellow) */}
            <div className="preview-column todo">
                <h3>До виконання</h3>
                <div className="preview-card">
                    Дизайн сторінки входу
                    <br/>
                    <span className="card-tag">High Priority</span>
                </div>
                <div className="preview-card">
                    Створення бази даних
                </div>
                <div className="preview-card" style={{opacity: 0.5}}>
                    + Нова задача
                </div>
            </div>

            {/* Column 2: In Progress (Purple) */}
            <div className="preview-column progress">
                <h3>У процесі</h3>
                <div className="preview-card">
                    Реалізувати Drag & Drop
                    <div className="avatars">
                        <div className="avatar-circle" style={{background: '#FF6B6B'}}></div>
                        <div className="avatar-circle" style={{background: '#4ECDC4'}}></div>
                    </div>
                </div>
                 <div className="preview-card">
                    Налаштування API
                </div>
            </div>

            {/* Column 3: Done (Grey) */}
            <div className="preview-column done">
                <h3>Готово</h3>
                <div className="preview-card" style={{opacity: 0.6}}>
                    Авторизація через Google
                </div>
                <div className="preview-card" style={{opacity: 0.6}}>
                    Налаштування проекту
                </div>
            </div>
        </div>
    );
};