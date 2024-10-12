# YT.PlayerState に関するメモ

| Key       | Value |
| --------- | ----- |
| UNSTARTED | -1    |
| ENDED     | 0     |
| PLAYING   | 1     |
| PAUSED    | 2     |
| BUFFERING | 3     |
| CUED      | 5     |

## State 遷移

- 動画変更時
  - PAUSED
  - UNSTARTED
  - BUFFERING
  - UNSTARTED
  - BUFFERING
  - PLAYING
- 再生位置変更時
  - PAUSED
  - BUFFERING
  - PLAYING
- 動画終了時
  - ENDED
  - PLAYING
  - BUFFERING
  - PLAYING
