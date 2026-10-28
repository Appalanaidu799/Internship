/**
 * Secure Identity Document OCR Service for Naidu Hotel
 * Coordinates with backend /api/ocr/extract-identity
 * Extracts address fields only when present & readable without hallucination
 */

import { IdDocumentType } from '../types/auth';

export interface OcrExtractionResult {
  success: boolean;
  documentType: IdDocumentType | 'Unknown' | string;
  documentNumber?: string;
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  hasAddress: boolean;
  isReadable: boolean;
  message?: string;
  error?: string;
  rawTextPreview?: string;
}

export async function processDocumentOcr(
  imageBase64: string,
  mimeType: string,
  targetDocType: IdDocumentType = 'Aadhar Card'
): Promise<OcrExtractionResult> {
  // Validate basic format before sending
  if (!imageBase64) {
    return {
      success: false,
      documentType: targetDocType,
      hasAddress: false,
      isReadable: false,
      error: 'Please select a document image before initiating OCR scanning.'
    };
  }

  // Validate supported mime types
  const supportedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedMimeTypes.includes(mimeType.toLowerCase())) {
    return {
      success: false,
      documentType: targetDocType,
      hasAddress: false,
      isReadable: false,
      error: `Unsupported file format (${mimeType}). Please upload a JPG, JPEG, PNG, or WebP image.`
    };
  }

  try {
    const response = await fetch('/api/ocr/extract-identity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        documentType: targetDocType === 'PAN Card' ? 'pan' : 'aadhaar'
      })
    });

    if (!response.ok) {
      let errText = 'OCR extraction failed.';
      try {
        const errJson = await response.json();
        errText = errJson.error || errJson.message || errText;
      } catch {
        errText = `OCR service returned status ${response.status}.`;
      }
      return {
        success: false,
        documentType: targetDocType,
        hasAddress: false,
        isReadable: false,
        error: errText
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        documentType: data.documentType || targetDocType,
        hasAddress: false,
        isReadable: false,
        error: data.error || 'Failed to extract text from document.'
      };
    }

    // PAN cards do not contain residential addresses in India
    const detectedType = data.documentType === 'pan' || targetDocType === 'PAN Card' ? 'PAN Card' : 'Aadhar Card';
    const hasAddress = detectedType === 'PAN Card' ? false : Boolean(data.hasAddress && (data.addressLine1 || data.city || data.pincode));

    return {
      success: true,
      documentType: detectedType,
      documentNumber: data.documentNumber || undefined,
      name: data.name || undefined,
      addressLine1: data.addressLine1 || undefined,
      addressLine2: data.addressLine2 || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      pincode: data.pincode || undefined,
      country: data.country || 'India',
      hasAddress,
      isReadable: Boolean(data.isReadable),
      message: detectedType === 'PAN Card'
        ? 'PAN Card details recognized. Note: Indian PAN Cards do not contain a residential address; please enter your permanent address manually.'
        : 'Aadhaar Card scanned successfully. Review the extracted address fields before applying.',
      rawTextPreview: data.rawTextPreview
    };
  } catch (error: any) {
    console.warn('Network error reaching OCR endpoint:', error);
    return {
      success: false,
      documentType: targetDocType,
      hasAddress: false,
      isReadable: false,
      error: error?.message || 'Could not reach backend OCR service. Please enter your address details manually.'
    };
  }
}
