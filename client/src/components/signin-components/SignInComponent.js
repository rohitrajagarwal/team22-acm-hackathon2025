import React, { useEffect } from 'react';
import axios from 'axios'; // Make sure to install: npm install axios

// --- IMPORTANT ---
// Paste the Client ID you got from your Google Cloud Console
const GOOGLE_CLIENT_ID = '176802236115-vovintb1q007nchtr4spe4fqhpt09pde.apps.googleusercontent.com';
// This should be the address of your backend server
const BACKEND_URL = 'http://localhost:5001';

export default function SignInComponent() {
  let googleClient;

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google && window.google.accounts) {
        
        // Initialize the "Auth Code" client
        googleClient = window.google.accounts.oauth2.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          
          // These are the scopes you set up in your console
          scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/classroom.courses.readonly'
          ].join(' '), // Scopes must be a space-separated string
          
          // This is the callback function that fires after the user logs in
          callback: (codeResponse) => {
            console.log('Auth Code received:', codeResponse.code);
            // Send this one-time code to your backend
            sendCodeToBackend(codeResponse.code);
          },
        });
      }
    };

    return () => {
      // Cleanup
      document.head.removeChild(script);
    };
  }, []);

  // Trigger the Google login pop-up
  const handleGoogleSignIn = () => {
    if (googleClient) {
      googleClient.requestCode();
    } else {
      console.error('Google client not initialized.');
      alert('Google Sign-In is not ready. Please try again in a moment.');
    }
  };

  // This function sends the one-time code to your server
  const sendCodeToBackend = async (code) => {
    try {
      // This is the new backend route you will create
      const res = await axios.post(`${BACKEND_URL}/api/auth/google/callback`, { code });
      
      console.log('Server response:', res.data);
      
      // Your backend will send back its *own* app token and user data
      // Store them in local storage
      localStorage.setItem('app_token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Redirect to your app's dashboard or home page
      alert('Login Successful!');
      // window.location.href = '/dashboard'; // Uncomment to redirect

    } catch (error) {
      console.error('Error sending code to backend:', error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="main-container">
      {/* <MenuComponent /> */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        marginTop: '60px',
        padding: '20px'
      }}>
        <h2>Sign In</h2>
        <p>Please sign in with your Google account to continue.</p>
        <button 
          onClick={handleGoogleSignIn} 
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px 0 rgba(0,0,0,0.25)',
            marginTop: '20px'
          }}
        >
          Sign in with Google
        </button>
      </div>
      {/* <FooterComponent /> */}
    </div>
  );
}
