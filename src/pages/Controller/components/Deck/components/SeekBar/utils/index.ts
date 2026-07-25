export const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const toPercentage = (value: number, total: number): number => {
  return total > 0 ? (value / total) * 100 : 0;
};
