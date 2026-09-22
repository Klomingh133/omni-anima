'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { useTimelineStore } from '@/store/use-timeline-store';
import { useLoadingStore } from '@/store/use-loading-store';
import { CanvasEngine } from '@/engine/canvas-engine';
import { TopStudioNavbar } from '@/components/studio/TopStudioNavbar';
import { ToolboxSidebar } from '@/components/studio/ToolboxSidebar';
import { CanvasViewport } from '@/components/studio/CanvasViewport';
import { TimelineStrip } from '@/components/studio/TimelineStrip';
import { PublishModal } from '@/components/studio/PublishModal';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const { token, initializeAuth } = useAuthStore();
  const showLoader = useLoadingStore((s) => s.show);
  const hideLoader = useLoadingStore((s) => s.hide);

  const {
    frames,
    currentFrameIndex,
    fps,
    isPlaying,
    setProject,
    setCurrentFrameIndex,
    addFrame,
    duplicateFrame,
    deleteFrame,
    reorderFrames,
    setSaveStatus,
  } = useTimelineStore();

  const engineRef = useRef<CanvasEngine | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check auth and load project
  const loadProject = useCallback(async (pId: string, authToken: string) => {
    try {
      showLoader('Loading project frames and blueprint...');
      const res = await fetch(`/api/projects/${pId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const json = await res.json();
      hideLoader();

      if (!res.ok || !json.success) {
        alert('Failed to load project.');
        router.replace('/app');
        return;
      }

      const p = json.data;
      setProject(p.id, p.name, p.fps, p.frames);

      // Check if user has carried over sketch from landing page
      const carriedSketch = sessionStorage.getItem('omni_sketch_carryover');
      if (carriedSketch) {
        sessionStorage.removeItem('omni_sketch_carryover');
        useTimelineStore.getState().updateActiveFrameImage(carriedSketch);
      }
    } catch (e) {
      hideLoader();
      console.error('Load project error:', e);
      router.replace('/app');
    }
  }, [hideLoader, router, setProject, showLoader]);

  useEffect(() => {
    initializeAuth().then((u) => {
      if (!u) {
        showLoader('Redirecting to Sign In...');
        router.replace('/login');
      } else {
        const storedToken = localStorage.getItem('auth_token') || '';
        if (projectId) {
          loadProject(projectId, storedToken);
        }
      }
    });
  }, [initializeAuth, loadProject, projectId, router, showLoader]);

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      const delay = Math.max(16, Math.floor(1000 / fps));
      playbackIntervalRef.current = setInterval(() => {
        const { currentFrameIndex: cIdx, frames: fList } = useTimelineStore.getState();
        const nextIdx = (cIdx + 1) % fList.length;
        setCurrentFrameIndex(nextIdx);
      }, delay);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    };
  }, [fps, isPlaying, setCurrentFrameIndex]);

  // Engine hooks
  const handleEngineReady = (engine: CanvasEngine) => {
    engineRef.current = engine;
    const updateUndoRedoState = () => {
      setCanUndo(engine.canUndo());
      setCanRedo(engine.canRedo());
    };
    engine.setOnChange(() => {
      updateUndoRedoState();
    });
  };

  const handleUndo = () => {
    if (engineRef.current) {
      engineRef.current.undo();
      setCanUndo(engineRef.current.canUndo());
      setCanRedo(engineRef.current.canRedo());
    }
  };

  const handleRedo = () => {
    if (engineRef.current) {
      engineRef.current.redo();
      setCanUndo(engineRef.current.canUndo());
      setCanRedo(engineRef.current.canRedo());
    }
  };

  const handleClearCanvas = () => {
    if (engineRef.current) {
      engineRef.current.clear(true);
      setCanUndo(engineRef.current.canUndo());
      setCanRedo(engineRef.current.canRedo());
    }
  };

  // Autosave single frame
  const handleAutosaveFrame = async (frameIndex: number, imageData: string) => {
    if (!token || !projectId) return;

    try {
      setSaveStatus('saving');
      const res = await fetch(`/api/projects/${projectId}/frames/${frameIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image_data: imageData }),
      });

      if (res.ok) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  // Timeline operations
  const handleAddFrame = async () => {
    const nextIdx = currentFrameIndex + 1;
    addFrame(nextIdx);

    if (token && projectId) {
      try {
        await fetch(`/api/projects/${projectId}/frames`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ frame_index: nextIdx }),
        });
      } catch (err) {
        console.error('Failed to sync add frame:', err);
      }
    }
  };

  const handleDuplicateFrame = async (index: number) => {
    duplicateFrame(index);

    if (token && projectId) {
      try {
        await fetch(`/api/projects/${projectId}/duplicate-frame`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ frame_index: index }),
        });
      } catch (err) {
        console.error('Failed to sync duplicate frame:', err);
      }
    }
  };

  const handleDeleteFrame = async (index: number) => {
    if (frames.length <= 1) return;
    deleteFrame(index);

    if (token && projectId) {
      try {
        await fetch(`/api/projects/${projectId}/frames/${index}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Failed to sync delete frame:', err);
      }
    }
  };

  const handleReorderFrame = async (oldIndex: number, newIndex: number) => {
    reorderFrames(oldIndex, newIndex);

    if (token && projectId) {
      try {
        await fetch(`/api/projects/${projectId}/frames/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ old_index: oldIndex, new_index: newIndex }),
        });
      } catch (err) {
        console.error('Failed to sync reorder frames:', err);
      }
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden font-body">
      {/* Top Navbar */}
      <TopStudioNavbar
        onExport={() => setIsPublishModalOpen(true)}
        onPublish={() => setIsPublishModalOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Center workspace: Sidebar + Viewport */}
      <div className="flex-1 flex overflow-hidden">
        <ToolboxSidebar onClearCanvas={handleClearCanvas} />
        <CanvasViewport
          onEngineReady={handleEngineReady}
          onAutosaveFrame={handleAutosaveFrame}
        />
      </div>

      {/* Bottom Timeline Strip */}
      <TimelineStrip
        onAddFrame={handleAddFrame}
        onDuplicateFrame={handleDuplicateFrame}
        onDeleteFrame={handleDeleteFrame}
        onReorderFrame={handleReorderFrame}
      />

      {/* Publish & Export Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublishedSuccess={() => {
          router.push('/app');
        }}
      />
    </div>
  );
}
