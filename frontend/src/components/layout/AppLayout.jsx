// AppLayout.jsx — App shell grid
// Grid: Topbar (50px) full-width on top; Sidebar + content area below
// Topbar is sticky, content area scrolls independently

import Topbar from './Topbar';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg0)',
        overflow: 'hidden',
      }}
    >
      {/* Top bar — full width, 50px */}
      <Topbar />

      {/* Body row: Sidebar + main content */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <Sidebar />

        {/* Scrollable page content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: 'var(--bg0)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
