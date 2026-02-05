import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowBigUp, 
  ArrowBigDown, 
  MessageSquare, 
  MoreHorizontal,
  Edit,
  Trash2,
  CornerDownRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { commentsAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { Comment } from '@/types';

interface CommentItemProps {
  comment: Comment;
  onReply?: (commentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  depth?: number;
  maxDepth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  onReply, 
  onEdit, 
  onDelete,
  depth = 0,
  maxDepth = 6
}) => {
  const { user, isAuthenticated } = useAuth();
  const [voteScore, setVoteScore] = useState(comment.voteScore || 0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(comment.userVote || null);
  const [isVoting, setIsVoting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(depth < 3);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  const handleVote = async (type: 'up' | 'down') => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    const previousVote = userVote;
    const previousScore = voteScore;

    // Optimistic update
    if (type === 'up') {
      if (userVote === 'up') {
        setUserVote(null);
        setVoteScore(prev => prev - 1);
      } else {
        setUserVote('up');
        setVoteScore(prev => prev + (userVote === 'down' ? 2 : 1));
      }
    } else {
      if (userVote === 'down') {
        setUserVote(null);
        setVoteScore(prev => prev + 1);
      } else {
        setUserVote('down');
        setVoteScore(prev => prev - (userVote === 'up' ? 2 : 1));
      }
    }

    try {
      const response = type === 'up' 
        ? await commentsAPI.upvote(comment._id)
        : await commentsAPI.downvote(comment._id);
      
      setVoteScore(response.data.voteScore);
      setUserVote(response.data.userVote.upvoted ? 'up' : response.data.userVote.downvoted ? 'down' : null);
    } catch {
      // Revert on error
      setUserVote(previousVote);
      setVoteScore(previousScore);
      toast.error('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      await onReply?.(comment._id, replyContent);
      setReplyContent('');
      setIsReplying(false);
      toast.success('Reply posted');
    } catch {
      toast.error('Failed to post reply');
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;

    try {
      await onEdit?.(comment._id, editContent);
      setIsEditing(false);
      toast.success('Comment updated');
    } catch {
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsAPI.delete(comment._id);
      onDelete?.(comment._id);
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const loadReplies = async () => {
    if (isLoadingReplies) return;
    
    setIsLoadingReplies(true);
    try {
      const response = await commentsAPI.getReplies(comment._id);
      setReplies(response.data.replies);
      setShowReplies(true);
    } catch {
      toast.error('Failed to load replies');
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isAuthor = user?._id === (typeof comment.author === 'string' ? comment.author : comment.author._id);

  // Don't render deleted comments with no replies
  if (comment.isDeleted && (!comment.replies || comment.replies.length === 0)) {
    return null;
  }

  return (
    <div className={`${depth > 0 ? 'ml-4 md:ml-8 border-l-2 border-border pl-4' : ''}`}>
      <div className="flex space-x-3 py-3">
        {/* Vote Section */}
        <div className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${userVote === 'up' ? 'text-orange-500' : 'text-muted-foreground'}`}
            onClick={() => handleVote('up')}
            disabled={isVoting}
          >
            <ArrowBigUp className={`h-5 w-5 ${userVote === 'up' ? 'fill-current' : ''}`} />
          </Button>
          <span className={`text-xs font-medium ${
            userVote === 'up' ? 'text-orange-500' : 
            userVote === 'down' ? 'text-blue-500' : 
            'text-muted-foreground'
          }`}>
            {voteScore}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${userVote === 'down' ? 'text-blue-500' : 'text-muted-foreground'}`}
            onClick={() => handleVote('down')}
            disabled={isVoting}
          >
            <ArrowBigDown className={`h-5 w-5 ${userVote === 'down' ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <Link to={`/u/${comment.author.username}`} className="flex items-center space-x-2 hover:underline">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={comment.author.avatar} />
                  <AvatarFallback className="text-xs">{getInitials(comment.author.displayName)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">u/{comment.author.username}</span>
              </Link>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{formatDate(comment.createdAt)}</span>
              {comment.isEdited && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
              {comment.author.karma && (
                <span className="text-xs text-muted-foreground">
                  {comment.author.karma} karma
                </span>
              )}
            </div>

            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleEdit}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm text-foreground">
              {comment.content}
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center space-x-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setIsReplying(!isReplying)}
              >
                <MessageSquare className="mr-1 h-3 w-3" />
                Reply
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                Share
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                Save
              </Button>
            </div>
          )}

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleReply}>Reply</Button>
                <Button size="sm" variant="outline" onClick={() => setIsReplying(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {depth < maxDepth && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {showReplies ? (
                (Array.isArray(comment.replies) ? comment.replies : []).map((reply: any) => (
                  <CommentItem
                    key={typeof reply === 'string' ? reply : reply._id}
                    comment={typeof reply === 'string' ? replies.find(r => r._id === reply) || comment : reply}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                  />
                ))
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-orange-500"
                  onClick={loadReplies}
                  disabled={isLoadingReplies}
                >
                  <CornerDownRight className="mr-1 h-3 w-3" />
                  {isLoadingReplies ? 'Loading...' : `Show ${comment.replyCount || comment.replies.length} replies`}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
