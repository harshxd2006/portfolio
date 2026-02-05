import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/u/:username" element={<Profile />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/post/:id" element={<PostDetail />} />
            {/* Add more routes as needed */}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
