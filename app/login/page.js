"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  async function handleRegister(ev) {
    ev.preventDefault();
    setError('');
    setLoginInProgress(true);

    try {
      const response = await fetch("/cognicode/api/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        await signIn('credentials', { email, password, callbackUrl: '/edit-profile' });
      } else {
        const data = await response.json();
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }

    setLoginInProgress(false);
  }

  async function handleLogin(ev) {
    ev.preventDefault();
    setError('');
    setLoginInProgress(true);

    try {
      const result = await signIn('credentials', { email, password, redirect: false });

      if (result?.error) {
        setError('Invalid email or password.');
      } else if (result?.ok) {
        router.push('/');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }

    setLoginInProgress(false);
  }

  return (
    <section className="flex flex-col justify-center items-center min-h-[72vh] px-4">
      {error && (
        <div className="my-4 text-center bg-accent py-2 px-6 text-white rounded-full cursor-pointer animate-on-load animate-slide-down" onClick={() => setError('')}>
          {error}
        </div>
      )}

      <Link href='/' className='flex justify-center items-center mb-10 gap-4 animate-on-load animate-scale-in'>
        <img
          src='/cognicode/coding.png'
          alt='cognicode_logo'
          className='w-14 h-14 object-contain'
        />
        <h2 className='font-bold text-3xl text-dark-1 dark:text-light-1'>
          COGNICODE
        </h2>
      </Link>

      <div className="w-full max-w-[420px] bg-light-2 dark:bg-dark-3 rounded-2xl shadow-lg p-8 border border-transparent hover:border-accent/20 transition-colors duration-300 animate-on-load animate-slide-up delay-200">
        <h3 className="text-xl font-bold text-dark-1 dark:text-light-1 text-center mb-1">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h3>
        <p className="text-sm text-gray-1 dark:text-gray-2 text-center mb-6">
          {isLogin ? "Sign in to continue your journey" : "Join us and start coding"}
        </p>
        <div className="h-0.5 w-10 bg-accent rounded-full mx-auto mb-6"></div>

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-1 dark:text-gray-2 mb-1.5">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              disabled={loginInProgress}
              onChange={(ev) => setEmail(ev.target.value)}
              className="shadow-sm p-3.5 bg-light-1 dark:bg-dark-2 dark:text-light-1 border border-light-4 dark:border-dark-4 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-1 dark:text-gray-2 mb-1.5">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={password}
              disabled={loginInProgress}
              onChange={(ev) => setPassword(ev.target.value)}
              className="shadow-sm p-3.5 bg-light-1 dark:bg-dark-2 dark:text-light-1 border border-light-4 dark:border-dark-4 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
            />
          </div>
          <button
            type="submit"
            disabled={loginInProgress}
            className="w-full flex justify-center items-center gap-2 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {loginInProgress ? (
              <img src="/cognicode/loader.svg" alt="loading" className="w-5 h-5 object-contain" />
            ) : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-1 dark:text-gray-2 mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <span className="text-accent font-medium cursor-pointer hover:underline" onClick={() => setIsLogin(prev => !prev)}>
            {isLogin ? "Register" : "Sign In"}
          </span>
        </p>
      </div>
    </section>
  );
}