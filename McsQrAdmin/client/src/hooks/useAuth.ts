import { useQuery } from '@tanstack/react-query';

interface AuthResponse {
  authenticated: boolean;
  adminId?: number;
}

export function useAuth() {
  const { data: authData, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  return {
    isAuthenticated: authData?.authenticated || false,
    adminId: authData?.adminId,
    isLoading,
    error: error as Error | null,
  };
}