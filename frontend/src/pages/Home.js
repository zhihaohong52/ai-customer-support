import React from 'react';
import Chatbot from './Chatbot';
import { Route, Routes } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FinPlan from './FinPlan';
import ImageGen from './ImageGen';

const Home = ({user}) => {
  return (
    <div>
      <Navbar/>
      <Routes>
        <Route path="/home" element={<h1>Welcome to the Home Page :)))))</h1>}/>
        <Route path="/chatbot" element={<Chatbot user={user} />} />
        <Route path="/financialplan" element={<FinPlan/>} />
        <Route path="/imagegen" element={<ImageGen/>} />
        {/* Add more routes here as needed */}
      </Routes>
    </div>
  );
};

export default Home;