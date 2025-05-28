/**
 * MIDIコントローラー用テンプレートコード
 * カテゴリ別に整理されたテンプレート集
 */

/**
 * 共通テンプレート
 */
const COMMON_TEMPLATES = {
  crossfader: {
    name: "Crossfader",
    code: "const val = value / 0x7f;\n\nsetCrossfader((val - 0.5) * 2);",
  },
  libraryChangeFocus: {
    name: "Library_ChangeFocus",
    code: "if (value === 0x7f) {\n  Library.actions.changeFocus();\n}",
  },
  libraryMove: {
    name: "Library_Move",
    code: "if (value === 0x7f) {\n  Library.actions.up();\n} else {\n  Library.actions.down();\n}",
  },
};

/**
 * チャンネル別テンプレート生成関数
 * @param {number} channel - チャンネル番号 (1 or 2)
 * @returns {Object} チャンネル用テンプレート
 */
function createChannelTemplates(channel) {
  const chVar = `ch${channel}`;

  return {
    load: {
      name: `Ch${channel}_Load`,
      code: `if (data2 === 0x7f) {\n  ${chVar}.setVideo(prepareVideoId);\n}`,
    },
    play: {
      name: `Ch${channel}_Play`,
      code: `if (data2 == 0x7f) {\n  ${chVar}.play();\n}`,
    },
    pause: {
      name: `Ch${channel}_Pause`,
      code: `if (data2 === 0x7f) {\n  ${chVar}.pause();\n}`,
    },
    playPause: {
      name: `Ch${channel}_Play/Pause`,
      code: `if (data2 === 0x7f) {\n  ${chVar}.togglePlayPause();\n}`,
    },
    mute: {
      name: `Ch${channel}_Mute`,
      code: `if (data2 == 0x7f) {\n  ${chVar}.mute();\n}`,
    },
    unmute: {
      name: `Ch${channel}_Unmute`,
      code: `if (data2 === 0x7f) {\n  ${chVar}.unmute();\n}`,
    },
    muteToggle: {
      name: `Ch${channel}_Mute/Unmute`,
      code: `if (data2 === 0x7f) {\n  ${chVar}.toggleMuteUnmute();\n}`,
    },
    volume: {
      name: `Ch${channel}_Volume`,
      code: `const val = value / 0x7f;\n\n${chVar}.setVolume(parseInt(val * 100));`,
    },
    speed: {
      name: `Ch${channel}_Speed`,
      code: `// x0.25～x2.00\nconst val = value / 0x7f;\nif (value < 0x40) {\n  speed = 0.25 + val * 1.5;\n} else {\n  speed = val * 2;\n}\n${chVar}.setSpeed(speed);`,
    },
    speedReset: {
      name: `Ch${channel}_Speed_x1.00`,
      code: `if (data2 === 0x7f) {\n  ${chVar}.setSpeed(1.00);\n}`,
    },
    adjust: {
      name: `Ch${channel}_Adjust`,
      code: `if (value < 0x40) {\n  ${chVar}.adjustTiming(+0.005 * value);\n} else {\n  ${chVar}.adjustTiming(-0.005 * (0x80-value));\n}`,
    },
    adjustToTop: {
      name: `Ch${channel}_Adjust_ToTop`,
      code: `if (data2 === 0x7f) {\n  ${chVar}.setTime(0);\n}`,
    },
    adjustMinus1s: {
      name: `Ch${channel}_Adjust_-1s`,
      code: `if (data2 === 0x7f) {\n  ${chVar}.adjustTiming(-1);\n}`,
    },
    adjustPlus1s: {
      name: `Ch${channel}_Adjust_+1s`,
      code: `if (data2 === 0x7f) {\n  ${chVar}.adjustTiming(+1);\n}`,
    },
    loopStart: {
      name: `Ch${channel}_LoopStart`,
      code: `if (value === 0x7f) {\n  ${chVar}.loopStart();\n}`,
    },
    loopEnd: {
      name: `Ch${channel}_LoopEnd`,
      code: `if (value === 0x7f) {\n  ${chVar}.loopEnd();\n}`,
    },
    loopClear: {
      name: `Ch${channel}_LoopClear`,
      code: `if (value === 0x7f) {\n  ${chVar}.loopClear();\n}`,
    },
    filterOpacity: {
      name: `Ch${channel}_Filter_Opacity`,
      code: `const val = value / 0x7f;\n${chVar}.setFilter({\n  opacity: val\n});`,
    },
  };
}

/**
 * ホットキュー用テンプレート生成関数
 * @param {number} channel - チャンネル番号 (1 or 2)
 * @param {number} index - ホットキューインデックス (1-4)
 * @returns {Object} ホットキュー用テンプレート
 */
function createHotcueTemplates(channel, index) {
  const chVar = `ch${channel}`;

  return {
    hotcue: {
      name: `Ch${channel}_Hotcue${index}`,
      code: `const index = ${index};\n\nif (value === 0x7f) {\n  ${chVar}.hotcue(index);\n}`,
    },
    removeHotcue: {
      name: `Ch${channel}_RemoveHotcue${index}`,
      code: `const index = ${index};\n\nif (value === 0x7f) {\n  ${chVar}.removeHotcue(index);\n}`,
    },
  };
}

/**
 * 全テンプレートを生成
 * @returns {Array} テンプレート配列
 */
function generateAllTemplates() {
  const templates = [];

  // 共通テンプレートを追加
  Object.values(COMMON_TEMPLATES).forEach((template) => {
    templates.push(template);
  });

  // チャンネル1, 2のテンプレートを追加
  for (let channel = 1; channel <= 2; channel++) {
    const channelTemplates = createChannelTemplates(channel);
    Object.values(channelTemplates).forEach((template) => {
      templates.push(template);
    });

    // ホットキューテンプレートを追加 (1-4)
    for (let index = 1; index <= 4; index++) {
      const hotcueTemplates = createHotcueTemplates(channel, index);
      Object.values(hotcueTemplates).forEach((template) => {
        templates.push(template);
      });
    }
  }

  return templates;
}

/**
 * カテゴリ別テンプレート取得
 * @returns {Object} カテゴリ別に整理されたテンプレート
 */
export function getTemplatesByCategory() {
  return {
    common: Object.values(COMMON_TEMPLATES),
    channel1: Object.values(createChannelTemplates(1)),
    channel2: Object.values(createChannelTemplates(2)),
    hotcues: (() => {
      const hotcues = [];
      for (let channel = 1; channel <= 2; channel++) {
        for (let index = 1; index <= 4; index++) {
          const templates = createHotcueTemplates(channel, index);
          hotcues.push(...Object.values(templates));
        }
      }
      return hotcues;
    })(),
  };
}

/**
 * 既存のフォーマットでテンプレートを取得（後方互換性のため）
 * @returns {Array} テンプレート配列
 */
export function getTemplates() {
  return generateAllTemplates();
}

// デフォルトエクスポート（後方互換性のため）
export default generateAllTemplates();
