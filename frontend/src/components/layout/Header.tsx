import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  TrendingUp,
  Home,
  Briefcase,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to home even if logout API fails
      navigate('/');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Trending', href: '/trending', icon: TrendingUp },
    { label: 'Portfolio', href: '/portfolio', icon: Briefcase },
    { label: 'Discussions', href: '/discussions', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="hidden font-bold text-xl md:inline-block">
            Portfolio<span className="text-orange-500">Social</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 mr-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Search Bar */}
        <div className="flex-1 flex items-center justify-end space-x-2">
          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts, users..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.displayName} />
                      <AvatarFallback>{getInitials(user?.displayName || '')}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.displayName} />
                      <AvatarFallback>{getInitials(user?.displayName || '')}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user?.displayName || 'User'}</p>
                      <p className="text-xs text-muted-foreground">@{user?.username || 'username'}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/u/${user?.username}`)}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button onClick={() => navigate('/register')} className="bg-orange-500 hover:bg-orange-600">
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="border-t p-2 md:hidden">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts, users..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  );
};

export default Header;