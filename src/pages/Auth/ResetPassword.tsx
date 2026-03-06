import React from 'react';
import { useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

export default function ResetPassword({ title, token }: { title: string, token: string }) {
  const { data, setData, setError, errors, processing } = useForm({
    password: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', 'Passwords do not match');
      return;
    }

    if (data.password.length < 8) {
        setError('password', 'Password must be at least 8 characters');
        return;
    }

    setIsSubmitting(true);
    setError('password', '');
    setError('confirmPassword', '');
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError('password', result.error || 'Failed to reset password. The link may be expired.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(result.message);
      setIsSubmitting(false);
    } catch (err) {
      setError('password', 'A network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl shadow-lg border">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-2">Enter your new password below to reset your account credentials.</p>
        </div>

        {successMessage ? (
          <div className="bg-primary/10 border border-primary/20 p-6 rounded-lg text-center space-y-4">
            <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground">{successMessage}</p>
            <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
            <Button asChild className="w-full">
              <Link href="/">Sign In Now</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  required 
                />
                {errors.password && (
                  <p className="text-sm font-medium text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={data.confirmPassword}
                  onChange={(e) => setData('confirmPassword', e.target.value)}
                  required 
                />
                {errors.confirmPassword && (
                  <p className="text-sm font-medium text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Button type="submit" className="w-full" size={'lg'} disabled={isSubmitting}>
                {isSubmitting ? "Resetting Password..." : "Reset Password"}
              </Button>
              
              <Link 
                href="/" 
                className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
