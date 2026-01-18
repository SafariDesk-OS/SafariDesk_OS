import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, ChevronDown, Mail, MessageSquare } from 'lucide-react';
import { SimpleRichEditor } from '../editor/SimpleRichEditor';
import { ActivityAuthor } from './ActivityStream';
import { EmailRecipientInput } from './EmailRecipientInput';
import http from '../../services/http';
import { APIS } from '../../services/apis';

interface User {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar_url?: string;
  role?: string;
}

interface Mailbox {
  id: number;
  email_address: string;
  provider: string;
  display_name?: string;
}

interface TicketInfo {
  id: number;
  creator_email: string;
  creator_name: string;
  source: 'email' | 'portal' | 'api' | 'phone' | 'chat' | 'web';
}

interface ActivityCommentInputProps {
  currentUser: ActivityAuthor;
  onSubmit: (content: string, isInternal: boolean, attachments?: File[]) => Promise<void>;
  onSendEmail?: (data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    content: string;
    mailboxId?: number;
    closeTicket?: boolean;
  }) => Promise<void>;
  onMarkStatus?: (status: 'pending' | 'resolved') => Promise<void>;
  ticket?: TicketInfo;
  mailboxes?: Mailbox[];
  loading?: boolean;
  isPublic?: boolean;
}

export const ActivityCommentInput: React.FC<ActivityCommentInputProps> = ({
  currentUser,
  onSubmit,
  onSendEmail,
  onMarkStatus,
  ticket,
  mailboxes = [],
  loading = false,
  isPublic: _isPublic = false,
}) => {
  // Mode: 'comment' or 'email' - default to comment, user can switch
  const [mode, setMode] = useState<'comment' | 'email'>('comment');

  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email mode state
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState<number | undefined>();
  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const [showNoteTypeDropdown, setShowNoteTypeDropdown] = useState(false);

  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [_mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, _setMentionPosition] = useState({ top: 0, left: 0 });
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);

  // Initialize email mode with ticket data
  useEffect(() => {
    if (mode === 'email' && ticket && toEmails.length === 0) {
      setToEmails([ticket.creator_email]);
      // Auto-fill greeting
      if (!content) {
        const greeting = `Hi ${ticket.creator_name?.split(' ')[0] || 'there'},\n\n`;
        setContent(greeting);
      }
    }
  }, [mode, ticket]);

  // Load users for mentions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const agentsResponse = await http.get(APIS.LIST_AGENTS);
        let users = Array.isArray(agentsResponse.data)
          ? agentsResponse.data
          : (agentsResponse.data?.data || agentsResponse.data?.results || []);
        setAvailableUsers(Array.isArray(users) ? users : []);
      } catch (error) {
        console.error('Failed to fetch users for mentions:', error);
        setAvailableUsers([]);
      }
    };
    fetchUsers();
  }, []);

  const getUserName = (user: User): string => {
    return user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email.split('@')[0] || 'User';
  };

  const handleSubmit = async (closeTicket = false, markStatus?: 'pending' | 'resolved') => {
    if (!content.trim() && attachments.length === 0) return;

    setSubmitting(true);
    try {
      if (mode === 'email' && onSendEmail) {
        await onSendEmail({
          to: toEmails,
          cc: ccEmails.length > 0 ? ccEmails : undefined,
          bcc: bccEmails.length > 0 ? bccEmails : undefined,
          content,
          mailboxId: selectedMailbox,
          closeTicket,
        });
      } else {
        await onSubmit(content, isInternal, attachments.length > 0 ? attachments : undefined);
      }

      // Mark status after submitting if requested
      if (markStatus && onMarkStatus) {
        await onMarkStatus(markStatus);
      }

      // Reset form
      setContent('');
      setAttachments([]);
      setIsInternal(false);
      if (mode === 'email') {
        setCcEmails([]);
        setBccEmails([]);
        setShowCc(false);
        setShowBcc(false);
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setSubmitting(false);
      setShowSendDropdown(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(newContent);

    // Check for @ mentions
    const textBeforeCursor = newContent.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      const charBeforeAt = lastAtSymbol > 0 ? textBeforeCursor[lastAtSymbol - 1] : ' ';
      const isValidContext = /\s/.test(charBeforeAt) || lastAtSymbol === 0;

      if (isValidContext && !textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionSearch(textAfterAt);
        setMentionStartPos(lastAtSymbol);
        setShowMentions(true);

        const filtered = availableUsers.filter(user => {
          const userName = getUserName(user);
          const searchLower = textAfterAt.toLowerCase();
          return userName.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower);
        }).slice(0, 5);

        setFilteredUsers(filtered);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const selectMention = (user: User) => {
    const beforeMention = content.substring(0, mentionStartPos);
    const afterCursor = content.substring(textareaRef.current?.selectionStart || content.length);
    const userName = getUserName(user);
    const mention = `@${userName} `;

    const newContent = beforeMention + mention + afterCursor;
    setContent(newContent);
    setShowMentions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + mention.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev < filteredUsers.length - 1 ? prev + 1 : 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : filteredUsers.length - 1);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(filteredUsers[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
      return;
    }

    // Ctrl+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (content.trim() || attachments.length > 0) {
        handleSubmit();
      }
    }
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const linkUrl = prompt('Enter URL:', 'https://');
    if (!linkUrl) return;

    const linkText = selectedText || 'link text';
    const markdownLink = `[${linkText}](${linkUrl})`;

    const newContent = content.substring(0, start) + markdownLink + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + markdownLink.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Formatting helper: wrap selected text or insert at cursor
  const wrapSelection = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const wrapped = `${prefix}${selectedText || 'text'}${suffix || prefix}`;

    const newContent = content.substring(0, start) + wrapped + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
      } else {
        const cursorPos = start + prefix.length;
        textarea.setSelectionRange(cursorPos, cursorPos + 4);
      }
    }, 0);
  };

  // Insert at line start (for lists, quotes)
  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const _canSendEmail = mode === 'email' && toEmails.length > 0 && onSendEmail;

  return (
    <div className="relative">
      {/* Avatar */}
      <div className="absolute -left-8 top-3 transform -translate-x-1/2">
        <img
          className="size-8 rounded-full ring-2 ring-white dark:ring-gray-900"
          src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=06A561&color=fff`}
          alt="Current user's avatar"
        />
      </div>

      {/* Input Card - Subtle background differentiation */}
      <div className={`rounded-lg shadow-sm border ${mode === 'comment' && isInternal
        ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50'  // Yellow tint for private notes
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'    // Clean white/dark for normal
        }`}>

        {/* Mode Toggle (show if email sending is available) */}
        {ticket && onSendEmail && (
          <div className="flex gap-2 px-4 pt-3">
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-full transition-colors ${mode === 'email'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <Mail size={14} />
              Reply
            </button>
            <button
              type="button"
              onClick={() => setMode('comment')}
              className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-full transition-colors ${mode === 'comment'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <MessageSquare size={14} />
              Note
            </button>
          </div>
        )}

        {/* Email Fields (only in email mode) */}
        {mode === 'email' && (
          <div className="px-4 pt-2 space-y-0 border-b border-gray-100 dark:border-gray-700/50">
            {/* From */}
            {mailboxes.length > 0 && (
              <div className="flex items-center gap-2 py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-12">From:</span>
                <select
                  value={selectedMailbox || ''}
                  onChange={(e) => setSelectedMailbox(e.target.value ? Number(e.target.value) : undefined)}
                  className="flex-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none rounded px-2 py-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Default mailbox</option>
                  {mailboxes.map((mb) => (
                    <option key={mb.id} value={mb.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {mb.display_name || mb.email_address}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* To */}
            <div className="flex items-center">
              <div className="flex-1">
                <EmailRecipientInput
                  label="To"
                  emails={toEmails}
                  onChange={setToEmails}
                  placeholder="recipient@example.com"
                  disabled={submitting}
                />
              </div>
              <div className="flex gap-2 text-sm">
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowBcc(true)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Bcc
                  </button>
                )}
              </div>
            </div>

            {/* CC */}
            {showCc && (
              <EmailRecipientInput
                label="Cc"
                emails={ccEmails}
                onChange={setCcEmails}
                disabled={submitting}
              />
            )}

            {/* BCC */}
            {showBcc && (
              <EmailRecipientInput
                label="Bcc"
                emails={bccEmails}
                onChange={setBccEmails}
                disabled={submitting}
              />
            )}
          </div>
        )}

        {/* Content Area - Rich Text Editor */}
        <div className="px-4 py-2">
          <SimpleRichEditor
            content={content}
            onChange={setContent}
            placeholder={mode === 'email' ? 'Write your reply...' : 'Add a comment...'}
            disabled={submitting || loading}
            onAttachmentClick={() => fileInputRef.current?.click()}
            showAttachment={true}
          />
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={submitting || loading}
          />

          {/* Mention Autocomplete */}
          {showMentions && filteredUsers.length > 0 && (
            <div
              className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              style={{ top: `${mentionPosition.top + 40}px`, left: '20px', minWidth: '250px' }}
            >
              {filteredUsers.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${index === selectedMentionIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                    }`}
                  onClick={() => selectMention(user)}
                  onMouseEnter={() => setSelectedMentionIndex(index)}
                >
                  <img
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName(user))}&background=06A561&color=fff&size=32`}
                    alt={getUserName(user)}
                    className="size-6 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{getUserName(user)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Paperclip size={12} />
                <span>{file.name}</span>
                <button onClick={() => setAttachments(attachments.filter((_, i) => i !== index))} className="text-gray-400 hover:text-red-500">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end items-center px-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-100 dark:border-gray-700/50">

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Note Type Dropdown (for comment mode) */}
            {mode === 'comment' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNoteTypeDropdown(!showNoteTypeDropdown)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${isInternal
                    ? 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  disabled={submitting || loading}
                >
                  {isInternal ? '🔒 Private' : '🌐 Public'}
                  <ChevronDown size={14} />
                </button>
                {showNoteTypeDropdown && (
                  <div className="absolute bottom-full mb-1 right-0 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700">
                      Mark note as
                    </div>
                    <button
                      type="button"
                      onClick={() => { setIsInternal(false); setShowNoteTypeDropdown(false); }}
                      className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between ${!isInternal ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      <span>🌐 <strong>Public</strong> <span className="text-gray-400 text-xs ml-1">Visible to contact</span></span>
                      {!isInternal && <span>✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsInternal(true); setShowNoteTypeDropdown(false); }}
                      className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between ${isInternal ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      <span>🔒 <strong>Private</strong> <span className="text-gray-400 text-xs ml-1">Internal only</span></span>
                      {isInternal && <span>✓</span>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Send Button with Dropdown */}
            <div className="relative">
              <div className="flex">
                <button
                  onClick={() => handleSubmit(false)}
                  className={`flex items-center justify-center h-9 px-4 bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed ${onMarkStatus ? 'rounded-l-lg' : 'rounded-lg'}`}
                  disabled={(!content.trim() && attachments.length === 0) || (mode === 'email' && toEmails.length === 0) || submitting || loading}
                >
                  {submitting ? 'Sending...' : (mode === 'email' ? 'Send' : 'Comment')}
                </button>
                {/* Show dropdown arrow if onMarkStatus is provided or email mode */}
                {(onMarkStatus || mode === 'email') && (
                  <button
                    type="button"
                    onClick={() => setShowSendDropdown(!showSendDropdown)}
                    className="flex items-center justify-center rounded-r-lg h-9 px-2 bg-green-700 text-white hover:bg-green-800 border-l border-green-600"
                    disabled={submitting || loading}
                  >
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showSendDropdown && (
                <div className="absolute left-0 top-full mt-1 min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                  {mode === 'email' && (
                    <button
                      type="button"
                      onClick={() => handleSubmit(true)}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                    >
                      Send & <span className="font-semibold">Close Ticket</span>
                    </button>
                  )}
                  {onMarkStatus && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSubmit(false, 'pending')}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                      >
                        {mode === 'email' ? 'Send' : 'Comment'} & <span className="font-semibold">Mark Pending</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmit(false, 'resolved')}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                      >
                        {mode === 'email' ? 'Send' : 'Comment'} & <span className="font-semibold">Mark Resolved</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
