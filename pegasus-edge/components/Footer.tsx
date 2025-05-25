import React from 'react';
import { PEGASUS_APP_TITLE } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-700/50 py-10 text-center">
      <div className="container mx-auto px-4">
        <p className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} {PEGASUS_APP_TITLE}. Unleash Your Creative Edge.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Sophisticated AI tools, engineered for creators. Powered by Google Gemini.
        </p>
        <div className="mt-4">
          <span className="font-display text-lg text-purple-500">{PEGASUS_APP_TITLE}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;