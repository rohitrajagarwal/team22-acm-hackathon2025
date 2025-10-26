import React, { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import MenuComponent from '../home-page-components/MenuComponent';
import FooterComponent from '../home-page-components/FooterComponent';

export default function SignInComponent() {
  return
    <>
      <MenuComponent />
      <div className="main-container">
        {localStorage.getItem('user') ? (
          //delete localStorage user and redirect to home page
            (() => {
                localStorage.removeItem('user');
               <div>
                    <h2>Sign Out</h2>
                    <p>You have been signed out.</p>
                </div>
            })
        ) : (
            //redirect to sign in page
            <div>
                <p>You are not signed in.</p>
            </div>
        )}
      </div>
      <FooterComponent />
    </>

  );
}