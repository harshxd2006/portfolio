import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { postsAPI } from '@/services/api';
import PostCard from '@/components/posts/PostCard';
import CommentSection from '@/components/comments/CommentSection';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Post } from '@/types';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await postsAPI.getById(id);
        setPost(response.data.post);
      } catch {
        toast.error('Failed to load post');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate]);

  const handleVote = (_postId: string, voteType: 'up' | 'down' | null) => {
    if (post) {
      setPost({ ...post, userVote: voteType });
    }
  };

  const handleDelete = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="border rounded-lg p-4">
          <div className="flex space-x-4">
            <div className="flex flex-col items-center space-y-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-muted-foreground text-lg">Post not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/')}
        >
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <PostCard
        post={post}
        onVote={handleVote}
        onDelete={handleDelete}
      />

      <CommentSection
        postId={post._id}
        commentCount={post.commentCount || post.comments.length}
      />
    </div>
  );
};

export default PostDetail;
