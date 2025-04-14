import { defineEventHandler, readBody } from 'h3';
import { getRedisClient } from '../utils/redis';
import QRCode from 'qrcode-reader';
import { Jimp } from 'jimp';
import util from 'util';

// Interface for the UPI details extracted from QR
interface UPIQRData {
  upiId: string;
  name?: string;
  merchantCode?: string;
  amount?: number;
  transactionNote?: string;
  referenceId?: string;
}

/**
 * Extracts UPI payment details from a QR code
 * UPI QR codes follow this format: upi://pay?pa=UPI_ID&pn=NAME&mc=MERCHANT_CODE&tid=TRANSACTION_ID&tr=REFERENCE_ID&tn=NOTE&am=AMOUNT&cu=CURRENCY
 */
function extractUPIDetails(qrData: string): UPIQRData | null {
  try {
    // Check if this is a UPI QR code
    if (!qrData.startsWith('upi://pay?')) {
      console.error('Not a UPI QR code:', qrData);
      return null;
    }

    // Extract the query parameters
    const queryString = qrData.substring(qrData.indexOf('?') + 1);
    const params = new URLSearchParams(queryString);

    // Extract UPI ID (mandatory)
    const upiId = params.get('pa') || '';
    if (!upiId) {
      console.error('No UPI ID found in QR');
      return null;
    }

    // Build result object
    const result: UPIQRData = { upiId };

    // Add optional parameters if they exist
    if (params.has('pn')) result.name = params.get('pn') || undefined;
    if (params.has('mc')) result.merchantCode = params.get('mc') || undefined;
    if (params.has('tn')) result.transactionNote = params.get('tn') || undefined;
    if (params.has('tr')) result.referenceId = params.get('tr') || undefined;

    // Parse amount if present
    if (params.has('am')) {
      const amountStr = params.get('am');
      if (amountStr) {
        const amount = parseFloat(amountStr);
        if (!isNaN(amount)) {
          result.amount = amount;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error extracting UPI details:', error);
    return null;
  }
}

/**
 * Process a QR code image and extract UPI details
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    if (!body || !body.imageData) {
      return {
        success: false,
        error: 'No image data provided'
      };
    }

    // Get image data from request
    const imageDataUrl = body.imageData;

    // Verify it's a data URL
    if (!imageDataUrl.startsWith('data:image/')) {
      return {
        success: false,
        error: 'Invalid image format'
      };
    }

    // Remove the data:image/xxx;base64, prefix
    const base64Data = imageDataUrl.split(',')[1];

    // Decode the image
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const image = await Jimp.read(imageBuffer);

    // Setup QR code reader
    const qrReader = new QRCode();
    const decodeQR = util.promisify(qrReader.decode.bind(qrReader));

    try {
      // Decode the QR code
      const result = await decodeQR(image);

      if (!result || !result.result) {
        return {
          success: false,
          error: 'No QR code found in image'
        };
      }

      // Extract UPI details from the QR data
      const upiDetails = extractUPIDetails(result.result);

      if (!upiDetails) {
        return {
          success: false,
          error: 'Invalid UPI QR code'
        };
      }

      // Log the processed QR in Redis for statistics
      const redis = getRedisClient();
      await redis.incr('stats:qr-processed');

      // Return success with UPI details
      return {
        success: true,
        ...upiDetails
      };
    } catch (qrError) {
      console.error('QR decoding error:', qrError);
      return {
        success: false,
        error: 'Failed to decode QR code'
      };
    }
  } catch (error) {
    console.error('Process QR error:', error);
    return {
      success: false,
      error: 'An error occurred while processing the QR code'
    };
  }
});