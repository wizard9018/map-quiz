# 游戏 5：晓晓和云扬混合录音

用户选择 EasyVoice 试听中的 1（晓晓）与 4（云扬）。140 个词逐词独立随机分配这两种音色，固定于 manifest.json；重播不会改变声音。编号与 focus-batch-games.js 的 audioWords 一致。

2026-10-03 使用 cosin2077/easyVoice 的 runEdgeTTS 服务，版本 0caca0c，默认语速 0%、音调 0Hz、音量 0%；MP3 转为 24kHz 单声道 PCM16 WAV。原录音和 Qwen3 候选录音均保留，游戏只更换词语文件路径，关卡规则、词库及播放速度不变。

复现：在 C:\Users\wizar\Gemini\easyVoice\packages\backend 运行 `npx tsx generate-focus-all.ts`。脚本沿用 manifest 的分配，跳过已完成 WAV；源 MP3 在 EasyVoice 的 audio/focus-game5 目录。本地试玩无需运行 EasyVoice 服务。
