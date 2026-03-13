'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, LogIn, Beaker, ExternalLink } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inIframe, setInIframe] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Detect if in iframe - show "Open in New Tab" for ALL browsers in iframe
    // Chrome, Firefox, and other browsers are also blocking third-party cookies now
    const iframe = window.self !== window.top;
    setInIframe(iframe);
  }, []);

  const openDirectLink = () => {
    // Open the app directly in a new tab - bypasses all iframe cookie issues
    window.open('https://peptide-chat.abacusai.app/login', '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Check if in iframe - warn about potential cookie issues
    const isInIframe = window.self !== window.top;
    
    try {
      const res = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false
      });
      
      console.log('SignIn response:', res);
      
      if (res?.error) {
        setError('Invalid email or password. Please try again.');
        setLoading(false);
      } else if (res?.ok) {
        // Give the session time to establish before redirecting
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Verify session was actually established before redirecting
        try {
          const sessionCheck = await fetch('/api/auth/session');
          const session = await sessionCheck.json();
          console.log('Session check:', session);
          
          if (session?.user) {
            // Session established, redirect
            window.location.href = '/dashboard';
          } else {
            // Session not established - likely cookie issue in iframe
            if (isInIframe) {
              setError('Login blocked by browser. Please click "Open in New Tab" above to log in directly.');
            } else {
              setError('Session could not be established. Please try again or clear your browser cookies.');
            }
            setLoading(false);
          }
        } catch (sessionErr) {
          console.error('Session check error:', sessionErr);
          // Proceed with redirect anyway
          window.location.href = '/dashboard';
        }
      } else {
        // Unexpected response - likely cookie/session issue
        if (isInIframe) {
          setError('Login blocked by browser. Please click "Open in New Tab" above to log in directly.');
        } else {
          setError('Login failed. Please try again or clear your browser cookies.');
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      if (isInIframe) {
        setError('Connection blocked. Please click "Open in New Tab" above to log in directly.');
      } else {
        setError('Connection error. Please check your internet and try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Beaker className="w-10 h-10 text-cyan-400" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            FF Peptide Console
          </h1>
        </div>
        <p className="text-center text-slate-400 mb-8">Sign in to start conversations with peptides</p>
        
        {/* Users in iframe - show direct link option for all browsers */}
        {inIframe && (
          <div className="bg-amber-500/20 border-2 border-amber-500/50 rounded-xl p-4 mb-6 animate-pulse">
            <p className="text-sm text-amber-200 mb-3 font-medium">
              ⚠️ <strong>Browser Restriction Detected:</strong> Your browser is blocking login in this embedded view.
            </p>
            <button
              type="button"
              onClick={openDirectLink}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold transition flex items-center justify-center gap-2 text-white shadow-lg"
            >
              <ExternalLink className="w-5 h-5" />
              Open in New Tab to Login
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-cyan-500 focus:outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-cyan-500 focus:outline-none transition"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            Sign In
          </button>
          <div className="text-center">
            <Link href="/forgot-password" className="text-sm text-slate-400 hover:text-cyan-400 transition">
              Forgot your password?
            </Link>
          </div>
        </form>
        <p className="text-center text-slate-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-cyan-400 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
