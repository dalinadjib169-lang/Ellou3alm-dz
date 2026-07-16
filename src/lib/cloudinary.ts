export async function uploadImageToCloudinary(file: File, uploadPreset: string = 'ml_default') {
  const formData = new FormData();
  formData.append('file', file);
  // Using user provided cloud name
  formData.append('upload_preset', uploadPreset); 

  try {
    const response = await fetch('https://api.cloudinary.com/v1_1/doaxziqm7/image/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}
