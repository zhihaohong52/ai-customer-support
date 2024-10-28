// frontend/src/ChatbotSelection.js

import React from 'react';
import PropTypes from 'prop-types';

function ChatbotSelection({ onSelect }) {
  const chatbots = [
    {
      id: 'ai-customer-support',
      title: 'AI Customer Support',
      description: 'Get assistance with your banking needs and support queries.',
      image: '/images/ai-customer-support.png',
    },
    {
      id: 'financial-planning',
      title: 'Financial Planning Assistant',
      description: 'Plan your finances with expert advice and tools.',
      image: '/images/financial-planning.png',
    },
    {
      id: 'stock-market',
      title: 'Stock Market Assistant',
      description: 'Stay updated with the latest stock market trends and insights.',
      image: '/images/stock-market.png',
    },
  ];

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gray-100 w-full">
      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10 w-full max-w-7xl px-4">
        {chatbots.map((bot) => (
          <div
            key={bot.id}
            onClick={() => onSelect(bot.id)}
            className="cursor-pointer bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-center p-6 w-full"
            tabIndex={0}
            role="button"
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelect(bot.id);
              }
            }}
            aria-label={`Select ${bot.title} chatbot`}
          >
            {/* Rounded Image with Hover Zoom */}
            <img
              src={bot.image}
              alt={bot.title}
              className="w-24 h-24 mb-4 object-cover rounded-full bg-gray-200 transform transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
            {/* Chatbot Title */}
            <h2 className="text-xl font-semibold mb-2 text-center">{bot.title}</h2>
            {/* Chatbot Description */}
            <p className="text-gray-600 text-center">{bot.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

ChatbotSelection.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default ChatbotSelection;
