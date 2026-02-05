import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, Link, Type, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { postsAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { PostFormData } from '@/types';
import { AxiosError } from 'axios';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [postType, setPostType] = useState<'text' | 'link' | 'image' | 'portfolio'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a post');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (postType === 'link' && !linkUrl.trim()) {
      toast.error('Link URL is required');
      return;
    }

    if (postType === 'text' && !content.trim()) {
      toast.error('Content is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const postData: PostFormData = {
        title: title.trim(),
        content: content.trim(),
        type: postType,
        tags,
      };

      if (postType === 'link') {
        postData.linkUrl = linkUrl.trim();
      }

      const response = await postsAPI.create(postData);
      
      toast.success('Post created successfully!');
      navigate(`/post/${response.data.post._id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create a Post</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Post Type Tabs */}
          <Tabs value={postType} onValueChange={(v) => setPostType(v as typeof postType)}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="text">
                <Type className="mr-2 h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link className="mr-2 h-4 w-4" />
                Link
              </TabsTrigger>
              <TabsTrigger value="image">
                <Image className="mr-2 h-4 w-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="portfolio">
                <Briefcase className="mr-2 h-4 w-4" />
                Portfolio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text">
              <p className="text-sm text-muted-foreground">
                Share your thoughts, ideas, or questions with the community.
              </p>
            </TabsContent>
            <TabsContent value="link">
              <p className="text-sm text-muted-foreground">
                Share an interesting article, video, or website.
              </p>
            </TabsContent>
            <TabsContent value="image">
              <p className="text-sm text-muted-foreground">
                Share images, screenshots, or visual content.
              </p>
            </TabsContent>
            <TabsContent value="portfolio">
              <p className="text-sm text-muted-foreground">
                Showcase your projects, work, or achievements.
              </p>
            </TabsContent>
          </Tabs>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/300
            </p>
          </div>

          {/* Link URL (for link posts) */}
          {postType === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="linkUrl">Link URL *</Label>
              <Input
                id="linkUrl"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                type="url"
              />
            </div>
          )}

          {/* Content */}
          {(postType === 'text' || postType === 'portfolio') && (
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Write your post content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
                maxLength={10000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length}/10000
              </p>
            </div>
          )}

          {/* Image Upload Placeholder */}
          {postType === 'image' && (
            <div className="space-y-2">
              <Label>Images</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Drag and drop images here, or click to select files
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  (Image upload functionality coming soon)
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Add tags (press Enter to add)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    #{tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePost;