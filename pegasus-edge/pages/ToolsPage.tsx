import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TextGeneratorTool from '../components/tools/TextGeneratorTool';
import ImageGeneratorTool from '../components/tools/ImageGeneratorTool';
import ChatbotTool from '../components/tools/ChatbotTool';
import SearchGroundingTool from '../components/tools/SearchGroundingTool';
import CreatorsEdgeStudioTool from '../components/tools/CreatorsEdgeStudioTool';
import { AI_TOOLS_DATA, AdjustmentsHorizontalIcon, PEGASUS_APP_TITLE } from '../constants';
import type { AiToolId } from '../types';
import { AiToolId as AiToolIdEnum } from '../types';


const ToolsPage: React.FC = () => {
  const { toolId } = useParams<{ toolId?: AiToolId }>();
  const navigate = useNavigate();

  const defaultToolId = AI_TOOLS_DATA.find(t => t.id === AiToolIdEnum.CREATORS_EDGE_STUDIO)?.id || AI_TOOLS_DATA[0]?.id || AiToolIdEnum.TEXT_GENERATOR;
  const activeToolId = toolId && AI_TOOLS_DATA.some(t => t.id === toolId) ? toolId : defaultToolId;

  const selectedTool = useMemo(() => AI_TOOLS_DATA.find(t => t.id === activeToolId), [activeToolId]);

  React.useEffect(() => {
    if (toolId && !AI_TOOLS_DATA.some(t => t.id === toolId)) {
      navigate(`/tools/${defaultToolId}`, { replace: true });
    } else if (!toolId) {
       navigate(`/tools/${defaultToolId}`, { replace: true });
    }
  }, [toolId, defaultToolId, navigate]);


  const renderToolComponent = () => {
    switch (activeToolId) {
      case AiToolIdEnum.CREATORS_EDGE_STUDIO:
        return <CreatorsEdgeStudioTool />;
      case AiToolIdEnum.TEXT_GENERATOR:
        return <TextGeneratorTool />;
      case AiToolIdEnum.IMAGE_GENERATOR:
        return <ImageGeneratorTool />;
      case AiToolIdEnum.CHATBOT:
        return <ChatbotTool />;
      case AiToolIdEnum.SEARCH_GROUNDING:
        return <SearchGroundingTool />;
      default:
        return (
            <div className="text-center p-10 card-premium">
                <h2 className="font-display text-3xl font-semibold text-slate-100">Tool Not Found</h2>
                <p className="text-slate-400 mt-2">Please select a tool from the arsenal.</p>
                <Link to={`/tools/${defaultToolId}`} className="mt-6 inline-block btn-premium">
                    Return to Tools
                </Link>
            </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="md:w-1/4 lg:w-1/5">
        <div className="sticky top-24"> {/* Adjust top based on Navbar height (h-20) + some padding */}
          <div className="flex items-center mb-1 p-4 bg-slate-800/50 rounded-t-lg border-b border-slate-700">
            <AdjustmentsHorizontalIcon className="w-6 h-6 text-purple-400 mr-3" />
            <h2 className="font-display text-xl font-semibold text-slate-200">AI Arsenal</h2>
          </div>
          <nav className="space-y-1 bg-slate-800/80 backdrop-blur-sm p-3 rounded-b-lg shadow-xl border border-slate-700/50">
            {AI_TOOLS_DATA.map((tool) => {
              const Icon = tool.icon;
              const isActive = tool.id === activeToolId;
              return (
                <button
                  key={tool.id}
                  onClick={() => navigate(`/tools/${tool.id}`)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md text-left transition-all duration-200 ease-in-out group
                    ${isActive 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg scale-[1.02]' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/70'
                    }
                    ${tool.isFlagship ? 'font-bold tracking-wide' : 'font-medium'} 
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-300'}`} />
                  <span>{tool.name}</span>
                  {tool.isFlagship && <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-semibold">EDGE</span>}
                </button>
              );
            })}
          </nav>
           <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
              <p className="text-xs text-slate-400">More tools & features with <Link to="/subscriptions" className="font-semibold text-purple-400 hover:text-amber-400">Pegasus Pro</Link>.</p>
          </div>
        </div>
      </aside>

      <main className="flex-grow md:w-3/4 lg:w-4/5">
        {selectedTool ? renderToolComponent() : (
             <div className="text-center p-10 card-premium">
                <h2 className="font-display text-3xl font-semibold text-slate-100">Select Your Weapon</h2>
                <p className="text-slate-400 mt-2">Choose a tool from the arsenal to begin.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default ToolsPage;