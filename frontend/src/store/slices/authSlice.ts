import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import client from '../../api/client';
import { User, ProfileData } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  successMessage: string | null; // Для повідомлень про успіх (наприклад, "Пароль змінено")
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: !!localStorage.getItem('authToken'),
  loading: false,
  error: null,
  successMessage: null,
};

const toErrorMessage = (payload: any) => {
  if (!payload) return 'Помилка авторизації.';
  if (typeof payload === 'string') return payload;
  if (payload.detail) return payload.detail;
  if (Array.isArray(payload.non_field_errors)) return payload.non_field_errors[0];
  const firstKey = Object.keys(payload)[0];
  if (firstKey && Array.isArray(payload[firstKey])) return payload[firstKey][0];
  return 'Помилка авторизації.';
};

// --- Async Thunks ---

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await client.get('/users/me/');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Failed to fetch user');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data: any, { dispatch, rejectWithValue }) => {
    try {
      const res = await client.post('/auth/token/login/', data);
      const token = res.data.auth_token;
      localStorage.setItem('authToken', token);
      dispatch(fetchMe());
      return token;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Login failed');
    }
  }
);

export const googleLoginUser = createAsyncThunk(
  'auth/googleLogin',
  async (payload: { code?: string; access_token?: string }, { dispatch, rejectWithValue }) => {
    try {
      const res = await client.post('/auth/google/', payload);
      const token = res.data.key || res.data.auth_token;
      localStorage.setItem('authToken', token);
      dispatch(fetchMe());
      return token;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Google login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await client.post('/auth/token/logout/');
    } catch (e) {
      // Ignore logout errors
    }
    localStorage.removeItem('authToken');
    return null;
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: any, { rejectWithValue }) => {
    try {
      await client.post('/auth/users/', { 
        ...data, 
        email: data.email || `${data.username}@boardly.local` 
      });
      // Повертаємо true, але не логінимось (чекаємо активації)
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Registration failed');
    }
  }
);

// --- Profile Management ---

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: Partial<User> & { profile?: Partial<ProfileData> }, { dispatch, rejectWithValue }) => {
    try {
      const res = await client.patch('/users/me/', data);
      dispatch(fetchMe()); // Оновлюємо дані в стейті
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Update failed');
    }
  }
);

export const uploadUserAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (file: File, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await client.post('/users/me/avatar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      dispatch(fetchMe());
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Upload failed');
    }
  }
);

export const removeUserAvatar = createAsyncThunk(
  'auth/removeAvatar',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await client.delete('/users/me/avatar/');
      dispatch(fetchMe());
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Delete failed');
    }
  }
);

export const changeUserPassword = createAsyncThunk(
  'auth/changePassword',
  async (data: { current_password: string; new_password: string }, { rejectWithValue }) => {
    try {
      await client.post('/auth/users/set_password/', data);
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Password change failed');
    }
  }
);

export const sendEmailVerification = createAsyncThunk(
  'auth/sendEmailVerification',
  async (email: string, { rejectWithValue }) => {
    try {
      await client.post('/auth/users/resend_activation/', { email });
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Verification email failed');
    }
  }
);

export const deleteUserAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      await client.delete('/users/me/');
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Delete account failed');
    }
  }
);

// --- Account Management ---

export const activateUserAccount = createAsyncThunk(
  'auth/activate',
  async ({ uid, token }: { uid: string; token: string }, { rejectWithValue }) => {
    try {
      await client.post('/auth/users/activation/', { uid, token });
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Activation failed');
    }
  }
);

export const resetUserPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      await client.post('/auth/users/reset_password/', { email });
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Reset password request failed');
    }
  }
);

export const confirmUserPasswordReset = createAsyncThunk(
  'auth/resetPasswordConfirm',
  async (data: any, { rejectWithValue }) => {
    try {
      await client.post('/auth/users/reset_password_confirm/', data);
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Password reset failed');
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
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Me
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
      // Login
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
      // Google Login
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
      // Logout - MOVED UP before addMatcher
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Profile Updates - MOVED UP before addMatcher
      .addCase(updateUserProfile.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'Профіль оновлено';
      })
      .addCase(uploadUserAvatar.fulfilled, (state) => {
        state.successMessage = 'Аватар оновлено';
      });
      // Matchers must be LAST
      // .addMatcher(...) logic was removed or needs to be re-added carefully if needed. 
      // In the previous code, matchers were duplicating logic for login/googleLogin which are already handled above.
      // If you want generic matchers, they must be at the end.
      // Based on the specific error, moving `addCase` up fixes the chain type issue.
  },
});

export const { setToken, clearError } = authSlice.actions;
export default authSlice.reducer;
