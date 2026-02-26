import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';
import client from '../../api/client';
import { type ProfileData, type User } from '../../types';
import { extractAuthErrorMessage, type AuthErrorPayload } from '../../shared/utils/authError';
import { getApiErrorPayload } from '../../shared/utils/apiError';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

type AuthRejectValue = AuthErrorPayload | string;

type LoginPayload = {
  username: string;
  password: string;
};

type RegisterPayload = {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: !!localStorage.getItem('authToken'),
  loading: false,
  error: null,
  successMessage: null,
};

const parseApiErrorPayload = (error: unknown, fallback: string): AuthRejectValue => {
  return getApiErrorPayload(error, fallback) as AuthRejectValue;
};

const toErrorMessage = (payload: unknown) => extractAuthErrorMessage(payload, 'Помилка авторизації.');

export const fetchMe = createAsyncThunk<User, void, { rejectValue: AuthRejectValue }>(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await client.get<User>('/users/me/');
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Failed to fetch user'));
    }
  }
);

export const loginUser = createAsyncThunk<string, LoginPayload, { rejectValue: AuthRejectValue }>(
  'auth/login',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const res = await client.post<{ auth_token: string }>('/auth/token/login/', data);
      const token = res.data.auth_token;
      localStorage.setItem('authToken', token);
      dispatch(fetchMe());
      return token;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Login failed'));
    }
  }
);

export const googleLoginUser = createAsyncThunk<
  string,
  { code?: string; access_token?: string },
  { rejectValue: AuthRejectValue }
>(
  'auth/googleLogin',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await client.post<{ key?: string; auth_token?: string }>('/auth/google/', payload);
      const token = res.data.key || res.data.auth_token || '';
      localStorage.setItem('authToken', token);
      dispatch(fetchMe());
      return token;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Google login failed'));
    }
  }
);

export const logoutUser = createAsyncThunk<null>('auth/logout', async () => {
  try {
    await client.post('/auth/token/logout/');
  } catch {
    // Ignore logout errors.
  }

  localStorage.removeItem('authToken');
  return null;
});

export const registerUser = createAsyncThunk<boolean, RegisterPayload, { rejectValue: AuthRejectValue }>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      await client.post('/auth/users/', {
        username: (data.username || '').trim(),
        password: data.password || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: (data.email || `${data.username}@boardly.local`).trim(),
      });
      return true;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Registration failed'));
    }
  }
);

export const updateUserProfile = createAsyncThunk<
  User,
  Partial<User> & { profile?: Partial<ProfileData> },
  { rejectValue: AuthRejectValue }
>(
  'auth/updateProfile',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const res = await client.patch<User>('/users/me/', data);
      dispatch(fetchMe());
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Update failed'));
    }
  }
);

export const uploadUserAvatar = createAsyncThunk<unknown, File, { rejectValue: AuthRejectValue }>(
  'auth/uploadAvatar',
  async (file, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await client.post('/users/me/avatar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(fetchMe());
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Upload failed'));
    }
  }
);

export const removeUserAvatar = createAsyncThunk<unknown, void, { rejectValue: AuthRejectValue }>(
  'auth/removeAvatar',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await client.delete('/users/me/avatar/');
      dispatch(fetchMe());
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Delete failed'));
    }
  }
);

export const changeUserPassword = createAsyncThunk<
  boolean,
  { current_password: string; new_password: string; re_new_password?: string },
  { rejectValue: AuthRejectValue }
>(
  'auth/changePassword',
  async (data, { rejectWithValue }) => {
    try {
      try {
        await client.post('/users/me/password/', {
          current_password: data.current_password,
          new_password: data.new_password,
          re_new_password: data.re_new_password ?? data.new_password,
        });
      } catch (firstError: unknown) {
        const status = isAxiosError(firstError) ? firstError.response?.status : undefined;
        if (status !== 404) {
          throw firstError;
        }

        try {
          await client.post('/auth/users/set_password/', {
            current_password: data.current_password,
            new_password: data.new_password,
            re_new_password: data.re_new_password ?? data.new_password,
          });
        } catch (djoserError: unknown) {
          const payload = isAxiosError(djoserError)
            ? (djoserError.response?.data as Record<string, unknown> | undefined)
            : undefined;

          const hasReNewPasswordError = Boolean(payload && typeof payload === 'object' && 're_new_password' in payload);
          if (!hasReNewPasswordError) {
            throw djoserError;
          }

          await client.post('/auth/users/set_password/', {
            current_password: data.current_password,
            new_password: data.new_password,
          });
        }
      }

      return true;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Password change failed'));
    }
  }
);

export const verifyCurrentPassword = createAsyncThunk<
  boolean,
  string,
  { rejectValue: AuthRejectValue }
>(
  'auth/verifyCurrentPassword',
  async (current_password, { rejectWithValue }) => {
    try {
      await client.post('/users/me/password/check-current/', { current_password });
      return true;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Current password verification failed'));
    }
  }
);

export const sendEmailVerification = createAsyncThunk<
  boolean,
  string,
  { rejectValue: AuthRejectValue }
>(
  'auth/sendEmailVerification',
  async (email, { rejectWithValue }) => {
    try {
      await client.post('/auth/users/resend_activation/', { email });
      return true;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Verification email failed'));
    }
  }
);

export const deleteUserAccount = createAsyncThunk<boolean, void, { rejectValue: AuthRejectValue }>(
  'auth/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      await client.delete('/users/me/');
      return true;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Delete account failed'));
    }
  }
);

export const activateUserAccount = createAsyncThunk<
  boolean,
  { uid: string; token: string },
  { rejectValue: AuthRejectValue }
>(
  'auth/activate',
  async ({ uid, token }, { rejectWithValue }) => {
    try {
      await client.post('/auth/users/activation/', { uid, token });
      return true;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Activation failed'));
    }
  }
);

export const resetUserPassword = createAsyncThunk<boolean, string, { rejectValue: AuthRejectValue }>(
  'auth/resetPassword',
  async (email, { rejectWithValue }) => {
    try {
      await client.post('/auth/users/reset_password/', { email });
      return true;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Reset password request failed'));
    }
  }
);

export const requestUserPasswordChange = createAsyncThunk<
  boolean,
  { current_password?: string; new_password: string; re_new_password?: string },
  { rejectValue: AuthRejectValue }
>(
  'auth/requestUserPasswordChange',
  async (data, { rejectWithValue }) => {
    try {
      await client.post('/users/me/password/request-change/', {
        current_password: data.current_password ?? '',
        new_password: data.new_password,
        re_new_password: data.re_new_password ?? data.new_password,
      });
      return true;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Password change request failed'));
    }
  }
);

export const confirmUserPasswordReset = createAsyncThunk<
  boolean,
  { uid?: string; token?: string },
  { rejectValue: AuthRejectValue }
>(
  'auth/resetPasswordConfirm',
  async (data, { rejectWithValue }) => {
    try {
      await client.post('/users/password/confirm-change/', data);
      return true;
    } catch (error: unknown) {
      return rejectWithValue(parseApiErrorPayload(error, 'Password reset failed'));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('authToken', action.payload);
    },
    clearError(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('authToken');
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = toErrorMessage(action.payload);
      })
      .addCase(googleLoginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLoginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(googleLoginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = toErrorMessage(action.payload);
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(updateUserProfile.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'Профіль оновлено';
      })
      .addCase(uploadUserAvatar.fulfilled, (state) => {
        state.successMessage = 'Аватар оновлено';
      });
  },
});

export const { setToken, clearError } = authSlice.actions;
export default authSlice.reducer;
