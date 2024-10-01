// src/App.js
import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase'; // Firebase configuration
import './App.css';
import Chatbot from './Chatbot';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Toggle between login and register

  // Google sign-in
  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => setUser(result.user))
      .catch((error) => console.error('Error during sign-in:', error));
  };

  // Email/Password sign-in
  const handleEmailSignIn = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((result) => setUser(result.user))
      .catch((error) => console.error('Error during email sign-in:', error));
  };

  // Email/Password registration
  const handleEmailRegistration = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((result) => setUser(result.user))
      .catch((error) => console.error('Error during email registration:', error));
  };

  // Sign-out
  const handleSignOut = () => {
    signOut(auth)
      .then(() => setUser(null))
      .catch((error) => console.error('Error during sign-out:', error));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="text-2xl font-bold mb-4">AI Customer Support</h1>
        {!user ? (
          <div>
            <h2 className="text-xl mb-4">Sign In</h2>

            {/* Email and Password Input */}
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-2 mb-2 w-full border border-gray-300 rounded text-black"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-2 mb-2 w-full border border-gray-300 rounded text-black"
              />
            </div>

            {/* Toggle between Sign In and Register */}
            <div className="flex flex-col items-center">
              {isRegistering ? (
                <button onClick={handleEmailRegistration} className="App-link mb-4">
                  Register
                </button>
              ) : (
                <button onClick={handleEmailSignIn} className="App-link mb-4">
                  Sign in with Email
                </button>
              )}

              {/* The text is now in a new block element below the sign-in button */}
              <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-blue-500 underline mb-4 block">
                {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register'}
              </button>
            </div>

            {/* Google Sign-In */}
            <hr className="my-4 w-full" />
            <button onClick={handleGoogleSignIn} className="App-link">
              Sign in with Google
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl mb-4">Welcome, {user.displayName || user.email}</h2>
            <button onClick={handleSignOut} className="App-link">
              Sign out
            </button>
            <Chatbot /> {/* Chatbot component */}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
