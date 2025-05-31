# MIDI Script Global Variables Structure

## 🎛️ Proposed Global Variable Organization

VJ/DJ操作に最適化されたグローバル変数の構成案

### 📊 Channel Operations (CH1, CH2)

```
CH1 (Channel 1)
├── Video Control
│   ├── setVideo(videoId)
│   ├── play()
│   ├── pause()
│   ├── togglePlayPause()        // Toggle between play/pause
│   └── setTime(seconds)
├── Timing & Speed
│   ├── setSpeed(rate)           // 0.25-2.0
│   ├── adjustTiming(seconds)    // -5 to +5
│   └── syncToTop()              // setTime(0)
├── Audio Control
│   ├── setVolume(0-100)
│   ├── mute()
│   ├── unmute()
│   └── toggleMute()             // Toggle mute/unmute (alias: toggleMuteUnmute)
├── Visual Effects
│   ├── setFilter({opacity: 0-1})
│   ├── setOpacity(0-1)
│   └── resetFilters()
├── Hotcues (1-9)
│   ├── hotcue(index)
│   ├── removeHotcue(index)
│   └── clearAllHotcues()
├── Loop Control
│   ├── loopStart()
│   ├── loopEnd()
│   ├── loopClear()
│   └── toggleLoop()
└── Properties
    ├── channelNumber            // 1
    ├── isPlaying
    ├── isMuted
    └── currentTime

CH2 (Channel 2)
└── [Same structure as CH1]
```

### 🎚️ Mixer Operations (MIXER)

```
MIXER
├── Crossfader
│   ├── setCrossfader(-1 to +1)
│   ├── switchVideo()            // Auto crossfade
│   └── setSwitchingDuration(ms)
├── Channel Selection
│   ├── selectChannel(1|2)
│   ├── getSelectedChannel()
│   └── toggleChannel()
├── Load Operations
│   ├── loadVideo(videoId)       // Load to selected channel
│   ├── prepareVideo(videoId)    // Prepare for loading
│   ├── getPreparedVideoId()     // Get prepared video ID (alternative)
│   └── swapChannels()
└── Status
    ├── crossfaderValue
    ├── selectedChannel
    ├── preparedVideoId          // Currently prepared video ID (legacy support)
    └── isSwitching
```

### 🎯 Master Controls (MASTER)

```
MASTER
├── Audio Controls               // [Category - for organization only]
│   ├── setMasterVolume(0-100)   // MASTER.setMasterVolume()
│   ├── muteMaster()             // MASTER.muteMaster()
│   └── unmuteMaster()           // MASTER.unmuteMaster()
├── Global Controls              // [Category - for organization only]
│   ├── pauseAll()               // MASTER.pauseAll()
│   ├── muteAll()                // MASTER.muteAll()
│   └── resetAll()               // MASTER.resetAll()
└── System Settings              // [Category - for organization only]
    ├── setFadeoutVolume(boolean) // MASTER.setFadeoutVolume()
    ├── setAPIKey(key)           // MASTER.setAPIKey()
    └── getSystemStatus()        // MASTER.getSystemStatus()
```

**Note**: カテゴリ名（Audio Controls等）はドキュメント上の整理目的のみで、実際のAPIには含まれません。

### 📱 Application Controls (APP)

```
APP
├── Window Management            // [Category - for organization only]
│   ├── openProjection()         // APP.openProjection()
│   ├── openProjectionPreview()  // APP.openProjectionPreview()
│   ├── closeProjection()        // APP.closeProjection()
│   ├── openLibrary()            // APP.openLibrary()
│   └── closeLibrary()           // APP.closeLibrary()
├── External Applications        // [Category - for organization only]
│   └── openYouTube()            // APP.openYouTube()
├── Utilities                    // [Category - for organization only]
│   ├── parseVideoId(input)      // APP.parseVideoId()
│   ├── formatTime(seconds)      // APP.formatTime()
│   └── validateInput(value)     // APP.validateInput()
└── Debug & Development          // [Category - for organization only]
    ├── getDebugInfo()           // APP.getDebugInfo()
    ├── exportConfig()           // APP.exportConfig()
    ├── resetToDefaults()        // APP.resetToDefaults()
    ├── appManager               // APP.appManager (direct access)
    ├── channels[]               // APP.channels[] (array access)
    └── midi                     // APP.midi (direct access)
```

**Note**: カテゴリ名（Window Management等）はドキュメント上の整理目的のみで、実際のAPIには含まれません。

### 📚 Library Operations (LIBRARY)

```
LIBRARY
├── Navigation Actions           // [Category - for organization only]
│   ├── up()                     // LIBRARY.actions.up() | LIBRARY.up()
│   ├── down()                   // LIBRARY.actions.down() | LIBRARY.down()
│   └── changeFocus()            // LIBRARY.actions.changeFocus() | LIBRARY.changeFocus()
├── File Operations              // [Category - for organization only]
│   ├── loadPlaylist()           // LIBRARY.loadPlaylist()
│   ├── savePlaylist()           // LIBRARY.savePlaylist()
│   └── exportHistory()          // LIBRARY.exportHistory()
├── Search & Browse              // [Category - for organization only]
│   ├── search(keyword)          // LIBRARY.search()
│   ├── filterByCategory()       // LIBRARY.filterByCategory()
│   └── getHistory()             // LIBRARY.getHistory()
├── Video Management             // [Category - for organization only]
│   ├── addToPlaylist(videoId)   // LIBRARY.addToPlaylist()
│   ├── removeFromPlaylist(videoId) // LIBRARY.removeFromPlaylist()
│   └── clearHistory()           // LIBRARY.clearHistory()
└── UI Control                   // [Category - for organization only]
    ├── show()                   // LIBRARY.show()
    ├── hide()                   // LIBRARY.hide()
    └── toggle()                 // LIBRARY.toggle()
```

**Note**: Navigation Actionsは `LIBRARY.actions.method()` または `LIBRARY.method()` の両方でアクセス可能にして後方互換性を維持します。

### ⚙️ System Access (SYSTEM)

```
SYSTEM
├── Core Access
│   ├── appManager
│   ├── channels[]               // Array access [CH1, CH2]
│   └── midi
├── Utilities
│   ├── parseVideoId(input)
│   ├── formatTime(seconds)
│   └── validateInput(value)
└── Debug & Development
    ├── getDebugInfo()
    ├── exportConfig()
    └── resetToDefaults()
```

## 🔢 Channel Indexing Strategy

### Recommendation: Dual Index Support

```javascript
// Human-friendly (1-based) - Primary for MIDI scripts
CH1, CH2                        // Direct access
MIXER.selectChannel(1)          // 1-based selection

// Programmer-friendly (0-based) - For internal/advanced use
APP.channels[0], APP.channels[1]    // Array access
MIXER.selectChannel(0)          // 0-based selection (alternative)
```

**Rationale:**
- **1-based (CH1, CH2)**: Natural for DJs/VJs, matches physical controllers
- **0-based arrays**: Familiar for developers, allows iteration
- **Both supported**: Maximum flexibility

## 🏷️ Naming Convention Rules

### Global Variable Names: **SCREAMING_SNAKE_CASE**
```javascript
CH1, CH2            // Channel identifiers
MIXER               // Mixer controls
MASTER              // Master controls  
LIBRARY             // Library system
APP                 // Application controls
```

### Method Names: **camelCase**
```javascript
CH1.setVideo()      // Method names
CH1.toggleMute()    // Action methods
MIXER.setCrossfader() // Mixer methods
```

### Property Names: **camelCase**
```javascript
CH1.channelNumber   // Properties
CH1.isPlaying       // Boolean properties
MIXER.crossfaderValue // Value properties
```

## 📝 Usage Examples

### Basic Channel Control
```javascript
// Load and play video on Channel 1
CH1.setVideo('dQw4w9WgXcQ');
CH1.play();
CH1.setVolume(80);

// Quick mute toggle
CH1.toggleMute();
```

### Crossfader Control
```javascript
// Manual crossfader
MIXER.setCrossfader(0.5);    // 50% mix

// Auto switch with custom duration
MIXER.setSwitchingDuration(2000);  // 2 seconds
MIXER.switchVideo();
```

### Hotcue Operations
```javascript
// Set and trigger hotcues
CH1.hotcue(1);              // Jump to hotcue 1
CH2.removeHotcue(3);        // Remove hotcue 3
```

### Advanced Control
```javascript
// Sync timing between channels
const ch1Time = CH1.currentTime;
CH2.setTime(ch1Time);
CH2.setSpeed(CH1.speed);
```

### Library Navigation
```javascript
// Traditional hierarchical access (backward compatible)
LIBRARY.actions.up();
LIBRARY.actions.down();
LIBRARY.actions.changeFocus();

// Direct access (new simplified syntax)
LIBRARY.up();
LIBRARY.down();
LIBRARY.changeFocus();

// Combined navigation and loading
LIBRARY.down();
LIBRARY.actions.changeFocus();
const selectedVideo = LIBRARY.getSelectedVideo();
CH1.setVideo(selectedVideo);
```

### Application Operations
```javascript
// Window management
APP.openProjection();
APP.openLibrary();

// Utility functions
const videoId = APP.parseVideoId('https://youtu.be/dQw4w9WgXcQ');
const timeString = APP.formatTime(125); // "2:05"
```

### MIDI Template Migration Examples
```javascript
// === CROSSFADER ===
// Before: setCrossfader((val - 0.5) * 2);
// After:
const val = value / 0x7f;
MIXER.setCrossfader((val - 0.5) * 2);

// === LIBRARY NAVIGATION ===
// Before: Library.actions.changeFocus();
// After (option 1): LIBRARY.actions.changeFocus();
// After (option 2): LIBRARY.changeFocus();

// === CHANNEL OPERATIONS ===
// Before: ch1.setVideo(prepareVideoId);
// After (backward compatible):
CH1.setVideo(prepareVideoId);
// Alternative (new syntax):
CH1.setVideo(MIXER.getPreparedVideoId());

// Before: ch2.toggleMuteUnmute();
// After:
CH2.toggleMute(); // or CH2.toggleMuteUnmute() for backward compatibility

// === HOTCUES ===
// Before: ch1.hotcue(index);
// After:
const index = 3;
CH1.hotcue(index);

// === SPEED CONTROL ===
// Before: ch1.setSpeed(speed);
// After:
const val = value / 0x7f;
const speed = value < 0x40 ? 0.25 + val * 1.5 : val * 2;
CH1.setSpeed(speed);
```

## 🎵 Benefits of This Structure

1. **Intuitive for VJs/DJs**: Matches physical controller layout
2. **MIDI Script Friendly**: Clear, concise function calls
3. **Discoverable**: Logical grouping makes functions easy to find
4. **Extensible**: Easy to add new functions within existing structure
5. **Backward Compatible**: Can coexist with current implementation
6. **Type-Safe**: Clear parameter expectations and return values
7. **Complete MIDI Template Coverage**: All existing MIDI templates can be migrated
8. **Alias Support**: Legacy function names (like toggleMuteUnmute) maintained for compatibility

## 🔄 Migration Strategy

1. **Phase 1**: Implement new structure alongside existing globals
2. **Phase 2**: Update MIDI templates to use new structure
3. **Phase 3**: Deprecate old individual window functions (optional)
4. **Phase 4**: Update documentation and examples

This structure transforms verbose MIDI scripts into clean, readable code that matches the mental model of VJ/DJ workflows. 