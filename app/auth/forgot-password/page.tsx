'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, ArrowLeft, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { auth } from '@/lib/firebase'; 
import { sendPasswordResetEmail } from 'firebase/auth';
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
 await sendPasswordResetEmail(auth, email);

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred');
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
              {success ? 'Check your email' : 'Reset your password'}
            </CardTitle>
            <CardDescription className="text-center">
              {success 
                ? 'We\'ve sent you a password reset link'
                : 'Enter your email address and we\'ll send you a reset link'
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
                    We've sent a password reset link to:
                  </p>
                  <p className="font-medium text-gray-900">{email}</p>
                  <p className="text-sm text-gray-600">
                    Click the link in the email to reset your password. If you don't see it, check your spam folder.
                  </p>
                </div>
                <div className="space-y-2">
                  <Link href="/auth/signin">
                    <Button className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                    }}
                  >
                    Try Different Email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending reset link...' : 'Send Reset Link'}
                </Button>
              </form>
            )}

            {!success && (
              <div className="mt-6 text-center">
                <Link href="/auth/signin" className="inline-flex items-center text-sm text-blue-600 hover:underline">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        {!success && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-2">Need help?</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Make sure you enter the email address associated with your account</p>
                <p>• Check your spam or junk folder if you don't receive the email</p>
                <p>• The reset link will expire after 1 hour for security</p>
                <p>• Contact your administrator if you continue having issues</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}