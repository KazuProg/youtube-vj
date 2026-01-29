/**
 * レガシーAPIの互換性エイリアスを設定
 *
 * このファイルは互換性のために一時的に存在します。
 * レガシー対応が不要になったタイミングでファイルごと削除してください。
 */

interface LegacyDeckAPI {
  setVideo: (videoId: string) => void;
  setSpeed: (speed: number) => void;
  setTime: (time: number) => void;
  setFilter: (filters: Record<string, string>) => void;
  hotcue: (cueId: number) => void;
  addHotcue: (cueId: number) => void;
  playHotcue: (cueId: number) => void;
  removeHotcue: (cueId: number) => void;
  suspendPreview: () => void;
  resumePreview: () => void;
  adjustTiming: (time: number) => void;
  loopStart: () => void;
  loopEnd: () => void;
  loopClear: () => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  mute: () => void;
  unmute: () => void;
  toggleMuteUnmute: () => void;
  setVolume: (volume: number) => void;
  fadeoutVolume: (time: number) => void;
}

interface LegacyLibraryAPI {
  actions: {
    up: () => void;
    down: () => void;
    changeFocus: () => void;
  };
}

// レガシーAPIの型定義
declare global {
  interface Window {
    ch1: LegacyDeckAPI | null;
    ch2: LegacyDeckAPI | null;
    selCh: LegacyDeckAPI | null;
    changeVideo: (videoId: string) => void;
    switchVideo: (videoId: string) => void;
    setSwitchingDuration: (duration: number) => void;
    setCrossfader: (value: number) => void;
    selectCh: (ch: number) => void;
    // biome-ignore lint/style/useNamingConvention: Legacy API naming
    Library: LegacyLibraryAPI | null;

    prepareVideoId: undefined;
  }
}

window.prepareVideoId = undefined;

// レガシー setCrossfader API (範囲: -1 ~ 1) を新API (範囲: 0 ~ 1) にマッピング
// window.mixer が設定されていれば、その setCrossfader メソッドを呼び出す
window.setCrossfader = (value: number) => {
  window.mixer?.setCrossfader((value + 1) / 2);
};

window.ch1 = {
  setVideo: (videoId: string | undefined) => {
    // レガシースクリプトでは、window.prepareVideoId を使用しているが、
    // 新しいスクリプトでは、window.mixer?.getPreparedVideoId() を使用しているため、
    // 互換性のために、window.prepareVideoId を使用している。
    const video = videoId ?? window.mixer?.getPreparedVideo();
    if (video) {
      window.ch[0]?.loadVideo(video);
    }
  },
  setSpeed: (speed: number) => {
    window.ch[0]?.setPlaybackRate(speed);
  },
  setTime: (time: number) => {
    window.ch[0]?.seekTo(time);
  },
  setFilter: (filters: Record<string, string>) => {
    window.ch[0]?.setFilters(filters);
  },
  hotcue: (cueId: number) => {
    if (window.ch[0]?.hasHotCue(cueId)) {
      window.ch[0]?.jumpToHotCue(cueId);
    } else {
      window.ch[0]?.setHotCue(cueId);
    }
  },
  addHotcue: (cueId: number) => {
    window.ch[0]?.setHotCue(cueId);
  },
  playHotcue: (cueId: number) => {
    window.ch[0]?.jumpToHotCue(cueId);
  },
  removeHotcue: (cueId: number) => {
    window.ch[0]?.deleteHotCue(cueId);
  },
  suspendPreview: () => {
    console.warn("suspendPreview is not implemented");
  },
  resumePreview: () => {
    console.warn("resumePreview is not implemented");
  },
  adjustTiming: (_time: number) => {
    const currentTime = window.ch[0]?.getCurrentTime();
    if (currentTime === undefined) {
      return;
    }
    window.ch[0]?.seekTo(Number(currentTime) + _time);
  },
  loopStart: () => {
    window.ch[0]?.setLoopStart();
  },
  loopEnd: () => {
    window.ch[0]?.setLoopEnd();
  },
  loopClear: () => {
    window.ch[0]?.clearLoop();
  },
  play: () => {
    window.ch[0]?.playVideo();
  },
  pause: () => {
    window.ch[0]?.pauseVideo();
  },
  togglePlayPause: () => {
    if (window.ch[0]?.isPlaying()) {
      window.ch[0]?.pauseVideo();
    } else {
      window.ch[0]?.playVideo();
    }
  },
  mute: () => {
    window.ch[0]?.mute();
  },
  unmute: () => {
    window.ch[0]?.unMute();
  },
  toggleMuteUnmute: () => {
    if (window.ch[0]?.isMuted()) {
      window.ch[0]?.unMute();
    } else {
      window.ch[0]?.mute();
    }
  },
  setVolume: (volume: number) => {
    window.ch[0]?.setVolume(volume);
  },
  fadeoutVolume: (_time: number) => {
    console.warn("fadeoutVolume is not implemented");
  },
};

window.ch2 = {
  setVideo: (videoId: string | undefined) => {
    // レガシースクリプトでは、window.prepareVideoId を使用しているが、
    // 新しいスクリプトでは、window.mixer?.getPreparedVideoId() を使用しているため、
    // 互換性のために、window.prepareVideoId を使用している。
    const video = videoId ?? window.mixer?.getPreparedVideo();
    if (video) {
      window.ch[1]?.loadVideo(video);
    }
  },
  setSpeed: (speed: number) => {
    window.ch[1]?.setPlaybackRate(speed);
  },
  setTime: (time: number) => {
    window.ch[1]?.seekTo(time);
  },
  setFilter: (filters: Record<string, string>) => {
    window.ch[1]?.setFilters(filters);
  },
  hotcue: (cueId: number) => {
    if (window.ch[1]?.hasHotCue(cueId)) {
      window.ch[1]?.jumpToHotCue(cueId);
    } else {
      window.ch[1]?.setHotCue(cueId);
    }
  },
  addHotcue: (cueId: number) => {
    window.ch[1]?.setHotCue(cueId);
  },
  playHotcue: (cueId: number) => {
    window.ch[1]?.jumpToHotCue(cueId);
  },
  removeHotcue: (cueId: number) => {
    window.ch[1]?.deleteHotCue(cueId);
  },
  suspendPreview: () => {
    console.warn("suspendPreview is not implemented");
  },
  resumePreview: () => {
    console.warn("resumePreview is not implemented");
  },
  adjustTiming: (_time: number) => {
    const currentTime = window.ch[1]?.getCurrentTime();
    if (currentTime === undefined) {
      return;
    }
    window.ch[1]?.seekTo(Number(currentTime) + _time);
  },
  loopStart: () => {
    window.ch[1]?.setLoopStart();
  },
  loopEnd: () => {
    window.ch[1]?.setLoopEnd();
  },
  loopClear: () => {
    window.ch[1]?.clearLoop();
  },
  play: () => {
    window.ch[1]?.playVideo();
  },
  pause: () => {
    window.ch[1]?.pauseVideo();
  },
  togglePlayPause: () => {
    if (window.ch[1]?.isPlaying()) {
      window.ch[1]?.pauseVideo();
    } else {
      window.ch[1]?.playVideo();
    }
  },
  mute: () => {
    window.ch[1]?.mute();
  },
  unmute: () => {
    window.ch[1]?.unMute();
  },
  toggleMuteUnmute: () => {
    if (window.ch[1]?.isMuted()) {
      window.ch[1]?.unMute();
    } else {
      window.ch[1]?.mute();
    }
  },
  setVolume: (volume: number) => {
    window.ch[1]?.setVolume(volume);
  },
  fadeoutVolume: (_time: number) => {
    console.warn("fadeoutVolume is not implemented");
  },
};

window.Library = {
  actions: {
    up: () => {
      window.library?.navigation.selectPrev();
    },
    down: () => {
      window.library?.navigation.selectNext();
    },
    changeFocus: () => {
      window.library?.navigation.changeFocus();
    },
  },
};
