'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { auth } from '@/lib/firebase'; // Import the auth instance
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams(); // To get the oobCode from URL

  useEffect(() => {
    // Check if we have the necessary oobCode from the URL
    const oobCode = searchParams.get('oobCode'); 
    if (!oobCode) {
      setError('Invalid or expired reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const oobCode = searchParams.get('oobCode');
      if (!oobCode) { 
        throw new Error('Missing password reset code.');
      }
      // confirmPasswordReset is a standalone function from firebase/auth
      await require('firebase/auth').confirmPasswordReset(auth, oobCode, password);

      setSuccess(true);
      toast.success('Password updated successfully!');
      
      // Redirect to sign in after a short delay
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);

    } catch (err) {
      console.error("Password reset error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900">
            <Brain className="h-8 w-8 text-blue-600" />
            <span>Mind-DiLTak</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {success ? 'Password Updated!' : 'Set New Password'}
            </CardTitle>
            <CardDescription className="text-center">
              {success 
                ? 'Your password has been successfully updated'
                : 'Enter your new password below'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Your password has been successfully updated. You can now sign in with your new password.
                  </p>
                </div>
                <Link href="/auth/signin">
                  <Button className="w-full">
                    Continue to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Password requirements:</p>
                  <ul className="space-y-1 text-xs">
                    <li className={password.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                      • At least 6 characters
                    </li>
                    <li className={password === confirmPassword && password.length > 0 ? 'text-green-600' : 'text-gray-500'}>
                      • Passwords match
                    </li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !password || password !== confirmPassword}
                >
                  {loading ? 'Updating password...' : 'Update Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        {!success && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-2">Security Notice</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Choose a strong, unique password</p>
                <p>• Don't reuse passwords from other accounts</p>
                <p>• This reset link will expire after use</p>
                <p>• You'll be automatically signed in after resetting</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}