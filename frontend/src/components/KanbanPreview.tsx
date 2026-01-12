import React from 'react';

export const KanbanPreview: React.FC = () => {
    return (
        <div className="auth-right">
            <div className="board-wrapper">
                {/* Column 1: To Do */}
                <div className="column todo">
                    <h3>To do</h3>
                    <div className="card-preview">Design login page</div>
                    <div className="card-preview">Create task board</div>
                    <div className="card-preview">Set up notifications</div>
                </div>

                {/* Column 2: In Progress */}
                <div className="column progress">
                    <h3>In progress</h3>
                    <div className="card-preview">
                        Implement drag & drop
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
                    <h3>Done</h3>
                    <div className="card-preview done-item">
                        <span className="check-icon">✔</span> User authentication
                    </div>
                    <div className="card-preview done-item">
                        <span className="check-icon">✔</span> Board creation
                    </div>
                    <div className="card-preview done-item">
                        <span className="check-icon">✔</span> Team invites
                    </div>
                </div>
            </div>
        </div>
    );
};