import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Users,
  MessageSquare,
  ArrowLeft,
  Edit,
  Share2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usersAPI, postsAPI } from '@/services/api';
import PostCard from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { User, Post, UserStats } from '@/types';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      
      try {
        setIsLoading(true);
        const response = await usersAPI.getByUsername(username);
        setProfile(response.data.user);
        setStats(response.data.user.stats);

        // Check if current user is following this profile
        if (currentUser && response.data.user.followers) {
          setIsFollowing(
            response.data.user.followers.some(
              (f) => (typeof f === 'string' ? f : f._id) === currentUser._id
            )
          );
        }
      } catch {
        toast.error('Failed to load profile');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser, navigate]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!profile?._id) return;
      
      try {
        setIsLoadingPosts(true);
        const response = await postsAPI.getByUser(profile._id, { limit: 10 });
        setPosts(response.data.posts);
      } catch {
        toast.error('Failed to load posts');
      } finally {
        setIsLoadingPosts(false);
      }
    };

    if (activeTab === 'posts') {
      fetchPosts();
    }
  }, [profile?._id, activeTab]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to follow users');
      navigate('/login');
      return;
    }

    if (!profile) return;

    try {
      const response = await usersAPI.follow(profile._id);
      setIsFollowing(response.data.isFollowing);
      toast.success(response.data.message);
    } catch {
      toast.error('Failed to follow user');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isOwnProfile = currentUser?.username === username;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-muted-foreground text-lg">User not found</p>
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
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 w-full bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-lg" />
        
        {/* Profile Info */}
        <div className="px-4 pb-4">
          <div className="flex flex-col md:flex-row md:items-end -mt-12 mb-4">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="text-2xl">{getInitials(profile.displayName)}</AvatarFallback>
            </Avatar>
            
            <div className="mt-4 md:mt-0 md:ml-4 flex-1">
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              <p className="text-muted-foreground">u/{profile.username}</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-2">
              {isOwnProfile ? (
                <Button variant="outline" onClick={() => navigate('/settings')}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => toast.info('Shared')}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={isFollowing ? 'outline' : 'default'}
                    onClick={handleFollow}
                    className={!isFollowing ? 'bg-orange-500 hover:bg-orange-600' : ''}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-foreground mb-4">{profile.bio}</p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            {profile.location && (
              <div className="flex items-center">
                <MapPin className="mr-1 h-4 w-4" />
                {profile.location}
              </div>
            )}
            {profile.website && (
              <a 
                href={profile.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:underline"
              >
                <LinkIcon className="mr-1 h-4 w-4" />
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              Joined {formatDate(profile.createdAt)}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-1">
              <span className="font-bold">{stats?.karma || profile.karma}</span>
              <span className="text-muted-foreground">Karma</span>
            </div>
            <Link to={`/u/${profile.username}/followers`} className="flex items-center space-x-1 hover:underline">
              <span className="font-bold">{stats?.followerCount || profile.followers?.length || 0}</span>
              <span className="text-muted-foreground">Followers</span>
            </Link>
            <Link to={`/u/${profile.username}/following`} className="flex items-center space-x-1 hover:underline">
              <span className="font-bold">{stats?.followingCount || profile.following?.length || 0}</span>
              <span className="text-muted-foreground">Following</span>
            </Link>
          </div>

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="posts">
            <MessageSquare className="mr-2 h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="mr-2 h-4 w-4" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="about">
            <Users className="mr-2 h-4 w-4" />
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {isLoadingPosts ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} compact />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Comments coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <div className="space-y-6">
            {profile.title && (
              <div>
                <h3 className="font-semibold mb-2">Title</h3>
                <p className="text-muted-foreground">{profile.title}</p>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold mb-2">Account Info</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Member since {formatDate(profile.createdAt)}</p>
                <p>Username: u/{profile.username}</p>
                <p>Email: {profile.email}</p>
                {profile.isVerified && (
                  <Badge variant="default" className="bg-green-500">Verified</Badge>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
