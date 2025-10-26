import React, { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import MenuComponent from '../home-page-components/MenuComponent';
import FooterComponent from '../home-page-components/FooterComponent';

export default function SignInComponent() {
  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Define callback function
    window.handleCredentialResponse = (response) => {
        //decode response.credential
    const decoded = jwtDecode(response.credential);
      console.log('Encoded JWT ID token:', decoded.email);
      console.log('Encoded JWT ID token:', decoded.name);
        localStorage.setItem('user', JSON.stringify({ email: decoded.email, name: decoded.name }));
      // TODO: Send token to your backend for verification
    };

    // Initialize Google Sign-In after script loads
    script.onload = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: '770409293353-v77odpd2664ciec79pk0avi66ivma7tm.apps.googleusercontent.com',
          callback: window.handleCredentialResponse,
        });
        // Render the sign-in button
        window.google.accounts.id.renderButton(
          document.getElementById('g_id_signin'),
          { theme: 'outline', size: 'large', text: 'signin_with' }
        );
      }
    };

    return () => {
      // Cleanup
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="main-container">
      <MenuComponent />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px' }}>
        <div id="g_id_signin"></div>
      </div>
      <FooterComponent />
    </div>
  );
}