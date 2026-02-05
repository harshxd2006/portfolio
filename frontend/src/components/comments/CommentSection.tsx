import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, SortAsc, SortDesc } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { commentsAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import CommentItem from './CommentItem';
import type { Comment } from '@/types';

interface CommentSectionProps {
  postId: string;
  commentCount?: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, commentCount = 0 }) => {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'top' | 'new'>('top');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchComments = useCallback(async (reset = false) => {
    try {
      setIsLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await commentsAPI.getByPost(postId, {
        page: currentPage,
        limit: 20,
        sortBy,
      });

      const newComments = response.data.comments;
      
      if (reset) {
        setComments(newComments);
        setPage(1);
      } else {
        setComments(prev => [...prev, ...newComments]);
      }
      
      setHasMore(response.data.pagination.hasMore);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [postId, sortBy, page]);

  useEffect(() => {
    fetchComments(true);
  }, [sortBy, fetchComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await commentsAPI.create({
        postId,
        content: newComment.trim(),
      });

      setComments(prev => [response.data.comment, ...prev]);
      setNewComment('');
      toast.success('Comment posted successfully');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId: string, content: string) => {
    const response = await commentsAPI.create({
      postId,
      content,
      parentCommentId,
    });

    // Update the parent comment's replies
    setComments(prev =>
      prev.map(comment => {
        if (comment._id === parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), response.data.comment],
          };
        }
        return comment;
      })
    );

    return response.data.comment;
  };

  const handleEdit = async (commentId: string, content: string) => {
    const response = await commentsAPI.update(commentId, content);

    setComments(prev =>
      prev.map(comment => {
        if (comment._id === commentId) {
          return { ...comment, ...response.data.comment };
        }
        // Also check in replies
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map((reply: string | Comment) =>
              (typeof reply === 'string' ? reply : reply._id) === commentId
                ? response.data.comment
                : reply
            ),
          };
        }
        return comment;
      })
    );
  };

  const handleDelete = (commentId: string) => {
    setComments(prev =>
      prev.map(comment => {
        if (comment._id === commentId) {
          return { ...comment, isDeleted: true, content: '[deleted]' };
        }
        // Also check in replies
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map((reply: string | Comment) =>
              (typeof reply === 'string' ? reply : reply._id) === commentId
                ? { ...reply, isDeleted: true, content: '[deleted]' }
                : reply
            ),
          };
        }
        return comment;
      })
    );
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    fetchComments();
  };

  return (
    <div className="mt-6">
      <Separator className="mb-6" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          {commentCount} Comments
        </h3>
        
        <Select value={sortBy} onValueChange={(value: 'top' | 'new') => setSortBy(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">
              <div className="flex items-center">
                <SortDesc className="mr-2 h-4 w-4" />
                Top
              </div>
            </SelectItem>
            <SelectItem value="new">
              <div className="flex items-center">
                <SortAsc className="mr-2 h-4 w-4" />
                New
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* New Comment Form */}
      {isAuthenticated && (
        <div className="mb-6 space-y-3">
          <Textarea
            placeholder="What are your thoughts?"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? 'Posting...' : 'Comment'}
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-0">
        {isLoading && comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            
            {hasMore && (
              <div className="text-center py-4">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load More Comments'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
