import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowBigUp, 
  ArrowBigDown, 
  MessageSquare, 
  Share2, 
  MoreHorizontal,
  Bookmark,
  Flag,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { postsAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onVote?: (postId: string, voteType: 'up' | 'down' | null) => void;
  onDelete?: (postId: string) => void;
  compact?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onVote, 
  onDelete,
  compact = false 
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [voteScore, setVoteScore] = useState(post.voteScore || 0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(post.userVote || null);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (type: 'up' | 'down') => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote');
      navigate('/login');
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
        ? await postsAPI.upvote(post._id)
        : await postsAPI.downvote(post._id);
      
      setVoteScore(response.data.voteScore);
      setUserVote(response.data.userVote.upvoted ? 'up' : response.data.userVote.downvoted ? 'down' : null);
      
      if (onVote) {
        onVote(post._id, userVote);
      }
    } catch {
      // Revert on error
      setUserVote(previousVote);
      setVoteScore(previousScore);
      toast.error('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsAPI.delete(post._id);
      toast.success('Post deleted successfully');
      if (onDelete) {
        onDelete(post._id);
      }
    } catch {
      toast.error('Failed to delete post');
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

  const isAuthor = user?._id === (typeof post.author === 'string' ? post.author : post.author._id);

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Vote Section */}
        <div className="flex flex-col items-center p-4 bg-muted/50 rounded-l-lg min-w-[60px]">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${userVote === 'up' ? 'text-orange-500' : 'text-muted-foreground'}`}
            onClick={() => handleVote('up')}
            disabled={isVoting}
          >
            <ArrowBigUp className={`h-6 w-6 ${userVote === 'up' ? 'fill-current' : ''}`} />
          </Button>
          <span className={`text-sm font-bold ${
            userVote === 'up' ? 'text-orange-500' : 
            userVote === 'down' ? 'text-blue-500' : 
            'text-foreground'
          }`}>
            {voteScore}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${userVote === 'down' ? 'text-blue-500' : 'text-muted-foreground'}`}
            onClick={() => handleVote('down')}
            disabled={isVoting}
          >
            <ArrowBigDown className={`h-6 w-6 ${userVote === 'down' ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Content Section */}
        <div className="flex-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link to={`/u/${post.author.username}`} className="flex items-center space-x-2 hover:underline">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback className="text-xs">{getInitials(post.author.displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">u/{post.author.username}</span>
                </Link>
                <span>•</span>
                <span>{formatDate(post.createdAt)}</span>
                {post.isEdited && <span className="text-xs">(edited)</span>}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast.info('Saved to bookmarks')}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Post shared')}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  {isAuthor && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(`/edit-post/${post._id}`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isAuthor && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toast.info('Post reported')}>
                        <Flag className="mr-2 h-4 w-4" />
                        Report
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link to={`/post/${post._id}`}>
              <h3 className="text-lg font-semibold leading-tight hover:underline cursor-pointer mt-1">
                {post.title}
              </h3>
            </Link>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent className="pb-2">
            {/* Link Post */}
            {post.type === 'link' && post.linkUrl && (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-blue-500 hover:underline mb-2"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                {post.linkUrl}
              </a>
            )}

            {/* Post Content */}
            {!compact && (
              <div className="text-sm text-muted-foreground line-clamp-3">
                {post.content}
              </div>
            )}

            {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {post.images.slice(0, compact ? 1 : 4).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Post image ${index + 1}`}
                    className="rounded-md object-cover w-full h-48"
                  />
                ))}
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-0">
            <div className="flex items-center space-x-4">
              <Link to={`/post/${post._id}`}>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <MessageSquare className="mr-1 h-4 w-4" />
                  {post.commentCount || post.comments.length} Comments
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Share2 className="mr-1 h-4 w-4" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Bookmark className="mr-1 h-4 w-4" />
                Save
              </Button>
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;
