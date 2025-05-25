
import React from 'react';
import { Link } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard';
import { AI_TOOLS_DATA, PEGASUS_APP_TITLE, WandSparklesIcon, SparklesIcon } from '../constants';
import { AiToolId } from '../types';

const HomePage: React.FC = () => {
  const creatorsEdgeTool = AI_TOOLS_DATA.find(tool => tool.id === AiToolId.CREATORS_EDGE_STUDIO);
  const otherTools = AI_TOOLS_DATA.filter(tool => tool.id !== AiToolId.CREATORS_EDGE_STUDIO);

  return (
    <div className="space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24 relative overflow-hidden min-h-[70vh] flex flex-col justify-center items-center">
        {/* Subtle background pattern or gradient animation could go here */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-900/30 to-slate-950 opacity-50"></div>
         <div className="absolute inset-0 flex items-center justify-center">
            <SparklesIcon className="w-1/2 h-1/2 text-purple-600/10 animate-pulse transform scale-150" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <WandSparklesIcon className="w-20 h-20 md:w-28 md:h-28 text-amber-400 mx-auto mb-6 shadow-2xl rounded-full p-2 bg-slate-800/50" />
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400">
              {PEGASUS_APP_TITLE}
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            The Ultimate AI Co-Producer for <span className="text-hotpink font-semibold">Streamers & YouTubers</span>.
            Generate video ideas, branding, scripts, <span className="text-teal-400 font-semibold">audio concepts</span>, and more. Get your <span className="text-amber-400 font-semibold">Edge</span>.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              to={creatorsEdgeTool ? `/tools/${creatorsEdgeTool.id}` : "/tools"}
              className="inline-block btn-premium text-lg px-10 py-4 transform hover:scale-110"
            >
              Launch Creator's Edge Studio <span className="ml-2">&rarr;</span>
            </Link>
             <Link
              to="/subscriptions"
              className="inline-block btn-secondary text-lg px-10 py-4"
            >
              Explore Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Creator's Edge Studio Spotlight */}
      {creatorsEdgeTool && (
        <section className="card-premium md:p-12 relative overflow-hidden">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/30 rounded-full filter blur-3xl animate-pulse"></div>
           <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="md:w-2/5 text-center">
              <WandSparklesIcon className="w-32 h-32 md:w-48 md:h-48 text-purple-500 mx-auto mb-4 transform group-hover:rotate-6 transition-transform" />
            </div>
            <div className="md:w-3/5">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-100 mb-5">
                {creatorsEdgeTool.name}
              </h2>
              <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                {creatorsEdgeTool.description} Stop juggling tasks. Get a synthesized content pack—from viral titles and branding concepts to script outlines and AI-generated audio ideas—all tailored to your unique style.
              </p>
              <Link
                to={`/tools/${creatorsEdgeTool.id}`}
                className="btn-premium px-8 py-3 text-base"
              >
                Unleash Your Co-Producer Now
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Other Tools Section */}
      {otherTools.length > 0 && (
        <section>
          <h2 className="font-display text-4xl font-bold text-center text-slate-100 mb-12">
            Your AI Arsenal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {otherTools.map((tool) => (
              <FeatureCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Call to Action for Subscriptions */}
      <section className="bg-gradient-to-r from-purple-900/50 via-slate-800/80 to-pink-900/50 p-10 md:p-16 rounded-xl shadow-2xl text-center border border-slate-700/50">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-100 mb-5">Ready to Dominate?</h2>
        <p className="text-slate-300 mb-8 max-w-xl mx-auto text-lg">
          Upgrade to unlock the full suite of Pegasus Edge. More power, more features, more <span className="text-amber-400 font-semibold">impact</span>.
        </p>
        <Link
          to="/subscriptions"
          className="btn-premium px-12 py-4 text-lg"
        >
          View Premium Plans
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
