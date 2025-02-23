// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EditProfile from './components/EditProfile';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';

function App() {
  return (
    <GoogleOAuthProvider clientId="132446576172-7fppfejsg51fl6bol556fp44maehunqq.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/edit-profile" element={<EditProfile />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;