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

      const selectedRole = document.querySelector('input[name="role"]:checked').value;
      // connect to amazon rds and store email, split name into first and last name,
      const [firstName, lastName] = decoded.name.split(' ');
      const userData = {
        email: decoded.email,
        firstName,
        lastName,
        role: selectedRole,
        google_id: response.credential
      };


      // send userData to Amazon RDS via backend API
      fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        })
        .then(res => { {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        }})
        .then(data => {
          console.log('User data successfully saved:', data);
        })
        .catch(error => {
          console.error('Error saving user data:', error);
        });

        
      // Redirect to home page after successful sign-in
      window.location.href = '/';
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
    
    <>
      <MenuComponent />
      <div className="main-container">
        {localStorage.getItem('user') ? (
          <p>Welcome back, {JSON.parse(localStorage.getItem('user')).name}!</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px' }}>
               
                <div> 
                     <p>Please sign in to continue.</p>
                    <fieldset>
                        <legend>Select your role:</legend>
                        <p><input type="radio" placeholder="Student" id="student" name="role" /> Student</p>
                        <p><input type="radio" placeholder="Teacher" id="teacher" name="role" /> Teacher</p>
                        <p><input type="radio" placeholder="Admin" id="admin" name="role" /> Admin</p>
                    </fieldset>
                    <div id="g_id_signin"></div>
                </div>
              
            </div>
          </>
        )}
      </div>
      <FooterComponent />
    </>

  );
}