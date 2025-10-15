'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface ResumeUploadProps {
  onTextExtracted?: (text: string) => void;
}

export default function ResumeUpload({ onTextExtracted }: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError('');
    setIsUploading(true);
    setFileName(file.name);

    try {
      const text = await extractTextFromPDF(file);
      console.log('Extracted PDF text:', text);
      setExtractedText(text);
      onTextExtracted?.(text);
    } catch (err) {
      setError('Failed to extract text from PDF. Please try a different file.');
      console.error('PDF extraction error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Dynamically import pdfjs-dist only on client side
        const pdfjsLib = await import('pdfjs-dist');
        
        // Disable worker completely - PDF.js will run on main thread
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            
            // Extract text from all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              fullText += pageText + '\n';
            }
            
            resolve(fullText.trim());
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setExtractedText('');
    setFileName('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Upload Resume
      </h2>
      
      <div className="space-y-4">
        {/* File Input */}
        <div>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                📄 Choose PDF File
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-3">
            <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* File Info */}
        {fileName && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-green-700 dark:text-green-200 text-sm">
                  ✅ {fileName}
                </span>
              </div>
              <button
                onClick={clearFile}
                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Extracted Text Preview */}
        {extractedText && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Extracted Text Preview
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {extractedText}
              </pre>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {extractedText.length} characters extracted
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
