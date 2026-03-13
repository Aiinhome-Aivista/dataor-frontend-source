import Uppy from '@uppy/core';
import { API_ENDPOINTS, defaultConfig } from './api.config';

class UploadService {
  private uppy: Uppy;

  constructor() {
    this.uppy = new Uppy({
      id: 'dagent-uploader',
      autoProceed: false,
      debug: true,
      restrictions: {
        maxNumberOfFiles: 10,
      },
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.uppy.on('upload-progress', (file, progress) => {
    });

    this.uppy.on('complete', (result) => {
      console.log('Upload complete!', result.successful);
    });

    this.uppy.on('error', (error) => {
      console.error('Uppy Error:', error);
    });
  }

  getUppy() {
    return this.uppy;
  }

  async startUpload(userId: string, sessionId: string) {
    this.uppy.setMeta({ user_id: userId, session_id: sessionId });
    return this.uppy.upload();
  }

  reset() {
    this.uppy.cancelAll();
  }
}

export const uploadService = new UploadService();
