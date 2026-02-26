import { useState } from 'react';
import { requestUserPasswordChange } from '../../../store/slices/authSlice';
import { type AppDispatch } from '../../../store/store';
import { extractAuthErrorMessage } from '../../../shared/utils/authError';
import { type PasswordFormState, type TranslateFn } from '../types';

type UsePasswordChangeParams = {
  dispatch: AppDispatch;
  passwordInitialized: boolean;
  t: TranslateFn;
  showToast: (message: string) => void;
};

const INITIAL_PASSWORD_FORM: PasswordFormState = {
  current_password: '',
  new_password: '',
  confirm_password: '',
};

export const usePasswordChange = ({
  dispatch,
  passwordInitialized,
  t,
  showToast,
}: UsePasswordChangeParams) => {
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(INITIAL_PASSWORD_FORM);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isPasswordInstructionsOpen, setIsPasswordInstructionsOpen] = useState(false);

  const handlePasswordChange = async () => {
    const requireCurrentPassword = passwordInitialized;
    if ((!passwordForm.current_password && requireCurrentPassword) || !passwordForm.new_password || !passwordForm.confirm_password) {
      showToast(t('common.error'));
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast(t('resetConfirm.errorMismatch'));
      return;
    }

    try {
      await dispatch(requestUserPasswordChange({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        re_new_password: passwordForm.confirm_password,
      })).unwrap();

      setIsPasswordInstructionsOpen(true);
      setPasswordForm(INITIAL_PASSWORD_FORM);
    } catch (error: unknown) {
      showToast(extractAuthErrorMessage(error, t('common.error')));
    }
  };

  return {
    passwordForm,
    setPasswordForm,
    showNewPassword,
    setShowNewPassword,
    isPasswordInstructionsOpen,
    setIsPasswordInstructionsOpen,
    handlePasswordChange,
  };
};
