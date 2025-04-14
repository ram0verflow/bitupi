import { defineEventHandler, readBody, createError } from 'h3'

/**
 * Parse UPI QR code data
 * Format: upi://pay?pa=upiid@provider&pn=Name&am=amount&cu=INR&...
 */
function parseUpiData(data: string) {
  try {
    // Check if this is a UPI QR code
    if (!data.startsWith('upi://')) {
      return null;
    }
    
    console.log('Processing UPI QR code data:', data);
    
    // Extract query parameters
    const url = new URL(data);
    const params = new URLSearchParams(url.search);
    
    // Extract key UPI parameters
    const pa = params.get('pa'); // Payment address (UPI ID)
    const pn = params.get('pn'); // Payee name
    const am = params.get('am'); // Amount
    const cu = params.get('cu'); // Currency
    const mc = params.get('mc'); // Merchant code
    const tid = params.get('tid'); // Transaction ID
    const tr = params.get('tr'); // Transaction reference
    
    // UPI ID is mandatory
    if (!pa) {
      console.error('Invalid UPI QR: Missing UPI ID (pa parameter)');
      return null;
    }
    
    // Construct UPI data object
    const upiData = {
      upiId: pa,
      name: pn || 'Unknown',
      amount: am ? parseFloat(am) : undefined,
      currency: cu || 'INR',
      merchantCode: mc || undefined,
      transactionId: tid || undefined,
      reference: tr || undefined,
      isValid: true,
      rawData: data
    };
    
    console.log('Parsed UPI data:', upiData);
    
    return upiData;
  } catch (error) {
    console.error('Error parsing UPI data:', error);
    return null;
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    if (!body.image) {
      throw createError({
        statusCode: 400,
        message: 'No image data provided'
      });
    }
    
    // In a real implementation, we would decode the QR code from the image
    // using a library like jsQR. For this demo, we'll simulate QR decoding
    // and pretend we extracted a UPI string from the QR code.
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate a decoded UPI QR code string
    // In a real app, this would come from decoding the QR image
    const simulatedQrData = 'upi://pay?pa=example@upi&pn=Example+User&mc=1234&tid=QR' + 
                            Math.floor(Math.random() * 10000000) + 
                            '&tr=REF' + Math.floor(Math.random() * 10000000);
    
    // Parse the UPI data
    const upiData = parseUpiData(simulatedQrData);
    
    // Check if this is a valid UPI QR code
    if (!upiData) {
      throw createError({
        statusCode: 400,
        message: 'Invalid QR code: Not a valid UPI QR code'
      });
    }
    
    return {
      success: true,
      upiId: upiData.upiId,
      name: upiData.name,
      meta: upiData
    };
  } catch (error) {
    console.error('Error processing QR code:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to process QR code'
    };
  }
});