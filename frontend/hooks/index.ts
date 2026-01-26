// frontend/hooks/index.ts
import { useAuthStore } from '@/lib/store';

export const useAuth = () => {
  const { user, login: storeLogin, logout: storeLogout } = useAuthStore();

  const login = async (credentials: any) => {
    // In a real application, you would make an API call to your backend
    // to authenticate the user. For now, we'll just simulate a successful
    // login and update the store.
    const user = {
      id: '1',
      email: credentials.email,
      name: 'Test User',
    };
    storeLogin(user);
  };

  const logout = () => {
    // In a real application, you would make an API call to your backend
    // to invalidate the user's session.
    storeLogout();
  };

  return {
    user,
    login,
    logout,
  };
};
