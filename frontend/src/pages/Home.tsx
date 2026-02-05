import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { postsAPI } from '@/services/api';
import PostCard from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Post } from '@/types';

const Home: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const sortBy = searchParams.get('sort') || 'new';

  const fetchPosts = useCallback(async (reset = false) => {
    try {
      setIsLoading(true);
      const currentPage = reset ? 1 : page;
      
      const response = await postsAPI.getAll({
        page: currentPage,
        limit: 10,
        sortBy,
      });

      const newPosts = response.data.posts;
      
      if (reset) {
        setPosts(newPosts);
        setPage(2);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(response.data.pagination.hasMore);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
    }
  }, [sortBy, page]);

  useEffect(() => {
    fetchPosts(true);
  }, [sortBy, fetchPosts]);

  const handleSortChange = (value: string) => {
    setSearchParams({ sort: value });
  };

  const handleVote = (postId: string, voteType: 'up' | 'down' | null) => {
    // Update the post in the list
    setPosts(prev =>
      prev.map(post => {
        if (post._id === postId) {
          return { ...post, userVote: voteType };
        }
        return post;
      })
    );
  };

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feed</h1>
        
        <Tabs value={sortBy} onValueChange={handleSortChange}>
          <TabsList>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="top">Top</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading && posts.length === 0 ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex space-x-4">
                <div className="flex flex-col items-center space-y-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No posts yet</p>
            <p className="text-muted-foreground">Be the first to create a post!</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onVote={handleVote}
                onDelete={handleDelete}
              />
            ))}
            
            {hasMore && (
              <div className="text-center py-4">
                <Button
                  onClick={() => fetchPosts()}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
