// frontend/src/App.js
import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './firebase';  // Firebase configuration
import './App.css';
import Chatbot from './Chatbot';    // Chatbot component

function App() {
  const [user, setUser] = useState(null);  // User state

  // Google sign-in
  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => setUser(result.user))
      .catch((error) => console.error('Error during sign-in:', error));
  };

  // Google sign-out
  const handleSignOut = () => {
    signOut(auth)
      .then(() => setUser(null))
      .catch((error) => console.error('Error during sign-out:', error));
  };

  return (
    <div className="App">
      <header className="App-header">
        {!user ? (
          <button onClick={handleGoogleSignIn} className="App-link">Sign in with Google</button>
        ) : (
          <div>
            <h2>Welcome, {user.displayName}</h2>
            <button onClick={handleSignOut} className="App-link">Sign out</button>
            <Chatbot /> {/* Chatbot component */}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
