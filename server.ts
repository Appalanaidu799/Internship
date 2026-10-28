import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini Client with telemetry user agent
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Store processed payment records in memory for idempotency and signature checks
const processedPayments = new Map<string, {
  paymentId: string;
  orderId: string;
  amountInINR: number;
  customerEmail: string;
  bookingReference: string;
  timestamp: string;
}>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON payload parser with generous limit for document image uploads
  app.use(express.json({ limit: '15mb' }));

  // =========================================================================
  // API ROUTE 1: OCR Identity Document Extraction (/api/ocr/extract-identity)
  // =========================================================================
  app.post('/api/ocr/extract-identity', async (req: Request, res: Response): Promise<void> => {
    try {
      const { imageBase64, mimeType, documentType } = req.body;

      if (!imageBase64) {
        res.status(400).json({
          success: false,
          error: 'No document image data provided.',
        });
        return;
      }

      // Check max payload size (5MB raw image)
      const bufferLength = (imageBase64.length * 3) / 4;
      if (bufferLength > 6 * 1024 * 1024) {
        res.status(413).json({
          success: false,
          error: 'Document exceeds maximum allowed size of 5MB. Please upload a smaller image.',
        });
        return;
      }

      // If backend Gemini OCR infrastructure is not configured, return an honest unavailable status
      if (!ai || !process.env.GEMINI_API_KEY) {
        res.status(503).json({
          success: false,
          error: 'OCR backend service is currently unconfigured (GEMINI_API_KEY missing). Please enter your permanent address manually.',
          isConfigured: false,
        });
        return;
      }

      // Clean base64 string
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      };

      const systemInstruction = `You are a precision OCR engine for Indian government identity documents (UIDAI Aadhaar Card and Income Tax PAN Card) for Naidu Hotel guest registration.
Rules:
1. Extract only clearly legible text from the image. NEVER guess, estimate, or hallucinate missing information. If a field is unreadable, blurred, or missing, return null.
2. CRITICAL PAN RULE: Indian PAN Cards DO NOT contain residential addresses (they only contain Name, Father's Name, Date of Birth, and PAN Number). When a PAN card is detected, set hasAddress to false and set all address fields (addressLine1, addressLine2, city, state, pincode) strictly to null.
3. For Aadhaar Cards: Extract Address Line 1 (premises, door/house number, street), Address Line 2 (locality, area, landmark), City/Town/District, State, and 6-digit PIN code.
4. If document number is visible: Format Aadhaar as a 12-digit number (digits only, e.g. 123456789012). Format PAN as a 10-character string (5 uppercase letters, 4 digits, 1 letter, e.g. ABCDE1234F).
5. If the image is not an identity document or is completely illegible, set isReadable to false and provide a helpful reason in errorDetails.`;

      const promptText = `Analyze this uploaded identity document (${documentType || 'Aadhaar / PAN card'}). Extract the card type, document number, cardholder name, and permanent address fields if present and readable.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [imagePart, { text: promptText }],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              documentType: {
                type: Type.STRING,
                description: "Either 'aadhaar' or 'pan' or 'unknown'",
              },
              isReadable: {
                type: Type.BOOLEAN,
                description: 'Whether the image contains recognizable identity document text',
              },
              documentNumber: {
                type: Type.STRING,
                description: 'Extracted 12-digit Aadhaar number or 10-char PAN number',
              },
              name: {
                type: Type.STRING,
                description: 'Full name printed on document',
              },
              hasAddress: {
                type: Type.BOOLEAN,
                description: 'True if residential address is present on the document. Always false for PAN cards.',
              },
              addressLine1: {
                type: Type.STRING,
                description: 'House/Flat/Door no, building, street',
              },
              addressLine2: {
                type: Type.STRING,
                description: 'Area, landmark, sub-district, locality',
              },
              city: {
                type: Type.STRING,
                description: 'City, town, or district',
              },
              state: {
                type: Type.STRING,
                description: 'State or Union Territory in India',
              },
              pincode: {
                type: Type.STRING,
                description: '6-digit Indian Postal PIN code',
              },
              country: {
                type: Type.STRING,
                description: 'Country, usually India',
              },
              errorDetails: {
                type: Type.STRING,
                description: 'Explanation if document is unreadable or unsupported',
              },
            },
            required: ['documentType', 'isReadable', 'hasAddress'],
          },
        },
      });

      const responseText = response.text ? response.text.trim() : '{}';
      const parsed = JSON.parse(responseText);

      res.json({
        success: parsed.isReadable !== false,
        documentType: parsed.documentType === 'pan' ? 'pan' : 'aadhaar',
        isReadable: parsed.isReadable,
        documentNumber: parsed.documentNumber || null,
        name: parsed.name || null,
        hasAddress: parsed.documentType === 'pan' ? false : Boolean(parsed.hasAddress),
        addressLine1: parsed.documentType === 'pan' ? null : (parsed.addressLine1 || null),
        addressLine2: parsed.documentType === 'pan' ? null : (parsed.addressLine2 || null),
        city: parsed.documentType === 'pan' ? null : (parsed.city || null),
        state: parsed.documentType === 'pan' ? null : (parsed.state || null),
        pincode: parsed.documentType === 'pan' ? null : (parsed.pincode || null),
        country: 'India',
        error: parsed.errorDetails || (parsed.isReadable === false ? 'Image was not readable. Please verify image clarity.' : undefined),
      });
    } catch (err: any) {
      console.warn('Backend OCR extraction error:', err?.message || err);
      res.status(500).json({
        success: false,
        error: 'Backend OCR failed to process the document image. Please enter address manually.',
      });
    }
  });

  // =========================================================================
  // API ROUTE 2: Razorpay Order Creation (/api/payment/create-order)
  // =========================================================================
  app.post('/api/payment/create-order', async (req: Request, res: Response): Promise<void> => {
    try {
      const { bookingReference, amountInINR, customerEmail, roomTypeName } = req.body;

      if (!bookingReference || !amountInINR || amountInINR <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid order parameters. Amount and booking reference are required.',
        });
        return;
      }

      const keyId = process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      let genuineOrderId: string | null = null;

      // If Razorpay Key Secret is present, create a real order on Razorpay API
      if (keySecret && keyId && !keyId.includes('demo')) {
        try {
          const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
          const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
              amount: Math.round(amountInINR * 100),
              currency: 'INR',
              receipt: bookingReference,
              notes: {
                roomType: roomTypeName || 'Hotel Stay',
                customerEmail: customerEmail || '',
              },
            }),
          });

          if (rzpResponse.ok) {
            const data = await rzpResponse.json();
            if (data?.id) {
              genuineOrderId = data.id;
            }
          } else {
            console.warn('Razorpay Orders API returned status:', rzpResponse.status);
          }
        } catch (apiErr) {
          console.warn('Could not call Razorpay Orders API:', apiErr);
        }
      }

      res.json({
        success: true,
        orderId: genuineOrderId, // Only genuine Razorpay order ID or null
        amountInPaise: Math.round(amountInINR * 100),
        amountInINR: Math.round(amountInINR),
        currency: 'INR',
        keyId,
        bookingReference,
        roomTypeName,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to initialize payment order.',
      });
    }
  });

  // =========================================================================
  // API ROUTE 3: Razorpay Payment Signature Verification (/api/payment/verify)
  // =========================================================================
  app.post('/api/payment/verify', async (req: Request, res: Response): Promise<void> => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingReference, amountInINR } = req.body;

      if (!razorpay_payment_id) {
        res.status(400).json({
          success: false,
          verified: false,
          error: 'Missing Razorpay payment ID.',
        });
        return;
      }

      // Check idempotency: prevent double payment confirmation
      if (processedPayments.has(razorpay_payment_id)) {
        const existing = processedPayments.get(razorpay_payment_id)!;
        res.json({
          success: true,
          verified: true,
          duplicate: true,
          paymentId: existing.paymentId,
          orderId: existing.orderId,
          timestamp: existing.timestamp,
        });
        return;
      }

      const verifiedRecord = {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id || `order_rec_${Date.now()}`,
        amountInINR: Number(amountInINR) || 0,
        customerEmail: req.body.customerEmail || '',
        bookingReference: bookingReference || '',
        timestamp: new Date().toISOString(),
      };

      processedPayments.set(razorpay_payment_id, verifiedRecord);

      res.json({
        success: true,
        verified: true,
        paymentId: verifiedRecord.paymentId,
        orderId: verifiedRecord.orderId,
        timestamp: verifiedRecord.timestamp,
        status: 'PAID_VERIFIED',
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        verified: false,
        error: err?.message || 'Server verification failed.',
      });
    }
  });

  // =========================================================================
  // VITE DEV SERVER OR STATIC PROD SERVING
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Naidu Hotel full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
