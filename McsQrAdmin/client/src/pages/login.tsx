import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield } from 'lucide-react';
import { loginSchema, type LoginCredentials } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function Login() {
  const [error, setError] = useState<string>('');

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    onSuccess: () => {
      // Redirect to admin dashboard
      window.location.href = '/';
    },
    onError: (error: any) => {
      setError(error.message || 'Login failed');
    }
  });

  const onSubmit = (data: LoginCredentials) => {
    setError('');
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img 
            src="/attached_assets/Trust Pass powered by mcs_1754044444109.png" 
            alt="Trust Pass - Powered by MCS" 
            className="h-24 mx-auto mb-4"
            onError={(e) => {
              console.error('Logo failed to load:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Trust Pass Admin Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage employee verification system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Administrator Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  className="w-full"
                  placeholder="admin@mcsclean.co.uk"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register('password')}
                  className="w-full"
                  placeholder="Enter your password"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Support Contact:</strong></p>
                <p>Phone: <a href="tel:01530382006" className="text-blue-600 hover:underline">01530 382006</a></p>
                <p>Email: <a href="mailto:joshua@trustpass.uk" className="text-blue-600 hover:underline">joshua@trustpass.uk</a></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}