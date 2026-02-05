import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  MessageSquare,
  Briefcase,
  Users,
  Award,
  Settings,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const mainNavItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Trending', href: '/trending', icon: TrendingUp },
    { label: 'Discussions', href: '/discussions', icon: MessageSquare },
    { label: 'Portfolio', href: '/portfolio', icon: Briefcase },
  ];

  const communityNavItems = [
    { label: 'Users', href: '/users', icon: Users },
    { label: 'Leaderboard', href: '/leaderboard', icon: Award },
  ];

  const bottomNavItems = [
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Help', href: '/help', icon: HelpCircle },
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={`
          fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 
          border-r bg-background transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <ScrollArea className="h-full py-4">
          <div className="px-3 py-2">
            {/* Create Post Button */}
            {isAuthenticated && (
              <Link to="/create-post">
                <Button className="w-full mb-4 bg-orange-500 hover:bg-orange-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Post
                </Button>
              </Link>
            )}

            {/* Main Navigation */}
            <nav className="space-y-1">
              {mainNavItems.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={`
                        flex items-center rounded-md px-3 py-2 text-sm font-medium
                        transition-colors hover:bg-accent hover:text-accent-foreground
                        ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}
                      `}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>

            <Separator className="my-4" />

            {/* Community Navigation */}
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Community
              </h3>
            </div>
            <nav className="space-y-1">
              {communityNavItems.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={`
                        flex items-center rounded-md px-3 py-2 text-sm font-medium
                        transition-colors hover:bg-accent hover:text-accent-foreground
                        ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}
                      `}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>

            {/* User Stats */}
            {isAuthenticated && user && (
              <>
                <Separator className="my-4" />
                <div className="px-3 mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Your Stats
                  </h3>
                </div>
                <div className="px-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Karma</span>
                    <span className="font-medium">{user.karma || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Followers</span>
                    <span className="font-medium">{user.followers?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Following</span>
                    <span className="font-medium">{user.following?.length || 0}</span>
                  </div>
                </div>
              </>
            )}

            <Separator className="my-4" />

            {/* Bottom Navigation */}
            <nav className="space-y-1">
              {bottomNavItems.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={`
                        flex items-center rounded-md px-3 py-2 text-sm font-medium
                        transition-colors hover:bg-accent hover:text-accent-foreground
                        ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}
                      `}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </div>
        </ScrollArea>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
    </TooltipProvider>
  );
};

export default Sidebar;
