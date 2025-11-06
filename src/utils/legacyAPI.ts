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
  setFilter: (filter: string) => void;
  hotcue: (cue: number) => void;
  addHotcue: (cue: number) => void;
  playHotcue: (cue: number) => void;
  removeHotcue: (cue: number) => void;
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
  };
}

// レガシーAPIの型定義
declare global {
  interface Window {
    ch1: LegacyDeckAPI | null;
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
  setVideo: (videoId: string) => {
    // レガシースクリプトでは、window.prepareVideoId を使用しているが、
    // 新しいスクリプトでは、window.mixer?.getPreparedVideoId() を使用しているため、
    // 互換性のために、window.prepareVideoId を使用している。
    window.ch[0]?.loadVideoById(videoId ?? window.mixer?.getPreparedVideoId() ?? "");
  },
  setSpeed: (speed: number) => {
    window.ch[0]?.setPlaybackRate(speed);
  },
  setTime: (time: number) => {
    window.ch[0]?.seekTo(time, false);
  },
  setFilter: (_filter: string) => {
    console.warn("setFilter is not implemented");
  },
  hotcue: (_cue: number) => {
    console.warn("hotcue is not implemented");
  },
  addHotcue: (_cue: number) => {
    console.warn("addHotcue is not implemented");
  },
  playHotcue: (_cue: number) => {
    console.warn("playHotcue is not implemented");
  },
  removeHotcue: (_cue: number) => {
    console.warn("removeHotcue is not implemented");
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
    window.ch[0]?.seekTo(Number(currentTime) + _time, false);
  },
  loopStart: () => {
    console.warn("loopStart is not implemented");
  },
  loopEnd: () => {
    console.warn("loopEnd is not implemented");
  },
  loopClear: () => {
    console.warn("loopClear is not implemented");
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

window.Library = {
  actions: {
    up: () => {
      window.library?.navigation.selectPrev();
    },
    down: () => {
      window.library?.navigation.selectNext();
    },
  },
};
