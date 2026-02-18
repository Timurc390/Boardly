import React from 'react';

export const KanbanPreview: React.FC = () => {
    return (
        <div className="board-preview-container">
            {/* Column 1: To Do */}
            <div className="preview-column todo">
                <h3>To do</h3>
                <div className="preview-card">
                    Design login page
                </div>
                <div className="preview-card">
                    Create task board
                </div>
                <div className="preview-card">
                    Set up notifications
                </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="preview-column progress">
                <h3>In progress</h3>
                <div className="preview-card card-large">
                    <span style={{alignSelf: 'center', marginBottom: 'auto'}}>Implement drag & drop</span>
                    
                    <div className="avatars-container">
                        <div className="avatar-circle" style={{background: '#FF6B6B'}}>AB</div>
                        <div className="avatar-circle" style={{background: '#4ECDC4'}}>CD</div>
                        <div className="avatar-circle" style={{background: '#FFD93D'}}>EF</div>
                    </div>
                    
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill"></div>
                    </div>
                </div>
            </div>

            {/* Column 3: Done */}
            <div className="preview-column done">
                <h3>Done</h3>
                <div className="preview-card card-done">
                    <span className="check-icon check-left">✅</span>
                    User authentication
                    <span className="check-icon check-right">✅</span>
                </div>
                <div className="preview-card card-done">
                    <span className="check-icon check-left">✅</span>
                    Board creation
                    <span className="check-icon check-right">✅</span>
                </div>
                <div className="preview-card card-done">
                    <span className="check-icon check-left">✅</span>
                    Team invites
                    <span className="check-icon check-right">✅</span>
                </div>
            </div>
        </div>
    );
};