'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Eye, EyeOff, Users, Info } from 'lucide-react';
import { toast } from 'sonner';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function EmployeeLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Sign in with email and password using Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        setError('User profile not found. Please contact your administrator.');
        await signOut(auth); // Sign out the user from Firebase
        return;
      }

      const userData = userDoc.data();

      if (userData?.role !== 'employee') {
        setError('This login portal is for employees only. Please use the employer login portal or contact your administrator.');
        await signOut(auth); // Sign out the user from Firebase
        return;
      }

      toast.success(`Welcome back, ${userData.first_name}!`);
      router.push('/employee/dashboard');
      
    } catch (err: any) {
      setError(err.message); // Display Firebase error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">WellnessHub</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/auth/employer/login">
                <Button variant="ghost">Employer Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Portal</h1>
            <p className="text-gray-600 mt-2">
              Sign in with your company-provided credentials
            </p>
          </div>

          {/* Login Notice */}
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900">Employee Access</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Use the login credentials provided by your employer. 
                    If you don't have an account, contact your HR department.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">
                Enter your company email and password to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Company Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your company email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    'Sign In to Employee Portal'
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                    Forgot your password?
                  </Link>
                </div>

                <div className="text-center text-sm text-gray-600">
                  <span>Are you an employer? </span>
                  <Link href="/auth/employer/login" className="text-blue-600 hover:underline">
                    Use Employer Portal
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Contact your HR department for login credentials</p>
                <p>• Your employer creates and manages employee accounts</p>
                <p>• Use the email address provided by your company</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
