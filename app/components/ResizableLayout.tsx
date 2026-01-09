'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import ChatSidebar from './ChatSidebar';

interface ResizableLayoutProps {
  leftContent: React.ReactNode;
  defaultLayout?: number;
  defaultCollapsed?: boolean;
}

export default function ResizableLayout({ 
  leftContent,
  defaultLayout = 20,
  defaultCollapsed = false
}: ResizableLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isMounted, setIsMounted] = useState(false);
  const panelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = () => setDirection(mql.matches ? 'vertical' : 'horizontal');
    
    onChange();
    setIsMounted(true);
    
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

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

  const onLayout = (sizes: number[]) => {
    // Save to cookie as well for server-side persistence
    document.cookie = `resizable-layout:layout=${JSON.stringify(sizes)}; path=/; max-age=31536000`;
  };

  const onCollapse = () => {
    setIsCollapsed(true);
    document.cookie = `resizable-layout:collapsed=true; path=/; max-age=31536000`;
  };

  const onExpand = () => {
    setIsCollapsed(false);
    document.cookie = `resizable-layout:collapsed=false; path=/; max-age=31536000`;
  };

  return (
    <div 
      className="relative h-screen w-screen overflow-hidden"
      style={{
        opacity: isMounted ? 1 : 0,
        transition: 'opacity 150ms ease-in'
      }}
    >
      {/* Global Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 -z-10" />
      
      {/* Dot Pattern Overlay */}
      <div 
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-200/30 to-blue-200/30 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      
      <PanelGroup 
        direction={direction} 
        className="h-full w-full"
        onLayout={onLayout}
      >
        {/* Panel chính (Trên/Trái) */}
        <Panel 
          defaultSize={direction === 'horizontal' ? (100 - defaultLayout) : 70} 
          minSize={direction === 'horizontal' ? 30 : 20}
        >
          <div className="h-full w-full overflow-auto" style={{ touchAction: 'pan-y' }}>
            {leftContent}
          </div>
        </Panel>
        
        {/* Thanh kéo để resize */}
        <PanelResizeHandle className={`${direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'} bg-gray-200 hover:bg-blue-400 transition-colors relative group`}>
          <div className={`absolute ${direction === 'horizontal' ? 'inset-y-0 left-1/2 -translate-x-1/2 w-0.5' : 'inset-x-0 top-1/2 -translate-y-1/2 h-0.5'} bg-gray-300 group-hover:bg-blue-500`} />
        </PanelResizeHandle>
        
        {/* Panel Sidebar (Dưới/Phải) */}
        <Panel 
          ref={panelRef}
          defaultSize={direction === 'horizontal' ? defaultLayout : 30} 
          minSize={direction === 'horizontal' ? 20 : 15} 
          maxSize={direction === 'horizontal' ? 40 : 80}
          collapsible={true}
          onCollapse={onCollapse}
          onExpand={onExpand}
        >
          <div className={`h-full w-full overflow-hidden ${direction === 'horizontal' ? 'border-l' : 'border-t'} border-gray-200 p-3`}>
            <ChatSidebar onClose={togglePanel} />
          </div>
        </Panel>
      </PanelGroup>

      {/* Toggle Button khi collapsed */}
      {isCollapsed && (
        <button
          onClick={togglePanel}
          className={`absolute z-50 bg-white border border-gray-200 shadow-md hover:bg-gray-50 transition-all group flex items-center justify-center
            ${direction === 'horizontal' 
              ? 'right-0 top-1/2 -translate-y-1/2 border-r-0 rounded-l-md p-1.5' 
              : 'bottom-0 left-1/2 -translate-x-1/2 border-b-0 rounded-t-lg px-6 py-1.5'
            }`}
          title={direction === 'horizontal' ? "Open Sidebar" : "Open Chat"}
        >
          {direction === 'horizontal' ? (
            <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-1 bg-gray-300 rounded-full group-hover:bg-blue-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-600">Mở Chat</span>
            </div>
          )}
        </button>
      )}

    </div>
  );
}
