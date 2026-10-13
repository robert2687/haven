import React, { useState } from 'react';
import {
  Users,
  Flame,
  Award,
  MessageSquare,
  Sparkles,
  Plus,
  Send,
  CheckCircle,
  TrendingUp,
  Heart,
  Share2,
} from 'lucide-react';
import { CommunityCircle, CommunityPost } from '../types';

interface CommunityViewProps {
  circles: CommunityCircle[];
  userName: string;
  companionName: string;
  onUpdateCircles: (circles: CommunityCircle[]) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  circles,
  userName = 'Alex',
  companionName = 'Sophia',
  onUpdateCircles,
}) => {
  const [selectedCircleId, setSelectedCircleId] = useState<string>(circles[0]?.id || '');
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const selectedCircle = circles.find((c) => c.id === selectedCircleId) || circles[0];

  const handleToggleJoin = (circleId: string) => {
    const updated = circles.map((c) => {
      if (c.id !== circleId) return c;
      return {
        ...c,
        joined: !c.joined,
        membersCount: c.joined ? c.membersCount - 1 : c.membersCount + 1,
      };
    });
    onUpdateCircles(updated);
  };

  const handleCheer = (circleId: string, postId: string) => {
    const updated = circles.map((c) => {
      if (c.id !== circleId) return c;
      const updatedPosts = c.recentPosts.map((p) => {
        if (p.id !== postId) return p;
        const userCheered = !p.userCheered;
        const cheers = userCheered ? p.cheers + 1 : p.cheers - 1;
        return { ...p, cheers, userCheered };
      });
      return { ...c, recentPosts: updatedPosts };
    });
    onUpdateCircles(updated);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !selectedCircle) return;

    setIsPosting(true);
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: userName,
      avatar: '',
      timeAgo: 'Just now',
      content: newPostContent.trim(),
      circleName: selectedCircle.name,
      tag: 'Check-in',
      cheers: 1,
      userCheered: true,
      companionComment: {
        companionName,
        text: `Proud of you for showing up and sharing the work, ${userName}! That is how streaks are made.`,
      },
    };

    const updated = circles.map((c) => {
      if (c.id !== selectedCircle.id) return c;
      return {
        ...c,
        recentPosts: [newPost, ...c.recentPosts],
      };
    });

    onUpdateCircles(updated);
    setNewPostContent('');
    setIsPosting(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 max-w-5xl mx-auto w-full text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              Haven Community Circles
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium">
              Human Social Layer
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Accountability groups, shared challenges, and goal-oriented circles where AI companions support human connection.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circles Directory (Left Column) */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Accountability Circles
          </h2>

          <div className="space-y-3">
            {circles.map((c) => {
              const isSelected = c.id === selectedCircleId;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCircleId(c.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-blue-500/80 ring-1 ring-blue-500/30 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-white">{c.name}</h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      {c.membersCount.toLocaleString()} builders
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {c.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    {c.activeChallenge ? (
                      <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-amber-300/30" />
                        <span className="truncate">{c.activeChallenge}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Open circle</span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleJoin(c.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        c.joined
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {c.joined ? 'Joined' : 'Join'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Circle Feed (Right 2 Columns) */}
        <div className="lg:col-span-2 space-y-5">
          {selectedCircle && (
            <>
              {/* Circle Header Card */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="text-lg font-bold text-white">{selectedCircle.name}</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {selectedCircle.type} circle
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{selectedCircle.description}</p>

                {selectedCircle.activeChallenge && (
                  <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-200 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Active Challenge: <strong>{selectedCircle.activeChallenge}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Share a Win / Check-in Input */}
              <form
                onSubmit={handleCreatePost}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <textarea
                  rows={2}
                  placeholder={`Share a daily win, shipping update, or accountability check-in with ${selectedCircle.name}...`}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Your companion {companionName} will cheer on your check-in!
                  </span>

                  <button
                    type="submit"
                    disabled={isPosting || !newPostContent.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Update</span>
                  </button>
                </div>
              </form>

              {/* Feed of Posts */}
              <div className="space-y-4">
                {selectedCircle.recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {post.avatar ? (
                          <img
                            src={post.avatar}
                            alt={post.authorName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                            {post.authorName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {post.authorName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {post.timeAgo}
                          </span>
                        </div>
                      </div>

                      {post.tag && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-blue-300 border border-slate-700">
                          {post.tag}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* AI Companion Cheer Comment */}
                    {post.companionComment && (
                      <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-700/40 text-xs text-blue-200 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-blue-300 mr-1">
                            {post.companionComment.companionName}:
                          </span>
                          <span>{post.companionComment.text}</span>
                        </div>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleCheer(selectedCircle.id, post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all ${
                          post.userCheered
                            ? 'bg-amber-950/80 text-amber-300 font-bold border border-amber-700/60'
                            : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Flame className={`w-3.5 h-3.5 ${post.userCheered ? 'fill-current' : ''}`} />
                        <span>{post.cheers} Cheers</span>
                      </button>

                      <span className="text-[11px] text-slate-400">
                        In {post.circleName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
