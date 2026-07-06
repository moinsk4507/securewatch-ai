import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: 0,
            background: '#0d1828',
            color: '#e4eaf4',
            border: '1px solid #1a2d45',
            fontFamily: "'Syne', sans-serif",
            fontSize: '13px',
          },
          success: {
            iconTheme: {
              primary: '#00e887',
              secondary: '#0d1828',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff3b5c',
              secondary: '#0d1828',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
