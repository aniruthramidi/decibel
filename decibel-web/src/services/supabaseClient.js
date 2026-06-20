export const supabase = {
  auth: {
    async getSession() {
      try {
        const sessionStr = localStorage.getItem('decibel_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          return {
            data: {
              session: {
                user: {
                  email: session.email,
                  user_metadata: { name: session.name },
                  email_confirmed_at: session.email_verified ? new Date().toISOString() : null
                }
              }
            },
            error: null
          };
        }
      } catch (e) {
        console.error('Error parsing session', e);
      }
      return { data: { session: null }, error: null };
    },

    onAuthStateChange(callback) {
      // Return a mock unsubscribe hook
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    },

    async signOut() {
      localStorage.removeItem('decibel_session');
      return { error: null };
    },

    async signUp({ email, password, options }) {
      try {
        const name = options?.data?.name || email.split('@')[0];
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        });
        const data = await res.json();
        if (!res.ok) {
          return { data: null, error: { message: data.detail || 'Registration failed' } };
        }
        return {
          data: {
            user: {
              email: data.email,
              user_metadata: { name: data.name },
              email_confirmed_at: null
            },
            session: null // triggers OTP view in frontend
          },
          error: null
        };
      } catch (err) {
        return { data: null, error: { message: 'Server connection failed' } };
      }
    },

    async signInWithPassword({ email, password }) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          return { data: null, error: { message: data.detail || 'Invalid email or password' } };
        }
        return {
          data: {
            user: {
              email: data.email,
              user_metadata: { name: data.name },
              email_confirmed_at: data.email_verified ? new Date().toISOString() : null
            }
          },
          error: null
        };
      } catch (err) {
        return { data: null, error: { message: 'Server connection failed' } };
      }
    },

    async verifyOtp({ email, token }) {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: token })
        });
        const data = await res.json();
        if (!res.ok) {
          return { data: null, error: { message: data.detail || 'Invalid code' } };
        }
        return {
          data: {
            user: {
              email: email,
              email_confirmed_at: new Date().toISOString()
            }
          },
          error: null
        };
      } catch (err) {
        return { data: null, error: { message: 'Server connection failed' } };
      }
    }
  }
};
