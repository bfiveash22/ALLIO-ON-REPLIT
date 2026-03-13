'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, UserPlus, Beaker, ExternalLink } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
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
    window.open('https://peptide-chat.abacusai.app/signup', '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Step 1: Create the account
      const signupRes = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      if (!signupRes.ok) {
        const data = await signupRes.json();
        throw new Error(data?.error || 'Signup failed');
      }
      
      // Step 2: Auto-login after successful signup
      const loginRes = await signIn('credentials', { 
        email, 
        password, 
        redirect: false 
      });
      
      if (loginRes?.error) {
        throw new Error('Account created but login failed. Please try logging in manually.');
      }
      
      if (loginRes?.ok) {
        // Give the session time to establish before redirecting
        await new Promise(resolve => setTimeout(resolve, 800));
        // Use window.location for more reliable redirect on mobile
        window.location.href = '/dashboard';
      } else {
        throw new Error('Account created but login failed. Please try logging in manually.');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err?.message || 'Signup failed');
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
        <p className="text-center text-slate-400 mb-8">Create an account to explore peptide conversations</p>
        
        {/* Users in iframe - show direct link option for all browsers */}
        {inIframe && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-cyan-200 mb-3">
              🔒 <strong>For best experience:</strong> Click below to open in a new tab for reliable signup.
            </p>
            <button
              type="button"
              onClick={openDirectLink}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 font-semibold transition flex items-center justify-center gap-2 text-white"
            >
              <ExternalLink className="w-5 h-5" />
              Open in New Tab
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-cyan-500 focus:outline-none transition"
            />
          </div>
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
              minLength={6}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            Create Account
          </button>
        </form>
        <p className="text-center text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-cyan-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
