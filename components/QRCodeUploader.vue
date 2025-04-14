<script setup>
import { ref, computed } from 'vue';

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
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to process QR code');
        }
        
        const result = await response.json();
        progress.value = 100;
        
        emit('upload-success', result);
      } catch (error) {
        errorMessage.value = error.message || 'Failed to process QR code';
        emit('upload-error', error);
      }
    };
    
    reader.onerror = () => {
      errorMessage.value = 'Error reading file';
      emit('upload-error', new Error('Error reading file'));
    };
    
    reader.readAsDataURL(selectedFile.value);
    
  } catch (error) {
    errorMessage.value = error.message || 'An unexpected error occurred';
    emit('upload-error', error);
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
            Drag and drop or click to select
          </p>
          
          <label class="btn-outline-primary cursor-pointer">
            <span>Select Image</span>
            <input 
              type="file" 
              class="hidden" 
              accept="image/jpeg,image/png,image/gif,image/webp"
              @change="handleFileSelect"
            />
          </label>
        </div>
        
        <p class="text-text-muted text-xs">
          Supports: PNG, JPEG, GIF, WEBP (Max {{ formatSize(maxSize) }})
        </p>
      </div>
    </div>
  </div>
</template>