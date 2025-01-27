let templates = [
  {
    name: "Crossfader",
    code: "const val = value / 0x7f;\n\nsetCrossfader((val - 0.5) * 2);",
  },
  {
    name: "Ch1_Load",
    code: "if (data2 === 0x7f) {\n  ch1.setVideo(prepareVideoId);\n}",
  },
  {
    name: "Ch1_Play",
    code: "if (data2 == 0x7f) {\n  ch1.play();\n}",
  },
  {
    name: "Ch1_Pause",
    code: "if (data2 === 0x7f) {\n  ch1.pause();\n}",
  },
  {
    name: "Ch1_Play/Pause",
    code: "if (data2 === 0x7f) {\n  ch1.togglePlayPause();\n}",
  },
  {
    name: "Ch1_Mute",
    code: "if (data2 == 0x7f) {\n  ch1.mute();\n}",
  },
  {
    name: "Ch1_Unmute",
    code: "if (data2 === 0x7f) {\n  ch1.unmute();\n}",
  },
  {
    name: "Ch1_Mute/Unmute",
    code: "if (data2 === 0x7f) {\n  ch1.toggleMuteUnmute();\n}",
  },
  {
    name: "Ch1_Speed",
    code: "// x0.25～x2.00\nconst val = value / 0x7f;\nif (value < 0x40) {\n  speed = 0.25 + val * 1.5;\n} else {\n  speed = val * 2;\n}\nch1.setSpeed(speed);",
  },
  {
    name: "Ch1_Speed_x1.00",
    code: "if (data2 === 0x7f) {\n  ch1.setSpeed(1.00);\n}",
  },
  {
    name: "Ch1_Adjust",
    code: "if (value < 0x40) {\n  ch1.adjustTiming(+0.005 * value);\n} else {\n  ch1.adjustTiming(-0.005 * (0x80-value));\n}",
  },
  {
    name: "Ch1_Adjust_ToTop",
    code: "if (data2 === 0x7f) {\n  ch1.setTime(0);\n}",
  },
  {
    name: "Ch1_Adjust_-1s",
    code: "if (data2 === 0x7f) {\n  ch1.adjustTiming(-1);\n}",
  },
  {
    name: "Ch1_Adjust_+1s",
    code: "if (data2 === 0x7f) {\n  ch1.adjustTiming(+1);\n}",
  },
  {
    name: "Ch1_Hotcue1",
    code: "const index = 1;\n\nif (value === 0x7f) {\n  ch1.hotcue(index);\n}",
  },
  {
    name: "Ch1_Hotcue2",
    code: "const index = 2;\n\nif (value === 0x7f) {\n  ch1.hotcue(index);\n}",
  },
  {
    name: "Ch1_Hotcue3",
    code: "const index = 3;\n\nif (value === 0x7f) {\n  ch1.hotcue(index);\n}",
  },
  {
    name: "Ch1_Hotcue4",
    code: "const index = 4;\n\nif (value === 0x7f) {\n  ch1.hotcue(index);\n}",
  },
  {
    name: "Ch1_RemoveHotcue1",
    code: "const index = 1;\n\nif (value === 0x7f) {\n  ch1.removeHotcue(index);\n}",
  },
  {
    name: "Ch1_RemoveHotcue2",
    code: "const index = 2;\n\nif (value === 0x7f) {\n  ch1.removeHotcue(index);\n}",
  },
  {
    name: "Ch1_RemoveHotcue3",
    code: "const index = 3;\n\nif (value === 0x7f) {\n  ch1.removeHotcue(index);\n}",
  },
  {
    name: "Ch1_RemoveHotcue4",
    code: "const index = 4;\n\nif (value === 0x7f) {\n  ch1.removeHotcue(index);\n}",
  },
  {
    name: "Ch1_Filter_Opacity",
    code: "const val = value / 0x7f;\nch1.setFilter({\n  opacity: val\n});",
  },
  {
    name: "Ch2_Load",
    code: "if (data2 === 0x7f) {\n  ch2.setVideo(prepareVideoId);\n}",
  },
  {
    name: "Ch2_Play",
    code: "if (data2 == 0x7f) {\n  ch2.play();\n}",
  },
  {
    name: "Ch2_Pause",
    code: "if (data2 === 0x7f) {\n  ch2.pause();\n}",
  },
  {
    name: "Ch2_Play/Pause",
    code: "if (data2 === 0x7f) {\n  ch2.togglePlayPause();\n}",
  },
  {
    name: "Ch2_Mute",
    code: "if (data2 == 0x7f) {\n  ch2.mute();\n}",
  },
  {
    name: "Ch2_Unmute",
    code: "if (data2 === 0x7f) {\n  ch2.unmute();\n}",
  },
  {
    name: "Ch2_Mute/Unmute",
    code: "if (data2 === 0x7f) {\n  ch2.toggleMuteUnmute();\n}",
  },
  {
    name: "Ch2_Speed",
    code: "// x0.25～x2.00\nconst val = value / 0x7f;\nif (value < 0x40) {\n  speed = 0.25 + val * 1.5;\n} else {\n  speed = val * 2;\n}\nch2.setSpeed(speed);",
  },
  {
    name: "Ch2_Speed_x1.00",
    code: "if (data2 === 0x7f) {\n  ch2.setSpeed(1.00);\n}",
  },
  {
    name: "Ch2_Adjust",
    code: "if (value < 0x40) {\n  ch2.adjustTiming(+0.005 * value);\n} else {\n  ch2.adjustTiming(-0.005 * (0x80-value));\n}",
  },
  {
    name: "Ch2_Adjust_ToTop",
    code: "if (data2 === 0x7f) {\n  ch2.setTime(0);\n}",
  },
  {
    name: "Ch2_Adjust_-1s",
    code: "if (data2 === 0x7f) {\n  ch2.adjustTiming(-1);\n}",
  },
  {
    name: "Ch2_Adjust_+1s",
    code: "if (data2 === 0x7f) {\n  ch2.adjustTiming(+1);\n}",
  },
  {
    name: "Ch2_Hotcue1",
    code: "const index = 1;\n\nif (value === 0x7f) {\n  ch2.hotcue(index);\n}",
  },
  {
    name: "Ch2_Hotcue2",
    code: "const index = 2;\n\nif (value === 0x7f) {\n  ch2.hotcue(index);\n}",
  },
  {
    name: "Ch2_Hotcue3",
    code: "const index = 3;\n\nif (value === 0x7f) {\n  ch2.hotcue(index);\n}",
  },
  {
    name: "Ch2_Hotcue4",
    code: "const index = 4;\n\nif (value === 0x7f) {\n  ch2.hotcue(index);\n}",
  },
  {
    name: "Ch2_RemoveHotcue1",
    code: "const index = 1;\n\nif (value === 0x7f) {\n  ch2.removeHotcue(index);\n}",
  },
  {
    name: "Ch2_RemoveHotcue2",
    code: "const index = 2;\n\nif (value === 0x7f) {\n  ch2.removeHotcue(index);\n}",
  },
  {
    name: "Ch2_RemoveHotcue3",
    code: "const index = 3;\n\nif (value === 0x7f) {\n  ch2.removeHotcue(index);\n}",
  },
  {
    name: "Ch2_RemoveHotcue4",
    code: "const index = 4;\n\nif (value === 0x7f) {\n  ch2.removeHotcue(index);\n}",
  },
  {
    name: "Ch2_Filter_Opacity",
    code: "const val = value / 0x7f;\nch2.setFilter({\n  opacity: val\n});",
  },
  {
    name: "Library_ChangeFocus",
    code: "if (value === 0x7f) {\n  Library.actions.changeFocus();\n}",
  },
  {
    name: "Library_Move",
    code: "if (value === 0x7f) {\n  Library.actions.up();\n} else {\n  Library.actions.down();\n}",
  },
];
