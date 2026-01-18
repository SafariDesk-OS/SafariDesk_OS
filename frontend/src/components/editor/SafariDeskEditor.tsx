import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import typescript from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import { ResizableImage } from './extensions/ResizableImage';
import { KBArticleService } from '../../services/kb/articles';
import './safaridesk-editor.css';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Plus,
  Minus,
  ChevronDown,
  Upload,
  X
} from 'lucide-react';

// Create lowlight instance and register languages
const lowlight = createLowlight();
lowlight.register({ 
  javascript, 
  python, 
  css, 
  typescript, 
  html,
  json,
  sql
});

interface SafariDeskEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

const SafariDeskEditor: React.FC<SafariDeskEditorProps> = ({
  content,
  onChange,
  className = "",
  onImageUpload
}) => {
  const fallbackUpload = React.useCallback(async (file: File): Promise<string> => {
    const response = await KBArticleService.uploadImage(file);
    let imageUrl = response.url;
    
    // Backend returns full URL from FILE_BASE_URL setting
    // If still relative, construct using window.location.origin
    if (!imageUrl.startsWith('http')) {
      const origin = window.location.origin;
      imageUrl = imageUrl.startsWith('/') ? `${origin}${imageUrl}` : `${origin}/${imageUrl}`;
    }
    
    console.log('Image URL from backend:', response.url);
    console.log('Final image URL to insert:', imageUrl);
    return imageUrl;
  }, []);

  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      ResizableImage.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'safaridesk-editor-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'safaridesk-editor-link',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'safaridesk-editor-table',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'safaridesk-editor-table-header',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'safaridesk-editor-table-cell',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'safaridesk-editor-codeblock',
        },
      }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }: { editor: any }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'safaridesk-editor-content',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return <div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />;
  }

  // Helper functions using CSS classes instead of Tailwind
  const getButtonClasses = (isActive = false) => {
    return isActive ? 'active' : '';
  };

  const getDropdownButtonClasses = () => {
    return `dropdown-button ${showHeadingDropdown ? 'active' : ''}`;
  };

  const getCurrentHeading = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    if (editor.isActive('heading', { level: 4 })) return 'Heading 4';
    if (editor.isActive('heading', { level: 5 })) return 'Heading 5';
    if (editor.isActive('heading', { level: 6 })) return 'Heading 6';
    return 'Normal';
  };

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const addImage = () => {
    setShowImageModal(true);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else {
        alert('Please drop an image file');
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    const uploader = onImageUpload || fallbackUpload;
    setUploadingImage(true);
    try {
      console.group('Image Upload Debug');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      const url = await uploader(file);
      console.log('Uploader returned URL:', url);
      
      // The uploader (fallbackUpload or onImageUpload) should return a proper full URL
      // If it's still relative, construct the full URL using the API base URL
      let finalUrl = url;
      if (!url.startsWith('http')) {
        // Use the API base URL from environment, fallback to window.location.origin
        const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin;
        finalUrl = url.startsWith('/') ? `${apiBaseUrl}${url}` : `${apiBaseUrl}/${url}`;
      }
      console.log('Final URL for editor:', finalUrl);
      
      // Insert into editor immediately - don't wait for image load test
      // This ensures the image is inserted even if there are temporary loading issues
      editor.chain().focus().setResizableImage({ 
        src: finalUrl, 
        alt: file.name,
        width: 300,
        alignment: 'center'
      }).run();
      
      // Test if the image URL is accessible (for logging purposes only)
      const testImg = new Image();
      testImg.crossOrigin = 'anonymous';
      testImg.onload = () => {
        console.log('Image loaded successfully');
        console.groupEnd();
      };
      testImg.onerror = () => {
        console.warn('Image may have loading issues (CORS or path). URL:', finalUrl);
        console.groupEnd();
      };
      testImg.src = finalUrl;
      
      setShowImageModal(false);
      
    } catch (error) {
      console.error('Image upload failed:', error);
      alert(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUrlImageInsert = async () => {
    if (!imageUrl.trim()) return;
    
    setUploadingImage(true);
    try {
      // Basic URL validation - just check if it's a valid URL format
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        throw new Error('Please enter a valid URL starting with http:// or https://');
      }
      
      // Test if image loads - this is the main validation
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      // Insert image into editor using ResizableImage
      editor.chain().focus().setResizableImage({
        src: imageUrl,
        alt: imageAlt || 'Image',
        width: 300,
        alignment: 'center'
      }).run();
      
      // Reset states
      setShowImageModal(false);
      setImageUrl('');
      setImageAlt('');
      
    } catch (error) {
      console.error('URL image insert failed:', error);
      alert(`Failed to insert image: ${error instanceof Error ? error.message : 'Invalid URL or image failed to load'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setShowTableModal(false);
  };

  const addTableRow = () => editor.chain().focus().addRowAfter().run();
  const addTableColumn = () => editor.chain().focus().addColumnAfter().run();
  const deleteTableRow = () => editor.chain().focus().deleteRow().run();
  const deleteTableColumn = () => editor.chain().focus().deleteColumn().run();

  return (
    <div className={`safaridesk-editor-wrapper ${className}`}>
      {/* SafariDesk Editor Toolbar */}
      <div className="safaridesk-editor-toolbar">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Heading Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
              className={getDropdownButtonClasses()}
              type="button"
            >
              <span>{getCurrentHeading()}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showHeadingDropdown && (
              <div className="safaridesk-editor-dropdown">
                <button
                  onClick={() => {
                    editor.chain().focus().setParagraph().run();
                    setShowHeadingDropdown(false);
                  }}
                >
                  Normal
                </button>
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
                      setShowHeadingDropdown(false);
                    }}
                  >
                    Heading {level}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={getButtonClasses(editor.isActive('bold'))}
              title="Bold (Ctrl+B)"
              type="button"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={getButtonClasses(editor.isActive('italic'))}
              title="Italic (Ctrl+I)"
              type="button"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={getButtonClasses(editor.isActive('underline'))}
              title="Underline (Ctrl+U)"
              type="button"
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={getButtonClasses(editor.isActive('strike'))}
              title="Strikethrough"
              type="button"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Text Alignment */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={getButtonClasses(editor.isActive({ textAlign: 'left' }))}
              title="Align Left"
              type="button"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={getButtonClasses(editor.isActive({ textAlign: 'center' }))}
              title="Align Center"
              type="button"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={getButtonClasses(editor.isActive({ textAlign: 'right' }))}
              title="Align Right"
              type="button"
            >
              <AlignRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className={getButtonClasses(editor.isActive({ textAlign: 'justify' }))}
              title="Justify"
              type="button"
            >
              <AlignJustify className="h-4 w-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Lists and Quotes */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={getButtonClasses(editor.isActive('bulletList'))}
              title="Bullet List"
              type="button"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={getButtonClasses(editor.isActive('orderedList'))}
              title="Numbered List"
              type="button"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={getButtonClasses(editor.isActive('blockquote'))}
              title="Quote"
              type="button"
            >
              <Quote className="h-4 w-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Code and Media */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={getButtonClasses(editor.isActive('code'))}
              title="Inline Code"
              type="button"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={getButtonClasses(editor.isActive('codeBlock'))}
              title="Code Block"
              type="button"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              onClick={addImage}
              className={getButtonClasses()}
              title="Insert Image"
              type="button"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              onClick={addLink}
              className={getButtonClasses(editor.isActive('link'))}
              title="Insert Link"
              type="button"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowTableModal(true)}
              className={getButtonClasses()}
              title="Insert Table"
              type="button"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Table Controls (show when in table) */}
          {editor.isActive('table') && (
            <>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-1">
                <button
                  onClick={addTableRow}
                  className={getButtonClasses()}
                  title="Add Row"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={addTableColumn}
                  className={getButtonClasses()}
                  title="Add Column"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={deleteTableRow}
                  className={getButtonClasses()}
                  title="Delete Row"
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={deleteTableColumn}
                  className={getButtonClasses()}
                  title="Delete Column"
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          <div className="h-6 w-px bg-border" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              className={`${getButtonClasses()} disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Undo (Ctrl+Z)"
              type="button"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              className={`${getButtonClasses()} disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Redo (Ctrl+Y)"
              type="button"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Size Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="safaridesk-editor-table-modal w-80 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Insert Table</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Rows: {tableRows}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Columns: {tableCols}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={insertTable}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
                  type="button"
                >
                  Insert Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="safaridesk-editor-table-modal w-96 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Insert Image</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-muted-foreground hover:text-foreground"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Tab-like interface */}
              <div className="border-b border-border">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setImageUploadMode('file')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      imageUploadMode === 'file'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                    type="button"
                  >
                    Upload File
                  </button>
                  <button
                    onClick={() => setImageUploadMode('url')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      imageUploadMode === 'url'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                    type="button"
                  >
                    From URL
                  </button>
                </nav>
              </div>

              {/* File Upload Tab */}
              {imageUploadMode === 'file' && (
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
                  ) : (
                    <ImageIcon className={`h-12 w-12 mx-auto mb-4 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  )}
                  
                  <p className="text-muted-foreground mb-4">
                    {uploadingImage ? 'Uploading image...' : dragActive ? 'Drop image here' : 'Click to upload or drag and drop'}
                  </p>
                  
                  <button
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploadingImage}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium disabled:opacity-50"
                    type="button"
                  >
                    <Upload className="h-4 w-4 mr-2 inline" />
                    Choose File
                  </button>
                </div>
              )}

              {/* URL Input Tab */}
              {imageUploadMode === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Alt Text (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Image description"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Image Preview */}
                  {imageUrl && (
                    <div className="mt-4">
                      <img
                        src={imageUrl}
                        alt={imageAlt || 'Preview'}
                        className="max-w-full h-48 object-contain rounded-lg border border-border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      onClick={() => {
                        setShowImageModal(false);
                        setImageUrl('');
                        setImageAlt('');
                      }}
                      className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium"
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUrlImageInsert}
                      disabled={!imageUrl.trim() || uploadingImage}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium disabled:opacity-50"
                      type="button"
                    >
                      {uploadingImage ? 'Inserting...' : 'Insert Image'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="min-h-[400px]" style={{ background: 'transparent' }}>
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      {editor && (
        <div className="safaridesk-editor-status flex justify-between items-center">
          <div className="flex gap-6">
            <span>Words: {editor.storage.characterCount?.words() || 0}</span>
            <span>Characters: {editor.storage.characterCount?.characters() || 0}</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-green-600 font-medium">SafariDesk Editor Ready</span>
          </div>
        </div>
      )}

      {/* Click outside handler for dropdown */}
      {showHeadingDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowHeadingDropdown(false)}
        />
      )}
    </div>
  );
};

export default SafariDeskEditor;
