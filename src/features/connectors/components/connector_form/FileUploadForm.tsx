import { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { FileSpreadsheet, FileCode2, Upload, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/src/ui-kit';
import { uploadService } from '@/src/services/upload.service';
import { connectorService } from '@/src/services/connector.service';

interface FileUploadFormProps {
  isCsvUpload: boolean;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  acceptedFileTypes: string;
<<<<<<< HEAD
=======
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  removeFile: (idx: number) => void;
  handleFileUploadConnect: () => void;
  uploadProgress: Record<string, number>;
  
  isUploading: boolean;
>>>>>>> ae306c3cf744c9e2abd43fae4606fb60fd67ac4c
  onBack: () => void;
  userId: string;
  sessionId: string;
  onSuccess: () => void;
}

export const FileUploadForm = ({
  isCsvUpload,
  isDragging,
  setIsDragging,
  acceptedFileTypes,
<<<<<<< HEAD
  onBack,
  userId,
  sessionId,
  onSuccess
=======
  uploadedFiles,
  setUploadedFiles,
  removeFile,
  handleFileUploadConnect,
  uploadProgress,
  isUploading,
  onBack
>>>>>>> ae306c3cf744c9e2abd43fae4606fb60fd67ac4c
}: FileUploadFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uppy = useMemo(() => uploadService.getUppy(), []);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleProgress = (totalProgress: number) => {
      setProgress(totalProgress);
    };

    const handleUploadStart = () => {
      setIsUploading(true);
      setErrorMsg('');
    };

    const handleUploadSuccess = (file: any, response: any) => {
      console.log('Upload success:', file.name);
    };

    const handleComplete = (result: any) => {
      setIsUploading(false);
      if (result.failed.length === 0) {
        onSuccess();
      } else {
        setErrorMsg('Some uploads failed. Please try again.');
      }
    };

    const handleFileAdded = () => {
      setUploadedFiles(uppy.getFiles());
    };

    const handleFileRemoved = () => {
      setUploadedFiles(uppy.getFiles());
    };

    const handleError = (error: any) => {
      setIsUploading(false);
      setErrorMsg(error.message || 'Upload failed.');
    };

    uppy.on('progress', handleProgress);
    uppy.on('upload', handleUploadStart);
    uppy.on('upload-success', handleUploadSuccess);
    uppy.on('complete', handleComplete);
    uppy.on('file-added', handleFileAdded);
    uppy.on('file-removed', handleFileRemoved);
    uppy.on('error', handleError);

    return () => {
      uppy.off('progress', handleProgress);
      uppy.off('upload', handleUploadStart);
      uppy.off('upload-success', handleUploadSuccess);
      uppy.off('complete', handleComplete);
      uppy.off('file-added', handleFileAdded);
      uppy.off('file-removed', handleFileRemoved);
      uppy.off('error', handleError);
    };
  }, [uppy, onSuccess]);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      isCsvUpload ? f.name.endsWith('.csv') : f.name.endsWith('.sql')
    );
    if (files.length === 0) {
      setErrorMsg(`Only ${isCsvUpload ? 'CSV' : 'SQL'} files are allowed.`);
      return;
    }
    files.forEach(file => {
      uppy.addFile({
        name: file.name,
        type: file.type,
        data: file,
      });
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      try {
        uppy.addFile({
          name: file.name,
          type: file.type,
          data: file,
        });
      } catch (err: any) {
        if (err.isRestriction) {
          setErrorMsg(err.message);
        }
      }
    });
    e.target.value = '';
  };

  const removeFile = (fileId: string) => {
    uppy.removeFile(fileId);
  };

  const handleFileUploadConnect = async () => {
    const filesToUpload = uppy.getFiles().map(file => file.data as File);
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setProgress(0);
    setErrorMsg('');

    try {
      // Mock progress since we're using a standard fetch/POST which doesn't easily report progress
      // without more complex XHR setup. For now, we'll use a simulated progress or just wait for success.
      const interval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 500);

      const response = await connectorService.uploadFiles({
        user_id: userId,
        session_id: sessionId,
        files: filesToUpload
      });

      clearInterval(interval);
      setProgress(100);

      if (response.status === 'success' || response.status === true) {
        onSuccess();
      } else {
        setErrorMsg(response.message || 'Upload failed.');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center">
          {errorMsg}
        </div>
      )}

      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
        Upload Files
      </p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all
          ${isDragging
            ? 'border-[var(--accent)] bg-[var(--accent)]/20 scale-[1.01]'
            : 'border-[var(--accent)]/60 bg-[var(--accent)]/5'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes}
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors bg-[var(--accent)]/20 text-[var(--accent)]">
          {isCsvUpload ? <FileSpreadsheet className="w-7 h-7" /> : <FileCode2 className="w-7 h-7" />}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            or <span className="text-[var(--accent)] font-medium">browse</span> to choose files
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold">
          <Upload className="w-3 h-3" />
          Upload Multiple Files
        </div>
      </div>

      {/* File list */}
      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
            </p>
            {!isUploading && (
              <button
                onClick={() => uppy.cancelAll()}
                className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)]/40 group relative overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                  {isCsvUpload ? <FileSpreadsheet className="w-4 h-4" /> : <FileCode2 className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    {(file.size / 1024).toFixed(1)} KB • {file.progress.percentage}%
                  </p>
                </div>
                {!isUploading && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 hover:text-red-500 text-[var(--text-secondary)] transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {file.progress.uploadComplete && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </div>
              {/* Individual progress bar */}
              <div className="h-1 w-full bg-[var(--border)]/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${file.progress.percentage}%` }}
                  className="h-full bg-[var(--accent)]"
                />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Overall Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            <span>Overall Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full bg-[var(--border)]/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-[var(--accent)]"
            />
          </div>
        </div>
      )}

      {/* Connect button */}
      <div className="pt-4 flex justify-end gap-4">
        <Button variant="outline" onClick={onBack} disabled={isUploading}>Cancel</Button>
        <Button
          className="px-8"
          onClick={handleFileUploadConnect}
          disabled={uploadedFiles.length === 0 || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Connect
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
