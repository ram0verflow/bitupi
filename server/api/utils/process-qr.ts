import { defineEventHandler, readBody, createError } from 'h3';
import jsQR from 'jsqr';
import { createCanvas, loadImage } from 'canvas';

export default defineEventHandler(async (event) => {
  // Get base64 image from request body
  const body = await readBody(event);
  
  if (!body.image) {
    throw createError({
      statusCode: 400,
      message: 'QR code image is required'
    });
  }
  
  try {
    // Extract base64 data
    let base64Data = body.image;
    if (base64Data.includes('base64,')) {
      base64Data = base64Data.split('base64,')[1];
    }
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Load image
    const image = await loadImage(imageBuffer);
    
    // Create canvas and draw image
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Decode QR code
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (!qrCode) {
      throw createError({
        statusCode: 400,
        message: 'No QR code found in image'
      });
    }
    
    // Extract UPI details from QR code text
    // UPI QR codes follow the format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT
    const qrData = qrCode.data;
    const upiRegex = /upi:\/\/pay\?([^#]*)/;
    const upiMatch = qrData.match(upiRegex);
    
    if (!upiMatch) {
      return {
        success: true,
        rawData: qrData,
        isUpiQr: false
      };
    }
    
    // Parse UPI params
    const paramsString = upiMatch[1];
    const paramsArray = paramsString.split('&');
    const upiParams: Record<string, string> = {};
    
    paramsArray.forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        upiParams[key] = decodeURIComponent(value);
      }
    });
    
    // Extract UPI ID, name, and amount
    const upiId = upiParams.pa || '';
    const upiName = upiParams.pn || '';
    const amount = upiParams.am ? parseFloat(upiParams.am) : 0;
    
    return {
      success: true,
      rawData: qrData,
      isUpiQr: true,
      upiId,
      upiName,
      amount
    };
  } catch (error) {
    console.error('Error processing QR code:', error);
    
    throw createError({
      statusCode: 500,
      message: 'Failed to process QR code image'
    });
  }
});