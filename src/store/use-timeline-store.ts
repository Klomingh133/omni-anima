import { create } from 'zustand';
import { FrameData, ToolType } from '../engine/types';

const BLANK_FRAME =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="#ffffff"/></svg>'
  );

interface TimelineState {
  projectId: string | null;
  projectName: string;
  fps: number;
  frames: FrameData[];
  currentFrameIndex: number;
  isPlaying: boolean;
  onionSkinPrev: boolean;
  onionSkinNext: boolean;
  activeTool: ToolType;
  activeColor: string;
  activeStrokeWidth: number;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // Actions
  setProject: (
    projectId: string,
    name: string,
    fps: number,
    frames: FrameData[]
  ) => void;
  setProjectName: (name: string) => void;
  setFps: (fps: number) => void;
  setCurrentFrameIndex: (index: number) => void;
  updateActiveFrameImage: (imageData: string) => void;
  addFrame: (atIndex?: number, image_data?: string) => void;
  duplicateFrame: (index: number) => void;
  deleteFrame: (index: number) => void;
  reorderFrames: (oldIndex: number, newIndex: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setOnionSkinPrev: (enabled: boolean) => void;
  setOnionSkinNext: (enabled: boolean) => void;
  setActiveTool: (tool: ToolType) => void;
  setActiveColor: (color: string) => void;
  setActiveStrokeWidth: (width: number) => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  projectId: null,
  projectName: 'Untitled Animation',
  fps: 12,
  frames: [
    { frame_index: 0, image_data: BLANK_FRAME }
  ],
  currentFrameIndex: 0,
  isPlaying: false,
  onionSkinPrev: true,
  onionSkinNext: false,
  activeTool: 'pencil',
  activeColor: '#212121',
  activeStrokeWidth: 4,
  isSaving: false,
  saveStatus: 'idle',

  setProject: (projectId, name, fps, frames) => {
    const validFrames = frames && frames.length > 0
      ? frames.map((f, i) => ({ ...f, frame_index: i }))
      : [{ frame_index: 0, image_data: BLANK_FRAME }];

    set({
      projectId,
      projectName: name || 'Untitled Animation',
      fps: Math.max(1, Math.min(60, fps || 12)),
      frames: validFrames,
      currentFrameIndex: 0,
      isPlaying: false,
      saveStatus: 'saved',
    });
  },

  setProjectName: (name) => set({ projectName: name }),

  setFps: (fps) => set({ fps: Math.max(1, Math.min(60, fps)) }),

  setCurrentFrameIndex: (index) => {
    const { frames } = get();
    if (index >= 0 && index < frames.length) {
      set({ currentFrameIndex: index });
    }
  },

  updateActiveFrameImage: (imageData) => {
    const { frames, currentFrameIndex } = get();
    const updated = [...frames];
    if (updated[currentFrameIndex]) {
      updated[currentFrameIndex] = {
        ...updated[currentFrameIndex],
        image_data: imageData,
      };
      set({ frames: updated });
    }
  },

  addFrame: (atIndex, image_data) => {
    const { frames, currentFrameIndex } = get();
    const targetIdx = atIndex !== undefined ? atIndex : currentFrameIndex + 1;
    const newFrame: FrameData = {
      frame_index: targetIdx,
      image_data: image_data || BLANK_FRAME,
    };

    const nextFrames = [...frames];
    nextFrames.splice(targetIdx, 0, newFrame);
    // Renumber frame_index
    const reindexed = nextFrames.map((f, i) => ({ ...f, frame_index: i }));

    set({
      frames: reindexed,
      currentFrameIndex: targetIdx,
    });
  },

  duplicateFrame: (index) => {
    const { frames } = get();
    const source = frames[index];
    if (!source) return;

    const dup: FrameData = {
      frame_index: index + 1,
      image_data: source.image_data,
    };

    const nextFrames = [...frames];
    nextFrames.splice(index + 1, 0, dup);
    const reindexed = nextFrames.map((f, i) => ({ ...f, frame_index: i }));

    set({
      frames: reindexed,
      currentFrameIndex: index + 1,
    });
  },

  deleteFrame: (index) => {
    const { frames, currentFrameIndex } = get();
    if (frames.length <= 1) return; // Prevent deleting the only frame

    const filtered = frames.filter((_, i) => i !== index);
    const reindexed = filtered.map((f, i) => ({ ...f, frame_index: i }));

    let nextCurrent = currentFrameIndex;
    if (currentFrameIndex >= reindexed.length) {
      nextCurrent = reindexed.length - 1;
    } else if (currentFrameIndex > index) {
      nextCurrent = currentFrameIndex - 1;
    }

    set({
      frames: reindexed,
      currentFrameIndex: nextCurrent,
    });
  },

  reorderFrames: (oldIndex, newIndex) => {
    const { frames, currentFrameIndex } = get();
    if (oldIndex === newIndex) return;

    const nextFrames = [...frames];
    const [moved] = nextFrames.splice(oldIndex, 1);
    nextFrames.splice(newIndex, 0, moved);
    const reindexed = nextFrames.map((f, i) => ({ ...f, frame_index: i }));

    let nextCurrent = currentFrameIndex;
    if (currentFrameIndex === oldIndex) {
      nextCurrent = newIndex;
    } else if (currentFrameIndex > oldIndex && currentFrameIndex <= newIndex) {
      nextCurrent = currentFrameIndex - 1;
    } else if (currentFrameIndex < oldIndex && currentFrameIndex >= newIndex) {
      nextCurrent = currentFrameIndex + 1;
    }

    set({
      frames: reindexed,
      currentFrameIndex: nextCurrent,
    });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setOnionSkinPrev: (enabled) => set({ onionSkinPrev: enabled }),

  setOnionSkinNext: (enabled) => set({ onionSkinNext: enabled }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setActiveColor: (color) => set({ activeColor: color }),

  setActiveStrokeWidth: (width) => set({ activeStrokeWidth: width }),

  setSaveStatus: (status) => set({ saveStatus: status }),
}));
