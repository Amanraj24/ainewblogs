import React, { useEffect, useState, useRef } from 'react';
import { generateFullPost, generateCoverImage, generateSVGImage } from '@/app/actions/gemini';
import { BlogPost } from '../types';
import Button from './Button';
import { Check, Copy, RefreshCw, ArrowLeft, Tag, Clock, Calendar, Sparkles, Upload, Wand2, Image as ImageIcon, CalendarClock, Globe, HelpCircle, TrendingUp } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import dynamic from 'next/dynamic';
import "@/styles/lexical.css";

// Lexical Imports
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, $convertToMarkdownString } from "@lexical/markdown";
import { $getRoot, $getSelection, SELECTION_CHANGE_COMMAND, FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from "lexical";
import { Bold, Italic, Underline, List, ListOrdered, Quote as QuoteIcon, Undo, Redo, Heading1, Heading2, Link as LinkIcon } from 'lucide-react';

const theme = {
  ltr: "ltr",
  rtl: "rtl",
  placeholder: "lexical-placeholder",
  paragraph: "lexical-paragraph",
  quote: "lexical-quote",
  heading: {
    h1: "lexical-h1",
    h2: "lexical-h2",
    h3: "lexical-h3",
  },
  list: {
    nested: {
      listitem: "lexical-nested-listitem",
    },
    ol: "lexical-ol",
    ul: "lexical-ul",
    listitem: "lexical-listitem",
  },
  image: "lexical-image",
  link: "lexical-link",
  text: {
    bold: "lexical-bold",
    italic: "lexical-italic",
    overflowed: "lexical-overflowed",
    hashtag: "lexical-hashtag",
    underline: "lexical-underline",
    strikethrough: "lexical-strikethrough",
    underlineStrikethrough: "lexical-underlineStrikethrough",
    code: "lexical-code",
  },
  code: "lexical-code",
  codeHighlight: {
    atrule: "lexical-tokenAtrule",
    attr: "lexical-tokenAttr",
    boolean: "lexical-tokenBoolean",
    builtin: "lexical-tokenBuiltin",
    cdata: "lexical-tokenCdata",
    char: "lexical-tokenChar",
    class: "lexical-tokenClass",
    "class-name": "lexical-tokenClassName",
    comment: "lexical-tokenComment",
    constant: "lexical-tokenConstant",
    deleted: "lexical-tokenDeleted",
    doctype: "lexical-tokenDoctype",
    entity: "lexical-tokenEntity",
    function: "lexical-tokenFunction",
    important: "lexical-tokenImportant",
    inserted: "lexical-tokenInserted",
    keyword: "lexical-tokenKeyword",
    namespace: "lexical-tokenNamespace",
    number: "lexical-tokenNumber",
    operator: "lexical-tokenOperator",
    prolog: "lexical-tokenProlog",
    property: "lexical-tokenProperty",
    punctuation: "lexical-tokenPunctuation",
    regex: "lexical-tokenRegex",
    selector: "lexical-tokenSelector",
    string: "lexical-tokenString",
    symbol: "lexical-tokenSymbol",
    tag: "lexical-tokenTag",
    url: "lexical-tokenUrl",
    variable: "lexical-tokenVariable",
  },
};

// Toolbar Component
const Toolbar = () => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updateToolbar = () => {
    const selection = $getSelection();
    if (selection && (selection as any).hasFormat) {
      setIsBold((selection as any).hasFormat("bold"));
      setIsItalic((selection as any).hasFormat("italic"));
      setIsUnderline((selection as any).hasFormat("underline"));
    }
  };

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      1
    );
  }, [editor]);

  return (
    <div className="lexical-toolbar">
      <button onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} className="toolbar-item" title="Undo"><Undo size={16} /></button>
      <button onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} className="toolbar-item" title="Redo"><Redo size={16} /></button>
      <div className="toolbar-divider" />
      <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")} className={`toolbar-item ${isBold ? 'active' : ''}`} title="Bold"><Bold size={16} /></button>
      <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")} className={`toolbar-item ${isItalic ? 'active' : ''}`} title="Italic"><Italic size={16} /></button>
      <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")} className={`toolbar-item ${isUnderline ? 'active' : ''}`} title="Underline"><Underline size={16} /></button>
      <div className="toolbar-divider" />
      <button onClick={() => {
        editor.update(() => {
          const selection = $getSelection();
          if (selection) {
            import("@lexical/rich-text").then(({ $createHeadingNode }) => {
              (selection as any).insertNodes([$createHeadingNode("h1")]);
            });
          }
        });
      }} className="toolbar-item" title="Heading 1"><Heading1 size={16} /></button>
      <button onClick={() => {
        editor.update(() => {
          const selection = $getSelection();
          if (selection) {
            import("@lexical/rich-text").then(({ $createHeadingNode }) => {
              (selection as any).insertNodes([$createHeadingNode("h2")]);
            });
          }
        });
      }} className="toolbar-item" title="Heading 2"><Heading2 size={16} /></button>
      <div className="toolbar-divider" />
      <button onClick={() => {
        editor.update(() => {
          const selection = $getSelection();
          if (selection) {
            import("@lexical/list").then(({ $createListNode }) => {
              (selection as any).insertNodes([$createListNode("bullet")]);
            });
          }
        });
      }} className="toolbar-item" title="Bullet List"><List size={16} /></button>
      <button onClick={() => {
        editor.update(() => {
          const selection = $getSelection();
          if (selection) {
            import("@lexical/list").then(({ $createListNode }) => {
              (selection as any).insertNodes([$createListNode("number")]);
            });
          }
        });
      }} className="toolbar-item" title="Ordered List"><ListOrdered size={16} /></button>
    </div>
  );
};

// Markdown Initializer Plugin
const MarkdownInitialValuePlugin = ({ value }: { value: string }) => {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current && value) {
      editor.update(() => {
        $convertFromMarkdownString(value, TRANSFORMERS);
      });
      hasInitialized.current = true;
    }
  }, [value, editor]);

  return null;
};

interface PostEditorProps {
  topic: string;
  tone: string;
  initialPost?: BlogPost | null;
  onPublish: (post: BlogPost) => void;
  onCancel: () => void;
  trainingContext?: string;
}

const PostEditor: React.FC<PostEditorProps> = ({ topic, tone, initialPost, onPublish, onCancel, trainingContext }) => {
  const [loading, setLoading] = useState(!initialPost);
  const [postData, setPostData] = useState<Partial<BlogPost> | null>(initialPost || null);
  const [error, setError] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(initialPost?.coverImage || null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [isSlugAutoGenerated, setIsSlugAutoGenerated] = useState(!initialPost?.slug);

  // Editing state for new fields
  const [geoTargeting, setGeoTargeting] = useState(initialPost?.geoTargeting || 'Global');
  const [seoScore, setSeoScore] = useState(initialPost?.seoScore || 85);

  // Load from local draft if available
  useEffect(() => {
    if (initialPost) {
      setPostData(initialPost);
      setCoverImage(initialPost.coverImage || null);
      setGeoTargeting(initialPost.geoTargeting || 'Global');
      setSeoScore(initialPost.seoScore || 85);
      setLoading(false);
      return;
    }

    // Check for saved draft matching this topic
    const savedDraft = localStorage.getItem('currentDraft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        // Simple check to see if the draft is for the current topic
        if (draft.topic === topic) {
          console.log("Restoring draft for topic:", topic);
          setPostData(draft.postData);
          setCoverImage(draft.coverImage);
          setGeoTargeting(draft.geoTargeting);
          setSeoScore(draft.seoScore);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }

    const fetchPost = async () => {
      try {
        setLoading(true);
        setCoverImage(`https://picsum.photos/800/400?random=${Date.now()}`);
        const data = await generateFullPost(topic, tone, trainingContext);

        // Sanitize content to remove duplicate H1 and raw JSON-LD
        let cleanContent = data.content || "";
        // Remove H1 headers (# Title)
        cleanContent = cleanContent.replace(/^#\s+.+$/gm, "");

        // TRUNCATE STRATEGY for Schema
        // If we find the start of a Schema block, cut everything after it.
        const schemaMatch = cleanContent.match(/(?:```json\s*)?\{\s*"@context"\s*:\s*"https?:\/\/schema\.org"/i);
        if (schemaMatch && schemaMatch.index !== undefined && schemaMatch.index > 50) {
          cleanContent = cleanContent.substring(0, schemaMatch.index);
        }

        // Cleanup any remaining fragments
        cleanContent = cleanContent.replace(/```json\s*\{[\s\S]*?\n\s*\}\s*```/g, ""); // Generic JSON block removal
        cleanContent = cleanContent.replace(/\{[\s\S]*?"@context"\s*:\s*"https?:\/\/schema\.org"[\s\S]*?\}/g, "");
        cleanContent = cleanContent.replace(/"@type"\s*:\s*"Question"[\s\S]*?\}/g, "");
        cleanContent = cleanContent.replace(/\[\s*\{[\s\S]*?"@type"\s*:\s*"Question"[\s\S]*?\]/g, "");
        cleanContent = cleanContent.replace(/,\s*\{[\s\S]*?"@type"\s*:\s*"Question"[\s\S]*?\}/g, ""); // Comma started fragments

        setPostData({ ...data, content: cleanContent });

        // Generate slug from title if not present
        if (!slug && data.title) {
          const generatedSlug = data.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
          setSlug(generatedSlug);
          setIsSlugAutoGenerated(true);
        }

        setGeoTargeting(data.geoTargeting || 'Global');
        setSeoScore(data.seoScore || 85);
      } catch (err) {
        setError("Failed to generate content. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [topic, tone, initialPost]);

  // Save changes to draft
  useEffect(() => {
    if (postData && !initialPost) {
      const draft = {
        topic,
        postData,
        coverImage,
        geoTargeting,
        seoScore,
        timestamp: Date.now()
      };
      localStorage.setItem('currentDraft', JSON.stringify(draft));
    }
  }, [postData, coverImage, geoTargeting, seoScore, topic, initialPost]);

  const handleGenerateImage = async () => {
    if (!topic && !postData?.title) return;
    setIsGeneratingImage(true);
    try {
      // Use SVG generation as requested
      const imageData = await generateSVGImage(topic || postData?.title || "");
      setCoverImage(imageData);
    } catch (err) {
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAddLink = () => {
    if (imageUrl) {
      setCoverImage(imageUrl);
      setShowLinkInput(false);
      setImageUrl('');
    }
  };

  const handleSavePost = (status: 'draft' | 'published' | 'scheduled' = 'published') => {
    if (!postData) return;
    const isScheduled = status === 'scheduled';

    if (isScheduled && new Date(scheduleDate) <= new Date()) {
      alert("Scheduled time must be in the future.");
      return;
    }

    const newPost: BlogPost = {
      id: initialPost?.id || Date.now().toString(),
      title: postData.title || (status === 'draft' ? "Untitled Draft" : "Untitled"),
      content: postData.content || "",
      excerpt: postData.excerpt || "",
      keywords: postData.keywords || [],
      category: postData.category || "General",
      readTime: postData.readTime || "3 min read",
      dateCreated: initialPost?.dateCreated || new Date().toLocaleString(),
      status: status,
      coverImage: coverImage || undefined,
      scheduledDate: isScheduled ? new Date(scheduleDate).toISOString() : undefined,
      geoTargeting: geoTargeting,
      aeoQuestions: postData.aeoQuestions || [],
      seoScore: seoScore,
      slug: slug || (postData.title || "untitled").toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
    };

    // Clear draft on successful publish or save, 
    // actually if we save as draft, we might want to keep working? 
    // But since it saves to DB, we can clear local storage draft.
    if (!initialPost) {
      localStorage.removeItem('currentDraft');
    }

    onPublish(newPost);
  };

  const handleCancelAndClear = () => {
    // Optional: Clear draft on cancel? Or keep it?
    // User said "never delete previous functionality until not commanded"
    // safer to keep it or maybe prompt? For now, we'll keep it so they can come back.
    // But if they switch topics, the draft check handles it.
    onCancel();
  }

  const copyToClipboard = () => {
    if (postData?.content) {
      navigator.clipboard.writeText(postData.content);
      alert("Content copied to clipboard!");
    }
  };

  const handleContentChange = (content: string) => {
    setPostData(prev => prev ? { ...prev, content } : null);
  };

  const handleTitleChange = (title: string) => {
    setPostData(prev => prev ? { ...prev, title } : null);

    // Update slug if it's still auto-generated
    if (isSlugAutoGenerated) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (newSlug: string) => {
    // Only allow URL-safe characters
    const sanitizedSlug = newSlug.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '');
    setSlug(sanitizedSlug);
    setIsSlugAutoGenerated(false); // Mark as manually edited
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative"><div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-indigo-600 animate-pulse" /></div></div>
        <div className="text-center space-y-2"><h3 className="text-xl font-medium text-gray-900">Crafting your masterpiece...</h3><p className="text-gray-500 max-w-md">Our AI is researching, writing, and optimizing your article on "{topic}". This usually takes about 10-20 seconds.</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4"><RefreshCw size={32} /></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <div className="flex space-x-4"><Button variant="secondary" onClick={handleCancelAndClear}>Go Back</Button><Button onClick={() => window.location.reload()}>Try Again</Button></div>
      </div>
    );
  }

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Set minimum to 1 minute in the future
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 sticky top-0 bg-[#f8fafc]/80 z-10 py-4 border-b border-gray-200/50 backdrop-blur-sm">
        <Button variant="ghost" onClick={handleCancelAndClear} icon={<ArrowLeft size={18} />}>Back</Button>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={copyToClipboard} icon={<Copy size={18} />}>Copy Markdown</Button>
          <Button variant="secondary" onClick={() => setShowScheduler(!showScheduler)} icon={<CalendarClock size={18} />}>Schedule</Button>
          <Button variant="secondary" onClick={() => handleSavePost('draft')} icon={<Clock size={18} />} className="bg-gray-100 text-gray-700 hover:bg-gray-200">Save Draft</Button>
          <Button onClick={() => handleSavePost(scheduleDate ? 'scheduled' : 'published')} icon={<Check size={18} />}>
            {scheduleDate ? 'Schedule Update' : (initialPost?.status === 'published' ? 'Update Post' : 'Publish Now')}
          </Button>
        </div>
      </div>
      {showScheduler && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg animate-fade-in flex items-center gap-4">
          <label htmlFor="scheduleTime" className="font-medium text-indigo-800">Publish on:</label>
          <input
            id="scheduleTime"
            type="datetime-local"
            value={scheduleDate}
            onChange={e => setScheduleDate(e.target.value)}
            min={getMinDateTime()}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="relative group bg-gray-100 min-h-[16rem]">
              {coverImage ? <img src={coverImage} alt="Cover" className="w-full h-64 object-cover" /> : <div className="w-full h-64 flex items-center justify-center text-gray-400"><ImageIcon size={48} /></div>}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                <Button variant="secondary" onClick={() => setShowLinkInput(!showLinkInput)} icon={<Upload size={18} />} className="bg-white/90 hover:bg-white">Add Link</Button>
                <Button variant="primary" onClick={handleGenerateImage} isLoading={isGeneratingImage} icon={<Wand2 size={18} />} className="shadow-lg">{coverImage ? 'Regenerate AI' : 'Generate AI'}</Button>
              </div>
              {showLinkInput && (
                <div className="absolute inset-x-0 bottom-0 p-4 bg-white/95 border-t border-gray-200 flex gap-2 animate-slide-up z-20">
                  <input
                    type="text"
                    placeholder="Paste image URL here..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                    autoFocus
                  />
                  <Button onClick={handleAddLink} className="text-sm">Apply</Button>
                  <Button variant="secondary" onClick={() => setShowLinkInput(false)} className="text-sm">Cancel</Button>
                </div>
              )}
            </div>
            <div className="p-8">
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">{postData?.category}</span>
                <span className="flex items-center"><Clock size={14} className="mr-1" /> {postData?.readTime}</span>
                <span className="flex items-center"><Calendar size={14} className="mr-1" /> {new Date().toLocaleDateString()}</span>
              </div>

              {/* Editable Title */}
              <input
                type="text"
                value={postData?.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight border-b-2 border-transparent focus:border-indigo-500 focus:outline-none bg-transparent"
                placeholder="Post Title"
              />

              {/* Slug Input */}
              <div className="flex items-center gap-2 mb-6 px-1">
                <span className="text-gray-400 text-sm font-medium">Slug:</span>
                <div className="flex-1 flex items-center bg-gray-50 rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                  <span className="pl-3 text-gray-400 text-xs">/post/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="flex-1 py-1.5 px-1 bg-transparent border-none focus:outline-none text-sm text-gray-600"
                    placeholder="post-url-slug"
                  />
                  {!isSlugAutoGenerated && (
                    <button
                      onClick={() => setIsSlugAutoGenerated(true)}
                      className="pr-2 text-indigo-500 hover:text-indigo-700 text-[10px] font-bold uppercase tracking-wider"
                      title="Re-enable auto-generation from title"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Lexical Editor Content */}
              <div className="lexical-container">
                <LexicalComposer
                  initialConfig={{
                    namespace: "PostEditor",
                    theme,
                    onError: (error) => console.error(error),
                    nodes: [
                      HeadingNode,
                      ListNode,
                      ListItemNode,
                      QuoteNode,
                      CodeNode,
                      CodeHighlightNode,
                      TableNode,
                      TableCellNode,
                      TableRowNode,
                      AutoLinkNode,
                      LinkNode,
                    ],
                  }}
                >
                  <Toolbar />
                  <div className="lexical-inner">
                    <RichTextPlugin
                      contentEditable={<ContentEditable className="lexical-input" />}
                      placeholder={<div className="lexical-placeholder">Write your masterpiece...</div>}
                      ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <ListPlugin />
                    <LinkPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <MarkdownInitialValuePlugin value={postData?.content || ''} />
                    <OnChangePlugin
                      onChange={(editorState) => {
                        editorState.read(() => {
                          const markdown = $convertToMarkdownString(TRANSFORMERS);
                          handleContentChange(markdown);
                        });
                      }}
                    />
                  </div>
                </LexicalComposer>
              </div>

              {/* Preview */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Preview</h3>
                <MarkdownRenderer content={postData?.content || ''} className="text-gray-700" />

                {/* FAQ Section Preview */}
                {postData?.aeoQuestions && postData.aeoQuestions.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
                    <div className="space-y-6">
                      {postData.aeoQuestions.map((qa, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{qa.question}</h4>
                          <p className="text-gray-700 leading-relaxed">{qa.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ Schema */}
                {postData?.aeoQuestions && postData.aeoQuestions.length > 0 && (
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                      __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": postData.aeoQuestions.map(q => ({
                          "@type": "Question",
                          "name": q.question,
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": q.answer
                          }
                        }))
                      })
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AEO / SEO Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><TrendingUp className="w-5 h-5 text-indigo-600 mr-2" />Optimization Score</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">SEO Score</span>
              <span className={`text-xl font-bold ${seoScore >= 80 ? 'text-green-600' : 'text-amber-500'}`}>{seoScore}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
              <div className={`h-2.5 rounded-full ${seoScore >= 80 ? 'bg-green-600' : 'bg-amber-500'}`} style={{ width: `${seoScore}%` }}></div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Globe size={14} /> Geo-Targeting</label>
              <input
                type="text"
                value={geoTargeting}
                onChange={(e) => setGeoTargeting(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* AEO Questions */}
          {postData?.aeoQuestions && postData.aeoQuestions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><HelpCircle className="w-5 h-5 text-indigo-600 mr-2" />People Also Ask</h3>
              <div className="space-y-3">
                {postData.aeoQuestions.map((qa, idx) => (
                  <div key={idx} className="bg-indigo-50 p-3 rounded-lg">
                    <p className="font-medium text-indigo-900 text-sm mb-1">Q: {qa.question}</p>
                    <p className="text-indigo-700 text-xs">A: {qa.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Sparkles className="w-5 h-5 text-indigo-600 mr-2" />Meta Data</h3>
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Target Keywords</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {postData?.keywords?.map((keyword, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100 group">
                    <Tag size={10} className="mr-1" />
                    {keyword}
                    <button
                      onClick={() => {
                        const newKeywords = postData.keywords?.filter((_, i) => i !== idx);
                        setPostData(prev => prev ? { ...prev, keywords: newKeywords } : null);
                      }}
                      className="ml-1 text-green-500 hover:text-green-800 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add keyword"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !postData?.keywords?.includes(val)) {
                        setPostData(prev => prev ? { ...prev, keywords: [...(prev.keywords || []), val] } : null);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  className="text-xs px-2 py-1 h-auto"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    const val = input.value.trim();
                    if (val && !postData?.keywords?.includes(val)) {
                      setPostData(prev => prev ? { ...prev, keywords: [...(prev.keywords || []), val] } : null);
                      input.value = '';
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Meta Description (Excerpt)</h4>
              <textarea
                value={postData?.excerpt}
                onChange={(e) => setPostData(prev => prev ? { ...prev, excerpt: e.target.value } : null)}
                className="w-full p-2 text-sm text-gray-600 leading-relaxed border border-gray-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;