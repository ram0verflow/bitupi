<script setup>
import { ref, computed, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB default
  }
});

const emit = defineEmits(['upload-success', 'upload-error', 'processing-start', 'processing-end']);

const selectedFile = ref(null);
const previewUrl = ref('');
const isProcessing = ref(false);
const errorMessage = ref('');
const progress = ref(0);
const dragActive = ref(false);
const detectedUpiInfo = ref(null);
const showCamera = ref(false);
const videoStream = ref(null);
const videoElement = ref(null);
const captureMode = ref('upload'); // 'upload' or 'camera'

const isValidFile = computed(() => {
  if (!selectedFile.value) return false;
  
  const file = selectedFile.value;
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const isValidType = validTypes.includes(file.type);
  const isValidSize = file.size <= props.maxSize;
  
  if (!isValidType) {
    errorMessage.value = 'Please upload an image file (JPEG, PNG, GIF, WEBP)';
    return false;
  }
  
  if (!isValidSize) {
    errorMessage.value = `File too large. Maximum size is ${formatSize(props.maxSize)}`;
    return false;
  }
  
  return true;
});

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function handleFileSelect(e) {
  const files = e.target.files || e.dataTransfer.files;
  errorMessage.value = '';
  
  if (!files || files.length === 0) {
    resetUpload();
    return;
  }
  
  selectedFile.value = files[0];
  
  if (isValidFile.value) {
    createPreview();
  } else {
    // Keep the file selected but don't create preview
    previewUrl.value = '';
  }
}

function createPreview() {
  if (!selectedFile.value) return;
  
  // Revoke previous object URL if exists
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
  
  previewUrl.value = URL.createObjectURL(selectedFile.value);
}

function resetUpload() {
  // Revoke object URL if exists
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
  
  selectedFile.value = null;
  previewUrl.value = '';
  errorMessage.value = '';
  progress.value = 0;
  detectedUpiInfo.value = null;
}

async function processQRCode() {
  if (!selectedFile.value || !isValidFile.value) return;
  
  isProcessing.value = true;
  progress.value = 10; // Show initial progress
  errorMessage.value = '';
  
  emit('processing-start');
  
  try {
    const reader = new FileReader();
    
    reader.onloadstart = () => {
      progress.value = 20;
    };
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        progress.value = 20 + (e.loaded / e.total) * 30;
      }
    };
    
    reader.onload = async (e) => {
      try {
        progress.value = 50;
        const base64Image = e.target.result;
        
        // Send to server for processing
        const response = await fetch('/api/process-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ image: base64Image })
        });
        
        progress.value = 80;
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          const errorMsg = result.error || 'Failed to process QR code';
          throw new Error(errorMsg);
        }
        
        progress.value = 100;
        
        // Check if it's a UPI QR code
        if (!result.isUpi) {
          console.warn('Non-UPI QR code detected:', result.rawData);
          throw new Error(`Not a UPI QR code. Detected: ${result.rawData.substring(0, 30)}...`);
        }
        
        // Validate UPI data
        if (!result.upiId) {
          throw new Error('Invalid UPI QR: Missing UPI ID');
        }
        
        console.log('UPI QR code processed successfully:', result);
        
        // Store detected UPI info for UI display
        detectedUpiInfo.value = {
          upiId: result.upiId,
          name: result.name || 'Not provided',
          amount: result.amount,
          transactionId: result.meta?.transactionId,
          reference: result.meta?.reference,
          rawData: result.meta?.rawData
        };
        
        // Show details about the detected UPI data in console
        const details = [
          `UPI ID: ${result.upiId}`,
          `Name: ${result.name || 'Not provided'}`,
          result.amount ? `Amount: ₹${result.amount}` : null,
          result.meta?.transactionId ? `Transaction ID: ${result.meta.transactionId}` : null,
          result.meta?.reference ? `Reference: ${result.meta.reference}` : null
        ].filter(Boolean).join('\n');
        
        console.log('UPI QR Details:\n' + details);
        
        emit('upload-success', result);
      } catch (error) {
        console.error('QR processing error:', error);
        errorMessage.value = error.message || 'Failed to process QR code';
        emit('upload-error', { message: error.message || 'Failed to process QR code' });
      }
    };
    
    reader.onerror = () => {
      errorMessage.value = 'Error reading file';
      emit('upload-error', { message: 'Error reading file' });
    };
    
    reader.readAsDataURL(selectedFile.value);
    
  } catch (error) {
    console.error('QR uploader error:', error);
    errorMessage.value = error.message || 'An unexpected error occurred';
    emit('upload-error', { message: error.message || 'An unexpected error occurred' });
  } finally {
    isProcessing.value = false;
    emit('processing-end');
  }
}

// Drag and drop handling
function handleDragEnter(e) {
  e.preventDefault();
  dragActive.value = true;
}

function handleDragLeave(e) {
  e.preventDefault();
  dragActive.value = false;
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();
  dragActive.value = false;
  handleFileSelect(e);
}

// Camera handling functions
async function startCamera() {
  captureMode.value = 'camera';
  showCamera.value = true;
  errorMessage.value = '';
  
  try {
    // First check if the browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support camera access');
    }
    
    // Check for permissions if available
    let permissionStatus;
    try {
      if (navigator.permissions && navigator.permissions.query) {
        permissionStatus = await navigator.permissions.query({ name: 'camera' });
        if (permissionStatus.state === 'denied') {
          throw new Error('Camera permission denied. Please enable camera access in your browser settings.');
        }
      }
    } catch (permError) {
      console.log('Permission query not supported, will try direct access:', permError);
    }
    
    // Request camera access with higher resolution
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: { ideal: 'environment' }, // Prefer back camera with fallback
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    
    videoStream.value = stream;
    
    // Wait for nextTick and use a timeout as backup
    await nextTick();
    setTimeout(() => {
      if (videoElement.value) {
        videoElement.value.srcObject = stream;
        
        // Make sure video is actually playing
        const playPromise = videoElement.value.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing video:', error);
            errorMessage.value = 'Could not start video stream. Please try again.';
          });
        }
      }
    }, 100);
  } catch (error) {
    console.error('Error accessing camera:', error);
    
    // Provide more specific error messages based on the error
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage.value = 'Camera access denied. Please allow camera access in your browser settings.';
    } else if (error.name === 'NotFoundError') {
      errorMessage.value = 'No camera found. Please connect a camera or try uploading an image instead.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage.value = 'Camera is in use by another application or not available.';
    } else {
      errorMessage.value = `Could not access camera: ${error.message || 'Unknown error'}. Try uploading instead.`;
    }
    
    // Fall back to upload mode
    showCamera.value = false;
    captureMode.value = 'upload';
  }
}

function stopCamera() {
  if (videoStream.value) {
    const tracks = videoStream.value.getTracks();
    tracks.forEach(track => track.stop());
    videoStream.value = null;
  }
  
  showCamera.value = false;
  captureMode.value = 'upload';
}

async function captureImage() {
  if (!videoElement.value || !showCamera.value) return;
  
  try {
    // Create a canvas with the same dimensions as the video
    const canvas = document.createElement('canvas');
    const videoWidth = videoElement.value.videoWidth;
    const videoHeight = videoElement.value.videoHeight;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Draw the current video frame to the canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement.value, 0, 0, videoWidth, videoHeight);
    
    // Convert to blob and create a File object
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    
    // Convert base64 to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create a file from the blob
    const capturedFile = new File([blob], "camera-capture.jpg", { type: 'image/jpeg' });
    
    // Set as the selected file and create preview
    selectedFile.value = capturedFile;
    previewUrl.value = dataUrl;
    
    // Stop the camera after capturing
    stopCamera();
    
  } catch (error) {
    console.error('Error capturing image:', error);
    errorMessage.value = 'Failed to capture image from camera';
  }
}

function switchMode(mode) {
  if (mode === 'camera') {
    startCamera();
  } else {
    stopCamera();
    captureMode.value = 'upload';
  }
}

// Cleanup on component unmount
onUnmounted(() => {
  stopCamera();
});
</script>

<template>
  <div class="qr-uploader w-full">
    <!-- Error message -->
    <div v-if="errorMessage" class="mb-4 p-3 bg-error/10 border border-error rounded-lg text-error text-sm">
      {{ errorMessage }}
    </div>
    
    <!-- Preview section if file is selected -->
    <div v-if="previewUrl" class="mb-4">
      <div class="relative aspect-square max-w-[250px] mx-auto">
        <img 
          :src="previewUrl" 
          alt="QR Code preview" 
          class="w-full h-full object-contain rounded-lg border border-border-dark"
        />
        <button 
          @click="resetUpload"
          class="absolute top-2 right-2 bg-bg-dark/80 text-text-light p-1 rounded-full hover:bg-error transition-colors"
          title="Remove image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="flex justify-center mt-4">
        <button 
          @click="processQRCode"
          :disabled="isProcessing || !isValidFile"
          class="btn-primary"
          :class="{'opacity-50 cursor-not-allowed': isProcessing || !isValidFile}"
        >
          <span v-if="isProcessing">
            Processing...
          </span>
          <span v-else>
            Process QR Code
          </span>
        </button>
      </div>
      
      <!-- Processing progress bar -->
      <div v-if="isProcessing" class="mt-4 w-full bg-bg-input rounded-full h-2.5">
        <div 
          class="bg-primary h-2.5 rounded-full transition-all duration-300"
          :style="`width: ${progress}%`"
        ></div>
      </div>
      
      <!-- Detected UPI Info -->
      <div v-if="detectedUpiInfo" class="mt-4 bg-success/10 p-4 rounded-lg border border-success/30">
        <h4 class="font-medium text-text-light mb-2">UPI QR Code Detected</h4>
        <ul class="space-y-1 text-sm text-text-muted">
          <li class="flex justify-between">
            <span class="font-medium">UPI ID:</span>
            <span>{{ detectedUpiInfo.upiId }}</span>
          </li>
          <li class="flex justify-between">
            <span class="font-medium">Payee:</span>
            <span>{{ detectedUpiInfo.name }}</span>
          </li>
          <li v-if="detectedUpiInfo.amount" class="flex justify-between">
            <span class="font-medium">Amount:</span>
            <span>₹ {{ detectedUpiInfo.amount }}</span>
          </li>
          <li v-if="detectedUpiInfo.transactionId" class="flex justify-between">
            <span class="font-medium">Transaction ID:</span>
            <span>{{ detectedUpiInfo.transactionId }}</span>
          </li>
          <li v-if="detectedUpiInfo.reference" class="flex justify-between">
            <span class="font-medium">Reference:</span>
            <span>{{ detectedUpiInfo.reference }}</span>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- Camera view when camera is active -->
    <div v-else-if="showCamera" class="border-2 border-border-dark rounded-lg overflow-hidden">
      <div class="relative">
        <!-- Camera video feed -->
        <video
          ref="videoElement"
          autoplay
          playsinline
          class="w-full h-auto aspect-video bg-black object-cover"
        ></video>
        
        <!-- Camera controls -->
        <div class="absolute inset-x-0 bottom-0 bg-bg-dark/80 p-4 flex justify-between">
          <button 
            @click="stopCamera"
            class="btn-outline-error text-sm"
          >
            Cancel
          </button>
          
          <button 
            @click="captureImage"
            class="btn-primary text-sm"
          >
            Capture QR Code
          </button>
        </div>
      </div>
    </div>
    
    <!-- Upload zone if no file is selected -->
    <div 
      v-else
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
      class="border-2 border-dashed rounded-lg p-8 text-center transition-all"
      :class="dragActive ? 'border-primary bg-primary/5' : 'border-border-dark'"
    >
      <div class="flex flex-col items-center justify-center space-y-4">
        <div class="text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        <div>
          <h3 class="font-display text-text-light font-medium mb-1">Upload UPI QR Code</h3>
          <p class="text-text-muted text-sm mb-4">
            Select a method to continue
          </p>
          
          <!-- Upload options -->
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              @click="switchMode('camera')"
              class="btn-secondary"
            >
              <span class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use Camera
              </span>
            </button>
            
            <label class="btn-outline-primary cursor-pointer">
              <span class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Image
              </span>
              <input 
                type="file" 
                class="hidden" 
                accept="image/jpeg,image/png,image/gif,image/webp"
                @change="handleFileSelect"
              />
            </label>
          </div>
        </div>
        
        <p class="text-text-muted text-xs">
          Supports: PNG, JPEG, GIF, WEBP (Max {{ formatSize(maxSize) }})
        </p>
      </div>
    </div>
  </div>
</template>