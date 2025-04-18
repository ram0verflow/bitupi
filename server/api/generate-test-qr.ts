import { defineEventHandler, readBody, createError } from 'h3';
import qr from 'qrcode';

/**
 * Generate a test UPI QR code for development and testing purposes
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { upiId, name, amount } = body;
    
    if (!upiId) {
      throw createError({
        statusCode: 400,
        message: 'UPI ID is required'
      });
    }
    
    // Validate UPI ID format
    if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+$/.test(upiId)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid UPI ID format'
      });
    }
    
    // Construct UPI URI
    // Format: upi://pay?pa=upiid@provider&pn=Name&am=amount&cu=INR
    let upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}`;
    
    // Add optional parameters if provided
    if (name) {
      upiUri += `&pn=${encodeURIComponent(name)}`;
    }
    
    if (amount && !isNaN(parseFloat(amount))) {
      upiUri += `&am=${parseFloat(amount)}`;
    }
    
    // Add currency (always INR)
    upiUri += '&cu=INR';
    
    // Add transaction ID and reference for more realistic test data
    const txnId = 'TX' + Math.floor(Math.random() * 10000000);
    const refId = 'REF' + Math.floor(Math.random() * 10000000);
    upiUri += `&tid=${txnId}&tr=${refId}`;
    
    // Generate QR code as base64 image
    const qrCodeImage = await qr.toDataURL(upiUri, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    return {
      success: true,
      qrImage: qrCodeImage,
      upiUri,
      details: {
        upiId,
        name: name || '',
        amount: amount ? parseFloat(amount) : undefined,
        txnId,
        refId
      }
    };
  } catch (error) {
    console.error('Error generating test QR code:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to generate test QR code'
    };
  }
});