import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav>
            <ul>
                <li><Link to="/home">Home</Link></li>
                <li><Link to="/chatbot">Chatbot</Link></li>
                <li><Link to="/financialplan">Financial Plan</Link></li>
                <li><Link to="/imagegen">Image Gen</Link></li>
            </ul>
        </nav>
    );
};

export default Navbar;