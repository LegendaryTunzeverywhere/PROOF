import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  DocumentArrowUpIcon, 
  SparklesIcon,
  XMarkIcon,
  DocumentTextIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface DocumentPath {
  id: string;
  title: string;
  emoji: string;
  description: string;
  createdAt: string;
  progress?: number;
}

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentPath[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingPathId, setDeletingPathId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [goal, setGoal] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ 
    show: false, 
    message: '' 
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; pathId: string; title: string }>({
    show: false,
    pathId: '',
    title: ''
  });

  useEffect(() => {
    checkAuth();
    loadDocuments();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(!!data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/curriculum/documents', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.paths || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const validExts = ['.pdf', '.docx', '.txt'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setErrorModal({ 
        show: true, 
        message: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' 
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorModal({ 
        show: true, 
        message: 'File too large. Maximum size is 10MB.' 
      });
      return;
    }

    setSelectedFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (!isAuthenticated) {
      setErrorModal({
        show: true,
        message: 'You need to be signed in to upload documents. Please connect your wallet first.'
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('goal', goal.trim());

      console.log('Uploading document:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        goal: goal.trim()
      });

      const response = await fetch('/api/curriculum/from-document', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          console.error('Server error (full):', JSON.stringify(errorData, null, 2));
          // Server returns {error: {code, message}}
          if (errorData.error && typeof errorData.error === 'object') {
            errorMessage = errorData.error.message || errorData.error.code || errorMessage;
          } else {
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch (e) {
          // If response isn't JSON, use status text
          console.error('Failed to parse error response:', e);
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const { path } = await response.json();
      navigate(`/learn/path/${path.id}`);
    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorModal({ 
        show: true, 
        message: error.message || 'Failed to upload document. Please try again.' 
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  const handleDeleteClick = (doc: DocumentPath) => {
    setDeleteConfirm({
      show: true,
      pathId: doc.id,
      title: doc.title
    });
  };

  const confirmDelete = async () => {
    const pathId = deleteConfirm.pathId;
    setDeletingPathId(pathId);
    try {
      const response = await fetch(`/api/curriculum/documents/${pathId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete curriculum');
      }

      // Remove from UI
      setDocuments((current) => current.filter(doc => doc.id !== pathId));
      setDeleteConfirm({ show: false, pathId: '', title: '' });
    } catch (error) {
      setErrorModal({
        show: true,
        message: 'Failed to delete curriculum. Please try again.'
      });
      setDeleteConfirm({ show: false, pathId: '', title: '' });
    } finally {
      setDeletingPathId(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/learn')}
          className="flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-brand"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Learning
        </button>
      </div>

      {/* Hero Card */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 p-8 text-center text-white">
        <div className="mb-4 text-5xl">
          <DocumentArrowUpIcon className="mx-auto h-16 w-16" />
        </div>
        <h1 className="mb-3 text-2xl font-bold">Create Curriculum from Document</h1>
        <p className="mx-auto max-w-2xl text-sm opacity-90">
          Upload a PDF, Word doc, or text file — AI will analyze it and build a personalized
          learning path with lessons, quizzes, and proof challenges.
        </p>
      </div>

      {/* Existing Documents */}
      {documents.length > 0 && (
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
              Your Document Curricula
            </h2>
          </div>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group w-full rounded-xl border border-line bg-surface p-4 transition-all hover:border-brand hover:shadow-lg"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <button
                    onClick={() => navigate(`/learn/path/${doc.id}`)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <div className="shrink-0 text-2xl">{doc.emoji}</div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <h3 className="overflow-wrap-anywhere font-semibold text-ink group-hover:text-brand">
                        {doc.title}
                      </h3>
                      <p className="mt-1 overflow-wrap-anywhere text-sm text-muted">{doc.description}</p>
                      {doc.progress !== undefined && (
                        <div className="mt-2">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                              style={{ width: `${doc.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(doc);
                    }}
                    disabled={uploading || deletingPathId !== null}
                    className="flex shrink-0 items-center gap-2 rounded-lg border-2 border-red-500 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                    title="Delete curriculum"
                  >
                    {deletingPathId === doc.id ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent dark:border-red-400" />
                        Deleting…
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div>
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Upload New Document
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6">
          {/* File Dropzone */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-ink">
              Select Document
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                dragActive
                  ? 'border-brand bg-brand/5'
                  : selectedFile
                  ? 'border-ok bg-ok/5'
                  : 'border-line bg-surface hover:border-brand/50'
              }`}
              onClick={() => {
                if (!selectedFile) {
                  document.getElementById('fileInput')?.click();
                }
              }}
            >
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileInput}
                className="hidden"
              />

              {!selectedFile ? (
                <>
                  <DocumentArrowUpIcon className="mx-auto mb-3 h-12 w-12 text-muted" />
                  <div className="text-base font-medium text-ink">
                    Drag & drop or click to select
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    PDF, DOCX, or TXT · Max 10MB
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <DocumentTextIcon className="h-10 w-10 shrink-0 text-ok" />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="overflow-wrap-anywhere break-words font-semibold text-ink">{selectedFile.name}</div>
                    <div className="text-sm text-muted">
                      {formatFileSize(selectedFile.size)} MB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="ml-auto shrink-0 rounded-lg p-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="h-5 w-5 text-muted" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Goal Input */}
          <div className="mb-6">
            <label htmlFor="docGoal" className="mb-2 block text-sm font-semibold text-ink">
              Your Goal (optional)
            </label>
            <input
              id="docGoal"
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Master this for a job interview, Build a project with this knowledge..."
              maxLength={240}
              className="w-full rounded-lg border border-line bg-surface px-4 py-2 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedFile || uploading || !isAuthenticated}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 font-semibold text-white transition-all hover:from-teal-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SparklesIcon className="h-5 w-5" />
            {uploading ? 'Analyzing document…' : !isAuthenticated ? 'Sign in to upload' : 'Analyze & Create Curriculum'}
          </button>

          <p className="mt-3 text-center text-xs text-muted">
            {!isAuthenticated ? (
              <>Please sign in with your wallet to upload documents and create personalized curricula.</>
            ) : (
              <>Your curriculum will be private and unique to you. The document is processed
              securely and not stored after analysis.</>
            )}
          </p>
        </form>
      </div>

      {uploading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-2xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-2xl text-brand animate-pulse" aria-hidden="true">
              ✦
            </div>
            <h2 className="mt-4 text-xl font-bold text-ink">Analyzing your document</h2>
            <p className="mt-2 text-sm text-muted">Building lessons, quizzes, recall prompts, and proof challenges.</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-elevated" aria-label="Analysis in progress">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 animate-[document-progress_1.8s_ease-in-out_infinite]" />
            </div>
            <p className="mt-3 text-xs text-muted">This may take a little while for larger documents.</p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XMarkIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upload Failed</h3>
            </div>
            <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
              {errorModal.message}
            </p>
            <button
              onClick={() => setErrorModal({ show: false, message: '' })}
              className="w-full rounded-lg bg-gray-900 dark:bg-white px-4 py-2.5 font-semibold text-white dark:text-gray-900 transition-colors hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XMarkIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Curriculum?</h3>
            </div>
            <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, pathId: '', title: '' })}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
