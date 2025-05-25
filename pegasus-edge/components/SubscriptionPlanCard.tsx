
import React from 'react';
import type { SubscriptionPlan } from '../types';
import { PlanId, UserSubscriptionTier } from '../types'; // Assuming PlanId is now an enum
import { useSubscription } from '../App'; // Adjust path if App.tsx is not in parent dir


const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

// Mock Stripe interaction
// In a real app, this would call your backend to create a Stripe Checkout Session
const redirectToStripeCheckout = async (priceId: string) => {
  alert(`(Demo) Redirecting to Stripe Checkout for price ID: ${priceId}\nThis would typically involve a backend call to create a session and then redirecting to Stripe's page.`);
  // Example: const stripe = await loadStripe('YOUR_STRIPE_PUBLISHABLE_KEY');
  // const { error } = await stripe.redirectToCheckout({ sessionId: 'SESSION_ID_FROM_BACKEND' });
  // if (error) console.error("Stripe Checkout error:", error.message);
  return new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
};


const SubscriptionPlanCard: React.FC<{ plan: SubscriptionPlan }> = ({ plan }) => {
  const { updateUserProfile } = useSubscription();

  const handleSubscribe = async () => {
    console.log(`(Demo) Initiating purchase for ${plan.name} with Stripe Price ID: ${plan.stripePriceId || 'N/A'}`);
    
    if (!plan.stripePriceId) {
        alert("Configuration error: Stripe Price ID is missing for this plan.");
        return;
    }

    // Simulate redirection and successful payment
    try {
      await redirectToStripeCheckout(plan.stripePriceId);
      // Simulate successful payment and update user profile
      alert(`(Demo) Payment for ${plan.name} successful! Your access has been upgraded.`);
      if (plan.id === PlanId.MONTHLY) {
        updateUserProfile({ tier: UserSubscriptionTier.MONTHLY });
      } else if (plan.id === PlanId.LIFETIME) {
        updateUserProfile({ tier: UserSubscriptionTier.LIFETIME });
      }
      // For pay-per-use, a different mechanism would confirm the one-time payment.
      // This card is for recurring/lifetime subscriptions.
    } catch (error) {
      alert(`(Demo) Payment failed: ${(error as Error).message}`);
    }
  };

  const cardBaseStyle = "flex flex-col rounded-2xl shadow-2xl overflow-hidden h-full transition-all duration-300 ease-in-out transform hover:scale-[1.03]";
  const cardBgStyle = plan.highlight 
    ? `bg-slate-800 border-2 border-purple-500` 
    : `bg-slate-800/70 backdrop-blur-md border border-slate-700`;
  
  const buttonBaseStyle = "w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-300 shadow-md hover:shadow-xl";
  const buttonDynamicStyle = plan.highlight 
    ? `bg-gradient-to-r ${plan.themeGradient || 'from-purple-600 to-pink-600'} hover:brightness-110 text-white`
    : `bg-slate-600 hover:bg-slate-500 text-slate-100`;

  return (
    <div className={`${cardBaseStyle} ${cardBgStyle}`}>
      {plan.highlight && (
        <div className={`bg-gradient-to-r ${plan.themeGradient || 'from-purple-600 to-pink-600'} text-white text-center py-3 text-sm font-bold tracking-wider uppercase`}>
          Most Popular
        </div>
      )}
      <div className="p-8 flex flex-col flex-grow">
        <h3 className="font-display text-3xl font-bold text-slate-100 mb-2">{plan.name}</h3>
        
        <div className="flex items-baseline text-slate-100 mb-6">
          <span className="text-5xl font-extrabold tracking-tight">
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${plan.themeGradient || 'from-purple-400 to-pink-400'}`}>
                  ${plan.price}
              </span>
          </span>
          {plan.priceFrequency && <span className="ml-2 text-xl font-semibold text-slate-400">{plan.priceFrequency}</span>}
        </div>
        
        <ul role="list" className="space-y-3 text-sm text-slate-300 mb-8 flex-grow">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start">
              <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-400 mr-3 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={handleSubscribe}
          className={`${buttonBaseStyle} ${buttonDynamicStyle}`}
        >
          {plan.cta}
        </button>
        <p className="text-xs text-slate-500 mt-3 text-center">
            Secure payment processing via Stripe (Demo).
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlanCard;
