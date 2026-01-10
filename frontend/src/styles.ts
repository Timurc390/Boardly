export const globalStyles = `
  /* ГЛОБАЛЬНІ СТИЛІ */
  /* RESET & BASIC */
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F4F5F7; color: #172B4D; }
  * { box-sizing: border-box; }

  /* COMPONENTS */
  .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F9FAFC; background-size: cover; }
  .card { background: white; padding: 40px; border-radius: 3px; box-shadow: 0 0 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px; border: 1px solid #DFE1E6; }
  
  .form-group { margin-bottom: 15px; }
  .form-label { display: block; font-size: 12px; font-weight: 700; color: #5E6C84; margin-bottom: 6px; }
  .form-input { width: 100%; padding: 8px 12px; border: 2px solid #DFE1E6; border-radius: 3px; font-size: 14px; transition: border-color 0.2s; }
  .form-input:focus { border-color: #0052CC; outline: none; }
  
  .btn { width: 100%; padding: 10px; border: none; border-radius: 3px; font-weight: 600; color: white; cursor: pointer; margin-top: 10px; transition: background 0.1s; }
  .btn:hover { filter: brightness(1.1); }
  .btn-primary { background-color: #0052CC; }
  .btn-success { background-color: #5AAC44; }
  .btn-link { background: none; border: none; color: #0052CC; cursor: pointer; margin-top: 15px; font-size: 14px; text-decoration: none; }
  .btn-link:hover { text-decoration: underline; }
  .btn-logout { background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-weight: 600; }
  
  .error-message { background: #FFEBE6; color: #DE350B; padding: 10px; border-radius: 3px; margin-bottom: 20px; font-size: 14px; text-align: left; }
  
  .app-header { background: #026AA7; color: white; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
  .profile-card { max-width: 700px; margin: 40px auto; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 2px rgba(9,30,66,0.25); }
  
  .avatar { width: 64px; height: 64px; background: #DFE1E6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; color: #172B4D; }
  .info-value { padding: 8px 0; border-bottom: 1px solid #EBECF0; color: #172B4D; }

  /* DARK MODE */
  .dark-mode { background-color: #121212; color: #e0e0e0; }
  .dark-mode .app-header { background-color: #1F2937; }
  .dark-mode .profile-card { background-color: #1E1E1E; border: 1px solid #333; }
  .dark-mode .info-value { border-bottom: 1px solid #333; color: #e0e0e0; }
  .dark-mode .form-input { background: #2b2b2b; color: white; border-color: #444; }
  .dark-mode .avatar { background: #333; color: #e0e0e0; }
  
  /* КОНТЕЙНЕРИ */
  .auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #F9FAFC;
    background-image: url('https://trello.com/assets/d947df93bc055849898e.svg'), url('https://trello.com/assets/26845bc3df16fe4046ed.svg');
    background-repeat: no-repeat, no-repeat;
    background-position: left bottom, right bottom;
    background-size: 25%, 25%;
  }

  /* КАРТКИ */
  .card {
    background: white;
    padding: 32px 40px;
    border-radius: 3px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 400px;
    border: 1px solid #DFE1E6;
    text-align: center;
  }

  .profile-card {
    max-width: 800px;
    margin: 40px auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(9, 30, 66, 0.25);
    overflow: hidden;
  }

  /* ЕЛЕМЕНТИ ФОРМИ */
  .form-group { margin-bottom: 15px; text-align: left; }
  .form-label { display: block; font-size: 12px; font-weight: 700; color: #5E6C84; margin-bottom: 4px; }
  .form-input, .form-select {
    width: 100%; padding: 8px 12px; border: 2px solid #DFE1E6;
    border-radius: 3px; background-color: #FAFBFC; font-size: 14px; box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .form-input:focus { outline: none; border-color: #0052CC; background-color: #fff; }

  /* КНОПКИ */
  .btn {
    width: 100%; padding: 10px; border: none; border-radius: 3px;
    font-weight: 600; font-size: 14px; color: white; margin-top: 10px; cursor: pointer;
  }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-primary { background-color: #0052CC; }
  .btn-primary:hover { background-color: #0747A6; }
  .btn-success { background-color: #5AAC44; }
  .btn-success:hover { background-color: #61BD4F; }
  .btn-link {
    background: none; border: none; color: #0052CC; font-size: 13px;
    margin-top: 15px; text-decoration: none; cursor: pointer;
  }
  .btn-link:hover { text-decoration: underline; }

  .error-message {
    background-color: #FFEBE6; color: #DE350B; padding: 10px;
    border-radius: 3px; font-size: 14px; margin-bottom: 15px; text-align: left;
  }
`;