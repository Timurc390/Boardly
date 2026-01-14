import React from 'react';

export const KanbanPreview: React.FC = () => {
    return (
        <div className="auth-right">
            <div className="board-wrapper">
                {/* Column 1: To Do */}
                <div className="column todo">
                    <h3>До виконання</h3>
                    <div className="card-preview">Дизайн сторінки входу</div>
                    <div className="card-preview">Створення дошки задач</div>
                    <div className="card-preview">Налаштувати сповіщення</div>
                </div>

                {/* Column 2: In Progress */}
                <div className="column progress">
                    <h3>У процесі</h3>
                    <div className="card-preview">
                        Реалізувати drag & drop
                        <div className="avatars">
                            <div className="avatar-circle" style={{background: '#ffab91'}}></div>
                            <div className="avatar-circle" style={{background: '#80cbc4'}}></div>
                            <div className="avatar-circle" style={{background: '#ce93d8'}}></div>
                        </div>
                        <div className="progress-line"></div>
                    </div>
                </div>

                {/* Column 3: Done */}
                <div className="column done">
                    <h3>Готово</h3>
                    <div className="card-preview done-item">
                        <span className="check-icon">✔</span> Авторизація користувача
                    </div>
                    <div className="card-preview done-item">
                        <span className="check-icon">✔</span> Створення дошки
                    </div>
                    <div className="card-preview done-item">
                        <span className="check-icon">✔</span> Запрошення команди
                    </div>
                </div>
            </div>
        </div>
    );
};
