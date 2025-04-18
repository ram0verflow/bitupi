import { defineEventHandler, readBody, createError } from 'h3';
import { Jimp } from 'jimp';
import jsQR from 'jsqr';

/**
 * Parse UPI QR code data
 * Format: upi://pay?pa=upiid@provider&pn=Name&am=amount&cu=INR&...
 */
function parseUpiData(data: string) {
  try {
    // Check if this is a UPI QR code
    if (!data.startsWith('upi://')) {
      console.log('Not a UPI QR code:', data.substring(0, 30) + '...');
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

/**
 * Decode QR code from image
 */
async function decodeQRFromImage(base64Image: string) {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    // Load image with Jimp
    const image = await Jimp.read(Buffer.from(base64Data, 'base64'));

    // Get image data for QR scanning
    const { width, height } = image.bitmap;

    // Check image dimensions and resize if necessary
    if (width > MAX_IMAGE_DIMENSIONS || height > MAX_IMAGE_DIMENSIONS) {
      console.log(`Resizing large image: ${width}x${height} -> MAX: ${MAX_IMAGE_DIMENSIONS}`);
      image.scaleToFit({ w: MAX_IMAGE_DIMENSIONS, h: MAX_IMAGE_DIMENSIONS });
      // Update dimensions after resize
      const newDimensions = image.bitmap;
      console.log(`Resized to: ${newDimensions.width}x${newDimensions.height}`);
    }
    const imageData = new Uint8ClampedArray(width * height * 4);

    let i = 0;
    image.scan(0, 0, width, height, function (x, y, idx) {
      imageData[i++] = this.bitmap.data[idx + 0]; // R
      imageData[i++] = this.bitmap.data[idx + 1]; // G
      imageData[i++] = this.bitmap.data[idx + 2]; // B
      imageData[i++] = this.bitmap.data[idx + 3]; // A
    });

    // Scan for QR code
    const code = jsQR(imageData, width, height, {
      inversionAttempts: "dontInvert",
    });

    if (code) {
      console.log('QR code found:', code.data);
      return code.data;
    } else {
      console.error('No QR code found in image');
      return null;
    }
  } catch (error) {
    console.error('Error decoding QR code:', error);
    return null;
  }
}

// Constants for image validation
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB limit
const MAX_IMAGE_DIMENSIONS = 2000; // Max 2000x2000 pixels

/**
 * Validate image size and dimensions
 * @param base64Image - Base64 encoded image
 * @returns Validation result
 */
function validateImageSize(base64Image: string): { valid: boolean; message?: string } {
  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

  // Check file size
  const sizeInBytes = Buffer.from(base64Data, 'base64').length;
  if (sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      message: `Image too large. Maximum size is ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB`
    };
  }

  return { valid: true };
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

    // Validate image size
    const sizeValidation = validateImageSize(body.image);
    if (!sizeValidation.valid) {
      throw createError({
        statusCode: 400,
        message: sizeValidation.message || 'Invalid image'
      });
    }

    // Decode the QR code from the image
    console.log('Decoding QR code from image...');
    const qrData = await decodeQRFromImage(body.image);

    if (!qrData) {
      throw createError({
        statusCode: 400,
        message: 'No QR code found in the image or unable to decode'
      });
    }

    console.log('QR code decoded successfully:', qrData);

    // For UPI, parse the data if it's a UPI QR code
    const upiData = parseUpiData(qrData);

    if (!upiData) {
      // For non-UPI QR codes, return the raw data
      return {
        success: true,
        rawData: qrData,
        isUpi: false,
        message: 'QR code decoded, but not a UPI QR code'
      };
    }

    // Return UPI data
    return {
      success: true,
      upiId: upiData.upiId,
      name: upiData.name,
      amount: upiData.amount,
      isUpi: true,
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