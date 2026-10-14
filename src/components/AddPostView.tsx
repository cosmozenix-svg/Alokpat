import React, { useState, useRef } from 'react';
import {
  Image,
  Tag,
  Lock,
  X,
  Plus,
  Upload,
  Layers,
  AlertCircle,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { compressImage } from '../utils/imageCompressor';

export const AddPostView: React.FC = () => {
  const { currentUser, createPost, setActiveTab, setIsAuthModalOpen, setAuthMode } = useApp();

  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Optional Link feature with URL and Button Label
  const [enableLink, setEnableLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkButtonText, setLinkButtonText] = useState('');

  // YouTube-style keyword tag system
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  // Post settings
  const [hideComments, setHideComments] = useState(false);
  const [isAIPost, setIsAIPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) {
    return (
      <div className="pb-24 pt-8 text-center">
        <div className="text-box empty-state-box bg-white dark:bg-neutral-700/80 rounded-2xl p-6 border border-neutral-200 dark:border-white/30 space-y-3 max-w-sm mx-auto shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Plus size={22} />
          </div>
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
            Sign in to publish a post
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-200">
            You need an account to publish text, photos, and keyword tags on Alokpat.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setAuthMode('register');
                setIsAuthModalOpen(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs transition-colors"
            >
              Create Account
            </button>
            <button
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg text-xs transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Keyword tag handler: converts comma or Enter to tags
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const parts = val.split(',');
      const newTags: string[] = [];
      parts.forEach(p => {
        const clean = p.trim().toLowerCase();
        if (clean && !keywords.includes(clean)) {
          newTags.push(clean);
        }
      });
      setKeywords(prev => [...prev, ...newTags]);
      setKeywordInput('');
    } else {
      setKeywordInput(val);
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const clean = keywordInput.trim().toLowerCase();
      if (clean && !keywords.includes(clean)) {
        setKeywords(prev => [...prev, clean]);
        setKeywordInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setKeywords(prev => prev.filter(t => t !== tagToRemove));
  };

  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Image Upload handler (File & Base64 with compression)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImage(true);
    try {
      const compressedList = await Promise.all(
        Array.from(files).map(file => compressImage(file, 1080, 1080, 0.75))
      );
      setImages(prev => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Failed to process image', err);
    } finally {
      setIsProcessingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);
    if (!caption.trim() && images.length === 0) {
      setPostError('Please enter some text or add a photo before publishing.');
      return;
    }

    if (enableLink) {
      if (!linkUrl.trim()) {
        setPostError('Please enter a link in the "Paste link" box, or turn off the Link option.');
        return;
      }
    }

    let finalKeywords = [...keywords];
    if (keywordInput.trim() && !finalKeywords.includes(keywordInput.trim().toLowerCase())) {
      finalKeywords.push(keywordInput.trim().toLowerCase());
    }

    createPost({
      caption,
      images,
      keywords: finalKeywords,
      hideComments,
      isAIPost,
      linkUrl: enableLink ? linkUrl.trim() : undefined,
      linkButtonText: enableLink ? (linkButtonText.trim() || 'Visit Website') : undefined,
    });

    // Reset and go to feed
    setCaption('');
    setImages([]);
    setKeywords([]);
    setEnableLink(false);
    setLinkUrl('');
    setLinkButtonText('');
    setActiveTab('home');
  };

  return (
    <div className="pb-24 pt-2">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 space-y-3.5">
        {postError && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
            <span>{postError}</span>
          </div>
        )}

        {/* Creator Header */}
        <div className="flex items-center gap-2.5 mb-3.5">
          <UserAvatar user={currentUser} size="md" />
          <div>
            <div className="flex items-center gap-1 font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100">
              <span>{currentUser?.name || 'Creator'}</span>
              {currentUser?.isVerified && <VerifiedBadge size="sm" user={currentUser} />}
            </div>
            <p className="text-[11px] text-neutral-400">
              @{currentUser?.username} • ID: #{currentUser?.id}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Caption Area */}
          <div>
            <textarea
              rows={4}
              placeholder="What's happening? Express thoughts or paste links..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="w-full p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-600 resize-none transition-colors"
            />
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1 px-1">
              <span>Links will be clickable automatically</span>
              <span>{caption.length} chars</span>
            </div>
          </div>

          {/* Uploaded Images Preview */}
          {images.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <Layers size={13} />
                  Images ({images.length})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center backdrop-blur-sm shadow-md active:scale-90 transition-transform cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Upload Tools - Only Device Internal Storage */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Image size={14} className="text-neutral-500" />
                Add Photos (Optional)
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-750 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-60"
              >
                <Upload size={12} />
                <span>{isProcessingImage ? 'Processing...' : 'Upload from Device Storage'}</span>
              </button>
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Photos must be uploaded only from your device's internal storage.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          {/* Optional Link Feature */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 rounded-xl space-y-3">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    enableLink
                      ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400'
                      : 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-500'
                  }`}
                >
                  <Link2 size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Link
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                      Optional
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Add a redirect button to your website, channel, or download page
                  </p>
                </div>
              </div>

              {/* Custom Switch */}
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={enableLink}
                  onChange={e => setEnableLink(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </div>
            </label>

            {enableLink && (
              <div className="pt-2 border-t border-neutral-200/70 dark:border-neutral-750 space-y-3 animate-in fade-in duration-150">
                {/* 1st Box: Paste link */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Paste link <span className="text-purple-600">*</span>
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://example.com or website URL"
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-600 shadow-2xs font-normal"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1 px-0.5">
                    1st box: Paste the website URL or destination link here.
                  </p>
                </div>

                {/* 2nd Box: Link button */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Link button <span className="text-purple-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={linkButtonText}
                    onChange={e => setLinkButtonText(e.target.value)}
                    placeholder="e.g. Download; Visit Website; Subscribe"
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-600 shadow-2xs font-normal"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1 px-0.5">
                    2nd box: Write what will appear on the button (e.g. Download, Visit Website, Subscribe).
                  </p>

                  {/* Suggestion tags for quick selection */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-neutral-400 mr-0.5">Quick presets:</span>
                    {['Visit Website', 'Download', 'Subscribe', 'Learn More', 'Watch Video', 'Join Now'].map(label => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setLinkButtonText(label)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer font-medium ${
                          linkButtonText === label
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                            : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-purple-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Button Preview */}
                {(linkUrl || linkButtonText) && (
                  <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                    <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 block mb-1.5">
                      Button preview (will appear at the very down of the post):
                    </span>
                    <div className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs">
                      <span>{linkButtonText.trim() || 'Visit Website'}</span>
                      <ExternalLink size={13} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* YouTube-Style Keyword & Tag System */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Tag size={13} className="text-neutral-500" />
                Keyword Tags
              </label>
              <span className="text-[10px] text-neutral-400">
                Separate with comma (,)
              </span>
            </div>

            <input
              type="text"
              placeholder="e.g. nature images, natural scene, nature"
              value={keywordInput}
              onChange={handleKeywordChange}
              onKeyDown={handleKeywordKeyDown}
              className="w-full px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 dark:text-white"
            />

            {/* Tag Badges */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {keywords.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500 ml-0.5"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Post Settings */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 rounded-xl space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-neutral-400" />
                <div>
                  <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    Disable Comments
                  </p>
                  <p className="text-[10px] text-neutral-400">Prevent comments on this post</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hideComments}
                onChange={e => setHideComments(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-purple-600/20 hover:shadow-lg hover:shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus size={15} />
            <span>Publish Post</span>
          </button>
        </form>
      </div>
    </div>
  );
};
