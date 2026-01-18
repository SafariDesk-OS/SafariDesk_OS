import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Quote,
    Code,
    Link as LinkIcon,
    Paperclip,
    ImageIcon
} from 'lucide-react';

interface SimpleRichEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    disabled?: boolean;
    onAttachmentClick?: () => void;
    showAttachment?: boolean;
    onImagePaste?: (file: File) => Promise<string | null>; // Returns URL after upload, or null to use base64
}

/**
 * Lightweight TipTap WYSIWYG editor for activity stream comments/replies.
 * Supports: Bold, Italic, Underline, Bullet List, Numbered List, Quote, Code, Link, Image Paste
 */
export const SimpleRichEditor: React.FC<SimpleRichEditorProps> = ({
    content,
    onChange,
    placeholder = 'Write your reply...',
    disabled = false,
    onAttachmentClick,
    showAttachment = true,
    onImagePaste,
}) => {
    // Convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false, // No headings for simple editor
                codeBlock: false, // Just inline code
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 dark:text-blue-400 underline',
                    rel: 'noopener noreferrer',
                    target: '_blank',
                },
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-md my-2',
                },
            }),
        ],
        content,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'focus:outline-none text-sm text-gray-900 dark:text-gray-100 [&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0 [&_ul]:pl-5 [&_ol]:pl-5 [&_blockquote]:m-0 [&_blockquote]:pl-3 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300',
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items;
                if (!items) return false;

                for (const item of Array.from(items)) {
                    if (item.type.startsWith('image/')) {
                        event.preventDefault();
                        const file = item.getAsFile();
                        if (!file) continue;

                        // Handle image paste
                        (async () => {
                            let imageUrl: string | null = null;

                            // If parent provides upload handler, use it
                            if (onImagePaste) {
                                imageUrl = await onImagePaste(file);
                            }

                            // Fallback to base64 if no URL returned
                            if (!imageUrl) {
                                imageUrl = await fileToBase64(file);
                            }

                            // Insert image into editor
                            view.dispatch(
                                view.state.tr.replaceSelectionWith(
                                    view.state.schema.nodes.image.create({ src: imageUrl })
                                )
                            );
                        })();

                        return true;
                    }
                }
                return false;
            },
        },
    });

    // Sync content from parent
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    // Update editable state
    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [disabled, editor]);

    if (!editor) {
        return <div className="h-6 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />;
    }

    const addLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Enter URL:', previousUrl || 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const buttonClass = (isActive = false) =>
        `p-1.5 rounded transition-colors ${isActive
            ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div>
            {/* Editor Content - override global min-height, remove focus outline */}
            <EditorContent
                editor={editor}
                className="simple-rich-editor [&_.ProseMirror]:!min-h-[60px] [&_.ProseMirror]:!p-0 [&_.ProseMirror]:!outline-none [&_.ProseMirror:focus-visible]:!outline-none"
            />

            {/* Toolbar - thin line separator */}
            <div className="flex items-center gap-0.5 px-1 py-1.5 border-t border-gray-200 dark:border-gray-700">
                {/* Text Formatting */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={buttonClass(editor.isActive('bold'))}
                    title="Bold"
                    disabled={disabled}
                >
                    <Bold size={15} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={buttonClass(editor.isActive('italic'))}
                    title="Italic"
                    disabled={disabled}
                >
                    <Italic size={15} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={buttonClass(editor.isActive('underline'))}
                    title="Underline"
                    disabled={disabled}
                >
                    <UnderlineIcon size={15} />
                </button>

                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Lists */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={buttonClass(editor.isActive('bulletList'))}
                    title="Bullet List"
                    disabled={disabled}
                >
                    <List size={15} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={buttonClass(editor.isActive('orderedList'))}
                    title="Numbered List"
                    disabled={disabled}
                >
                    <ListOrdered size={15} />
                </button>

                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Block Elements */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={buttonClass(editor.isActive('blockquote'))}
                    title="Quote"
                    disabled={disabled}
                >
                    <Quote size={15} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={buttonClass(editor.isActive('code'))}
                    title="Inline Code"
                    disabled={disabled}
                >
                    <Code size={15} />
                </button>

                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Link */}
                <button
                    type="button"
                    onClick={addLink}
                    className={buttonClass(editor.isActive('link'))}
                    title="Add Link"
                    disabled={disabled}
                >
                    <LinkIcon size={15} />
                </button>

                {/* Attachment */}
                {showAttachment && onAttachmentClick && (
                    <button
                        type="button"
                        onClick={onAttachmentClick}
                        className={buttonClass()}
                        title="Attach File"
                        disabled={disabled}
                    >
                        <Paperclip size={15} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SimpleRichEditor;
