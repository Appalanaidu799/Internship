/**
 * Razorpay Payment Gateway Integration for Naidu Hotel
 * Supports Official Razorpay Checkout (https://checkout.razorpay.com/v1/checkout.js)
 * and interactive sandbox testing for Instant UPI, Cards, NetBanking, and Wallets.
 */

// Hotel room rates and folios are natively stored and billed in Indian Rupees (INR)
export const USD_TO_INR_RATE = 1;

export function convertUsdToInr(amount: number): number {
  return Math.round(amount);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Dynamically loads the Razorpay checkout script from official CDN.
 */
export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (window.Razorpay) {
    return true;
  }

  return new Promise((resolve) => {
    const existingScript = document.getElementById('razorpay-checkout-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load official Razorpay script. Sandbox fallback will be active.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface RazorpayPaymentPayload {
  bookingReference: string;
  roomTypeName: string;
  amountInINR: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  aadharNumber?: string;
  nights: number;
  guests: number;
}

export interface RazorpaySuccessResult {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  payment_method: string;
  amount_inr: number;
  timestamp: string;
}

export const RAZORPAY_TEST_KEY =
  (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || 'rzp_test_NaiduHotel2026';

/**
 * Generates an authentic-looking Razorpay Payment ID (e.g., pay_Nxk9120Ja882L)
 */
export function generateRazorpayPaymentId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 14; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `pay_${rand}`;
}

export function generateRazorpayOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 14; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `order_${rand}`;
}
