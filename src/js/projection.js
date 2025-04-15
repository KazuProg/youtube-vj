import '../scss/projection.scss';
import VJPlayer from './components/VJPlayer.js';
import Storage from './utils/Storage.js';

// 初期化関数
function init(fullscreen = false) {
  // 初期化ボタンを非表示
  document.getElementById('init_button').style.display = 'none';
  
  // フルスクリーン設定
  if (fullscreen) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error('フルスクリーン開始エラー:', err);
    });
  }
  
  // プレイヤーの初期化
  const players = [
    new VJPlayer(0, { isProjection: true }),
    new VJPlayer(1, { isProjection: true })
  ];
  
  // ローカルストレージの変更を監視
  window.addEventListener('storage', handleStorageChange);
  
  // スケール設定を適用
  applyScale();
  
  // 親ウィンドウに準備完了を通知
  if (window.opener) {
    window.opener.document.getElementById('projection-status')
      .querySelector('.indicator').classList.add('active');
  }
  
  // ウィンドウが閉じられたときの処理
  window.addEventListener('beforeunload', () => {
    if (window.opener) {
      window.opener.document.getElementById('projection-status')
        .querySelector('.indicator').classList.remove('active');
    }
  });
}

/**
 * ストレージ変更のハンドラ
 * @param {StorageEvent} event - ストレージイベント
 */
function handleStorageChange(event) {
  // スケール変更時の処理
  if (event.key === 'config-projection-scale') {
    applyScale();
  }
}

/**
 * プロジェクション画面のスケールを適用
 */
function applyScale() {
  const scale = Storage.load('config-projection-scale', 1);
  document.querySelectorAll('.player_container').forEach(container => {
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = 'center center';
  });
}

// イベントリスナー
document.addEventListener('DOMContentLoaded', () => {
  // 初期化ボタンのイベント設定
  document.querySelectorAll('[data-init]').forEach(button => {
    button.addEventListener('click', () => {
      const isFullscreen = button.dataset.init === 'fullscreen';
      init(isFullscreen);
    });
  });
  
  // キーボードショートカット
  document.addEventListener('keydown', (event) => {
    // Escキーでフルスクリーン解除
    if (event.key === 'Escape' && document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    // Fキーでフルスクリーン切替
    if (event.key === 'f') {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
      event.preventDefault();
    }
  });
});

// グローバルに公開
window.init = init; 