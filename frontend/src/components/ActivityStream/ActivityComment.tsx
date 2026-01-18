import React, { useState, useEffect } from 'react';
import { Edit, MoreHorizontal, FileText, File, FileCode, FileArchive, FileSpreadsheet, Info, ChevronRight } from 'lucide-react';
import { ActivityCommentData, ActivityAuthor } from './ActivityStream';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../editor/safaridesk-editor.css'; // Import SafariDesk editor styles

// Helper function to detect if URL is an image
const isImageUrl = (url: string): boolean => {
  return /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(url);
};

// Helper function to detect base64 images
const isBase64Image = (text: string): boolean => {
  return /^data:image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64,/.test(text);
};

// Helper to detect if content is HTML
const isHTMLContent = (text: string): boolean => {
  return /<\/?[a-z][\s\S]*>/i.test(text);
};

// Custom component for rendering content with images and clickable links
const ContentRenderer: React.FC<{ content: string }> = ({ content }) => {
  // Check if content is HTML (from SafariDesk editor)
  if (isHTMLContent(content)) {
    // Render HTML content with SafariDesk editor styles to match exact rendering
    // Wrap in a container with max-width and overflow handling
    return (
      <div
        className="text-sm max-w-3xl overflow-x-auto whitespace-normal break-words activity-content-renderer [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_blockquote]:my-1 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: content }}
        style={{
          maxWidth: '100%',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
        }}
      />
    );
  }

  // For non-HTML content, process as markdown/text
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check if line is a standalone image URL or base64 image
    if ((isImageUrl(trimmed) && trimmed.startsWith('http')) || isBase64Image(trimmed)) {
      elements.push(
        <div key={`img-${index}`} className="my-3">
          <img
            src={trimmed}
            alt="Pasted image"
            className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
            style={{ maxHeight: '500px' }}
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    } else {
      // Process line to handle @mentions before passing to ReactMarkdown
      const processedLine = line.replace(/@(\w+(?:\s+\w+)*)/g, (_, username) => {
        // Return just the username without @ for cleaner display
        return username;
      });

      // Use ReactMarkdown for other content
      elements.push(
        <div key={`text-${index}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Make links open in new tab and be styled
              a: ({ ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
                />
              ),
            }}
          >
            {processedLine}
          </ReactMarkdown>
        </div>
      );
    }
  });

  return <>{elements}</>;
};

interface ActivityCommentProps {
  comment: ActivityCommentData;
  currentUser: ActivityAuthor;
  onEdit?: (commentId: number, content: string) => Promise<void>;
  onDelete?: (commentId: number) => Promise<void>;
  defaultCollapsed?: boolean;
}

export const ActivityComment: React.FC<ActivityCommentProps> = ({
  comment,
  currentUser,
  onEdit,
  onDelete,
  defaultCollapsed = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Sync with parent's collapse all/expand all
  useEffect(() => {
    setIsCollapsed(defaultCollapsed);
  }, [defaultCollapsed]);

  const isOwner = currentUser.id === comment.author.id;

  const handleSaveEdit = async () => {
    if (onEdit) {
      await onEdit(comment.id, editContent);
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete && window.confirm('Are you sure you want to delete this comment?')) {
      await onDelete(comment.id);
    }
    setShowMenu(false);
  };

  // Generate a preview for collapsed state
  const getContentPreview = (): string => {
    const content = comment.content || '';
    const hasAttachments = comment.attachments && comment.attachments.length > 0;

    // Strip HTML tags and get plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const cleanText = textContent.trim().replace(/\s+/g, ' ');

    // If there's meaningful text, show preview
    if (cleanText.length > 10) {
      return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText;
    }

    // If only attachments, show attachment indicator
    if (hasAttachments) {
      const count = comment.attachments!.length;
      return `📎 ${count} Attachment${count > 1 ? 's' : ''}`;
    }

    return cleanText || 'No content';
  };


  return (
    <div className="relative mb-6">
      {/* Avatar */}
      <div className="absolute -left-8 top-3 transform -translate-x-1/2">
        <img
          className="size-8 rounded-full ring-2 ring-white dark:ring-gray-900"
          src={comment.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&background=06A561&color=fff`}
          alt={`Avatar of ${comment.author.name}`}
        />
      </div>

      {/* Comment Card - GitHub-like styling */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
          <div className="flex items-center gap-2 text-sm">
            {/* Collapse/Expand Chevron */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-0.5 -ml-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <ChevronRight
                size={16}
                className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
              />
            </button>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{comment.author.name}</span>
            <span className="text-gray-500 dark:text-gray-400">replied</span>
          </div>
          <div className="flex items-center gap-2">
            {comment.is_internal && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-600 text-xs font-medium">
                Internal
              </span>
            )}
            {comment.is_solution && (
              <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-600 text-xs font-medium">
                Solution
              </span>
            )}
            <span className="text-gray-400 dark:text-gray-500 text-xs italic">
              {format(new Date(comment.created_at), 'EEE, d MMM yyyy \'at\' h:mm a')}
            </span>
          </div>
        </div>

        {/* Collapsed Preview - Show snippet when collapsed */}
        {isCollapsed && (() => {
          const preview = getContentPreview();
          const isAttachment = preview.startsWith('📎');
          return (
            <div
              className={`px-4 py-2 text-sm text-gray-500 dark:text-gray-400 truncate cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-b-lg ${isAttachment ? 'font-semibold' : ''}`}
              onClick={() => setIsCollapsed(false)}
            >
              {preview}
            </div>
          );
        })()}

        {/* Collapsible Content - hidden when collapsed */}
        {!isCollapsed && (
          <>
            {/* Email Recipients - Compact view with info tooltip */}
            {(comment.email_to?.length || comment.email_cc?.length || comment.email_bcc?.length) && (
              <div className="px-4 py-1.5 bg-gray-50/50 dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-700/50 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-500 dark:text-gray-500">To:</span>
                  <span className="truncate max-w-xs">
                    {comment.email_to && comment.email_to.length > 0
                      ? comment.email_to[0] + (comment.email_to.length > 1 ? ` +${comment.email_to.length - 1}` : '')
                      : '—'}
                  </span>
                  {/* Info icon with tooltip */}
                  <div className="relative group">
                    <button className="p-0.5 rounded-full transition-colors">
                      <Info size={14} className="fill-green-500 stroke-white dark:stroke-gray-900" />
                    </button>
                    {/* Tooltip on hover - positioned to the right of icon */}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-1.5 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 ease-in-out">
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-2.5 text-[11px] whitespace-nowrap">
                        {/* To */}
                        {comment.email_to && comment.email_to.length > 0 && (
                          <div className="flex gap-2 mb-1">
                            <span className="font-medium text-gray-500 dark:text-gray-400 w-8 flex-shrink-0">To:</span>
                            <span className="text-gray-700 dark:text-gray-300">{comment.email_to.join(', ')}</span>
                          </div>
                        )}
                        {/* Cc */}
                        {comment.email_cc && comment.email_cc.length > 0 && (
                          <div className="flex gap-2 mb-1">
                            <span className="font-medium text-gray-500 dark:text-gray-400 w-8 flex-shrink-0">Cc:</span>
                            <span className="text-gray-700 dark:text-gray-300">{comment.email_cc.join(', ')}</span>
                          </div>
                        )}
                        {/* Bcc */}
                        {comment.email_bcc && comment.email_bcc.length > 0 && (
                          <div className="flex gap-2">
                            <span className="font-medium text-gray-500 dark:text-gray-400 w-8 flex-shrink-0">Bcc:</span>
                            <span className="text-gray-700 dark:text-gray-300">{comment.email_bcc.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isOwner && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 relative">
                <button
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit size={16} />
                </button>
                <button
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreHorizontal size={16} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="px-4 py-3 overflow-x-auto max-w-full">
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full min-h-[100px] p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(comment.content);
                      }}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-900 dark:text-gray-100 text-sm prose prose-sm dark:prose-invert max-w-3xl prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-headings:text-base prose-headings:font-semibold prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline hover:prose-a:text-blue-800 dark:hover:prose-a:text-blue-300">
                  <ContentRenderer content={comment.content} />
                </div>
              )}

              {/* Attachments */}
              {comment.attachments && comment.attachments.length > 0 && (() => {
                // Filter out images that are already embedded in the content
                const isImageInContent = (url: string) => {
                  return comment.content && comment.content.includes(url);
                };

                const imageAttachments = comment.attachments.filter(
                  att => isImageUrl(att.file_url) && !isImageInContent(att.file_url)
                );
                const otherAttachments = comment.attachments.filter(att => !isImageUrl(att.file_url));

                if (imageAttachments.length === 0 && otherAttachments.length === 0) {
                  return null;
                }

                return (
                  <div className="mt-3 space-y-2">
                    {/* Images (only those NOT already inline in content) */}
                    {imageAttachments.map((attachment) => {
                      // Use original filename if available, otherwise extract from URL
                      const filename = attachment.filename || attachment.file_url.split('/').pop() || 'image';
                      const decodedFilename = decodeURIComponent(filename);

                      return (
                        <div key={`img-${attachment.id}`} className="my-3">
                          <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={attachment.file_url}
                              alt={decodedFilename}
                              className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              style={{ maxHeight: '400px' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </a>
                        </div>
                      );
                    })}

                    {/* Other files (PDFs, documents, etc.) - Card Interface */}
                    {otherAttachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {otherAttachments.map((attachment) => {
                          // Use original filename if available, otherwise extract from URL
                          const filename = attachment.filename || attachment.file_url.split('/').pop() || attachment.file_url.split('?')[0].split('/').pop() || 'attachment';
                          const decodedFilename = decodeURIComponent(filename);
                          const ext = filename.split('.').pop()?.toLowerCase() || '';

                          // File type styling with colors
                          const getFileTypeInfo = (extension: string) => {
                            switch (extension) {
                              case 'pdf':
                                return { Icon: FileText, color: 'from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10', borderColor: 'border-red-200 dark:border-red-800', badgeColor: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', iconColor: 'text-red-600 dark:text-red-400', label: 'PDF Document' };
                              case 'doc':
                              case 'docx':
                                return { Icon: FileText, color: 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10', borderColor: 'border-blue-200 dark:border-blue-800', badgeColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', iconColor: 'text-blue-600 dark:text-blue-400', label: 'Word Document' };
                              case 'xls':
                              case 'xlsx':
                                return { Icon: FileSpreadsheet, color: 'from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10', borderColor: 'border-green-200 dark:border-green-800', badgeColor: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', iconColor: 'text-green-600 dark:text-green-400', label: 'Excel Spreadsheet' };
                              case 'zip':
                              case 'rar':
                              case '7z':
                                return { Icon: FileArchive, color: 'from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-900/10', borderColor: 'border-yellow-200 dark:border-yellow-800', badgeColor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', iconColor: 'text-yellow-600 dark:text-yellow-400', label: 'Archive File' };
                              case 'txt':
                                return { Icon: FileCode, color: 'from-gray-50 to-gray-100/50 dark:from-gray-800/20 dark:to-gray-800/10', borderColor: 'border-gray-200 dark:border-gray-700', badgeColor: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300', iconColor: 'text-gray-600 dark:text-gray-400', label: 'Text File' };
                              case 'ppt':
                              case 'pptx':
                                return { Icon: FileText, color: 'from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10', borderColor: 'border-purple-200 dark:border-purple-800', badgeColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', iconColor: 'text-purple-600 dark:text-purple-400', label: 'PowerPoint Presentation' };
                              case 'csv':
                                return { Icon: FileCode, color: 'from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-900/10', borderColor: 'border-indigo-200 dark:border-indigo-800', badgeColor: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300', iconColor: 'text-indigo-600 dark:text-indigo-400', label: 'CSV File' };
                              default:
                                return { Icon: File, color: 'from-slate-50 to-slate-100/50 dark:from-slate-800/20 dark:to-slate-800/10', borderColor: 'border-slate-200 dark:border-slate-700', badgeColor: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300', iconColor: 'text-slate-600 dark:text-slate-400', label: 'File' };
                            }
                          };

                          const fileInfo = getFileTypeInfo(ext);

                          return (
                            <a
                              key={attachment.id}
                              href={attachment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block bg-gradient-to-br ${fileInfo.color} border ${fileInfo.borderColor} rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02] group`}
                              title={`Download ${decodedFilename}`}
                            >
                              <div className="flex items-start gap-3">
                                {/* File Icon */}
                                <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                                  <fileInfo.Icon className={`w-8 h-8 ${fileInfo.iconColor}`} />
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                      {decodedFilename}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${fileInfo.badgeColor}`}>
                                      {ext.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {fileInfo.label}
                                    </span>
                                  </div>

                                  <p className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                    Click to download or open in new tab
                                  </p>
                                </div>

                                {/* Download indicator */}
                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
                                    <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          className="size-6 rounded-full"
                          src={reply.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.author.name)}&background=06A561&color=fff`}
                          alt={reply.author.name}
                        />
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{reply.author.name}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs italic">
                          {format(new Date(reply.created_at), 'EEE, d MMM yyyy \'at\' h:mm a')}
                        </p>
                      </div>
                      <div className="text-gray-800 dark:text-gray-200 ml-8 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-a:text-blue-600 dark:prose-a:text-blue-400">
                        <ContentRenderer content={reply.content} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
