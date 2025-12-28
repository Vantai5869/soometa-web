'use client';

import React, { useState, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ChatSidebar from './ChatSidebar';

interface ResizableLayoutProps {
  leftContent: React.ReactNode;
}

export default function ResizableLayout({ 
  leftContent
}: ResizableLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = useRef<ImperativePanelHandle>(null);

  const togglePanel = () => {
    const panel = panelRef.current;
    if (panel) {
      if (isCollapsed) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <PanelGroup 
        direction="horizontal" 
        className="h-full w-full"
        autoSaveId="resizable-layout-persistence"
      >
        {/* Panel bên trái - Nội dung chính */}
        <Panel 
          defaultSize={80} 
          minSize={30}
        >
          <div className="h-full w-full overflow-auto">
            {leftContent}
          </div>
        </Panel>
        
        {/* Thanh kéo để resize */}
        <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-blue-400 transition-colors cursor-col-resize relative group">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gray-300 group-hover:bg-blue-500" />
        </PanelResizeHandle>
        
        {/* Panel bên phải - Sidebar */}
        <Panel 
          ref={panelRef}
          defaultSize={20} 
          minSize={15} 
          maxSize={40}
          collapsible={true}
          onCollapse={() => setIsCollapsed(true)}
          onExpand={() => setIsCollapsed(false)}
          className="transition-all duration-300 ease-in-out"
        >
          <div className="h-full w-full overflow-hidden bg-white border-l border-gray-200 p-3">
            <ChatSidebar />
          </div>
        </Panel>
      </PanelGroup>

      {/* Toggle Button khi collapsed */}
      {isCollapsed && (
        <button
          onClick={togglePanel}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 border-r-0 rounded-l-md p-1.5 shadow-md hover:bg-gray-50 transition-all group"
          title="Open Sidebar"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
        </button>
      )}

      {/* Optional: Nút toggle luôn hiển thị ở góc nếu muốn (giống IDE) */}
      {!isCollapsed && (
        <button
          onClick={togglePanel}
          className="absolute right-4 bottom-4 z-50 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-sm hover:bg-white transition-all group lg:hidden"
          title="Close Sidebar"
        >
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
        </button>
      )}
    </div>
  );
}
