import React from 'react';
import { useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';

export default function ForgotPassword({ title }: { title: string }) {
  const { data, setData, setError, errors, processing } = useForm({
    email: '',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('email', '');
    setSuccessMessage(null);
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError('email', result.error || 'Failed to send reset link. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(result.message);
      setIsSubmitting(false);
    } catch (err) {
      setError('email', 'A network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl shadow-lg border">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-2">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        {successMessage ? (
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg text-center space-y-4">
            <p className="text-sm font-medium text-foreground">{successMessage}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Return to Login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@morphic.cms"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                required 
              />
              {errors.email && (
                <p className="text-sm font-medium text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-4">
              <Button type="submit" className="w-full" size={'lg'} disabled={isSubmitting}>
                {isSubmitting ? "Sending Link..." : "Send Reset Link"}
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
