import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { MailIcon, SendIcon, CheckCircleIcon, AlertCircleIcon, Loader2Icon } from 'lucide-react';

export default function EmailTest({ user }: { user?: any }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResult({ success: true, message: 'Test email sent successfully! Check your inbox (and spam folder).' });
        toast.success('Test email sent!');
      } else {
        setResult({ success: false, message: data.error || 'Failed to send test email.' });
        toast.error(data.error || 'Failed to send test email');
      }
    } catch (err) {
      setResult({ success: false, message: 'Network error. Make sure the server is running.' });
      toast.error('Network error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout user={user}>
      <Head title="Email Settings | Morphic" />
      
      <div className="w-full space-y-6 flex flex-col">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center space-x-2 mb-1">
               <MailIcon className="w-5 h-5 text-primary" />
               <h1 className="text-3xl font-bold tracking-tight">Email Service</h1>
            </div>
            <p className="text-muted-foreground text-sm">Configure and test transactional emails via Resend.</p>
          </div>
          
        </div>

        <div className="bg-card rounded-xl border p-6 space-y-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Configuration Status</h2>
            <div className="p-4 bg-muted/30 rounded-lg border border-dashed flex items-center justify-between">
              <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-sm font-medium">Ready to test</span>
              </div>
              <span className="text-xs opacity-50 font-mono">RESEND_API_KEY detected</span>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Note: Credentials must be set for the server in your .env file.
            </p>
          </div>

          <form onSubmit={handleSendTest} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="test-email" className="text-sm font-medium">Send Test Email To</label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  id="test-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !email} className="min-w-[140px]">
                  {sending ? (
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <SendIcon className="w-4 h-4 mr-2" />
                  )}
                  {sending ? 'Sending...' : 'Send Test'}
                </Button>
              </div>
            </div>

            {result && (
              <div className={`p-4 rounded-lg flex items-start space-x-3 text-sm transition-all animate-in fade-in slide-in-from-top-1 ${
                result.success ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
              }`}>
                {result.success ? (
                  <CheckCircleIcon className="w-4 h-4 mt-0.5" />
                ) : (
                  <AlertCircleIcon className="w-4 h-4 mt-0.5" />
                )}
                <span>{result.message}</span>
              </div>
            )}
          </form>
        </div>

        <div className="p-4 bg-muted/40 rounded-lg border border-dashed flex items-start space-x-3">
          <div className="text-xs text-muted-foreground space-y-1">
             <p className="font-semibold text-foreground">Usage Help</p>
             <p>Transactional emails can be sent from any server-side component using the <code>src/lib/email.ts</code> utility. 
            Remember to verify your domain or the recipient's address in Resend's dashboard if you're using a free/sandbox account.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
