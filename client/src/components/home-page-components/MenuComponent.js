import React, { useState, useEffect } from 'react';

const MenuComponent = () => {
	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const [user, setUser] = useState(null);

	useEffect(() => {
		// Check for user info in localStorage
		const storedUser = localStorage.getItem('user');
		if (storedUser && JSON.parse(storedUser).email && JSON.parse(storedUser).name) {
			setUser(JSON.parse(storedUser));
		}
	}, []);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			// Show menu if at the top (within 50px)
			if (currentScrollY <= 50) {
				setIsVisible(true);
			}
			// Hide menu if scrolling down past 50px
			else if (currentScrollY > lastScrollY && currentScrollY > 50) {
				setIsVisible(false);
			}
			// Show menu if scrolling up
			else if (currentScrollY < lastScrollY) {
				setIsVisible(true);
			}

			setLastScrollY(currentScrollY);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, [lastScrollY]);

	return (
		<header className={`menu-header ${isVisible ? '' : 'hidden'}`}>
			<div className="menu-container">
				<div className="brand">HighView Engage</div>
				<nav className="nav-menu">
					<a href="/" className="menu-link">Home</a>
					<a href="/about" className="menu-link">About Us</a>
					{user ? (
						<a href="/profile" className="menu-link">Profile</a>
					) : (
						<a href="/signin" className="menu-link">Sign In with Google</a>
					)}
					{user ? (
						<a href="/viewregistrations" className="menu-link">View my registrations</a>
					) : (
						<a href="/viewregistrations" className="menu-link">View my registrations</a>
					)}
				</nav>
			</div>
		</header>
	);
};

export default MenuComponent;
