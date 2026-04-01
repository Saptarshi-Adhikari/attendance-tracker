import React, { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message.replace("Firebase: ", ""));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Sign In' : 'Sign Up'}</h2>

                {error && <p className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm border border-red-500/50">{error}</p>}

                <input type="email" placeholder="Email" className="w-full p-3 mb-4 bg-gray-900 rounded border border-gray-700 focus:border-purple-500 outline-none"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />

                <input type="password" placeholder="Password" className="w-full p-3 mb-6 bg-gray-900 rounded border border-gray-700 focus:border-purple-500 outline-none"
                    value={password} onChange={(e) => setPassword(e.target.value)} required />

                <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-colors mb-4">
                    {isLogin ? 'Login' : 'Register'}
                </button>

                <p className="text-center text-sm text-gray-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-purple-400 hover:underline">
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </form>
        </div>
    );
}