# K12 专注力 50 款科学认知训练系统与测试平台技术交接文档

> **项目名称**：K12 专注力 50 款科学认知训练系统 (Focus Training 50)  
> **宿主工程**：[World Countries Map Quiz](https://wizard9018.github.io/map-quiz/)  
> **代码仓库**：`https://github.com/wizard9018/map-quiz.git` (分支：`master`)  
> **在线访问**：`https://wizard9018.github.io/map-quiz/?tab=focus`  
> **本地访问**：`http://127.0.0.1:8080/index.html?tab=focus`  
> **交接日期**：2026-09-29  

---

## 一、 项目背景与业务目标

本项目旨在为中小学学生（K12）提供一套基于神经认知科学（前额叶认知控制、双重工作记忆、视觉搜索、选择性注意与抑制控制）的**50 款专注力小游戏 Web 互动测试与测评转化系统**。

系统以轻量、无外部依赖、免下载、跨设备适配（移动端手机、平板、桌面端）为原则，深度整合进现有的 `World Countries Map Quiz` 网站，形成独立 Tab，并构建了包含 **关卡挑战 -> 容错机制 -> 1v1 好友 PK -> 省份均分天梯评定 -> 专家咨询领取7天资料 -> 裂变分享 PK** 的完整运营转化闭环。

---

## 二、 系统架构与文件资产目录

本模块采用微模块解耦架构，独立为 `focus.html` + `focus.css` + `focus.js`，通过 `<iframe>` 嵌入到宿主主站 `index.html` 的 `Focus 专注力` Tab 中，既保证与原地图 Quiz 互不干扰，又支持独立以手机模式访问。

```
C:\Users\wizar\Others\map-quiz/
├── index.html               # 宿主首页，包含顶部 Tab 切换与 focus-frame iframe
├── focus.html               # 50款小游戏核心视界 HTML（手机壳容器、状态栏、手势区、战报弹窗）
├── focus.css                # 游戏样式表（Duolingo卡通质感、响应式视界、心数动画、战报卡片）
├── focus.js                 # 核心运行引擎（50款注册表、关卡控制、Web Audio音效、战报计算）
├── start_server.js          # 本地静态文件极简 HTTP 服务器脚本 (端口 8080)
├── 启动本地测试.bat          # Windows 一键启动脚本（启动 node 服务并自动打开浏览器）
└── HANDOVER.md              # 本技术交接文档
```

---

## 三、 50 款小游戏学堂分类体系与引擎映射

系统将 50 款游戏划分为四大认知训练学堂，所有游戏均配置在 `focus.js` 的 `REGISTRY` 对象中：

### 1. 工作记忆学堂 (Working Memory, 14 款)
* **核心范式**：Dual N-Back（空间/地名/数字/符号）、Corsi 散点块、时序正反序复现。
* **游戏清单**：
  1. `nback_spatial`：2-back 空间九宫格记忆挑战
  2. `places_nback`：地名序列 2-Back 刷新
  3. `numbers_nback`：数字时序 2-Back 挑战
  4. `letters_nback`：少儿图形符号 2-Back
  5. `spatial_grid_136`：136 双色优先级空间瞬记（先蓝后黄）
  6. `spatial_grid_5x5`：5×5 矩阵高密度方块瞬记
  7. `sequence_timeline`：时序先后正序复原
  8. `sequence_reverse`：逆序时序倒放检索
  9. `visual_flash_afterimage`：380ms 极短残影单点闪记
  10. `pattern_separation_26`：海马体模式分离位移判断
  11. `dual_task_memory_33`：双重任务认知资源分配（九宫格+心算）
  12. `short_term_memory_37`：Corsi 散点空间跨度提取
  13. `detective_memory_61`：名侦探服饰细节排位瞬记
  14. `auditory_sentence_order_92`：听觉句子时序重组比对

### 2. 深度专注学堂 (Focused Attention, 8 款)
* **核心范式**：舒尔特方格注意力阶梯递进训练、极限视界搜索、罗马/噪波/动态旋转方格。
* **游戏清单**：
  1. `schulte_classic`：**第 1 款游戏：舒尔特方格注意力阶梯训练**（3x3 到 6x6 进阶）
  2. `schulte_3x3`：启蒙 3×3 英文字母舒尔特
  3. `schulte_4x4`：进阶 4×4 中文数词汉字舒尔特
  4. `schulte_6x6`：高阶 6×6 舒尔特方格
  5. `schulte_7x7`：挑战 7×7 极限大视野舒尔特
  6. `schulte_rotate`：圆盘动态旋转舒尔特
  7. `schulte_reverse`：6阶倒序舒尔特挑战（从 36 倒点至 1）
  8. `schulte_extended_27`：罗马数字噪波舒尔特方格

### 3. 前额叶自控学堂 (Inhibition Control, 14 款)
* **核心范式**：Stroop 色词抗干扰、Go/No-Go 冲动抑制、反向指令控制、逢7/逢3放行。
* **游戏清单**：
  1. `stroop_color_word`：Stroop 字色与字义相符矩阵筛选
  2. `stroop_speed_switch`：高频冷暖色规则快速切换
  3. `seven_inhibition`：数字跑马灯逢7/含7克制点击
  4. `three_inhibition`：数字跑马灯逢3倍数克制点击
  5. `animal_zoo_gonogo`：动物萌宠放行，猛兽克制击键
  6. `traffic_go_nogo`：红绿灯经典 Go/No-Go 反应测试
  7. `cpt_continuous_performance`：CPT 罕见字母 X 警觉测试
  8. `impulse_control_131`：见左点右/见右点左 反向控制
  9. `eye_mouth_coord_34`：上下左右反向四方按键抑制
  10. `eye_hand_coord_30`：箭头跟随快速击键
  11. `dual_task_split_55`：红球凝视中心 + 干扰字符计数
  12. `visual_interference_126`：多色块干扰下数值最大数挑选
  13. `alertness_network_25`：无预警突发视听刺激捕捉
  14. `brain_science_inhibit_90`：两难冲突决策抑制

### 4. 视觉敏捷与空间感知学堂 (Visual Agility & Spatial Perception, 14 款)
* **核心范式**：MOT 多目标动态追踪、心智旋转、轴对称折叠、微特征形近字找不同。
* **游戏清单**：
  1. `mot_ball_tracking`：MOT 多目标动态小球运动轨迹追踪
  2. `visual_tracking_47`：错综复杂多目标小球动态锁定
  3. `visual_tracking_57`：复杂交叉线条终点追寻
  4. `visual_motion_71`：反向旋转猫咪动态敏捷捕捉
  5. `hanzi_spot_diff`：汉字形近微特征找不同（如群王寻玉）
  6. `hanzi_diff_reverse`：黑白反转底色笔画差异辨析
  7. `mental_clock_rotation`：镜中时钟心智推算真实时间
  8. `reverse_hanzi`：水平镜像翻转汉字短语识别
  9. `mirror_symmetry_spatial`：轴对称图形折叠重合判定
  10. `spatial_rotation_3d`：Shepard-Metzler 三维立体旋转比对
  11. `cube_count_hidden`：多层积木遮挡盲区心智透视
  12. `spatial_direction_arrow`：空间方位多级转向（左转90/右转180）
  13. `pattern_mirror_67`：非对称复杂图案角位移比对
  14. `spatial_depth_perception`：重叠与阴影深度远近知觉
  15. `paper_fold_hole`：对折打孔心智展开孔位脑内还原

---

## 四、 核心规则、关卡机制与测试支持

### 1. 舒尔特注意力阶梯规则（第 1 款游戏）
依据教学实战需求，第 1 款游戏配置了严格的阶梯式递进难度与限时机制：
* **第 1 关**：3×3 方格 (1~9)，限时 **20s**
* **第 2 关**：3×3 方格 (1~9)，限时 **15s**
* **第 3 关**：3×3 方格 (1~9)，限时 **10s**
* **第 4 关**：4×4 方格 (1~16)，限时 **20s**
* **第 5 关**：4×4 方格 (1~16)，限时 **15s**
* **第 6 关**：4×4 方格 (1~16)，限时 **10s**
* **第 7 关**：5×5 方格 (1~25)，限时 **20s**
* **第 8 关**：5×5 方格 (1~25)，限时 **15s**
* **第 9 关**：5×5 方格 (1~25)，限时 **10s**
* **第 10 关**：6×6 方格 (1~36)，限时 **20s**

### 2. 空间 2-Back 规则（第 2 款游戏）
* 舞台为纯净的 3×3 九宫格；
* **第 1 步**：高亮闪烁第 1 个位置，提示玩家记住；
* **第 2 步**：高亮闪烁第 2 个位置，提示玩家记住；
* **第 3 步起**：高亮闪烁当前方块，用户比对当前位置与【2步前】是否相同，点击底部 `🟢 相同 (Match)` 或 `🔴 不同 (Diff)`；
* 达成设定的达标连续正确次数后自动进入下一关。

### 3. 每关 3 次容错机制 (3 Lives)
* 每一关开始时，分配 **3 颗心（❤️❤️❤️）**；
* 点击错误、手势失误或倒计时耗尽时，心数 `-1`；
* 倒计时耗尽且仍有剩余心数时，在当前关卡重新开始，保留剩余心数；
* **当本关 3 次机会全部耗尽，游戏立即结束并触发终局评定战报**；
* 成功通关晋级到新关卡时，心数重新恢复满格 3 颗心。

### 4. 测试专用【直接失败】按钮
在顶部状态栏常驻 `💥 直接失败 (测试)` 按钮（`#btn-test-fail`）：
* 任意关卡点击后直接将生命值归零，秒级唤出当前关卡的测评报告，极大方便各关卡边界条件与报告界面的敏捷测试。

---

## 五、 战报评定体系与引流裂变闭环

测试结束时弹出的 `#report-modal` 包含了 4 个维度的完整交付物：

### 1. 1v1 好友 PK 对决战报
* **URL 传参机制**：支持读取 `?inviter=xxx&inviterScore=xx&inviterLevel=x`（缺省预设为“海淀·林同学 76分 第4关”）。
* **胜负评定**：
  * 若当前用户关卡高于邀请人，或同关卡总分高于邀请人：显示 **`👑 挑战大获全胜！`** 徽章及祝贺评语；
  * 若落后于邀请人：显示 **`💪 稍逊一筹·继续加油`** 徽章及逆袭加练评语。

### 2. 全国 31 省市天梯榜评定（加分 / 拖后腿）
* 内置全国 31 省市官方专注力常模基准分（北京 89.6、上海 88.5、江苏 87.2... 青海 71.2、西藏 70.5）；
* 提供出战省份即时切换下拉框（`#province-select`）；
* **高于本省均分**：展示绿色横幅 **`🏆 高于本省平均成绩 · 恭喜加分！`**，为全省排位拉榜；
* **低于本省均分**：展示橙红警示横幅 **`⚠️ 低于本省平均成绩 · 拖了后腿！`**，计算落后分差，提示给全省拖了后腿。

### 3. 专注力专家咨询与《7天提升资料》引流转化
* **高清矢量 SVG 二维码**：纯代码生成，无外部图片依赖，支持移动端长按或电脑端微信扫码；
* **一键复制微信号**：展示专属微信号 `ql_focus88`，配备 `#btn-copy-wechat` 一键写入剪贴板；
* **3 大核心权益**：7天脑力打卡营音频、粗心漏题防错手册 PDF、专家 1v1 诊断提分方案；
* **智能动态备注口令**：提示扫码时附带备注，如 `【专注力+第 4 关+85分】`，提升私域加微留存率。

### 4. 游戏结束后发给朋友挑战 PK 的裂变选项
* 点击战报底部的 **`⚔️ 发给朋友挑战 PK（比拼闯关级数）`** 按钮（`#btn-pk-share`）；
* 自动提取当前玩家的昵称、最高闯关级数、得分与全国战胜百分比，动态拼装专属挑战 URL 并写入剪贴板：
  ```text
  ⚔️ 我在【专注力 50 款小游戏】闯到了第 4 关 (85分)，战胜了全国 75% 的人！敢来挑战我吗？点击链接直接迎战 👉 https://wizard9018.github.io/map-quiz/?tab=focus&game=schulte_classic&inviter=你的好友&inviterScore=85&inviterLevel=4#schulte_classic
  ```

---

## 六、 音频引擎设计 (Web Audio API)

为保证在 GitHub Pages 及各类网络环境下的零延迟、免加载、免外部 CDN 资源，音效全部由浏览器底层 Web Audio API 振荡器实时纯数学合成：
* `soundSuccess()`：C5 (523Hz) + E5 (659Hz) 双音上扬和弦（三角波）；
* `soundError()`：G3 (196Hz) 锯齿波下行杂音；
* `soundLevelUp()`：C5 + E5 + G5 三重琶音级联跃升。

---

## 七、 本地开发、调试与线上部署

### 1. 本地调试与运行
* **前置要求**：安装 Node.js (推荐 v18+)。
* **方式一（Windows 快捷方式）**：
  双击根目录下的 `启动本地测试.bat`。
* **方式二（命令行启动）**：
  ```bash
  cd "C:\Users\wizar\Others\map-quiz"
  node start_server.js
  ```
  然后在浏览器打开：[http://127.0.0.1:8080/index.html?tab=focus](http://127.0.0.1:8080/index.html?tab=focus)。

### 2. 自动化验证测试 (Playwright)
项目配置了完备的无头浏览器自动化验收用例，可随时验证核心逻辑与界面元素：
```bash
# 验证 3次机会失误、省份拖后腿/加分、微信号复制及PK链接复制
node test_focus.js

# 验证直接失败按钮与关卡跳转
node test_fail_btn.js

# 验证九宫格空间 2-Back 刺激流与比对
node test_game2.js
```

### 3. Git 版本管理与发布
代码直接托管在 GitHub 主干，更新后执行以下命令即可同步至 GitHub Pages 自动构建与发布：
```bash
git add focus.html focus.css focus.js start_server.js HANDOVER.md
git commit -m "docs: 完善项目技术交接文档与运行指引"
git push origin master
```
推送成功后，约 1~2 分钟即可在线上访问：`https://wizard9018.github.io/map-quiz/?tab=focus`。

---

## 八、 关键技术注意事项与后续演进建议

1. **iframe 通信与自适应**：
   * `index.html` 中的 `.focus-frame` 设置了 `width: 100%; height: calc(100vh - 120px); border: none;`；若需从父级向子级传递主题或鉴权信息，可通过 `postMessage` 机制扩展。
2. **移动端手势优化**：
   * 所有按钮均应用了 `-webkit-tap-highlight-color: transparent;` 与 `touch-action: manipulation;`，杜绝 iOS 双击缩放延迟。
3. **微信内置浏览器适配**：
   * 微信长按识别二维码要求 `<img>` 或直出 `<svg>` 结构，目前已内联高清晰度 SVG；若在特定老版微信内核长按无效，可配置转成 base64 PNG 输出作为补充方案。
4. **后端成绩埋点扩展**：
   * 目前成绩结算保存在前端内存与 URL 参数中；后续若需沉淀用户全生命周期训练档案，可在 `finishGame` 中向服务端 API 发送一个 JSON 数据包打点即可。
