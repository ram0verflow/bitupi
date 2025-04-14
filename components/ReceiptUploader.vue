<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB default
  }
});

const emit = defineEmits(['upload-success', 'upload-error']);

const selectedFile = ref(null);
const previewUrl = ref('');
const isUploading = ref(false);
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

async function uploadReceipt() {
  if (!selectedFile.value || !isValidFile.value) return;
  
  isUploading.value = true;
  progress.value = 10; // Show initial progress
  errorMessage.value = '';
  
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
        
        emit('upload-success', { 
          image: base64Image,
          originalFile: selectedFile.value
        });
        
        progress.value = 100;
      } catch (error) {
        errorMessage.value = error.message || 'Failed to upload receipt';
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
    isUploading.value = false;
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
  <div class="receipt-uploader w-full">
    <!-- Error message -->
    <div v-if="errorMessage" class="mb-4 p-3 bg-error/10 border border-error rounded-lg text-error text-sm">
      {{ errorMessage }}
    </div>
    
    <!-- Preview section if file is selected -->
    <div v-if="previewUrl" class="mb-4">
      <div class="relative max-h-[300px] overflow-hidden rounded-lg border border-border-dark">
        <img 
          :src="previewUrl" 
          alt="Payment receipt preview" 
          class="w-full object-contain"
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
          @click="uploadReceipt"
          :disabled="isUploading || !isValidFile"
          class="btn-primary"
          :class="{'opacity-50 cursor-not-allowed': isUploading || !isValidFile}"
        >
          <span v-if="isUploading">
            Uploading...
          </span>
          <span v-else>
            Confirm Upload
          </span>
        </button>
      </div>
      
      <!-- Upload progress bar -->
      <div v-if="isUploading" class="mt-4 w-full bg-bg-input rounded-full h-2.5">
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
      class="border-2 border-dashed rounded-lg p-6 text-center transition-all"
      :class="dragActive ? 'border-secondary bg-secondary/5' : 'border-border-dark'"
    >
      <div class="flex flex-col items-center justify-center space-y-4">
        <div class="text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        
        <div>
          <h3 class="font-display text-text-light font-medium mb-1">Upload Payment Receipt</h3>
          <p class="text-text-muted text-sm mb-4">
            Drag and drop or click to select
          </p>
          
          <label class="btn-outline-secondary cursor-pointer">
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