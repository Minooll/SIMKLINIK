/**
 * SIMKLINIK - Auth & Password Helper
 * Utilities for password validation, first-time Google user detection,
 * setting initial passwords, and requesting password resets.
 */
(function (global) {
  'use strict';

  const authHelper = {
    /**
     * Validates password and confirmPassword inputs.
     * @param {string} password
     * @param {string} confirmPassword
     * @returns {{ valid: boolean, error: string|null }}
     */
    validatePasswordInput(password, confirmPassword) {
      if (!password || typeof password !== 'string' || password.length < 6) {
        return {
          valid: false,
          error: 'Password minimal 6 karakter.'
        };
      }
      if (password !== confirmPassword) {
        return {
          valid: false,
          error: 'Konfirmasi password tidak cocok.'
        };
      }
      return {
        valid: true,
        error: null
      };
    },

    /**
     * Checks if a user logged in with Google is a first-time user who needs to set a password.
     * @param {object} user - Supabase auth user object
     * @param {object} profile - Supabase profile row
     * @returns {boolean}
     */
    isFirstTimeGoogleUser(user, profile) {
      if (!user) return false;

      // Check if user came via Google provider
      const isGoogle = user.app_metadata?.provider === 'google' ||
        (Array.isArray(user.app_metadata?.providers) && user.app_metadata.providers.includes('google'));

      if (!isGoogle) return false;

      // If user metadata explicitly says has_password === true, not first time
      if (user.user_metadata?.has_password === true) {
        return false;
      }

      // Check profile if available
      if (profile && profile.has_password === true) {
        return false;
      }

      return true;
    },

    /**
     * Sets a new password for the currently authenticated user in Supabase.
     * Also updates user_metadata.has_password = true.
     * @param {object} client - Supabase client
     * @param {string} password - New password
     * @returns {Promise<{ success: boolean, error: string|null, data?: any }>}
     */
    async setupNewUserPassword(client, password) {
      if (!client || !client.auth) {
        return { success: false, error: 'Database client tidak tersedia.' };
      }

      const val = this.validatePasswordInput(password, password);
      if (!val.valid) {
        return { success: false, error: val.error };
      }

      try {
        const { data, error } = await client.auth.updateUser({
          password: password,
          data: {
            has_password: true
          }
        });
        if (error) throw error;
        return { success: true, data, error: null };
      } catch (err) {
        const errorMsg = (typeof global.translateError === 'function'
          ? global.translateError(err.message)
          : err.message) || 'Gagal menyimpan kata sandi.';
        return { success: false, error: errorMsg };
      }
    },

    /**
     * Requests a password reset email from Supabase Auth.
     * @param {object} client - Supabase client
     * @param {string} email - Target email
     * @param {string} [redirectTo] - Recovery URL to return to
     * @returns {Promise<{ success: boolean, error: string|null, message?: string }>}
     */
    async requestPasswordReset(client, email, redirectTo) {
      if (!client || !client.auth) {
        return { success: false, error: 'Database client tidak tersedia.' };
      }

      const emailClean = (email || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailClean)) {
        return { success: false, error: 'Format email tidak valid.' };
      }

      try {
        const options = redirectTo ? { redirectTo } : {};
        const { data, error } = await client.auth.resetPasswordForEmail(emailClean, options);
        if (error) throw error;
        return {
          success: true,
          error: null,
          message: 'Tautan reset kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk atau spam.'
        };
      } catch (err) {
        const errorMsg = (typeof global.translateError === 'function'
          ? global.translateError(err.message)
          : err.message) || 'Gagal mengirim instruksi reset kata sandi.';
        return { success: false, error: errorMsg };
      }
    }
  };

  global.authHelper = authHelper;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = authHelper;
  }
})(typeof window !== 'undefined' ? window : this);
