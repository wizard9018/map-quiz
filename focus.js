// focus.js - K12 50 款专注力小游戏 Web 互动测试运行引擎
(function() {
  'use strict';

  // 舒尔特阶梯进阶配置表: 1-3关 3x3 (20s/15s/10s), 4-6关 4x4 (20s/15s/10s), 7-9关 5x5 (20s/15s/10s), 10关 6x6 (20s)
  const SCHULTE_LEVEL_CONFIG = {
    1:  { cols: 3, time: 20 },
    2:  { cols: 3, time: 15 },
    3:  { cols: 3, time: 10 },
    4:  { cols: 4, time: 20 },
    5:  { cols: 4, time: 15 },
    6:  { cols: 4, time: 10 },
    7:  { cols: 5, time: 20 },
    8:  { cols: 5, time: 15 },
    9:  { cols: 5, time: 10 },
    10: { cols: 6, time: 20 }
  };

  // 1. 专注力认知训练系统 · 核心母版矩阵与衍生游戏注册表
  const REGISTRY = {
    // ==================== 21 款纯种认知母版核心矩阵 ====================
    // 母版 01: N-Back 工作记忆刷新流
    nback_flow: {
      masterId: 1,
      title: "母版 01 · N-Back 工作记忆刷新流",
      academy: "memory",
      brainCircuit: "背外侧前额叶 (DLPFC) + 顶内沟 (IPS)",
      prompt: "👀 当刺激与【N 步前】相同时点击【相同】（不同则无需点击，自动通过）",
      modality: "nback_flow",
      gesture: "single_match_tap",
      layout: "nback_flow_stage",
      stimulus: "adaptive_multimodal",
      engine: "nback_flow"
    },

    // 第一个游戏：舒尔特方格注意力阶梯训练
    schulte_classic: {
      title: "舒尔特方格注意力训练",
      academy: "focus",
      prompt: "第一关3×3(20s)，第二关(15s)，第三关(10s)，第四关4×4(20s)...阶梯递增",
      modality: "matrix_grid",
      gesture: "sequential_grid_tap",
      layout: "grid_progression",
      stimulus: "numbers_progressive",
      engine: "schulte"
    },

    // 一、 工作记忆学堂 (14 款)
    nback_spatial: {
      title: "2-back 空间记忆挑战",
      academy: "memory",
      prompt: "九宫格连续闪现，比对当前位置与2步前是否相同",
      modality: "spatial_nback",
      gesture: "2way_same_diff",
      layout: "grid_3x3",
      stimulus: "spatial_blocks",
      engine: "nback"
    },
    places_nback: {
      title: "地名序列 N-back 挑战",
      academy: "memory",
      prompt: "城市名依次闪现，判断当前城市是否与2步前相同",
      modality: "text_stream",
      gesture: "2way_same_diff",
      layout: "single_card",
      stimulus: "chinese_places",
      engine: "nback"
    },
    numbers_nback: {
      title: "数字时序 2-Back 挑战",
      academy: "memory",
      prompt: "纯数字快速刷新，比对当前数字是否与2步前相同",
      modality: "number_stream",
      gesture: "2way_same_diff",
      layout: "single_card",
      stimulus: "digits_0_9",
      engine: "nback"
    },
    letters_nback: {
      title: "少儿图形符号 2-Back 刷新",
      academy: "memory",
      prompt: "🌟火箭、气球等生动图符连续闪现，比对当前图形是否与2步前相同",
      modality: "symbol_emoji_stream",
      gesture: "2way_same_diff",
      layout: "single_card",
      stimulus: "emoji_symbols",
      engine: "nback"
    },
    spatial_grid_136: {
      title: "136 双色优先级空间瞬记",
      academy: "memory",
      prompt: "双色加权：先记住【蓝色方块】与【黄色方块】，还原时必须先蓝后黄！",
      modality: "dual_color_matrix_grid",
      gesture: "priority_dual_target_tap",
      layout: "grid_3x3",
      stimulus: "blue_yellow_priority_cells",
      engine: "grid"
    },
    spatial_grid_5x5: {
      title: "5×5 矩阵高密度方块瞬记",
      academy: "memory",
      prompt: "25格大矩阵，瞬记5个高亮块并还原",
      modality: "matrix_grid",
      gesture: "multi_target_tap",
      layout: "grid_5x5",
      stimulus: "lit_yellow_cells",
      engine: "grid"
    },
    sequence_timeline: {
      title: "时序先后顺序挑战",
      academy: "memory",
      prompt: "方块按 1→2→3... 顺序点亮，随后正序复现",
      modality: "matrix_grid",
      gesture: "sequential_grid_tap",
      layout: "grid_3x3",
      stimulus: "numbered_sequence",
      engine: "grid"
    },
    sequence_reverse: {
      title: "逆序时序倒放挑战",
      academy: "memory",
      prompt: "方块按序点亮，复原时倒着点回第一个（倒序检索）",
      modality: "matrix_grid",
      gesture: "sequential_grid_tap",
      layout: "grid_3x3",
      stimulus: "reverse_numbered_sequence",
      engine: "grid"
    },
    visual_flash_afterimage: {
      title: "视觉瞬时闪记与残影辨识",
      academy: "memory",
      prompt: "380ms 极短残影单点闪记，凭视网膜暂留抓取位置",
      modality: "matrix_grid",
      gesture: "single_cell_tap",
      layout: "grid_4x4",
      stimulus: "highspeed_flash_dot",
      engine: "grid"
    },
    pattern_separation_26: {
      title: "第26天海马体模式分离",
      academy: "memory",
      prompt: "观察点阵布局微调位移，判断与原图是否完全相同",
      modality: "dot_matrix",
      gesture: "2way_same_diff",
      layout: "dual_panel",
      stimulus: "dot_displacement",
      engine: "grid"
    },
    dual_task_memory_33: {
      title: "双重任务认知资源分配",
      academy: "memory",
      prompt: "主线九宫格 N-back 匹配，副线侧边心算递增累加",
      modality: "matrix_grid",
      gesture: "2way_same_diff",
      layout: "dual_task_split",
      stimulus: "grid_plus_arithmetic",
      engine: "nback"
    },
    short_term_memory_37: {
      title: "短时记忆瞬时提取 (Corsi Blocks)",
      academy: "memory",
      prompt: "Corsi 散点空间跨度，按先后敲击路径还原",
      modality: "corsi_scattered",
      gesture: "sequential_scatter_tap",
      layout: "scatter_nodes",
      stimulus: "corsi_blocks",
      engine: "grid"
    },
    detective_memory_61: {
      title: "名侦探细节瞬时记忆",
      academy: "memory",
      prompt: "4位嫌疑人排位与服饰细节瞬记，针对提问精准指认",
      modality: "character_scene",
      gesture: "multichoice_4_tap",
      layout: "scene_lineup",
      stimulus: "suspect_characters",
      engine: "grid"
    },
    auditory_sentence_order_92: {
      title: "听觉句子时序重组训练",
      academy: "memory",
      prompt: "分段语篇时序重建，判断当前词句是否与2步前相同",
      modality: "text_stream",
      gesture: "2way_same_diff",
      layout: "single_card",
      stimulus: "phrases_stream",
      engine: "nback"
    },

    // 二、 深度专注学堂 (8 款)
    schulte_3x3: {
      title: "启蒙 3×3 英文字母舒尔特",
      academy: "focus",
      prompt: "按 A 到 I 字母表顺序依次快速点选，启蒙大视野",
      modality: "letter_matrix_grid",
      gesture: "sequential_grid_tap",
      layout: "grid_3x3",
      stimulus: "letters_A_to_I",
      engine: "schulte"
    },
    schulte_4x4: {
      title: "进阶 4×4 中文数词舒尔特",
      academy: "focus",
      prompt: "按【一】到【十六】汉字数词顺序点选，汉字字形扫描",
      modality: "chinese_num_matrix_grid",
      gesture: "sequential_grid_tap",
      layout: "grid_4x4",
      stimulus: "chinese_num_1_16",
      engine: "schulte"
    },
    schulte_6x6: {
      title: "高阶 6×6 舒尔特方格",
      academy: "focus",
      prompt: "从 1 到 36 四象限扫描搜索，抗密集信息干扰",
      modality: "matrix_grid",
      gesture: "sequential_grid_tap",
      layout: "grid_6x6",
      stimulus: "numbers_1_to_36",
      engine: "schulte"
    },
    schulte_7x7: {
      title: "挑战 7×7 舒尔特极限",
      academy: "focus",
      prompt: "从 1 到 49 极限大视野搜索，抗视觉疲劳耐力",
      modality: "matrix_grid",
      gesture: "sequential_grid_tap",
      layout: "grid_7x7",
      stimulus: "numbers_1_to_49",
      engine: "schulte"
    },
    schulte_rotate: {
      title: "动态旋转舒尔特方格",
      academy: "focus",
      prompt: "圆盘匀速自转中锁定数字，克服眩晕与漂移",
      modality: "matrix_grid",
      gesture: "sequential_grid_tap",
      layout: "grid_5x5_rotating",
      stimulus: "numbers_1_to_25",
      engine: "schulte"
    },
    schulte_reverse: {
      title: "6阶倒序舒尔特挑战",
      academy: "focus",
      prompt: "从 36 倒数点选至 1，双重认知负荷逆向搜索",
      modality: "matrix_grid",
      gesture: "sequential_grid_tap",
      layout: "grid_6x6",
      stimulus: "numbers_36_to_1",
      engine: "schulte"
    },
    schulte_extended_27: {
      title: "罗马数字噪波舒尔特方格",
      academy: "focus",
      prompt: "在噪波背景下按 I 到 XXV 搜寻，罗马字符抗干扰",
      modality: "roman_matrix_grid",
      gesture: "sequential_grid_tap",
      layout: "grid_5x5_noise",
      stimulus: "roman_numerals_1_25",
      engine: "schulte"
    },

    // 三、 前额叶自控学堂 (14 款)
    stroop_color_word: {
      title: "Stroop 色词抗干扰",
      academy: "control",
      prompt: "克服字义阅读冲动，找出【字义与墨水颜色完全相同】的格子",
      modality: "color_word_matrix",
      gesture: "matrix_odd_tap",
      layout: "grid_5x5",
      stimulus: "stroop_colored_hanzi",
      engine: "stroop"
    },
    stroop_speed_switch: {
      title: "Stroop 极速任务切换",
      academy: "control",
      prompt: "认知灵活性切换：根据当前规则按【墨水色】或【字义】选按键",
      modality: "single_color_word",
      gesture: "multichoice_4_tap",
      layout: "switch_banner",
      stimulus: "rule_switch_word",
      engine: "stroop"
    },
    seven_inhibition: {
      title: "逢 7 抑制力专注训练",
      academy: "control",
      prompt: "数字依次滚动，普通数字按【通过】，遇含7或倍数急刹禁止点击",
      modality: "ticker_number",
      gesture: "ticker_pass_tap",
      layout: "center_focus",
      stimulus: "digits_ticker",
      engine: "stroop"
    },
    three_inhibition: {
      title: "少儿动物猛兽急刹制动",
      academy: "control",
      prompt: "萌宠放行，遇到猛兽（🐯老虎/🐻黑熊/🐺灰狼）必须紧急刹车严禁点击！",
      modality: "animal_predator_stream",
      gesture: "animal_pass_tap",
      layout: "center_focus",
      stimulus: "cute_animals_vs_predators",
      engine: "stroop"
    },
    traffic_go_nogo: {
      title: "红绿灯 Go / No-Go 急刹反应",
      academy: "control",
      prompt: "绿灯亮起快速点击【通行】，红灯亮起瞬间收手刹车",
      modality: "traffic_light",
      gesture: "gonogo_single_tap",
      layout: "center_focus",
      stimulus: "green_red_signals",
      engine: "stroop"
    },
    visual_interference_125: {
      title: "视觉抗干扰前额叶抑制",
      academy: "control",
      prompt: "凝视中央红球，余光数出周围数字「7」闪现的总次数",
      modality: "red_ball_distractor",
      gesture: "multichoice_4_tap",
      layout: "concentric_arena",
      stimulus: "ball_plus_flashing_7",
      engine: "stroop"
    },
    visual_interference_126: {
      title: "假动作诱导抑制练习",
      academy: "control",
      prompt: "2×2方格不同背景色干扰，忽略颜色诱饵，点击【数值最大】的方格",
      modality: "colored_cards_numbers",
      gesture: "matrix_odd_tap",
      layout: "grid_2x2",
      stimulus: "deceptive_colored_cards",
      engine: "stroop"
    },
    impulse_control_131: {
      title: "前额叶冲动性马虎克制",
      academy: "control",
      prompt: "方框呈现方向汉字，克服本能冲动，点击其【相反方向】",
      modality: "opposite_direction_word",
      gesture: "4way_direction_tap",
      layout: "direction_pad",
      stimulus: "opposite_words",
      engine: "stroop"
    },
    eye_hand_coord_30: {
      title: "手眼协调与制动练习",
      academy: "control",
      prompt: "看到箭头指示，极速点击对应方向，测试纯反应时",
      modality: "arrow_prompt",
      gesture: "4way_direction_tap",
      layout: "direction_pad",
      stimulus: "arrow_icons",
      engine: "stroop"
    },
    eye_mouth_coord_34: {
      title: "口眼协调与抗分心训练",
      academy: "control",
      prompt: "呈现方向词汇，快速选择反向按钮，口眼协同抗干扰",
      modality: "opposite_direction_word",
      gesture: "4way_direction_tap",
      layout: "direction_pad",
      stimulus: "opposite_words",
      engine: "stroop"
    },
    dual_task_split_55: {
      title: "多重任务协调与认知分流",
      academy: "control",
      prompt: "中央小球主线追踪，突发蜂鸣/红色闪烁时按压副键",
      modality: "split_attention_screen",
      gesture: "dual_split_action",
      layout: "split_arena",
      stimulus: "ball_plus_alarm",
      engine: "stroop"
    },
    brain_science_inhibit_90: {
      title: "脑科学前额叶自控大挑战",
      academy: "control",
      prompt: "Stroop 5×5 全域搜索，从左到右找出字色相符全部目标",
      modality: "color_word_matrix",
      gesture: "matrix_odd_tap",
      layout: "grid_5x5",
      stimulus: "stroop_colored_hanzi",
      engine: "stroop"
    },
    alertness_network_25: {
      title: "警觉网络注意力维持训练 (CPT)",
      academy: "control",
      prompt: "持续警觉维持：无提示出现红星时瞬间击键，忽略其他形状",
      modality: "cpt_rare_target",
      gesture: "gonogo_single_tap",
      layout: "center_focus",
      stimulus: "cpt_stream",
      engine: "stroop"
    },
    mot_ball_tracking: {
      title: "多目标小球动态追踪 (MOT)",
      academy: "control",
      prompt: "高亮目标小球高速穿梭碰撞，停止后准确点出目标小球",
      modality: "moving_balls",
      gesture: "multi_target_tap",
      layout: "bouncing_arena",
      stimulus: "colored_spheres",
      engine: "grid"
    },

    // 四、 视觉敏捷学堂 (14 款)
    visual_tracking_47: {
      title: "视觉视线寻迹追踪 (TMT)",
      academy: "agility",
      prompt: "Trail Making Test 散点轨迹追踪，由 1 到 8 连通",
      modality: "tmt_trail_nodes",
      gesture: "trail_connect_tap",
      layout: "scatter_canvas",
      stimulus: "numbered_tmt_dots",
      engine: "diff"
    },
    visual_tracking_57: {
      title: "复杂交叉轨迹追踪",
      academy: "agility",
      prompt: "线段交叉干扰，从左端起点追寻连接的右端终点编号",
      modality: "crossed_lines",
      gesture: "multichoice_4_tap",
      layout: "fiber_canvas",
      stimulus: "braided_lines",
      engine: "diff"
    },
    visual_motion_71: {
      title: "视觉运动感知与动态捕捉",
      academy: "agility",
      prompt: "4只卡通猫中，找出那只【旋转方向与其他三只相反】的猫",
      modality: "rotating_cats",
      gesture: "single_cat_tap",
      layout: "horizontal_lineup",
      stimulus: "counter_rotating_icons",
      engine: "diff"
    },
    hanzi_spot_diff: {
      title: "汉字微特征找不同",
      academy: "agility",
      prompt: "在众多形近字中（如一大堆「王」），找出唯一的「玉」",
      modality: "hanzi_dense_grid",
      gesture: "single_cell_tap",
      layout: "grid_6x6",
      stimulus: "similar_hanzi_oddball",
      engine: "diff"
    },
    hanzi_diff_reverse: {
      title: "汉字反色微特征辨析",
      academy: "agility",
      prompt: "高频黑白反转底色中，搜寻细微笔画差异字",
      modality: "hanzi_inverted_grid",
      gesture: "single_cell_tap",
      layout: "grid_6x6",
      stimulus: "inverted_hanzi_oddball",
      engine: "diff"
    },
    mental_clock_rotation: {
      title: "镜中识表心理旋转",
      academy: "agility",
      prompt: "镜子中照出倒立时钟，心理推算现实中的真实时间",
      modality: "mirrored_clock",
      gesture: "multichoice_4_tap",
      layout: "clock_dial_display",
      stimulus: "inverted_clock_face",
      engine: "diff"
    },
    reverse_hanzi: {
      title: "倒着认汉字空间定向",
      academy: "agility",
      prompt: "左右镜像翻转的汉字短语，识别其真实语义",
      modality: "mirrored_hanzi",
      gesture: "multichoice_4_tap",
      layout: "mirrored_banner",
      stimulus: "chiral_hanzi_phrase",
      engine: "diff"
    },
    mirror_symmetry_spatial: {
      title: "轴对称图形空间折叠",
      academy: "agility",
      prompt: "沿着虚线折叠后，判断两半图形能否完全重合",
      modality: "symmetric_folding",
      gesture: "2way_same_diff",
      layout: "split_folding_view",
      stimulus: "bilateral_polygons",
      engine: "diff"
    },
    spatial_rotation_3d: {
      title: "三维立体空间透视旋转",
      academy: "agility",
      prompt: "Shepard-Metzler 心理旋转，判断右图是否由左图旋转而成",
      modality: "wireframe_cube_pair",
      gesture: "2way_same_diff",
      layout: "dual_3d_panel",
      stimulus: "3d_block_aggregates",
      engine: "diff"
    },
    cube_count_hidden: {
      title: "遮挡积木空间心智透视",
      academy: "agility",
      prompt: "层叠方块组合，心智透视遮挡在底层的不可见积木数",
      modality: "stacked_cubes",
      gesture: "multichoice_4_tap",
      layout: "isometric_projection",
      stimulus: "occluded_cube_isometric",
      engine: "diff"
    },
    spatial_direction_arrow: {
      title: "空间方位多级转向挑战",
      academy: "agility",
      prompt: "前额叶空间坐标旋转：先右转90度、再左转180度，选最终朝向",
      modality: "multi_step_turn",
      gesture: "4way_direction_tap",
      layout: "direction_pad",
      stimulus: "compass_rose_arrows",
      engine: "diff"
    },
    pattern_mirror_67: {
      title: "复杂图案心理旋转挑战",
      academy: "agility",
      prompt: "非对称复杂图案经过角位移旋转，判断是否是原图案",
      modality: "chiral_pattern",
      gesture: "2way_same_diff",
      layout: "dual_panel",
      stimulus: "asymmetric_tessellation",
      engine: "diff"
    },
    spatial_depth_perception: {
      title: "空间深度知觉与远近判断",
      academy: "agility",
      prompt: "重叠与阴影深度线索中，最快判断哪个几何体距离更近",
      modality: "depth_cues",
      gesture: "2way_same_diff",
      layout: "perspective_arena",
      stimulus: "overlapping_geometric_shadows",
      engine: "diff"
    },
    paper_fold_hole: {
      title: "空间折纸打孔心智展开",
      academy: "agility",
      prompt: "正方形对折打孔后展开，脑内模拟所有圆孔的真实坐标",
      modality: "paper_folding_punch",
      gesture: "multichoice_4_tap",
      layout: "origami_view",
      stimulus: "punched_origami_expanded",
      engine: "diff"
    }
  };

  // 2. 音效生成器 (基于 Web Audio API 纯合成，零延迟免外部资源)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.12) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) { /* audio unavailable */ }
  }

  function soundSuccess() {
    playTone(523.25, 'triangle', 0.1, 0.15); // C5
    setTimeout(() => playTone(659.25, 'triangle', 0.15, 0.15), 80); // E5
  }

  function soundError() {
    playTone(196.00, 'sawtooth', 0.22, 0.18); // G3
  }

  function soundLevelUp() {
    playTone(523.25, 'triangle', 0.08, 0.15);
    setTimeout(() => playTone(659.25, 'triangle', 0.08, 0.15), 70);
    setTimeout(() => playTone(783.99, 'triangle', 0.2, 0.18), 140);
  }

  // 31 省市天梯榜官方基准均分与排位
  const PROVINCES_DATA = [
    { name: "北京市", score: 89.6, rank: 1 },
    { name: "上海市", score: 88.5, rank: 2 },
    { name: "江苏省", score: 87.2, rank: 3 },
    { name: "浙江省", score: 86.8, rank: 4 },
    { name: "广东省", score: 85.4, rank: 5 },
    { name: "山东省", score: 84.7, rank: 6 },
    { name: "湖北省", score: 83.9, rank: 7 },
    { name: "湖南省", score: 83.2, rank: 8 },
    { name: "四川省", score: 82.5, rank: 9 },
    { name: "陕西省", score: 81.8, rank: 10 },
    { name: "重庆市", score: 81.2, rank: 11 },
    { name: "福建省", score: 80.9, rank: 12 },
    { name: "安徽省", score: 80.3, rank: 13 },
    { name: "河南省", score: 79.8, rank: 14 },
    { name: "河北省", score: 79.2, rank: 15 },
    { name: "辽宁省", score: 78.6, rank: 16 },
    { name: "江西省", score: 78.1, rank: 17 },
    { name: "天津市", score: 77.8, rank: 18 },
    { name: "吉林省", score: 77.2, rank: 19 },
    { name: "黑龙江省", score: 76.8, rank: 20 },
    { name: "山西省", score: 76.4, rank: 21 },
    { name: "广西壮族自治区", score: 75.9, rank: 22 },
    { name: "云南省", score: 75.3, rank: 23 },
    { name: "贵州省", score: 74.8, rank: 24 },
    { name: "内蒙古自治区", score: 74.2, rank: 25 },
    { name: "新疆维吾尔自治区", score: 73.6, rank: 26 },
    { name: "甘肃省", score: 73.1, rank: 27 },
    { name: "海南省", score: 72.5, rank: 28 },
    { name: "宁夏回族自治区", score: 71.8, rank: 29 },
    { name: "青海省", score: 71.2, rank: 30 },
    { name: "西藏自治区", score: 70.5, rank: 31 }
  ];

  // 专家企业微信专属清晰矢量二维码 (SVG)
  const SVG_QR_CODE = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#ffffff" rx="8"/>
    <rect x="8" y="8" width="26" height="26" fill="#0369a1" rx="4"/>
    <rect x="12" y="12" width="18" height="18" fill="#ffffff" rx="2"/>
    <rect x="16" y="16" width="10" height="10" fill="#0284c7" rx="1"/>
    <rect x="66" y="8" width="26" height="26" fill="#0369a1" rx="4"/>
    <rect x="70" y="12" width="18" height="18" fill="#ffffff" rx="2"/>
    <rect x="74" y="16" width="10" height="10" fill="#0284c7" rx="1"/>
    <rect x="8" y="66" width="26" height="26" fill="#0369a1" rx="4"/>
    <rect x="12" y="70" width="18" height="18" fill="#ffffff" rx="2"/>
    <rect x="16" y="74" width="10" height="10" fill="#0284c7" rx="1"/>
    <rect x="40" y="10" width="5" height="5" fill="#0284c7"/>
    <rect x="48" y="10" width="5" height="5" fill="#0284c7"/>
    <rect x="56" y="10" width="5" height="5" fill="#0284c7"/>
    <rect x="44" y="18" width="5" height="5" fill="#0284c7"/>
    <rect x="52" y="18" width="5" height="5" fill="#0284c7"/>
    <rect x="40" y="26" width="5" height="5" fill="#0284c7"/>
    <rect x="56" y="26" width="5" height="5" fill="#0284c7"/>
    <rect x="10" y="40" width="5" height="5" fill="#0284c7"/>
    <rect x="18" y="40" width="5" height="5" fill="#0284c7"/>
    <rect x="26" y="40" width="5" height="5" fill="#0284c7"/>
    <rect x="14" y="48" width="5" height="5" fill="#0284c7"/>
    <rect x="22" y="48" width="5" height="5" fill="#0284c7"/>
    <rect x="10" y="56" width="5" height="5" fill="#0284c7"/>
    <rect x="26" y="56" width="5" height="5" fill="#0284c7"/>
    <circle cx="50" cy="50" r="13" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
    <circle cx="50" cy="50" r="10" fill="#0284c7"/>
    <text x="50" y="54" font-size="10" text-anchor="middle" fill="#ffffff" font-weight="900">🧠</text>
    <rect x="68" y="40" width="5" height="5" fill="#0284c7"/>
    <rect x="76" y="40" width="5" height="5" fill="#0284c7"/>
    <rect x="84" y="40" width="5" height="5" fill="#0284c7"/>
    <rect x="72" y="48" width="5" height="5" fill="#0284c7"/>
    <rect x="80" y="48" width="5" height="5" fill="#0284c7"/>
    <rect x="88" y="48" width="5" height="5" fill="#0284c7"/>
    <rect x="68" y="56" width="5" height="5" fill="#0284c7"/>
    <rect x="84" y="56" width="5" height="5" fill="#0284c7"/>
    <rect x="40" y="68" width="5" height="5" fill="#0284c7"/>
    <rect x="48" y="68" width="5" height="5" fill="#0284c7"/>
    <rect x="56" y="68" width="5" height="5" fill="#0284c7"/>
    <rect x="44" y="76" width="5" height="5" fill="#0284c7"/>
    <rect x="52" y="76" width="5" height="5" fill="#0284c7"/>
    <rect x="40" y="84" width="5" height="5" fill="#0284c7"/>
    <rect x="56" y="84" width="5" height="5" fill="#0284c7"/>
    <rect x="68" y="68" width="5" height="5" fill="#0284c7"/>
    <rect x="80" y="68" width="5" height="5" fill="#0284c7"/>
    <rect x="74" y="76" width="5" height="5" fill="#0284c7"/>
    <rect x="86" y="76" width="5" height="5" fill="#0284c7"/>
    <rect x="68" y="84" width="5" height="5" fill="#0284c7"/>
    <rect x="80" y="84" width="5" height="5" fill="#0284c7"/>
  </svg>`;

  // 3. 运行状态
  const state = {
    gameId: 'schulte_classic',
    level: 1,
    lives: 3,
    score: 0,
    timer: 20.0,
    timerInterval: null,
    inLevel: false,
    currentProvince: '江苏省',
    stats: {
      clicks: 0,
      correct: 0,
      mistakes: 0,
      reactionTimes: [],
      startTime: 0
    },
    // 当前题型专属内部变量
    subState: {}
  };

  // DOM 元素引用
  const el = {
    brandTitle: document.getElementById('brand-title'),
    gameSelect: document.getElementById('game-select'),
    levelSelect: document.getElementById('level-select'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    academyPills: document.getElementById('academy-pills'),
    levelBadge: document.getElementById('level-badge'),
    livesBox: document.getElementById('lives-box'),
    timerBadge: document.getElementById('timer-badge'),
    gameTitle: document.getElementById('game-title'),
    gamePrompt: document.getElementById('game-prompt'),
    stage: document.getElementById('game-stage'),
    controls: document.getElementById('game-controls'),
    toast: document.getElementById('feedback-toast'),
    reportModal: document.getElementById('report-modal'),
    reportGrade: document.getElementById('report-grade'),
    reportTitle: document.getElementById('report-title'),
    reportSubtitle: document.getElementById('report-subtitle'),
    statLevel: document.getElementById('stat-level'),
    statAcc: document.getElementById('stat-acc'),
    statRt: document.getElementById('stat-rt'),
    statScore: document.getElementById('stat-score'),
    // PK 模块
    pkOutcomeBadge: document.getElementById('pk-outcome-badge'),
    pkMyScore: document.getElementById('pk-my-score'),
    pkMyLevel: document.getElementById('pk-my-level'),
    pkOppName: document.getElementById('pk-opp-name'),
    pkOppScore: document.getElementById('pk-opp-score'),
    pkOppLevel: document.getElementById('pk-opp-level'),
    pkComment: document.getElementById('pk-comment'),
    // 省份打榜模块
    provinceSelect: document.getElementById('province-select'),
    provinceStatusBanner: document.getElementById('province-status-banner'),
    provinceDetailText: document.getElementById('province-detail-text'),
    provinceRankTag: document.getElementById('province-rank-tag'),
    // 专家与扫码模块
    expertQrWrap: document.getElementById('expert-qr-wrap'),
    expertWechatCode: document.getElementById('expert-wechat-code'),
    btnCopyWechat: document.getElementById('btn-copy-wechat'),
    expertTipNote: document.getElementById('expert-tip-note'),
    btnPkShare: document.getElementById('btn-pk-share'),
    btnRetry: document.getElementById('btn-retry'),
    btnNextGame: document.getElementById('btn-next-game'),
    btnTestFail: document.getElementById('btn-test-fail')
  };

  function showToast(text, duration = 1200) {
    if (!el.toast) return;
    el.toast.innerText = text;
    el.toast.classList.remove('hidden');
    clearTimeout(el.toast._t);
    el.toast._t = setTimeout(() => {
      el.toast.classList.add('hidden');
    }, duration);
  }

  // 4. 初始化下拉列表与学堂标签
  function initToolbar() {
    const keys = Object.keys(REGISTRY);

    function populateSelect(ac = 'all') {
      el.gameSelect.innerHTML = '';
      keys.forEach((gid, idx) => {
        const g = REGISTRY[gid];
        const match = (ac === 'all') || (ac === 'master' && g.masterId) || (g.academy === ac);
        if (match) {
          const opt = document.createElement('option');
          opt.value = gid;
          const prefix = g.masterId ? `🌟 [母版 ${String(g.masterId).padStart(2, '0')}]` : `[#${idx + 1}]`;
          opt.innerText = `${prefix} ${g.title}`;
          el.gameSelect.appendChild(opt);
        }
      });
    }

    populateSelect('all');

    el.gameSelect.addEventListener('change', () => {
      switchGame(el.gameSelect.value, 1);
    });

    el.levelSelect.addEventListener('change', () => {
      const lvl = parseInt(el.levelSelect.value, 10) || 1;
      switchGame(state.gameId, lvl);
    });

    el.prevBtn.addEventListener('click', () => {
      const curIdx = keys.indexOf(state.gameId);
      const nextIdx = (curIdx - 1 + keys.length) % keys.length;
      switchGame(keys[nextIdx], 1);
    });

    el.nextBtn.addEventListener('click', () => {
      const curIdx = keys.indexOf(state.gameId);
      const nextIdx = (curIdx + 1) % keys.length;
      switchGame(keys[nextIdx], 1);
    });

    // 学堂筛选按钮
    el.academyPills.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        el.academyPills.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const ac = btn.dataset.academy;
        populateSelect(ac);
        if (el.gameSelect.options.length > 0) {
          switchGame(el.gameSelect.value, 1);
        }
      });
    });

    // 弹窗按键
    if (el.btnRetry) {
      el.btnRetry.addEventListener('click', () => {
        el.reportModal.classList.add('hidden');
        switchGame(state.gameId, 1);
      });
    }

    if (el.btnNextGame) {
      el.btnNextGame.addEventListener('click', () => {
        el.reportModal.classList.add('hidden');
        const curIdx = keys.indexOf(state.gameId);
        const nextIdx = (curIdx + 1) % keys.length;
        switchGame(keys[nextIdx], 1);
      });
    }

    // 报告弹窗：省份切换监听
    if (el.provinceSelect) {
      el.provinceSelect.innerHTML = '';
      PROVINCES_DATA.forEach(prov => {
        const opt = document.createElement('option');
        opt.value = prov.name;
        opt.innerText = `${prov.name} (榜#${prov.rank} · 均分${prov.score})`;
        if (prov.name === state.currentProvince) opt.selected = true;
        el.provinceSelect.appendChild(opt);
      });

      el.provinceSelect.addEventListener('change', () => {
        state.currentProvince = el.provinceSelect.value;
        updateProvinceBenchmark(state.score);
      });
    }

    // 报告弹窗：一键复制专家微信号
    if (el.btnCopyWechat) {
      el.btnCopyWechat.addEventListener('click', () => {
        const wechatCode = 'ql_focus88';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(wechatCode).then(() => {
            showToast('✅ 专家微信号已复制：ql_focus88，请打开微信添加！');
            el.btnCopyWechat.innerText = '✅ 已复制微信号';
            setTimeout(() => {
              if (el.btnCopyWechat) el.btnCopyWechat.innerText = '📋 一键复制';
            }, 3000);
          }).catch(() => {
            showToast('微信号：ql_focus88，请手动长按复制');
          });
        } else {
          showToast('微信号：ql_focus88，请手动长按复制');
        }
      });
    }

    // 报告弹窗：发给朋友挑战 PK
    if (el.btnPkShare) {
      el.btnPkShare.addEventListener('click', () => {
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('tab', 'focus');
        shareUrl.searchParams.set('game', state.gameId);
        shareUrl.searchParams.set('inviter', '你的好友');
        shareUrl.searchParams.set('inviterScore', state.score || 85);
        shareUrl.searchParams.set('inviterLevel', state.lastAchievedLevel || 1);
        shareUrl.hash = `#${state.gameId}`;

        const challengeText = `⚔️ 我在【专注力 50 款小游戏】闯到了第 ${state.lastAchievedLevel || 1} 关 (${state.score || 85}分)，战胜了全国 ${state.lastPercentile || 75}% 的人！敢来挑战我吗？点击链接直接迎战 👉 ${shareUrl.toString()}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(challengeText).then(() => {
            showToast('⚔️ 专属挑战链接已复制！快发给微信好友/群聊 PK 吧！');
            el.btnPkShare.innerText = '✅ 挑战链接已复制！';
            setTimeout(() => {
              if (el.btnPkShare) el.btnPkShare.innerText = '⚔️ 发给朋友挑战 PK（比拼闯关级数）';
            }, 3000);
          }).catch(() => {
            showToast('请复制当前页面链接发给好友挑战');
          });
        } else {
          showToast('请复制当前页面链接发给好友挑战');
        }
      });
    }

    // 测试专用：直接失败按钮
    if (el.btnTestFail) {
      el.btnTestFail.addEventListener('click', () => {
        soundError();
        state.lives = 0;
        renderLives();
        showToast('💥 已触发测试直接失败！', 1000);
        finishGame(true);
      });
    }
  }

  // 5. 切换游戏主函数
  function switchGame(gid, lvl = 1) {
    if (!REGISTRY[gid]) gid = 'schulte_classic';
    state.gameId = gid;
    state.level = lvl;
    state.lives = 3;
    state.score = 0;
    state.stats = {
      clicks: 0,
      correct: 0,
      mistakes: 0,
      reactionTimes: [],
      startTime: Date.now()
    };

    el.gameSelect.value = gid;
    el.levelSelect.value = lvl;
    el.reportModal.classList.add('hidden');

    const g = REGISTRY[gid];
    el.gameTitle.innerText = g.title;
    el.gamePrompt.innerText = g.prompt;

    // URL 同步 hash
    try {
      history.replaceState(null, '', `#${gid}`);
    } catch(e) {}

    renderLives();
    startLevel(lvl);
  }

  function renderLives() {
    el.livesBox.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('span');
      heart.className = `heart ${i < state.lives ? 'active' : 'lost'}`;
      heart.innerText = '❤️';
      el.livesBox.appendChild(heart);
    }
  }

  function deductLife(reason = '操作失误') {
    soundError();
    state.lives = Math.max(0, state.lives - 1);
    state.stats.mistakes++;
    renderLives();
    showToast(`⚠️ ${reason}！心数 -1`);

    if (state.lives <= 0) {
      finishGame(true);
    }
  }

  // 6. 关卡计时与结束逻辑
  function startTimer(seconds = 15.0) {
    clearInterval(state.timerInterval);
    state.timer = seconds;
    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
      state.timer -= 0.1;
      if (state.timer <= 0) {
        state.timer = 0;
        clearInterval(state.timerInterval);
        deductLife('时间耗尽');
        if (state.lives > 0) {
          startLevel(state.level, true); // 重开当前关，保留剩余心数
        }
      }
      updateTimerDisplay();
    }, 100);
  }

  function updateTimerDisplay() {
    el.timerBadge.innerText = `⏱️ ${state.timer.toFixed(1)}s`;
    if (state.timer <= 3.0) {
      el.timerBadge.style.background = '#ffebee';
      el.timerBadge.style.color = '#c62828';
    } else {
      el.timerBadge.style.background = '#fff3e0';
      el.timerBadge.style.color = '#ef6c00';
    }
  }

  function nextLevel() {
    soundLevelUp();
    state.stats.correct++;
    state.score += (state.level * 10) + Math.round(state.timer * 5);

    if (state.level >= 10) {
      finishGame(false); // 10关全通
      return;
    }

    state.level++;
    el.levelSelect.value = state.level;
    showToast(`🎉 达成第 ${state.level - 1} 关！晋级第 ${state.level} 关`, 1000);
    setTimeout(() => {
      startLevel(state.level);
    }, 600);
  }

  // 省份天梯战报动态评定计算
  function updateProvinceBenchmark(score) {
    if (!el.provinceStatusBanner || !el.provinceDetailText || !el.provinceRankTag) return;
    const prov = PROVINCES_DATA.find(p => p.name === state.currentProvince) || PROVINCES_DATA[2]; // 默认江苏省
    const diff = (score - prov.score).toFixed(1);
    const isPass = score >= prov.score;

    if (isPass) {
      el.provinceStatusBanner.className = 'province-status-banner pass';
      el.provinceStatusBanner.innerHTML = `<span class="banner-icon">🏆</span><span class="banner-text">高于本省平均成绩 · 恭喜加分！</span>`;
      el.provinceDetailText.innerText = `本省 (${prov.name}) 平均成绩 ${prov.score} 分，你的成绩为 ${score} 分 (高出 +${diff} 分)！恭喜为全省平均分拉榜加分，排名持续提升！`;
    } else {
      el.provinceStatusBanner.className = 'province-status-banner fail';
      el.provinceStatusBanner.innerHTML = `<span class="banner-icon">⚠️</span><span class="banner-text">低于本省平均成绩 · 拖了后腿！</span>`;
      el.provinceDetailText.innerText = `本省 (${prov.name}) 平均成绩 ${prov.score} 分，你的成绩为 ${score} 分 (落后 ${Math.abs(diff)} 分)！给全省平均战力拖了后腿，快加练追赶超越！`;
    }

    el.provinceRankTag.innerText = `${prov.name}在全国 31 省平均专注力天梯榜排名：第 ${prov.rank} 名`;
  }

  function finishGame(isFail) {
    clearInterval(state.timerInterval);
    const achievedLevel = isFail ? Math.max(1, state.level - 1) : 10;
    const total = state.stats.correct + state.stats.mistakes;
    const acc = total > 0 ? Math.round((state.stats.correct / total) * 100) : 0;
    const avgRt = state.stats.reactionTimes.length > 0 
      ? Math.round(state.stats.reactionTimes.reduce((a,b)=>a+b,0) / state.stats.reactionTimes.length) 
      : 260;

    // 综合专注力潜能打分 (0-100分制，使分数与省份基准分 70~90 分具备高度可比性)
    let calcScore;
    if (isFail && state.level === 1) {
      // 第一关就失败，明显低于基准分
      calcScore = Math.max(20, Math.round(20 + acc * 0.3));
    } else {
      calcScore = Math.min(100, Math.max(25, Math.round(
        (achievedLevel * 7.5) + 
        (acc * 0.25) + 
        Math.max(0, 20 - (avgRt / 30))
      )));
    }
    state.score = calcScore;
    state.lastAchievedLevel = achievedLevel;

    let grade = 'B';
    let percentile = 75;
    if (achievedLevel >= 9) { grade = 'S'; percentile = 98; }
    else if (achievedLevel >= 7) { grade = 'A'; percentile = 90; }
    else if (achievedLevel >= 5) { grade = 'B'; percentile = 75; }
    else if (achievedLevel >= 3) { grade = 'C'; percentile = 50; }
    else { grade = 'D'; percentile = 25; }
    state.lastPercentile = percentile;

    el.reportGrade.innerText = grade;
    el.reportGrade.style.borderColor = (grade==='S'||grade==='A') ? '#58cc02' : (grade==='B' ? '#1cb0f6' : '#f97316');
    el.reportTitle.innerText = isFail ? `挑战结束 · 止步第 ${state.level} 关` : `🏆 恭喜！十关大满贯通关！`;
    el.statLevel.innerText = `第 ${achievedLevel} 关`;
    el.statAcc.innerText = `${acc}%`;
    el.statRt.innerText = `${avgRt}ms`;
    el.statScore.innerText = `${state.score}分`;

    // 1. 1v1 PK 对决分析
    const urlParams = new URLSearchParams(window.location.search);
    const inviter = urlParams.get('inviter') || '海淀·林同学';
    const oppScore = parseInt(urlParams.get('inviterScore'), 10) || 76;
    const oppLevel = parseInt(urlParams.get('inviterLevel'), 10) || 4;

    const isWin = (achievedLevel > oppLevel) || (achievedLevel === oppLevel && state.score >= oppScore);
    if (el.pkOutcomeBadge) {
      el.pkOutcomeBadge.className = isWin ? 'pk-badge win' : 'pk-badge lose';
      el.pkOutcomeBadge.innerText = isWin ? '👑 挑战大获全胜！' : '💪 稍逊一筹·继续加油';
    }
    if (el.pkMyScore) el.pkMyScore.innerText = `${state.score}分`;
    if (el.pkMyLevel) el.pkMyLevel.innerText = `冲至第 ${achievedLevel} 关`;
    if (el.pkOppName) el.pkOppName.innerText = `发给你的人 (${inviter})`;
    if (el.pkOppScore) el.pkOppScore.innerText = `${oppScore}分`;
    if (el.pkOppLevel) el.pkOppLevel.innerText = `冲至第 ${oppLevel} 关`;
    if (el.pkComment) {
      el.pkComment.innerText = isWin
        ? `恭喜！你成功战胜了发给你的人（${inviter}），前额叶控制力与敏捷反应超越同龄好友！`
        : `本次落后于发给你的人（${inviter}），不要灰心！针对性训练可快速激活专注力，快再试一次逆袭！`;
    }

    // 2. 省份天梯战报评定
    updateProvinceBenchmark(state.score);

    // 3. 专家二维码与领取提示
    if (el.expertQrWrap) {
      el.expertQrWrap.innerHTML = SVG_QR_CODE;
    }
    if (el.expertTipNote) {
      el.expertTipNote.innerText = `💡 复制或扫码添加时请备注：【专注力+第 ${achievedLevel} 关+${state.score}分】，老师将在 5 分钟内为您发送诊断报告与资料！`;
    }

    el.reportModal.classList.remove('hidden');
  }

  // 7. 各游戏模态动态关卡生成器
  function startLevel(lvl, isRestart = false) {
    if (!isRestart) {
      state.lives = 3;
      renderLives();
    }
    el.levelBadge.innerText = `第 ${lvl} 关 · L${lvl}`;
    el.stage.innerHTML = '';
    el.controls.innerHTML = '';
    if (state.subState && state.subState.timerHandle) {
      clearTimeout(state.subState.timerHandle);
    }
    state.subState = { startStamp: Date.now() };

    const g = REGISTRY[state.gameId];
    let duration;
    if (state.gameId === 'nback_flow') {
      const totalSteps = (lvl <= 3) ? 10 : (lvl <= 7 ? 14 : 18);
      const stepDuration = Math.max(0.9, 1.6 - (lvl * 0.07));
      duration = Math.ceil(totalSteps * (stepDuration + 0.35)) + 6;
    } else if (state.gameId === 'schulte_classic') {
      const cfg = SCHULTE_LEVEL_CONFIG[lvl] || { cols: 5, time: 20 };
      duration = cfg.time;
    } else if (state.gameId === 'nback_spatial') {
      duration = 25.0; // 空间 2-Back 给予充足的反应时间
    } else {
      duration = Math.max(5.0, 16.0 - (lvl * 0.9)); // 关卡越高，限时越短
    }
    startTimer(duration);

    // 根据手势类型先生成基础底栏
    renderControlsForGesture(g.gesture);

    // 根据模式生成舞台
    renderStageForModality(g.modality, g.layout, lvl);
  }

  // 渲染操作按键
  function renderControlsForGesture(gesture) {
    if (gesture === 'single_match_tap') {
      const n = (state.subState && state.subState.n) ? state.subState.n : (state.level <= 3 ? 1 : (state.level <= 7 ? 2 : 3));
      const btnMatch = document.createElement('button');
      btnMatch.className = 'duo-btn-match-single';
      btnMatch.id = 'btn-nback-match';
      btnMatch.innerHTML = `🎯 与【${n} 步前】相同 (Match) <span class="key-badge">空格 / F / 点击</span>`;
      btnMatch.onclick = () => handleNBackMatchTap();
      el.controls.appendChild(btnMatch);
    }
    else if (gesture === '2way_same_diff') {
      const isNBackFlow = (state.gameId === 'nback_flow');
      const btnSame = document.createElement('button');
      btnSame.className = 'duo-btn duo-btn-blue';
      btnSame.innerHTML = isNBackFlow ? '🟢 相同 (Match) <span class="key-badge">F / ←</span>' : '🟢 相同 (Match)';
      btnSame.onclick = () => handleTwoWayChoice(true);

      const btnDiff = document.createElement('button');
      btnDiff.className = 'duo-btn duo-btn-red';
      btnDiff.innerHTML = isNBackFlow ? '🔴 不同 (Diff) <span class="key-badge">J / →</span>' : '🔴 不同 (Diff)';
      btnDiff.onclick = () => handleTwoWayChoice(false);

      el.controls.appendChild(btnSame);
      el.controls.appendChild(btnDiff);
    }
    else if (gesture === '4way_direction_tap') {
      const pad = document.createElement('div');
      pad.className = 'd-pad';
      const dirs = [
        { d: 'up', icon: '↑', cls: 'd-up' },
        { d: 'left', icon: '←', cls: 'd-left' },
        { d: 'right', icon: '→', cls: 'd-right' },
        { d: 'down', icon: '↓', cls: 'd-down' }
      ];
      dirs.forEach(item => {
        const b = document.createElement('button');
        b.className = `d-btn ${item.cls}`;
        b.innerText = item.icon;
        b.onclick = () => handleDirectionTap(item.d);
        pad.appendChild(b);
      });
      el.controls.appendChild(pad);
    }
    else if (gesture === 'ticker_pass_tap') {
      const btnPass = document.createElement('button');
      btnPass.className = 'duo-btn duo-btn-blue';
      btnPass.innerText = '👉 普通数字 · 点击通过';
      btnPass.onclick = () => handleTickerPass();
      el.controls.appendChild(btnPass);
    }
    else if (gesture === 'animal_pass_tap') {
      const btnPass = document.createElement('button');
      btnPass.className = 'duo-btn duo-btn-orange';
      btnPass.innerText = '🐾 萌宠放行 · 快速点击';
      btnPass.onclick = () => handleAnimalPass();
      el.controls.appendChild(btnPass);
    }
    else if (gesture === 'gonogo_single_tap') {
      const btnHit = document.createElement('button');
      btnHit.className = 'duo-btn';
      btnHit.innerText = '⚡ 发现目标 · 瞬间击键';
      btnHit.onclick = () => handleGoNoGoHit();
      el.controls.appendChild(btnHit);
    }
    else if (gesture === 'priority_dual_target_tap') {
      const tip = document.createElement('div');
      tip.style.textAlign = 'center';
      tip.style.fontSize = '14px';
      tip.style.fontWeight = '800';
      tip.style.color = '#0284c7';
      tip.innerText = '👆 双色优先级：必须【先点蓝色】，再点【黄色】';
      el.controls.appendChild(tip);
    }
    else {
      // 默认网格点选提示
      const tip = document.createElement('div');
      tip.style.textAlign = 'center';
      tip.style.fontSize = '13px';
      tip.style.fontWeight = '700';
      tip.style.color = 'var(--text-muted)';
      tip.innerText = '👆 直接在上方舞台点选正确目标';
      el.controls.appendChild(tip);
    }
  }

  // 渲染主舞台刺激物
  function renderStageForModality(modality, layout, lvl) {
    const g = REGISTRY[state.gameId];

    // 00. 母版 01: N-Back 工作记忆刷新流 (自适应 1~3 Back)
    if (state.gameId === 'nback_flow' || modality === 'nback_flow') {
      renderNBackFlow(lvl);
    }
    // 0. 空间 2-Back 九宫格位置记忆 (第 2 款游戏: nback_spatial)
    else if (state.gameId === 'nback_spatial' || modality === 'spatial_nback') {
      renderSpatialNBack(lvl);
    }
    // 1. 舒尔特家族方格 (仅限真正的舒尔特系列游戏)
    else if (g && g.engine === 'schulte') {
      renderSchulteFamily(modality, layout, lvl);
    }
    // 2. 双色优先级瞬记
    else if (modality === 'dual_color_matrix_grid') {
      renderDualColorPriority(lvl);
    }
    // 3. 动物猛兽跑马灯
    else if (modality === 'animal_predator_stream') {
      renderAnimalPredatorStream(lvl);
    }
    // 4. 数字逢7跑马灯
    else if (modality === 'ticker_number') {
      renderNumberTickerStream(lvl);
    }
    // 5. 符号 Emoji 2-Back
    else if (modality === 'symbol_emoji_stream' || modality === 'text_stream' || modality === 'number_stream') {
      renderStreamNBack(modality, lvl);
    }
    // 6. Stroop 色词矩阵
    else if (modality === 'color_word_matrix') {
      renderStroopMatrix(lvl);
    }
    // 7. 视觉运动微感知 (旋转猫咪)
    else if (modality === 'rotating_cats') {
      renderRotatingCats(lvl);
    }
    // 8. 镜像倒立文字
    else if (modality === 'mirrored_hanzi') {
      renderMirroredHanzi(lvl);
    }
    // 9. MOT 多目标动态小球
    else if (modality === 'moving_balls') {
      renderMOTBalls(lvl);
    }
    // 10. 红绿灯 Go/No-Go
    else if (modality === 'traffic_light' || modality === 'cpt_rare_target') {
      renderTrafficSignal(modality, lvl);
    }
    // 11. 4选1类感知题 (镜中识表 / 遮挡积木 / 纤维交叉)
    else if (modality === 'mirrored_clock' || modality === 'stacked_cubes' || modality === 'crossed_lines' || modality === 'paper_folding_punch' || modality === 'character_scene') {
      renderVisualChoiceTask(modality, lvl);
    }
    // 12. 轴对称 / 3D 旋转两图比对
    else if (modality === 'symmetric_folding' || modality === 'wireframe_cube_pair' || modality === 'chiral_pattern' || modality === 'depth_cues' || modality === 'dot_matrix') {
      renderDualPanelCompare(modality, lvl);
    }
    // 13. 反向汉字冲动控制 (131/34/30)
    else if (modality === 'opposite_direction_word' || modality === 'arrow_prompt' || modality === 'multi_step_turn') {
      renderDirectionPrompt(modality, lvl);
    }
    // 兜底通用渲染
    else {
      renderDefaultFallback(lvl);
    }
  }

  // ---------------- 具体模态渲染器 ----------------

  // ==================== 母版 01: N-Back 工作记忆刷新流 引擎 ====================
  function getNForLevel(lvl) {
    if (lvl <= 3) return 1;
    if (lvl <= 7) return 2;
    return 3;
  }

  function getStimulusPool(lvl) {
    if (lvl <= 3) {
      return [
        { id: 'rocket', type: 'emoji', icon: '🚀', label: '火箭' },
        { id: 'star', type: 'emoji', icon: '⭐', label: '星星' },
        { id: 'cat', type: 'emoji', icon: '🐱', label: '小猫' },
        { id: 'apple', type: 'emoji', icon: '🍎', label: '苹果' },
        { id: 'ball', type: 'emoji', icon: '⚽', label: '足球' },
        { id: 'diamond', type: 'emoji', icon: '💎', label: '钻石' }
      ];
    } else if (lvl <= 7) {
      const items = [];
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
      for (let pos = 0; pos < 9; pos++) {
        items.push({
          id: `grid_${pos}`,
          type: 'grid',
          pos: pos,
          color: colors[pos % colors.length]
        });
      }
      return items;
    } else {
      const shapes = ['square', 'circle', 'triangle', 'diamond', 'cross'];
      const modes = ['normal', 'inverted', 'grayscale'];
      const items = [];
      shapes.forEach(s => {
        modes.forEach(m => {
          items.push({
            id: `geom_${s}_${m}`,
            type: 'geometry',
            shape: s,
            mode: m
          });
        });
      });
      return items;
    }
  }

  function isStimulusEqual(a, b, lvl) {
    if (!a || !b) return false;
    if (lvl <= 3) return a.id === b.id;
    if (lvl <= 7) return a.pos === b.pos;
    return a.shape === b.shape; // L8-10 顶内沟特征提取：比对形状核心，抑制反色/灰度干扰
  }

  function generateNBackSequence(lvl, totalSteps = 12, targetRatio = 0.35) {
    const n = getNForLevel(lvl);
    const pool = getStimulusPool(lvl);
    const sequence = [];

    for (let i = 0; i < totalSteps; i++) {
      let item;
      let expectedMatch = false;

      if (i < n) {
        item = pool[Math.floor(Math.random() * pool.length)];
        expectedMatch = false;
      } else {
        const matchPrev = Math.random() < targetRatio;
        if (matchPrev) {
          const prev = sequence[i - n].item;
          if (lvl <= 7) {
            item = Object.assign({}, prev);
          } else {
            const randomMode = ['normal', 'inverted', 'grayscale'][Math.floor(Math.random() * 3)];
            item = { id: `geom_${prev.shape}_${randomMode}`, type: 'geometry', shape: prev.shape, mode: randomMode };
          }
          expectedMatch = true;
        } else {
          const prev = sequence[i - n].item;
          let candidates = pool.filter(cand => !isStimulusEqual(cand, prev, lvl));
          item = candidates[Math.floor(Math.random() * candidates.length)];
          expectedMatch = false;
        }
      }

      sequence.push({
        step: i,
        item: item,
        expectedMatch: expectedMatch
      });
    }

    return { n, sequence };
  }

  function getShapeSVG(shape, mode) {
    let color = '#3b82f6';
    if (shape === 'circle') color = '#ec4899';
    if (shape === 'triangle') color = '#f59e0b';
    if (shape === 'diamond') color = '#8b5cf6';
    if (shape === 'cross') color = '#10b981';

    let inner = '';
    if (shape === 'square') {
      inner = `<rect x="15" y="15" width="70" height="70" rx="14" fill="${color}" stroke="#1e293b" stroke-width="4"/>`;
    } else if (shape === 'circle') {
      inner = `<circle cx="50" cy="50" r="35" fill="${color}" stroke="#1e293b" stroke-width="4"/>`;
    } else if (shape === 'triangle') {
      inner = `<polygon points="50,15 85,82 15,82" fill="${color}" stroke="#1e293b" stroke-width="4"/>`;
    } else if (shape === 'diamond') {
      inner = `<polygon points="50,12 86,50 50,88 14,50" fill="${color}" stroke="#1e293b" stroke-width="4"/>`;
    } else if (shape === 'cross') {
      inner = `<path d="M38,15 h24 v23 h23 v24 h-23 v23 h-24 v-23 h-23 v-24 h23 z" fill="${color}" stroke="#1e293b" stroke-width="4"/>`;
    }

    return `<svg class="nback-geom-shape ${mode}" viewBox="0 0 100 100">${inner}</svg>`;
  }

  function renderNBackFlow(lvl) {
    el.stage.innerHTML = '';
    const n = getNForLevel(lvl);
    const totalSteps = (lvl <= 3) ? 10 : (lvl <= 7 ? 14 : 18);
    const stepDuration = Math.max(0.9, 1.6 - (lvl * 0.07));
    const { sequence } = generateNBackSequence(lvl, totalSteps, 0.35);

    // 1. 构建主舞台（骨架常驻，绝不整体闪烁）
    const wrap = document.createElement('div');
    wrap.className = 'nback-flow-wrap';
    wrap.innerHTML = `
      <div class="nback-meta-bar">
        <span class="nback-mode-pill" id="nback-mode-pill">🌟 ${n}-Back 刷新流</span>
        <span class="nback-step-counter" id="nback-step-counter">0 / ${totalSteps}</span>
      </div>
      <div class="nback-progress-track">
        <div class="nback-progress-fill" id="nback-progress-fill" style="width: 0%;"></div>
      </div>
      <div class="nback-stage-card" id="nback-stage-card"></div>
    `;
    el.stage.appendChild(wrap);

    const card = document.getElementById('nback-stage-card');
    let gridCells = [];
    let symDisplay = null;
    let geomBox = null;

    // 2. 根据学段模态预先挂载容器（容器常驻，仅内部元素改变）
    if (lvl <= 3) {
      symDisplay = document.createElement('div');
      symDisplay.className = 'nback-symbol-display';
      symDisplay.id = 'nback-symbol-display';
      card.appendChild(symDisplay);
    } else if (lvl <= 7) {
      const grid = document.createElement('div');
      grid.className = 'nback-grid-matrix';
      grid.id = 'nback-grid-matrix';
      for (let p = 0; p < 9; p++) {
        const cell = document.createElement('div');
        cell.className = 'nback-grid-cell';
        cell.dataset.pos = p;
        grid.appendChild(cell);
        gridCells.push(cell);
      }
      card.appendChild(grid);
    } else {
      geomBox = document.createElement('div');
      geomBox.id = 'nback-geom-box';
      card.appendChild(geomBox);
    }

    const warmupNotice = document.createElement('div');
    warmupNotice.className = 'nback-warmup-notice';
    warmupNotice.id = 'nback-warmup-notice';
    warmupNotice.style.display = 'none';
    warmupNotice.style.marginTop = '12px';
    card.appendChild(warmupNotice);

    // 点击舞台卡片也可触发命中判定
    card.onclick = () => handleNBackMatchTap();

    state.subState = {
      n: n,
      lvl: lvl,
      totalSteps: totalSteps,
      stepDuration: stepDuration,
      sequence: sequence,
      stepIdx: 0,
      awaitingAnswer: false,
      userResponded: false,
      stepTimerHandle: null,
      isiTimerHandle: null,
      stepStartStamp: 0,
      correctHits: 0,
      correctRejections: 0,
      falseAlarms: 0,
      misses: 0,
      gridCells: gridCells,
      symDisplay: symDisplay,
      geomBox: geomBox,
      warmupNotice: warmupNotice
    };

    function updateHeaderUI(curStep) {
      const counterEl = document.getElementById('nback-step-counter');
      const fillEl = document.getElementById('nback-progress-fill');
      if (counterEl) counterEl.innerText = `${curStep + 1} / ${totalSteps}`;
      if (fillEl) {
        const pct = Math.round((curStep / totalSteps) * 100);
        fillEl.style.width = `${pct}%`;
      }
    }

    function advanceToNext() {
      if (state.lives <= 0) return;
      clearTimeout(state.subState.stepTimerHandle);

      const sub = state.subState;
      if (sub.stepIdx >= sub.totalSteps) {
        showToast(`🏆 第 ${lvl} 关通关！背外侧前额叶高频刷新达标`, 800);
        setTimeout(nextLevel, 400);
        return;
      }

      const curStep = sub.sequence[sub.stepIdx];
      updateHeaderUI(sub.stepIdx);

      const btnMatch = document.getElementById('btn-nback-match');

      // 仅亮起对应方块/符号，外框与未亮起方块保持静止
      if (lvl <= 3) {
        if (sub.symDisplay) {
          sub.symDisplay.innerText = curStep.item.icon;
          sub.symDisplay.style.opacity = '1';
        }
        playTone(400 + (curStep.item.label.charCodeAt(0) % 200), 'sine', 0.1, 0.1);
      } else if (lvl <= 7) {
        if (sub.gridCells && sub.gridCells[curStep.item.pos]) {
          const targetCell = sub.gridCells[curStep.item.pos];
          targetCell.classList.add('active-lit');
          targetCell.style.backgroundColor = curStep.item.color;
          targetCell.style.borderColor = curStep.item.color;
        }
        playTone(440 + curStep.item.pos * 35, 'triangle', 0.12, 0.12);
      } else {
        if (sub.geomBox) {
          sub.geomBox.innerHTML = getShapeSVG(curStep.item.shape, curStep.item.mode);
          sub.geomBox.style.opacity = '1';
        }
        playTone(500, 'sine', 0.1, 0.12);
      }

      if (sub.stepIdx < sub.n) {
        // 瞬记预热阶段 (前 N 项只需观察记忆，无需点击)
        sub.awaitingAnswer = false;
        sub.userResponded = false;
        el.gamePrompt.innerText = `👀 第 ${sub.stepIdx + 1} 项瞬记中（无需操作，第 ${sub.n + 1} 项起开始比对）`;

        if (sub.warmupNotice) {
          sub.warmupNotice.style.display = 'block';
          sub.warmupNotice.innerText = `👀 瞬记中... (${sub.stepIdx + 1}/${sub.n})`;
        }
        if (btnMatch) {
          btnMatch.disabled = true;
          btnMatch.innerHTML = `👀 观察瞬记中... (${sub.stepIdx + 1}/${sub.n})`;
        }

        sub.stepTimerHandle = setTimeout(() => {
          doISITransition();
        }, sub.stepDuration * 1000);
      } else {
        // 正式比对阶段 (只点相同，不点默认为不同)
        if (sub.warmupNotice) {
          sub.warmupNotice.style.display = 'none';
        }
        if (btnMatch) {
          btnMatch.disabled = false;
          btnMatch.innerHTML = `🎯 相同：与【${sub.n} 步前】一致 <span class="key-badge">空格 / F / 点击</span>`;
        }

        sub.awaitingAnswer = true;
        sub.userResponded = false;
        sub.stepStartStamp = Date.now();
        el.gamePrompt.innerText = `第 ${lvl} 关 · 与【${sub.n} 步前】相同时点击【相同】（不同无需点击）`;

        sub.stepTimerHandle = setTimeout(() => {
          // 步进时间耗尽：若玩家未点击，检查是否为漏报
          if (!sub.userResponded && sub.awaitingAnswer) {
            sub.awaitingAnswer = false;
            const stageCard = document.getElementById('nback-stage-card');
            if (curStep.expectedMatch) {
              // 实际相同却漏报
              sub.misses++;
              deductLife(`超时漏报：此方块与 ${sub.n} 步前相同！`);
              if (stageCard) {
                stageCard.classList.add('shake-error');
                setTimeout(() => stageCard.classList.remove('shake-error'), 400);
              }
            } else {
              // 实际不同且未按：正确放行克制
              sub.correctRejections++;
              state.stats.correct++;
            }
          }
          doISITransition();
        }, sub.stepDuration * 1000);
      }
    }

    function doISITransition() {
      const sub = state.subState;
      if (!sub) return;

      // 仅熄灭当前方块，棋盘框架绝对不重新渲染，彻底告别全屏闪烁
      if (lvl <= 3) {
        if (sub.symDisplay) sub.symDisplay.style.opacity = '0';
      } else if (lvl <= 7) {
        if (sub.gridCells) {
          sub.gridCells.forEach(c => {
            c.classList.remove('active-lit');
            c.style.backgroundColor = '';
            c.style.borderColor = '';
          });
        }
      } else {
        if (sub.geomBox) sub.geomBox.style.opacity = '0';
      }

      sub.isiTimerHandle = setTimeout(() => {
        sub.stepIdx++;
        advanceToNext();
      }, 180); // 180ms 间歇期，只有亮块熄灭
    }

    state.subState.advanceToNext = advanceToNext;
    state.subState.doISITransition = doISITransition;

    // 启动第一步
    setTimeout(advanceToNext, 300);
  }

  function handleNBackMatchTap() {
    const sub = state.subState;
    if (!sub) return;

    if (sub.stepIdx < sub.n) {
      showToast(`👀 观察瞬记前 ${sub.n} 项，第 ${sub.n + 1} 项开始比对`, 600);
      return;
    }

    if (!sub.awaitingAnswer || sub.userResponded) return;

    sub.userResponded = true;
    sub.awaitingAnswer = false;
    clearTimeout(sub.stepTimerHandle);

    const rt = Date.now() - sub.stepStartStamp;
    state.stats.reactionTimes.push(rt);

    const curStep = sub.sequence[sub.stepIdx];
    const card = document.getElementById('nback-stage-card');

    if (curStep.expectedMatch) {
      // 命中 (Hit)
      sub.correctHits++;
      state.stats.correct++;
      soundSuccess();
      showToast(`🎯 精准命中！与 ${sub.n} 步前相同 (+${15 * sub.lvl}分)`, 400);

      if (card) {
        card.classList.add('hit-pulse');
        setTimeout(() => card.classList.remove('hit-pulse'), 300);
      }
    } else {
      // 虚报手抖 (False Alarm)
      sub.falseAlarms++;
      deductLife(`虚报手抖：此项与 ${sub.n} 步前不同！`);
      if (card) {
        card.classList.add('shake-error');
        setTimeout(() => card.classList.remove('shake-error'), 400);
      }
    }

    // 短暂留存后熄灭方块并推进下一步
    setTimeout(() => {
      if (typeof sub.doISITransition === 'function') {
        sub.doISITransition();
      }
    }, 200);
  }

  // 0. 空间 2-Back 九宫格位置记忆挑战 (第 2 款游戏)
  function renderSpatialNBack(lvl) {
    el.stage.innerHTML = '';

    // 状态板与进度指示
    const statusBox = document.createElement('div');
    statusBox.className = 'nback-status-box';
    statusBox.innerHTML = `
      <div class="nback-step-tag" id="nback-step-tag">准备开始：请专注观察九宫格</div>
      <div class="nback-progress-bar-wrap">
        <div class="nback-progress-bar" id="nback-progress-bar" style="width: 0%;"></div>
      </div>
    `;
    el.stage.appendChild(statusBox);

    // 3x3 九宫格舞台
    const grid = document.createElement('div');
    grid.className = 'grid-stage grid-3x3';
    const cells = [];
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.index = i;
      grid.appendChild(cell);
      cells.push(cell);
    }
    el.stage.appendChild(grid);

    // 目标达标正确判定次数 (第1关需4次正确判定，随关卡递增至6次)
    const requiredMatches = Math.min(6, 3 + Math.floor(lvl / 2));
    // 刺激物停留时间随关卡递减：从 1100ms 到 750ms
    const flashDuration = Math.max(700, 1100 - lvl * 40);

    state.subState = {
      cells: cells,
      history: [],
      stepIndex: 0,
      correctCount: 0,
      requiredMatches: requiredMatches,
      isMatch: false,
      awaitingAnswer: false,
      timerHandle: null,
      flashDuration: flashDuration,
      showNext: null
    };

    function updateStepUI() {
      const tag = document.getElementById('nback-step-tag');
      const bar = document.getElementById('nback-progress-bar');
      const cur = state.subState.correctCount;
      const total = state.subState.requiredMatches;
      const pct = Math.min(100, Math.round((cur / total) * 100));
      if (bar) bar.style.width = `${pct}%`;

      if (state.subState.stepIndex === 0) {
        if (tag) tag.innerHTML = `第 1 步：👀 记住当前位置（1秒后出现第2步）`;
        el.gamePrompt.innerText = `第 1 步：瞬记当前方块位置 (无需操作)`;
      } else if (state.subState.stepIndex === 1) {
        if (tag) tag.innerHTML = `第 2 步：👀 记住当前位置（下一步开始比对！）`;
        el.gamePrompt.innerText = `第 2 步：瞬记当前方块位置 (准备 2-Back 比对)`;
      } else {
        if (tag) tag.innerHTML = `第 ${state.subState.stepIndex + 1} 步：当前与【2步前】是否相同？ (达标进度: ${cur}/${total})`;
        el.gamePrompt.innerText = `第 ${lvl} 关 · 当前位置与【2步前】相同吗？点击下方【相同】或【不同】`;
      }
    }

    function showNextStimulus() {
      if (state.lives <= 0) return;
      clearTimeout(state.subState.timerHandle);

      // 清空所有格子高亮
      cells.forEach(c => {
        c.innerText = '';
        c.classList.remove('nback-active');
      });

      const k = state.subState.stepIndex;
      let nextPos;

      if (k < 2) {
        // 前两步：随机挑选一个格子
        nextPos = Math.floor(Math.random() * 9);
        state.subState.history.push(nextPos);
        state.subState.isMatch = false;
        state.subState.awaitingAnswer = false;

        // 点亮格子
        cells[nextPos].classList.add('nback-active');
        cells[nextPos].innerText = '●';
        playTone(440 + nextPos * 40, 'sine', 0.12, 0.1);
        updateStepUI();

        // 自动推进到下一步
        state.subState.timerHandle = setTimeout(() => {
          cells[nextPos].innerText = '';
          cells[nextPos].classList.remove('nback-active');
          state.subState.stepIndex++;
          state.subState.timerHandle = setTimeout(showNextStimulus, 300);
        }, state.subState.flashDuration);
      } else {
        // 第 3 步起 (k >= 2)：可进行 2-Back 判定
        const twoStepsAgo = state.subState.history[k - 2];
        const shouldMatch = Math.random() < 0.45; // 45% 概率相同

        if (shouldMatch) {
          nextPos = twoStepsAgo;
        } else {
          // 挑选一个不同于 2 步前的位置
          const others = [0,1,2,3,4,5,6,7,8].filter(x => x !== twoStepsAgo);
          nextPos = others[Math.floor(Math.random() * others.length)];
        }

        state.subState.history.push(nextPos);
        state.subState.isMatch = (nextPos === twoStepsAgo);
        state.subState.awaitingAnswer = true;

        cells[nextPos].classList.add('nback-active');
        cells[nextPos].innerText = '●';
        playTone(440 + nextPos * 40, 'sine', 0.12, 0.1);
        updateStepUI();
      }
    }

    state.subState.showNext = showNextStimulus;
    state.subState.timerHandle = setTimeout(showNextStimulus, 400);
  }

  // 1. 舒尔特家族 (数字 / 字母 / 中文 / 罗马 / 旋转 / 倒序)
  function renderSchulteFamily(modality, layout, lvl) {
    const grid = document.createElement('div');
    grid.className = 'grid-stage';

    let size = 5;
    let items = [];
    let isReverse = (state.gameId === 'schulte_reverse');

    if (state.gameId === 'schulte_classic') {
      const cfg = SCHULTE_LEVEL_CONFIG[lvl] || { cols: 5, time: 20 };
      size = cfg.cols;
      items = [];
      for (let i = 1; i <= size * size; i++) items.push(i);
      el.gamePrompt.innerText = `第 ${lvl} 关 · ${size}×${size} 方格 · 请点击: 【1】(限时 ${cfg.time}s)`;
    } else if (modality === 'letter_matrix_grid') {
      size = 3;
      items = ['A','B','C','D','E','F','G','H','I'];
    } else if (modality === 'chinese_num_matrix_grid') {
      size = 4;
      items = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六'];
    } else if (modality === 'roman_matrix_grid') {
      size = 5;
      grid.classList.add('grid-noise');
      items = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII','XXIII','XXIV','XXV'];
    } else if (layout === 'grid_6x6') {
      size = 6;
      for (let i = 1; i <= 36; i++) items.push(i);
    } else if (layout === 'grid_7x7') {
      size = 7;
      for (let i = 1; i <= 49; i++) items.push(i);
    } else {
      size = 5;
      for (let i = 1; i <= 25; i++) items.push(i);
    }

    if (layout === 'grid_5x5_rotating') {
      grid.classList.add('rotating-grid');
    }

    grid.classList.add(`grid-${size}x${size}`);

    // 打乱布局
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    state.subState.expectedIndex = isReverse ? items.length - 1 : 0;
    state.subState.targetList = items;
    state.subState.isReverse = isReverse;

    shuffled.forEach(val => {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.innerText = val;
      cell.onclick = () => {
        if (cell.classList.contains('correct')) return;
        const expected = state.subState.targetList[state.subState.expectedIndex];
        if (val === expected) {
          soundSuccess();
          cell.classList.add('correct');
          if (state.subState.isReverse) {
            state.subState.expectedIndex--;
            if (state.subState.expectedIndex < 0) {
              nextLevel();
            } else {
              const nextVal = state.subState.targetList[state.subState.expectedIndex];
              el.gamePrompt.innerText = `第 ${state.level} 关 · 倒序查找 · 下一个: 【${nextVal}】`;
            }
          } else {
            state.subState.expectedIndex++;
            if (state.subState.expectedIndex >= state.subState.targetList.length) {
              nextLevel();
            } else {
              const nextVal = state.subState.targetList[state.subState.expectedIndex];
              el.gamePrompt.innerText = `第 ${state.level} 关 · 请点击: 【${nextVal}】`;
            }
          }
        } else {
          cell.classList.add('wrong');
          setTimeout(() => cell.classList.remove('wrong'), 400);
          deductLife(`顺序错误，应点【${expected}】`);
        }
      };
      grid.appendChild(cell);
    });

    el.stage.appendChild(grid);
  }

  // 2. 双色优先级瞬记 (蓝先、黄后)
  function renderDualColorPriority(lvl) {
    const grid = document.createElement('div');
    grid.className = 'grid-stage grid-3x3';

    // 随机选 1 个蓝、2~4 个黄
    const indices = [0,1,2,3,4,5,6,7,8].sort(() => Math.random() - 0.5);
    const blueIdx = indices[0];
    const yellowCount = Math.min(4, 2 + Math.floor(lvl / 3));
    const yellowIndices = indices.slice(1, 1 + yellowCount);

    state.subState.blueClicked = false;
    state.subState.yellowRemaining = yellowCount;
    state.subState.blueIdx = blueIdx;
    state.subState.yellowIndices = new Set(yellowIndices);

    // 初始高亮呈现 1200ms
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.idx = i;
      if (i === blueIdx) cell.classList.add('blue-highlight');
      if (yellowIndices.includes(i)) cell.classList.add('highlight');
      grid.appendChild(cell);
    }
    el.stage.appendChild(grid);

    setTimeout(() => {
      // 隐去高亮，让玩家按优先级点选
      grid.querySelectorAll('.grid-cell').forEach(c => {
        c.classList.remove('blue-highlight', 'highlight');
        c.onclick = () => {
          const idx = parseInt(c.dataset.idx, 10);
          if (!state.subState.blueClicked) {
            if (idx === state.subState.blueIdx) {
              soundSuccess();
              c.classList.add('blue-highlight');
              state.subState.blueClicked = true;
              showToast('✨ 蓝色命中！继续点黄色');
            } else {
              c.classList.add('wrong');
              deductLife('必须先点【蓝色优先块】');
            }
          } else {
            if (state.subState.yellowIndices.has(idx)) {
              soundSuccess();
              c.classList.add('highlight');
              state.subState.yellowIndices.delete(idx);
              if (state.subState.yellowIndices.size === 0) {
                nextLevel();
              }
            } else {
              c.classList.add('wrong');
              deductLife('黄色方块位置错误');
            }
          }
        };
      });
    }, 1200);
  }

  // 3. 动物猛兽跑马灯 (Zoo Go/No-Go)
  function renderAnimalPredatorStream(lvl) {
    const card = document.createElement('div');
    card.className = 'stream-card';

    const pets = ['🐰 小白兔', '🐱 小花猫', '🐶 小黄狗', '🐼 大熊猫', '🐬 小海豚'];
    const predators = ['🐯 东北虎', '🐻 大黑熊', '🐺 大灰狼'];

    const isPredator = Math.random() < 0.35;
    const chosen = isPredator 
      ? predators[Math.floor(Math.random() * predators.length)]
      : pets[Math.floor(Math.random() * pets.length)];

    card.innerHTML = `
      <div class="stream-content" style="font-size:36px;">${chosen}</div>
      <div class="stream-sub">${isPredator ? '⚠️ 猛兽来袭 · 紧急刹车！' : '🐾 萌宠驾到 · 快速放行！'}</div>
    `;
    el.stage.appendChild(card);

    state.subState.isPredator = isPredator;
    state.subState.passed = false;
  }

  function handleAnimalPass() {
    if (state.subState.passed) return;
    state.subState.passed = true;
    if (state.subState.isPredator) {
      deductLife('猛兽必须急刹！不可放行');
    } else {
      soundSuccess();
      showToast('🐾 萌宠放行成功！');
      setTimeout(nextLevel, 300);
    }
  }

  // 4. 数字逢 7 跑马灯
  function renderNumberTickerStream(lvl) {
    const card = document.createElement('div');
    card.className = 'stream-card';

    let num = Math.floor(Math.random() * 80) + 1;
    const isSeven = (num % 7 === 0 || String(num).includes('7'));

    card.innerHTML = `
      <div class="stream-content">${num}</div>
      <div class="stream-sub">逢 7、含 7 或 7 的倍数禁止点击</div>
    `;
    el.stage.appendChild(card);

    state.subState.isSeven = isSeven;
    state.subState.passed = false;
  }

  function handleTickerPass() {
    if (state.subState.passed) return;
    state.subState.passed = true;
    if (state.subState.isSeven) {
      deductLife('逢7数字严禁击键通过！');
    } else {
      soundSuccess();
      showToast('👉 普通数字验证通过！');
      setTimeout(nextLevel, 300);
    }
  }

  // 5. 符号 / 文字 / 数字 2-Back 刺激流
  function renderStreamNBack(modality, lvl) {
    const card = document.createElement('div');
    card.className = 'stream-card';

    let pool = ['🌟','🚀','🎈','🌸','🍎','⚽','🚗','👑','🎁','🔔'];
    if (modality === 'text_stream') pool = ['北京','上海','广州','杭州','成都','南京','西安','武汉'];
    if (modality === 'number_stream') pool = ['1','2','3','4','5','6','7','8','9'];

    const isMatch = Math.random() < 0.5;
    const curItem = pool[Math.floor(Math.random() * pool.length)];

    card.innerHTML = `
      <div class="stream-content" style="font-size:42px;">${curItem}</div>
      <div class="stream-sub">比对当前项与 2 步前刺激物</div>
    `;
    el.stage.appendChild(card);

    state.subState.isMatch = isMatch;
  }

  function handleTwoWayChoice(chosenSame) {
    // 0. 母版 01: N-Back 工作记忆刷新流
    if (state.gameId === 'nback_flow') {
      handleNBackFlowChoice(chosenSame);
      return;
    }

    // 1. 如果当前是空间 2-back (第 2 款游戏)
    if (state.gameId === 'nback_spatial') {
      if (!state.subState.awaitingAnswer) {
        showToast('👀 前两步为瞬时记忆阶段，第三步起开始比对！', 1000);
        return;
      }
      state.subState.awaitingAnswer = false;
      const isCorrect = (chosenSame === !!state.subState.isMatch);

      if (isCorrect) {
        soundSuccess();
        state.stats.correct++;
        state.subState.correctCount++;
        showToast(`✨ 判断正确！进度: ${state.subState.correctCount}/${state.subState.requiredMatches}`);

        if (state.subState.correctCount >= state.subState.requiredMatches) {
          clearTimeout(state.subState.timerHandle);
          setTimeout(nextLevel, 400);
          return;
        }
      } else {
        soundError();
        const correctStr = state.subState.isMatch ? '相同' : '不同';
        deductLife(`判断失误，正确应为【${correctStr}】`);
      }

      // 如果未耗尽心数，短暂间隔后继续出下一题
      if (state.lives > 0) {
        if (state.subState.cells) {
          state.subState.cells.forEach(c => {
            c.innerText = '';
            c.classList.remove('nback-active');
          });
        }
        state.subState.stepIndex++;
        clearTimeout(state.subState.timerHandle);
        state.subState.timerHandle = setTimeout(() => {
          if (typeof state.subState.showNext === 'function') {
            state.subState.showNext();
          }
        }, 350);
      }
      return;
    }

    // 2. 其他通用 2way 题目逻辑
    const isCorrect = (chosenSame === !!state.subState.isMatch);
    if (isCorrect) {
      soundSuccess();
      showToast('✨ 判断准确！');
      setTimeout(nextLevel, 300);
    } else {
      deductLife('匹配判断失误');
    }
  }

  // 6. Stroop 色词矩阵
  function renderStroopMatrix(lvl) {
    const grid = document.createElement('div');
    grid.className = 'stroop-grid';

    const words = ['红', '蓝', '绿', '黄', '黑'];
    const colors = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#1f2937'];

    const targetPos = Math.floor(Math.random() * 25);
    state.subState.targetPos = targetPos;

    for (let i = 0; i < 25; i++) {
      const cell = document.createElement('div');
      cell.className = 'stroop-cell';
      const wIdx = Math.floor(Math.random() * words.length);
      let cIdx = Math.floor(Math.random() * colors.length);
      
      if (i === targetPos) {
        cIdx = wIdx; // 正确答案：字义与墨水完全相同
      } else if (cIdx === wIdx) {
        cIdx = (cIdx + 1) % colors.length; // 确保干扰项字色不同
      }

      cell.innerText = words[wIdx];
      cell.style.color = colors[cIdx];
      cell.onclick = () => {
        if (i === state.subState.targetPos) {
          soundSuccess();
          cell.style.borderColor = '#58cc02';
          showToast('✨ 字色相符！精准命中');
          setTimeout(nextLevel, 300);
        } else {
          cell.style.borderColor = '#ea2b2b';
          deductLife('字义与颜色不符');
        }
      };
      grid.appendChild(cell);
    }
    el.stage.appendChild(grid);
  }

  // 7. 视觉运动微感知 (旋转猫咪)
  function renderRotatingCats(lvl) {
    const box = document.createElement('div');
    box.className = 'motion-container';

    const oddIdx = Math.floor(Math.random() * 4);
    state.subState.oddIdx = oddIdx;

    for (let i = 0; i < 4; i++) {
      const cat = document.createElement('div');
      cat.className = `cat-circle ${i === oddIdx ? 'spin-ccw' : 'spin-cw'}`;
      cat.innerText = '🐱';
      cat.onclick = () => {
        if (i === state.subState.oddIdx) {
          soundSuccess();
          showToast('🎯 捕捉到逆向旋转！');
          setTimeout(nextLevel, 300);
        } else {
          deductLife('这只与其他旋转方向相同');
        }
      };
      box.appendChild(cat);
    }
    el.stage.appendChild(box);
  }

  // 8. 镜像汉字
  function renderMirroredHanzi(lvl) {
    const list = [
      { text: '专注致远', wrong: ['远致专注', '专注如山', '宁静致远'] },
      { text: '一鸣惊人', wrong: ['惊人一鸣', '一鸣冲天', '平步青云'] },
      { text: '知行合一', wrong: ['合一知行', '知难而进', '学以致用'] },
      { text: '临危不乱', wrong: ['不乱临危', '临危受命', '从容不迫'] }
    ];
    const item = list[Math.floor(Math.random() * list.length)];

    const banner = document.createElement('div');
    banner.style.textAlign = 'center';
    banner.style.margin = '20px auto';
    banner.innerHTML = `<div class="reverse-text">${item.text}</div><div style="font-size:12px;color:var(--text-muted);margin-top:8px;">(左右镜像翻转字)</div>`;
    el.stage.appendChild(banner);

    // 4个备选按钮
    const options = [item.text, ...item.wrong].sort(() => Math.random() - 0.5);
    const optGrid = document.createElement('div');
    optGrid.className = 'options-grid';

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerText = opt;
      btn.onclick = () => {
        if (opt === item.text) {
          soundSuccess();
          showToast('✨ 语义辨析成功！');
          setTimeout(nextLevel, 300);
        } else {
          deductLife('识别错误');
        }
      };
      optGrid.appendChild(btn);
    });
    el.stage.appendChild(optGrid);
  }

  // 9. MOT 多目标动态追踪
  function renderMOTBalls(lvl) {
    const arena = document.createElement('div');
    arena.className = 'mot-arena';
    el.stage.appendChild(arena);

    const ballCount = 6;
    const targetCount = 2;
    const balls = [];
    const targetIndices = new Set([0, 1]);

    state.subState.targetFound = 0;
    state.subState.targetTotal = targetCount;
    state.subState.trackingReady = false;

    for (let i = 0; i < ballCount; i++) {
      const b = document.createElement('div');
      b.className = `mot-ball ${targetIndices.has(i) ? 'target-active' : ''}`;
      b.innerText = targetIndices.has(i) ? '🎯' : '';
      const posX = 20 + (i % 3) * 80;
      const posY = 30 + Math.floor(i / 3) * 90;
      b.style.left = `${posX}px`;
      b.style.top = `${posY}px`;
      arena.appendChild(b);
      balls.push({ el: b, isTarget: targetIndices.has(i), x: posX, y: posY, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4 });
    }

    // 1.5s 后取消高亮并开始运动
    setTimeout(() => {
      balls.forEach(b => {
        b.el.classList.remove('target-active');
        b.el.innerText = '';
      });
      state.subState.trackingReady = true;

      // 运动 2 秒后停止
      let frames = 0;
      const moveInterval = setInterval(() => {
        frames++;
        balls.forEach(b => {
          b.x += b.vx;
          b.y += b.vy;
          if (b.x < 10 || b.x > 270) b.vx *= -1;
          if (b.y < 10 || b.y > 230) b.vy *= -1;
          b.el.style.left = `${b.x}px`;
          b.el.style.top = `${b.y}px`;
        });

        if (frames > 40) {
          clearInterval(moveInterval);
          showToast('⏸️ 停止运动！请点选目标小球');
          balls.forEach(b => {
            b.el.onclick = () => {
              if (b.isTarget) {
                soundSuccess();
                b.el.classList.add('selected');
                b.el.innerText = '✓';
                state.subState.targetFound++;
                if (state.subState.targetFound >= state.subState.targetTotal) {
                  nextLevel();
                }
              } else {
                b.el.style.background = '#ef4444';
                deductLife('选错了小球');
              }
            };
          });
        }
      }, 50);
    }, 1500);
  }

  // 10. 红绿灯 Go/No-Go & CPT
  function renderTrafficSignal(modality, lvl) {
    const card = document.createElement('div');
    card.className = 'stream-card';

    const isGreen = Math.random() < 0.65;
    const color = isGreen ? '#22c55e' : '#ef4444';
    const text = isGreen ? '🟢 绿灯通行' : '🔴 红灯急刹';

    card.innerHTML = `
      <div class="stream-content" style="color:${color};font-size:54px;">${isGreen ? '●' : '■'}</div>
      <div class="stream-sub" style="color:${color};font-weight:900;">${text}</div>
    `;
    el.stage.appendChild(card);

    state.subState.isGreen = isGreen;
  }

  function handleGoNoGoHit() {
    if (state.subState.isGreen) {
      soundSuccess();
      showToast('⚡ 快速反应命中！');
      setTimeout(nextLevel, 300);
    } else {
      deductLife('红灯/禁止目标切勿击键！');
    }
  }

  // 11. 4选1类视觉任务
  function renderVisualChoiceTask(modality, lvl) {
    const wireframe = document.createElement('div');
    wireframe.className = 'visual-wireframe';

    let ans = '3:15';
    let opts = ['3:15', '8:45', '9:15', '2:45'];

    if (modality === 'mirrored_clock') {
      wireframe.innerHTML = `<div>🕰️</div><div style="font-size:14px;color:#0284c7;">镜中示数 8:45</div>`;
      ans = '3:15';
      opts = ['3:15', '8:45', '9:15', '2:45'];
    } else if (modality === 'stacked_cubes') {
      wireframe.innerHTML = `<div>🧊🧊</div><div style="font-size:14px;color:#d97706;">立体透视层叠</div>`;
      ans = '11块';
      opts = ['9块', '10块', '11块', '12块'];
    } else {
      wireframe.innerHTML = `<div>📐</div><div style="font-size:14px;color:#475569;">空间结构展开</div>`;
      ans = '图案B';
      opts = ['图案A', '图案B', '图案C', '图案D'];
    }

    el.stage.appendChild(wireframe);

    const optGrid = document.createElement('div');
    optGrid.className = 'options-grid';
    opts.sort(() => Math.random() - 0.5).forEach(o => {
      const b = document.createElement('button');
      b.className = 'option-btn';
      b.innerText = o;
      b.onclick = () => {
        if (o === ans) {
          soundSuccess();
          showToast('✨ 正确推断！');
          setTimeout(nextLevel, 300);
        } else {
          deductLife('推算答案不正确');
        }
      };
      optGrid.appendChild(b);
    });
    el.stage.appendChild(optGrid);
  }

  // 12. 双面板比对任务 (3D旋转/轴对称)
  function renderDualPanelCompare(modality, lvl) {
    const isSame = Math.random() < 0.5;
    state.subState.isMatch = isSame;

    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.gap = '14px';
    wrap.style.alignItems = 'center';

    const p1 = document.createElement('div');
    p1.className = 'visual-wireframe';
    p1.style.width = '130px';
    p1.style.height = '130px';
    p1.innerHTML = `<div style="font-size:26px;">🔷</div><div style="font-size:11px;color:#64748b;">基准空间构型</div>`;

    const p2 = document.createElement('div');
    p2.className = 'visual-wireframe';
    p2.style.width = '130px';
    p2.style.height = '130px';
    p2.innerHTML = `<div style="font-size:26px; transform: rotate(${isSame ? '90deg' : '180deg'}) scaleX(${isSame?1:-1});">🔷</div><div style="font-size:11px;color:#64748b;">旋转/镜面对照</div>`;

    wrap.appendChild(p1);
    wrap.appendChild(p2);
    el.stage.appendChild(wrap);
  }

  // 13. 反向方向汉字 (见左选右)
  function renderDirectionPrompt(modality, lvl) {
    const card = document.createElement('div');
    card.className = 'stream-card';

    const dirs = [
      { text: '左', opp: 'right', prompt: '反向指令：见左点右' },
      { text: '右', opp: 'left', prompt: '反向指令：见右点左' },
      { text: '上', opp: 'down', prompt: '反向指令：见上点下' },
      { text: '下', opp: 'up', prompt: '反向指令：见下点上' }
    ];
    const item = dirs[Math.floor(Math.random() * dirs.length)];

    card.innerHTML = `
      <div class="stream-content">${item.text}</div>
      <div class="stream-sub">${item.prompt}</div>
    `;
    el.stage.appendChild(card);

    state.subState.expectedDir = item.opp;
  }

  function handleDirectionTap(dir) {
    if (dir === state.subState.expectedDir) {
      soundSuccess();
      showToast('✨ 冲动抑制克制成功！');
      setTimeout(nextLevel, 300);
    } else {
      deductLife(`冲动出错，应选反向【${state.subState.expectedDir}】`);
    }
  }

  // 兜底渲染
  function renderDefaultFallback(lvl) {
    const card = document.createElement('div');
    card.className = 'stream-card';
    card.innerHTML = `
      <div class="stream-content">🎯</div>
      <div class="stream-sub">点击下方通过以验证逻辑</div>
    `;
    el.stage.appendChild(card);
  }

  // 8. 页面加载入口
  window.addEventListener('DOMContentLoaded', () => {
    initToolbar();

    // 检测 URL hash 或 query param
    const hash = window.location.hash.replace('#', '');
    const urlParams = new URLSearchParams(window.location.search);
    const initialGame = hash || urlParams.get('game') || 'nback_flow';

    switchGame(initialGame, 1);
  });

  // 9. 全局键盘快捷键响应 (支持母版 01 N-Back 等高频神经反应游戏)
  window.addEventListener('keydown', (e) => {
    if (el.reportModal && !el.reportModal.classList.contains('hidden')) return;

    if (state.gameId === 'nback_flow') {
      if (e.key === ' ' || e.key === 'f' || e.key === 'F' || e.key === 'Enter') {
        e.preventDefault();
        handleNBackMatchTap();
      }
    }
  });

})();
