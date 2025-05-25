import React from 'react';
import { Link } from 'react-router-dom';
import type { AiTool } from '../types';

interface FeatureCardProps {
  tool: AiTool;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ tool }) => {
  const IconComponent = tool.icon;
  return (
    <Link 
      to={`/tools/${tool.id}`}
      className="block card-premium group h-full flex flex-col" // Ensure full height for flex
    >
      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl mb-6 shadow-lg group-hover:from-purple-700 group-hover:to-pink-600 transition-all duration-300 transform group-hover:scale-110">
        <IconComponent className="w-8 h-8 text-white" />
      </div>
      <h3 className="font-display text-2xl font-bold text-slate-100 mb-3">{tool.name}</h3>
      <p className="text-slate-400 text-sm mb-4 flex-grow">{tool.description}</p> {/* flex-grow to push link to bottom */}
      <div className="mt-auto pt-4 border-t border-slate-700/50">
        <span className="font-semibold text-purple-400 group-hover:text-amber-400 transition-colors duration-300">
          Access Tool &rarr;
        </span>
      </div>
    </Link>
  );
};

export default FeatureCard;