"use client";
import React, { useState } from 'react'
import Modal from '../custom/Modal'
import Button from '../custom/Button';
import { useTranslations } from 'next-intl';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { Elements, useElements, useStripe, CardElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHEABLE_KEY || '');

function BuyStarsModal({ isOpen, onClose, currentUserId }: { isOpen: boolean; onClose: () => void; currentUserId: string }) {
  const t = useTranslations('Modals.BuyStars')
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [pending, setPending] = useState(false)
  const { siteSettings } = useSiteSettings();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [feedback, setFeedback] = React.useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({ open: false, title: '', message: '', type: 'success' });

  const selected = selectedIndex !== null ? siteSettings?.starPackages?.package?.[selectedIndex] : null

  function CheckoutSection() {
    const stripe = useStripe();
    const elements = useElements();
    
    const proceedToCheckout = async () => {
      setPending(true);
      if (!selected || !stripe || !elements) return;

      const amount = Number(selected.amount);
      const currency = siteSettings?.currency?.shortCode ?? 'usd';
      const packageId = (selected as any)?.id ?? (selectedIndex !== null ? String(selectedIndex) : undefined);

      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          amount,
          currency,
          packageId,
          starsBought: Number(selected.stars),
        }),
      });

      const data = await response.json();
      const clientSecret: string | undefined = data?.clientSecret;
      if (!clientSecret) {
        setFeedback({ open: true, title: t('paymentErrorTitle', { default: 'Payment Error' }), message: t('paymentClientSecretMissing', { default: 'Unable to start payment. Please try again.' }), type: 'error' });
            return;
          }

          const card = elements.getElement(CardElement);
          if (!card) {
            setFeedback({ open: true, title: t('paymentErrorTitle', { default: 'Payment Error' }), message: t('cardInputNotReady', { default: 'Card input not ready.' }), type: 'error' });
            return;
          }

      const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card },
          });

          if (result.error) {
            setFeedback({ open: true, title: t('paymentFailedTitle', { default: 'Payment failed' }), message: result.error.message || t('paymentFailed', { default: 'Payment failed' }), type: 'error' });
            return;
          }

        // Update local user state (accumulate stars)
        try {
          const inc = Number(selected.stars) || 0;
          if (user) {
            dispatch(setUser({ ...user, totalStars: (Number(user.totalStars) || 0) + inc }));
          }
        } catch {}

        // Clear selection and show success modal
        setSelectedIndex(null);
        setFeedback({
          open: true,
          title: t('paymentSuccessTitle', { default: 'Payment successful' }),
          message: t('paymentSuccessMessage', {
            default: `Payment successful for ${selected.stars} stars at ${siteSettings?.currency?.symbol}${selected.amount}`,
            stars: selected.stars,
            amount: selected.amount,
          }),
          type: 'success',
        });

        setPending(false);
    };

    return (
      <>
        {/* Card input shown when a package is selected */}
        {selected && (
          <div className="mt-6 max-w-md mx-auto p-3 border rounded-lg">
              <CardElement options={{ hidePostalCode: true }} />
          </div>
        )}
        <div className="w-full flex justify-center pt-3">
          <Button onClick={proceedToCheckout} disabled={!selected} style="secondary">
            {selected ? t('buyCta', { stars: selected.stars.toLocaleString(), price: selected.amount }) : t('selectPackage')}
          </Button>
        </div>
      </>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setSelectedIndex(null)
          onClose()
        }}
        title={t('title')}
        size='md'
        footer={<CheckoutSection />}
      >
        <div className="mt-10">
          <div className="flex flex-wrap gap-5 items-center justify-center">
              {siteSettings?.starPackages?.package?.length === 0 ? (
                  <p className='text-3xl font-extrabold'>{t('noPackages')}</p>
              ) : (
                  siteSettings?.starPackages?.package?.map((pkg, idx) => {
              const isSelected = selectedIndex === idx
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`text-left rounded-2xl border-2 p-4 cursor-pointer transition-all w-[150px] h-[100px] ${
                    isSelected
                      ? 'border-primary bg-gradient-to-br from-primary to-[#e6a942] text-white shadow-lg -translate-y-0.5'
                      : 'border-gray-200 bg-white hover:border-primary hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <h3 className={`text-xl font-bold mb-1 ${isSelected ? 'text-white' : 'text-primary'}`}>
                      {t('starsLabel', { count: pkg.stars.toLocaleString() })}
                    </h3>
                    <div className={`text-2xl font-extrabold mb-3 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {siteSettings?.currency?.symbol}{pkg.amount}
                    </div>
                  </div>
                </button>
              )}))}
          </div>
        </div>
      </Modal>
      {/* Feedback Modal */}
      <Modal
        isOpen={feedback.open}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        title={feedback.title}
        size='sm'
        footer={
          <div className="w-full flex justify-center pt-3">
            <Button
              onClick={() => {
                setFeedback((f) => ({ ...f, open: false }));
                // Close the Buy modal after success
                if (feedback.type === 'success') {
                  onClose();
                }
              }}
              style={feedback.type === 'success' ? 'primary' : 'secondary'}
            >
              {t('ok', { default: 'OK' })}
            </Button>
          </div>
        }
      >
        <div className={`py-3 text-center ${feedback.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
          {feedback.message}
        </div>
      </Modal>
    </Elements>
  )
}

export default BuyStarsModal