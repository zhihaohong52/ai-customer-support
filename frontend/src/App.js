// fronted/src/App.js
import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase'; // Firebase configuration
import Home from './pages/Home';
import './App.css';

function App() {

  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Toggle between login and register
  const [dropdownOpen, setDropdownOpen] = useState(false); // Toggle dropdown

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

  // Toggle the dropdown when the profile picture is clicked
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="App">
      <header className={`App-header ${user ? 'logged-in' : ''}`}>
        <div className="header-content">
          <h1 className="text-2xl font-bold header-title">AI Customer Support</h1>
          {user && (
            <div className="profile-container">
              {/* Display "Welcome {username}" */}
              <div className="welcome-text">Welcome, {user.displayName || user.email}</div>

              {/* Profile Picture */}
              <img
                src={user.photoURL || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}  // Use user's profile picture or a placeholder
                alt="Profile"
                className="profile-pic"
                onClick={toggleDropdown}
              />

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="dropdown">
                  <button onClick={handleSignOut} className="App-link">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="App-main">
        {!user ? (
          <div className='signin-container'>
            <h2 className="text-xl mb-4">Sign In</h2>

            <div className="input-container mb-4">
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

            <div className="flex flex-col items-center">
              {isRegistering ? (
                <button onClick={handleEmailRegistration} className="App-link mb-4">
                  Register
                </button>
              ) : (
                <button onClick={handleEmailSignIn} className="App-link mb-4">
                  Sign in
                </button>
              )}
              <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-blue-500 underline mb-4">
                {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register'}
              </button>
            </div>

            <hr className="my-4 w-full" />
            <div className="flex flex-col items-center">
              <button onClick={handleGoogleSignIn} className="google-signin-btn light">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/240px-Google_%22G%22_logo.svg.png" alt="Google logo" />
                Sign in with Google
              </button>
            </div>
          </div>
        ) : (
            <Home user={user} />
        )}
      </main>
    </div>
  );
}

export default App;
