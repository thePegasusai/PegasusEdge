
import React from 'react';
import SubscriptionPlanCard from '../components/SubscriptionPlanCard';
import { SUBSCRIPTION_PLANS_DATA, CreditCardIcon, PEGASUS_APP_TITLE, WandSparklesIcon } from '../constants';
import { useSubscription } from '../App'; // Adjust path if App.tsx is not in parent dir
import { UserSubscriptionTier } from '../types';

const SubscriptionPage: React.FC = () => {
  const { userProfile } = useSubscription();

  return (
    <div className="py-12 md:py-20">
      <div className="text-center mb-16 md:mb-20">
        <CreditCardIcon className="w-16 h-16 text-purple-500 mx-auto mb-6 animate-pulse" />
        <h1 className="font-display text-5xl md:text-6xl font-bold text-slate-100">
          Unlock Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400">Full Potential</span>
        </h1>
        <p className="mt-6 text-xl text-slate-300 max-w-2xl mx-auto">
          Choose your edge. Subscribe for unlimited power or pay as you go after your first free Creator's Edge Studio run.
        </p>
      </div>

      {userProfile.tier === UserSubscriptionTier.MONTHLY && (
        <div className="mb-12 p-6 bg-green-800/30 border border-green-600 rounded-xl text-center">
          <h2 className="font-display text-2xl text-green-300">You are on the Pro Monthly Plan!</h2>
          <p className="text-green-200">Enjoy unlimited access to all Pegasus Edge tools.</p>
        </div>
      )}
      {userProfile.tier === UserSubscriptionTier.LIFETIME && (
        <div className="mb-12 p-6 bg-amber-800/30 border border-amber-600 rounded-xl text-center">
          <h2 className="font-display text-2xl text-amber-300">You have Lifetime Access!</h2>
          <p className="text-amber-200">The ultimate creative edge is yours, forever.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 items-stretch max-w-4xl mx-auto">
        {SUBSCRIPTION_PLANS_DATA.map((plan) => (
          <SubscriptionPlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mt-16 md:mt-20 text-center card-premium p-8 max-w-3xl mx-auto">
        <WandSparklesIcon className="w-12 h-12 text-teal-400 mx-auto mb-4"/>
        <h2 className="font-display text-3xl text-slate-100 mb-3">How Access Works:</h2>
        <ul className="text-slate-300 space-y-2 text-left mx-auto max-w-lg list-disc list-inside">
            <li>
                <span className="font-semibold text-teal-300">Creator's Edge Studio:</span> Your first full pack generation is <span className="text-amber-400">FREE</span>!
            </li>
            <li>
                <span className="font-semibold text-teal-300">Pay-Per-Use:</span> After your free use, subsequent Creator's Edge Studio pack generations are just <span className="text-amber-400">$1 per pack</span> if you're not subscribed.
            </li>
             <li>
                <span className="font-semibold text-teal-300">Other AI Tools:</span> Access to Rapid Text Crafter, Visual Spark Generator, etc., also follows the $1/use model after your free studio run, or unlock unlimited use with a subscription.
            </li>
            <li>
                <span className="font-semibold text-teal-300">Pro Monthly / Lifetime:</span> Get <span className="text-amber-400">unlimited access</span> to all tools, all features, and priority support.
            </li>
        </ul>
        <p className="text-sm text-slate-400 mt-6">
            (Pay-per-use model is a conceptual demonstration. Stripe integration for $1 transactions would be required.)
        </p>
      </div>


      <div className="mt-12 text-center text-sm text-slate-400">
        <p>All prices are in USD. Command your creative destiny—cancel monthly plans anytime.</p>
        <p>For bespoke enterprise solutions and custom AI integrations, <span className="text-amber-400 font-semibold">contact our specialists</span> (via the old 'Dominate' plan concept).</p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
