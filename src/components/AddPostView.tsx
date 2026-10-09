import React, { useState, useRef } from 'react';
import {
  Image,
  Tag,
  Lock,
  X,
  Plus,
  Globe,
  Upload,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { compressImage } from '../utils/imageCompressor';

export const AddPostView: React.FC = () => {
  const { currentUser, createPost, setActiveTab, setIsAuthModalOpen, setAuthMode } = useApp();

  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // YouTube-style keyword tag system
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  // Post settings
  const [hideComments, setHideComments] = useState(false);
  const [isAIPost, setIsAIPost] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) {
    return (
      <div className="pb-24 pt-8 text-center">
        <div className="text-box empty-state-box bg-white dark:bg-neutral-700/80 rounded-2xl p-6 border border-neutral-200 dark:border-white/30 space-y-3 max-w-sm mx-auto shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Plus size={22} />
          </div>
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
            Sign in to share a post
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

  const handleAddImageUrl = async () => {
    if (!imageUrlInput.trim()) return;
    const url = imageUrlInput.trim();
    if (url.startsWith('data:image')) {
      try {
        const compressed = await compressImage(url, 1080, 1080, 0.75);
        setImages(prev => [...prev, compressed]);
      } catch {
        setImages(prev => [...prev, url]);
      }
    } else {
      setImages(prev => [...prev, url]);
    }
    setImageUrlInput('');
    setShowUrlInput(false);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && images.length === 0) {
      alert('Please enter a caption or upload an image before posting.');
      return;
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
    });

    // Reset and go to feed
    setCaption('');
    setImages([]);
    setKeywords([]);
    setActiveTab('home');
  };

  return (
    <div className="pb-24 pt-2">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
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
              placeholder="What's happening? Share thoughts or paste links..."
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

          {/* Photo Upload Tools */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Image size={14} className="text-neutral-500" />
                Add Photos (Optional)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-750 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Upload size={12} /> File
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-750 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Globe size={12} /> Link
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            {showUrlInput && (
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={imageUrlInput}
                  onChange={e => setImageUrlInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md hover:shadow-purple-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  Add
                </button>
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
