#updateSeekBar() {
  const timing = this.#dataManager.timing;
  const duration = this.#dataManager.duration;
  
  console.log("[SeekBarManager] Updating seek bar:", {
    timing,
    duration,
    currentTime: this.#vjPlayer.currentTime,
    playerTime: timing.playerTime
  });

  if (!timing || !duration) {
    console.log("[SeekBarManager] Missing timing or duration data");
    return;
  }

  const progress = (timing.playerTime / duration) * 100;
  console.log("[SeekBarManager] Calculated progress:", progress);
  
  this.#seekBar.style.width = `${progress}%`;
}

#onDataChanged(key, value) {
  console.log("[SeekBarManager] Data changed:", { key, value });
  
  if (key === "timing") {
    console.log("[SeekBarManager] Timing updated:", {
      newTiming: value,
      currentTime: this.#vjPlayer.currentTime,
      playerTime: value.playerTime
    });
    this.#updateSeekBar();
  }
} 