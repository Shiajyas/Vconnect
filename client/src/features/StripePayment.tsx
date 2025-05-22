import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useSearchParams } from 'react-router-dom';
import { userService } from '@/services/userService';

const stripePromise = loadStripe(
  'pk_test_51R96FJH8pkRmmJ6859FuaBwszQN9xD2Z46Tflj0UAyQ399Jbtas29w20el9NbCvhy2nWqY5y9p0kd9ANqMMe9fKy00X5qntRpU',
);

interface StripePaymentProps {
  userId: string;
  onSuccess: () => void;
  refreshSubscription: () => void;
}

const CheckoutForm = ({
  userId,
  onSubscriptionConfirmed,
  refreshSubscription,
}: {
  userId: string;
  onSubscriptionConfirmed: () => void;
  refreshSubscription: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');

    if (clientSecret && redirectStatus === 'succeeded' && !paymentProcessed) {
      stripe
        ?.retrievePaymentIntent(clientSecret)
        .then(({ paymentIntent }) => {
          if (paymentIntent?.status === 'succeeded') {
            confirmSubscription();
          } else {
            setMessage('⚠️ Payment was not successful.');
          }
          setPaymentProcessed(true);
        })
        .catch((error) => {
          setMessage(`❌ Error: ${error.message}`);
          setPaymentProcessed(true);
        });
    }
  }, [stripe, searchParams, paymentProcessed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage('');
    console.log('return url:', window.location.href);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    console.log('Payment result:', result);

    if (result.error) {
      setMessage(`❌ ${result.error.message}`);
    } else if (result.paymentIntent?.status === 'succeeded') {
    } else {
      setMessage('⚠️ Payment was not successful.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <label className="font-semibold text-sm text-gray-700 mb-1 block">Payment Details:</label>
      <div className="bg-white border rounded-md p-4 shadow-sm">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-all"
      >
        {loading ? 'Processing...' : 'Pay $9.99'}
      </button>

      {message && <p className="text-sm text-center text-red-600 mt-2">{message}</p>}
    </form>
  );
};

const StripePayment: React.FC<StripePaymentProps> = ({
  userId,
  onSuccess,
  refreshSubscription,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    userService
      .subscribe(userId, 'tok_visa')
      .then((res) => {
        if (res.clientSecret) setClientSecret(res.clientSecret);
      })
      .catch((err) => console.error('❌ Error fetching client secret:', err));
  }, [userId]);

  const handleSubscriptionConfirmed = () => {
    onSuccess();
  };

  if (!clientSecret) return <p>Loading payment details...</p>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <CheckoutForm
        userId={userId}
        onSubscriptionConfirmed={handleSubscriptionConfirmed}
        refreshSubscription={refreshSubscription}
      />
    </Elements>
  );
};

export default StripePayment;
