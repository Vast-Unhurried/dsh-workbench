window.__ModuleLoader__.load({
  id: '@local/dsh-workbench',
  factory(require) {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const React = require('react');
    const ReactDOM = (() => {
      try {
        return require('react-dom');
      } catch {
        return { createPortal: (element) => element };
      }
    })();
    const h = React.createElement;
    const { useEffect, useLayoutEffect, useRef, useState, useMemo } = React;

    /** Dictionary namespace owned by this plugin. */
    const NS = 'workbench';
    /** Sidebar panel id; the main slot is keyed by the same id. */
    const PANEL_ID = 'workbench';
    /** Sidebar order: directly below the shipped Automation tasks entry (10). */
    const PANEL_ORDER = 20;
    /** Browser-relative API root served by this plugin's Host half. */
    const API = '/workbench/api';
    /** The agent preset a plain-chat board runs under. */
    const CHAT_PRESET = 'workbench-chat';
    /** Built-in presets a non-chat conversation board may choose. */
    const AGENT_PRESETS = ['standard', 'ptc', 'minimal', 'cordis'];
    /** The workbench's working area, used when the document names none. */
    const WORKSPACE_FALLBACK = 'E:\\DeepseekHarness\\工作台';
    /** Priorities a to-do may carry, most urgent first. */
    const PRIORITIES = ['high', 'normal', 'low'];
    /** One day in milliseconds. */
    const DAY_MS = 86400000;
    /**
     * Field ceilings shared by the editors.
     *
     * The Host is the authority and re-applies every bound on save. These local
     * caps exist so a long paste is visibly limited in the editor instead of
     * being silently cut on the round trip; they mirror the Host constants.
     */
    const MAX_BOARD_NAME = 120;
    const MAX_PROMPT_NAME = 120;
    const MAX_PROMPT_TEXT = 60000;
    const MAX_TODO_TITLE = 200;
    const MAX_TODO_NOTE = 4000;
    const MAX_NOTE_TITLE = 200;
    const MAX_NOTE_BODY = 20000;
    const MAX_NOTE_TAGS = 8;
    const MAX_WORKSPACE_PATH = 2048;
    /** Structural ceilings mirrored from the Host's normalization. */
    const MAX_BOARDS = 200;
    const MAX_CHILDREN_PER_BOARD = 100;
    const MAX_PROMPTS = 200;
    const MAX_SKILLS = 200;
    const MAX_TODOS_PER_BOARD = 500;
    const MAX_NOTES_PER_BOARD = 500;
    const MAX_SESSIONS_PER_BOARD = 40;
    /** Longest provider/model/reasoning id accepted from the Host catalog. */
    const MAX_MODEL_ID = 200;
    /** Longest record id and skill directory name accepted from the Host. */
    const MAX_ID = 200;
    const MAX_SKILL_NAME = 128;
    /**
     * Object keys a board id must never become on the client either. The Host
     * rejects them during normalization, but `isDocument()` also guards a
     * broken proxy answer before it reaches Settings/Maps.
     */
    const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

    // ── the dictionary ───────────────────────────────────────────────────────
    //
    // Every string the plugin can put on screen lives here, in both languages.
    // A key nothing reads is dead weight (the audit refuses it) and a literal
    // outside the dictionary would be a string only one language can say, so
    // the copy is set in one place per language and nowhere else.

    const zh = {
      panel: '工作台',

      // ── the shelf's header and its day readout ──────────────────────────────
      'day.week.mon': '星期一',
      'day.week.tue': '星期二',
      'day.week.wed': '星期三',
      'day.week.thu': '星期四',
      'day.week.fri': '星期五',
      'day.week.sat': '星期六',
      'day.week.sun': '星期日',
      'watch.desk': 'WORKBENCH / THE SHELF',
      'watch.dayOfYear': '第 {day} 日 / 共 {total} 日',
      'watch.logNote': '工作台是一本每天续写的书。',
      'watch.month': '{month}月',
      'watch.dayPage': "今日清单 / TODAY'S LIST",
      'watch.reminders': '提醒 / REMINDERS',
      'watch.noReminders': '今天没有提醒。',
      'watch.weekDone': '本周完成',
      'watch.weekNew': '本周新增',
      'watch.weekNotes': '本周记录',
      'watch.weekOfYear': '第 {week} 周',
      'watch.onList': '清单内',
      'watch.hint': '← → 选卷 · 悬停预览 · 单击打开 · 右键章节新建',

      // ── the shelf itself ───────────────────────────────────────────────────
      'ledger.spaces': '{spaces} 卷 · {due} 件今日 · {over} 件逾期 · {remind} 个提醒',
      'ledger.siteNotes': '今日',
      'ledger.materials': '材料备注 / MATERIALS',
      'ledger.noMaterials': '还没有材料备注。',
      'ledger.continue': '继续最近一段',
      'ledger.openList': '查看今日清单',
      'ledger.openNotes': '打开笔记',
      'ledger.configure': '配置',
      'ledger.slips': '{count} 条',
      'ledger.noPrompt': '默认',
      'ledger.noSkills': '未挂技能',
      'ledger.talks': '{count} 段对话',
      'ledger.stateReady': '可继续',
      'ledger.stateIdle': '待命',
      'ledger.stateToday': '今日',
      'ledger.stateOver': '逾期',
      'ledger.stateDone': '已清',
      'ledger.stateNote': '在记',
      'ledger.kindChat': '聊天',
      'ledger.kindStandard': '标准',
      'ledger.kindTodo': '待办',
      'ledger.kindNote': '笔记',
      'ledger.newTalk': '新建会话',
      'ledger.empty': '还没有卷册。到「设置 · 工作台」建第一卷。',
      'ledger.subHint': '单击展开全部会话 · 右键新建会话',
      'ledger.hintSurface': '单击打开这一卷的内页。',
      'ledger.configureUnavailable': '没能自动打开设置：请从账号菜单进入「设置 › 工作台」。',

      // ── the cover, the inner page and the shelf's own copy ────────────────
      'shelf.series': 'PRESS / {count} VOLUMES · {year}',
      'shelf.clock': '当前时间',
      'shelf.volumes': '{count} 卷 / VOLUMES',
      'shelf.shelfHint': '悬停预览 · 点击打开',
      'shelf.kindChat': '对话板块 / CONVERSATION',
      'shelf.kindTodo': '待办板块 / TO-DO',
      'shelf.kindNote': '笔记板块 / NOTES',
      'shelf.leadTodoOpen': '今天这一页，还差 {open} 件。',
      'shelf.leadTodoClear': '今天这一页已经清空。',
      'shelf.leadTodoEmpty': '今天这一页还是空白。',
      'shelf.leadNote': '这一册夹着 {count} 条记录。',
      'shelf.leadNoteEmpty': '这一册还没有夹进一张纸条。',
      'shelf.leadChatSubs': '这一卷分成 {count} 个章节。',
      'shelf.leadChatReady': '上一段对话还夹在这一卷里。',
      'shelf.leadChatEmpty': '这一卷还没有写下第一段。',
      'shelf.mottoChat': '有些答案，要接着说才听得见。',
      'shelf.mottoDocs': '改到看不见刀痕，才算读懂。',
      'shelf.mottoMedia': '空不是没有，是留给有的位置。',
      'shelf.mottoTodo': '日子的刻度，不在钟表，在事里。',
      'shelf.mottoNote': '笔记是过去的自己写给未来的自己。',
      'shelf.ledeChat': '不必重新交代前情——这一卷记得你的说话方式，也记得上次停下的地方。',
      'shelf.ledeDocs': '从精读到改写，上一版的判断和这一版的刀痕都留在卷里；翻开就能继续。',
      'shelf.ledeMedia': '这一卷收着版式、留白与做过的取舍；下一次排版，先找回上一版的分寸。',
      'shelf.ledeOther': '这一卷选好的提示词、技能与工作区已经装订好；打开就能接着上次那一页，不用重新交代。',
      'shelf.ledeTodo': '勾选、期限与提醒都收在这一卷里；翻到今天，先把最近的一件做完。',
      'shelf.ledeNote': '灵感与笔记留在同一册里；想到什么先夹进来，想清楚了再整理。',
      'shelf.factList': '清单',
      'shelf.factToday': '今日到期',
      'shelf.factReminders': '提醒',
      'shelf.factRecords': '记录',
      'shelf.factPinned': '置顶',
      'shelf.factTags': '标签',
      'shelf.subs': '章节 / SUB-BOARDS',
      'shelf.subScope': '子版块 / SUB-BOARD',
      'shelf.backToBoard': '返回主版块',
      'shelf.recent': '最近 / RECENT',
      'shelf.recentEmpty': '这一卷还没有记录。',
      'shelf.addTalk': '新建会话',
      'shelf.footNote': '工作台是一本每天续写的书。',
      'shelf.footToday': '今日',
      'shelf.dayTitle': '今日 / THE DAY',
      'shelf.todayCount': '今日',
      'shelf.overdueCount': '逾期',
      'shelf.reminderCount': '提醒',
      'shelf.returnLatest': '返回最近一次会话',
      'shelf.noRecent': '还没有可返回的会话。',

      // ── session lines ─────────────────────────────────────────────────────
      'session.talkNo': '第 {index} 段对话',
      'session.empty': '还没有会话。点 + 或右键新建。',
      'session.running': '进行中',
      'session.gone': '这段会话已归档或不存在，已从记录中移除。',
      'session.archive': '归档会话',
      'session.archiveFailed': '无法归档会话：{message}',

      // ── the boards themselves ─────────────────────────────────────────────
      'board.newName': '新板块',
      'board.newChildName': '新子板块',
      'board.openFailed': '无法打开这个板块：{message}',

      // ── today's drawer ────────────────────────────────────────────────────
      'today.done': '{done} / {total} 已完成',
      'today.none': '今天没有到期的待办。',
      'today.noBoard': '还没有待办板块。',
      'today.more': '另有 {count} 项未完成',
      'today.onList': '在今天的清单上',
      'today.prompt': '提示词',
      'today.mode': '模式',
      'today.skills': '技能',

      // ── the to-do account page ────────────────────────────────────────────
      'surface.back': '返回工作台',
      'surface.save': '保存',
      'surface.cancel': '取消',
      'surface.sheetTodo': 'T-02 / 01',
      'surface.sheetNote': 'N-02 / 01',
      'surface.scale': 'EDITION 01 · REV. 01',
      'surface.wordTodo': 'WORKBENCH / TO-DO FOLIO',
      'surface.wordNote': 'WORKBENCH / NOTE FOLIO',
      'surface.dayLine': '第 {day} 天 / {weekday}',
      'surface.indexMeta': '目录 · {count} 条',
      'surface.filter': '目录 / FILTER',
      'surface.task': '事项 / TASK',
      'surface.due': '期限',
      'surface.priority': '优先',
      'surface.record': '记录',
      'surface.current': '当前选中',
      'surface.noDue': '未设期限',
      'surface.created': '创建',
      'surface.noteLabel': '备注 / NOTE',
      'surface.edit': '编辑',
      'surface.complete': '完成',
      'surface.reopen': '改为未完成',
      'surface.pickTodo': '从左侧选择一条待办',
      'surface.lastModified': '最后修改 {when}',
      'surface.synced': '文档已同步',
      'surface.emptyTitle': '还没有选中条目',
      'surface.emptyBody': '从左侧目录选择一条，或者新建一条。',
      'surface.emptyTodoTitle': '今天还没有待办',
      'surface.searchResults': '搜索结果 · {count}',
      'surface.noMatch': '没有匹配的条目。',
      'surface.blockCount': '灵感 {ideas} / 笔记 {notes}',
      'surface.kindIdea': '灵感 / IDEA',
      'surface.kindNote': '笔记 / NOTE',
      'surface.enter': '回车添加',
      'surface.sortedByDue': '按期限排序',
      'calendar.month': '{year}年{month}月',
      'calendar.prev': '上个月',
      'calendar.next': '下个月',
      'calendar.clear': '清除',
      'calendar.time': '时间',
      'calendar.hour': '小时',
      'calendar.minute': '分钟',
      'calendar.wheelHint': '滚轮或方向键调整时间',
      'calendar.confirm': '确定',
      'calendar.weekdays': '一 二 三 四 五 六 日',
      'calendar.none': '未设置',
      'surface.type': '类型',
      'surface.status': '状态',
      'surface.updated': '修改',
      'surface.tags': '标签',
      'surface.related': '相关条目',
      'surface.noTags': '还没有标签',
      'surface.noRelated': '还没有其他条目',
      'time.today': '今天',
      'time.tomorrow': '明天',
      'time.yesterday': '昨天',
      'time.justNow': '刚刚',
      'time.minutesAgo': '{count} 分钟前',
      'time.hoursAgo': '{count} 小时前',
      'time.monthDay': '{month}月{day}日',
      'time.yearMonthDay': '{year}年{month}月{day}日',
      'todo.subtitle': '一屏看清今天要做什么：勾选完成、设定期限、按时提醒。',
      'todo.new': '新建待办',
      'todo.newTitle': '新待办',
      'todo.untitled': '未命名待办',
      'todo.statOpen': '未完成',
      'todo.statToday': '今天到期',
      'todo.statOverdue': '已逾期',
      'todo.statDone': '已完成',
      'todo.progress': '完成 {done} / {total}',
      'todo.progressLabel': '完成进度',
      'todo.search': '搜索待办',
      'todo.addPlaceholder': '写下一件要做的事，回车添加',
      'todo.empty': '还没有待办，先写下第一件要做的事。',
      'todo.emptyFilter': '这个筛选下没有待办。',
      'todo.clearDone': '清除已完成',
      'todo.filterAll': '全部',
      'todo.toggle': '切换完成状态',
      'todo.edit': '编辑这条待办',
      'todo.editTitle': '编辑待办',
      'todo.delete': '删除',
      'todo.hasNote': '有备注',
      'todo.titlePlaceholder': '要做什么',
      'todo.notePlaceholder': '补充说明（可选）',
      'todo.priority': '优先级',
      'todo.due': '截止',
      'todo.remind': '提醒',
      'todo.presetEvening': '提醒：{when}',
      'todo.presetMorning': '提醒：{when}',
      'todo.presetHour': '一小时后提醒（{when}）',
      'todo.remindClear': '取消提醒',
      'todo.priority.high': '重要',
      'todo.priority.normal': '普通',
      'todo.priority.low': '次要',

      // ── reminders ─────────────────────────────────────────────────────────
      'remind.badge': '待办提醒',
      'remind.word': 'REMINDER',
      'remind.detailBoard': '板块 / BOARD',
      'remind.detailPriority': '优先级 / PRIORITY',
      'remind.detailDue': '期限 / DUE',
      'remind.detailNote': '备注 / NOTE',
      'remind.done': '完成',
      'remind.snooze': '10 分钟后',
      'remind.dismiss': '知道了',
      'remind.enable': '开启桌面提醒',
      'remind.enableHint': '开启后，即使不在待办页面也会收到系统提醒。',
      'remind.on': '桌面提醒已开启',
      'remind.blocked': '桌面提醒被浏览器关闭',
      'remind.blockedHint': '请先在浏览器的站点设置中允许通知。',

      // ── the note account page ─────────────────────────────────────────────
      'notes.subtitle': '灵感随手记，笔记整理成文；两块内容都留在同一个板块里。',
      'notes.ideas': '灵感',
      'notes.notes': '笔记',
      'notes.newIdea': '新建灵感',
      'notes.newNote': '新建笔记',
      'notes.editIdea': '编辑灵感',
      'notes.editNote': '编辑笔记',
      'notes.untitled': '未命名',
      'notes.open': '打开',
      'notes.pinned': '已置顶',
      'notes.normal': '普通',
      'notes.pin': '置顶',
      'notes.unpin': '取消置顶',
      'notes.copy': '复制',
      'notes.copied': '已复制内容',
      'notes.copyEmpty': '这条还没有内容。',
      'notes.copyFailed': '复制失败：{message}',
      'notes.toNote': '转为笔记',
      'notes.toIdea': '转回灵感',
      'notes.delete': '删除',
      'notes.movedToNotes': '已转为笔记',
      'notes.movedToIdeas': '已转回灵感',
      'notes.emptyIdea': '还没有灵感，先记一条。',
      'notes.emptyNote': '还没有笔记。灵感想清楚了，就转到这里整理成文。',
      'notes.search': '搜索灵感与笔记',
      'notes.titlePlaceholder': '标题',
      'notes.ideaPlaceholder': '想到什么就写下来，不必完整',
      'notes.notePlaceholder': '整理成可以复用的内容',
      'notes.tagsPlaceholder': '标签，用空格分隔',

      // ── the Settings section ──────────────────────────────────────────────
      'settings.nav': '工作台',
      'settings.title': '工作台',
      'settings.intro': '各卷、提示词与技能都在这里装订；保存后立即同步到书架。',
      'settings.loading': '正在加载工作台设置…',
      'settings.saved': '已保存',
      'settings.saveFailed': '保存失败：{message}',
      'settings.backMatter': 'PRESS / IMPRINT',
      'settings.workspace': '工作区',
      'settings.workspaceCode': 'WORKSPACE',
      'settings.workspaceLabel': '目录',
      'settings.workspaceApply': '应用',
      'settings.workspaceReset': '恢复默认',
      'settings.workspaceDefault': '默认目录：{path}',
      'settings.boardWorkspaceHint': '这个主版块及其子板块的会话都在这里运行；留空则使用默认工作区（{path}）。',
      'settings.workspaceInvalid': '请输入绝对路径，例如 E:\\DeepseekHarness\\工作台。',
      'settings.boards': '板块',
      'settings.boardsHint': '单击选中并在下方配置；拖动排序；右键打开菜单。',
      'settings.configuration': '板块配置',
      'settings.scope': '作用范围',
      'settings.boardMeta': '{count} 个子板块',
      'settings.boardNameCn': '中文名',
      'settings.boardNameEn': '英文封面',
      'settings.boardActive': '配置中',
      'settings.boardNew': '新建板块',
      'settings.boardNewChild': '新建子板块',
      'settings.boardRename': '重命名',
      'settings.boardDelete': '删除板块',
      'settings.boardDeleteChild': '删除子板块',
      'settings.boardSelect': '点击选中这个板块',
      'settings.boardEmpty': '还没有板块，先新建一个。',
      'settings.confirmDeleteBoard': '删除板块「{name}」及其中的全部内容？',
      'settings.confirmDeleteChild': '删除子板块「{name}」？',
      'settings.needBoards': '先新建一个板块，才能配置提示词与技能。',
      'settings.configHint': '以下设置只作用于「{name}」',

      'prompt.title': '提示词',
      'prompt.code': 'PROMPT',
      'prompt.nativeNote': '基底提示词',
      'prompt.selectedNote': '已选 {count} 条，追加在基底提示词之上',
      'prompt.hint': '默认（基底提示词）：聊天对话板块及其子版块固定使用聊天模式（workbench-chat），不启用其他 preset；其他板块及其子版块默认使用标准模式（standard），也可选择其他模式（ptc、minimal、cordis）。同时可选择多条提示词，在基底提示词的基础上按提示词库顺序依次追加。',
      'prompt.none': '默认',
      'prompt.library': '提示词库',
      'mode.title': '模　式',
      'mode.code': 'MODE',
      'mode.hint': '选择这个板块新建会话时使用的 Agent preset；已经打开的会话保持创建时的模式。',
      'mode.lockedChat': '聊天板块及其子版块固定使用聊天模式（workbench-chat），不启用其他 preset。',
      'mode.standard': '标准模式',
      'mode.standardDesc': '处理代码、文件和资料，适合大多数任务。',
      'mode.ptc': 'PTC 模式',
      'mode.ptcDesc': '包含标准模式的能力，更适合批量调用、筛选、统计和汇总。',
      'mode.minimal': '极简模式',
      'mode.minimalDesc': '只使用终端与图片读取工具，并支持上下文压缩，适合测试与对比。',
      'mode.cordis': '创造模式',
      'mode.cordisDesc': '用对话定制 DSH：让 Agent 编写插件、添加功能或创建自己的模式。',
      'prompt.hideLibrary': '收起提示词库',
      'prompt.empty': '还没有提示词，先新建一条。',
      'prompt.new': '新建提示词',
      'prompt.newName': '新提示词',
      'prompt.copySuffix': '副本',
      'prompt.namePlaceholder': '提示词名称',
      'prompt.textPlaceholder': '提示词内容',
      'prompt.copy': '复制',
      'prompt.delete': '删除',
      'prompt.edit': '编辑',
      'prompt.save': '保存',
      'prompt.cancel': '取消',

      'skills.title': '技　能',
      'skills.code': 'SKILLS',
      'skills.subtitle': '开启后，这个板块的每次对话都会带上这些技能。',
      'skills.none': '未挂技能',
      'skills.choose': '选择技能',
      'skills.remove': '移除技能：{name}',
      'skills.selected': '{count} 个技能',
      'skills.empty': '未发现已安装的技能。把技能放到 ~/.dsh/skills 下即可出现在这里。',
      'skills.missing': '已卸载（点击移除）',
      'skills.refresh': '刷新技能列表',
      'skills.loadError': '无法读取技能列表：{message}',

      'common.cancel': '取消',
      'common.delete': '删除',
      'common.loading': '正在加载…',
      'common.error': '工作台暂时无法加载。',
      'error.generic': '请求失败：{message}',
      'error.invalidDocument': '工作台文档格式无效。',
      'error.limitReached': '已达到数量上限，请先删除一些内容。',
      'error.notLoaded': '工作台数据尚未加载，请稍后重试。',
      'error.sessionsUnavailable': '会话服务暂不可用。',
      'error.workspaceUnavailable': '无法打开工作台工作区，请到「设置 · 工作台」检查工作区目录是否可写。',
    };

    const en = {
      panel: 'Workbench',
      'day.week.mon': 'Monday',
      'day.week.tue': 'Tuesday',
      'day.week.wed': 'Wednesday',
      'day.week.thu': 'Thursday',
      'day.week.fri': 'Friday',
      'day.week.sat': 'Saturday',
      'day.week.sun': 'Sunday',
      'watch.desk': 'WORKBENCH / THE SHELF',
      'watch.dayOfYear': 'Day {day} of {total}',
      'watch.logNote': 'The workbench is a book written a page a day.',
      'watch.month': '{month}',
      'watch.dayPage': "Today's list",
      'watch.reminders': 'Reminders',
      'watch.noReminders': 'No reminders today.',
      'watch.weekDone': 'Done this week',
      'watch.weekNew': 'Added this week',
      'watch.weekNotes': 'Notes this week',
      'watch.weekOfYear': 'Week {week}',
      'watch.onList': 'Listed',
      'watch.hint': '← → choose a volume · hover to preview · click to open · right-click a chapter to start',

      'ledger.spaces': '{spaces} volumes · {due} due · {over} overdue · {remind} reminders',
      'ledger.siteNotes': 'Today',
      'ledger.materials': 'Materials / NOTES',
      'ledger.noMaterials': 'No material notes yet.',
      'ledger.continue': 'Continue the latest',
      'ledger.openList': "Open today's list",
      'ledger.openNotes': 'Open notes',
      'ledger.configure': 'Configure',
      'ledger.slips': '{count} slips',
      'ledger.noPrompt': 'Default',
      'ledger.noSkills': 'No skills',
      'ledger.talks': '{count} chats',
      'ledger.stateReady': 'Ready',
      'ledger.stateIdle': 'Idle',
      'ledger.stateToday': 'Today',
      'ledger.stateOver': 'Overdue',
      'ledger.stateDone': 'Cleared',
      'ledger.stateNote': 'Open',
      'ledger.kindChat': 'chat',
      'ledger.kindStandard': 'standard',
      'ledger.kindTodo': 'to-do',
      'ledger.kindNote': 'notes',
      'ledger.newTalk': 'New session',
      'ledger.empty': 'No volumes yet. Create the first one in Settings › Workbench.',
      'ledger.subHint': 'Click to show every conversation · right-click to start one',
      'ledger.hintSurface': 'Click to open this volume.',
      'ledger.configureUnavailable': 'Could not open Settings automatically — use the account menu, then Settings › Workbench.',

      'shelf.series': 'PRESS / {count} VOLUMES · {year}',
      'shelf.clock': 'Current time',
      'shelf.volumes': '{count} VOLUMES',
      'shelf.shelfHint': 'Hover to preview · click to open',
      'shelf.kindChat': 'CONVERSATION BOARD',
      'shelf.kindTodo': 'TO-DO BOARD',
      'shelf.kindNote': 'NOTE BOARD',
      'shelf.leadTodoOpen': '{open} still open on today’s page.',
      'shelf.leadTodoClear': 'Today’s page is clear.',
      'shelf.leadTodoEmpty': 'Today’s page is still blank.',
      'shelf.leadNote': 'This volume holds {count} entries.',
      'shelf.leadNoteEmpty': 'No slips tucked into this volume yet.',
      'shelf.leadChatSubs': 'This volume is bound in {count} chapters.',
      'shelf.leadChatReady': 'The last conversation is still tucked inside.',
      'shelf.leadChatEmpty': 'The first conversation has not been written yet.',
      'shelf.mottoChat': 'Some answers are heard only as the talk goes on.',
      'shelf.mottoDocs': 'You have not read it until your edits leave no marks.',
      'shelf.mottoMedia': 'Emptiness is not nothing — it is the place left for something.',
      'shelf.mottoTodo': 'Days are measured not by the clock, but by what is done.',
      'shelf.mottoNote': 'A note is the past self writing to the future self.',
      'shelf.ledeChat': 'No need to brief it again — this volume remembers how you speak and where you last stopped.',
      'shelf.ledeDocs': 'From close reading to rewriting, the judgment of the last draft and the marks of this one stay in the volume; open it and carry on.',
      'shelf.ledeMedia': 'This volume keeps the layout, the white space and the choices made; next time you lay out a page, begin from the measure of the last edition.',
      'shelf.ledeOther': 'The chosen prompts, skills and working area are already bound into this volume; open it and pick up where the last page ended.',
      'shelf.ledeTodo': 'Ticks, due days and reminders all live in this volume; open today and finish the nearest thing first.',
      'shelf.ledeNote': 'Ideas and notes share one volume; tuck a thought in first, shape it later.',
      'shelf.factList': 'List',
      'shelf.factToday': 'Due today',
      'shelf.factReminders': 'Reminders',
      'shelf.factRecords': 'Entries',
      'shelf.factPinned': 'Pinned',
      'shelf.factTags': 'Tags',
      'shelf.subs': 'CHAPTERS / SUB-BOARDS',
      'shelf.subScope': 'SUB-BOARD',
      'shelf.backToBoard': 'Back to main board',
      'shelf.recent': 'RECENT',
      'shelf.recentEmpty': 'Nothing recorded in this volume yet.',
      'shelf.addTalk': 'New session',
      'shelf.footNote': 'The workbench is a book written a page a day.',
      'shelf.footToday': 'Today',
      'shelf.dayTitle': "TODAY / THE DAY",
      'shelf.todayCount': 'Today',
      'shelf.overdueCount': 'Overdue',
      'shelf.reminderCount': 'Reminders',
      'shelf.returnLatest': 'Back to the most recent session',
      'shelf.noRecent': 'No recent session yet.',

      'session.talkNo': 'Conversation {index}',
      'session.empty': 'No conversations yet. Click + or right-click to start one.',
      'session.running': 'Live',
      'session.gone': 'That conversation is archived or gone, so it was removed from the record.',
      'session.archive': 'Archive conversation',
      'session.archiveFailed': 'Could not archive the conversation: {message}',

      'board.newName': 'New board',
      'board.newChildName': 'New sub-board',
      'board.openFailed': 'Could not open this board: {message}',
      'today.done': '{done} of {total} done',
      'today.none': 'Nothing due today.',
      'today.noBoard': 'No to-do board yet.',
      'today.more': '{count} more still open',
      'today.onList': 'On today’s list',
      'today.prompt': 'Prompt',
      'today.mode': 'Mode',
      'today.skills': 'Skills',

      'surface.back': 'Back to the workbench',
      'surface.save': 'Save',
      'surface.cancel': 'Cancel',
      'surface.sheetTodo': 'T-02 / 01',
      'surface.sheetNote': 'N-02 / 01',
      'surface.scale': 'EDITION 01 · REV. 01',
      'surface.wordTodo': 'WORKBENCH / TO-DO FOLIO',
      'surface.wordNote': 'WORKBENCH / NOTE FOLIO',
      'surface.dayLine': 'Day {day} / {weekday}',
      'surface.indexMeta': 'CONTENTS · {count} ENTRIES',
      'surface.filter': 'CONTENTS',
      'surface.task': 'TASK',
      'surface.due': 'DUE',
      'surface.priority': 'PRIORITY',
      'surface.record': 'RECORD',
      'surface.current': 'SELECTED',
      'surface.noDue': 'No due date',
      'surface.created': 'CREATED',
      'surface.noteLabel': 'NOTE',
      'surface.edit': 'Edit',
      'surface.complete': 'Complete',
      'surface.reopen': 'Mark open',
      'surface.pickTodo': 'Choose a to-do on the left.',
      'surface.lastModified': 'Last edited {when}',
      'surface.synced': 'Document synced',
      'surface.emptyTitle': 'Nothing selected',
      'surface.emptyBody': 'Choose an entry from the contents, or create one.',
      'surface.emptyTodoTitle': 'No to-dos yet',
      'surface.searchResults': 'SEARCH · {count}',
      'surface.noMatch': 'No matching entries.',
      'surface.blockCount': 'IDEAS {ideas} / NOTES {notes}',
      'surface.kindIdea': 'IDEA',
      'surface.kindNote': 'NOTE',
      'surface.enter': 'ENTER',
      'surface.sortedByDue': 'SORTED BY DUE',
      'calendar.month': '{month} / {year}',
      'calendar.prev': 'Previous month',
      'calendar.next': 'Next month',
      'calendar.clear': 'Clear',
      'calendar.time': 'TIME',
      'calendar.hour': 'HOUR',
      'calendar.minute': 'MINUTE',
      'calendar.wheelHint': 'Scroll or use the arrow keys to set the time',
      'calendar.confirm': 'Set',
      'calendar.weekdays': 'M T W T F S S',
      'calendar.none': 'Not set',
      'surface.type': 'TYPE',
      'surface.status': 'STATUS',
      'surface.updated': 'UPDATED',
      'surface.tags': 'TAGS',
      'surface.related': 'RELATED',
      'surface.noTags': 'No tags yet',
      'surface.noRelated': 'No other entries yet',
      'time.today': 'Today',
      'time.tomorrow': 'Tomorrow',
      'time.yesterday': 'Yesterday',
      'time.justNow': 'Just now',
      'time.minutesAgo': '{count} min ago',
      'time.hoursAgo': '{count} h ago',
      'time.monthDay': '{month}/{day}',
      'time.yearMonthDay': '{year}/{month}/{day}',
      'todo.subtitle': 'See the day at a glance: tick things off, set a due day, get reminded.',
      'todo.new': 'New to-do',
      'todo.newTitle': 'New to-do',
      'todo.untitled': 'Untitled to-do',
      'todo.statOpen': 'Open',
      'todo.statToday': 'Due today',
      'todo.statOverdue': 'Overdue',
      'todo.statDone': 'Done',
      'todo.progress': '{done} of {total} done',
      'todo.progressLabel': 'Completion',
      'todo.search': 'Search to-dos',
      'todo.addPlaceholder': 'Write the next thing to do, then press Enter',
      'todo.empty': 'Nothing yet. Write down the first thing to do.',
      'todo.emptyFilter': 'Nothing under this filter.',
      'todo.clearDone': 'Clear finished',
      'todo.filterAll': 'All',
      'todo.toggle': 'Toggle done',
      'todo.edit': 'Edit this to-do',
      'todo.editTitle': 'Edit to-do',
      'todo.delete': 'Delete',
      'todo.hasNote': 'Has a note',
      'todo.titlePlaceholder': 'What needs doing',
      'todo.notePlaceholder': 'Details (optional)',
      'todo.priority': 'Priority',
      'todo.due': 'Due',
      'todo.remind': 'Remind',
      'todo.presetEvening': 'Remind: {when}',
      'todo.presetMorning': 'Remind: {when}',
      'todo.presetHour': 'In an hour ({when})',
      'todo.remindClear': 'Clear the reminder',
      'todo.priority.high': 'High',
      'todo.priority.normal': 'Normal',
      'todo.priority.low': 'Low',

      'remind.badge': 'To-do reminder',
      'remind.word': 'REMINDER',
      'remind.detailBoard': 'BOARD',
      'remind.detailPriority': 'PRIORITY',
      'remind.detailDue': 'DUE',
      'remind.detailNote': 'NOTE',
      'remind.done': 'Done',
      'remind.snooze': 'In 10 min',
      'remind.dismiss': 'Got it',
      'remind.enable': 'Enable desktop reminders',
      'remind.enableHint': 'With this on, a reminder reaches you even away from the to-do page.',
      'remind.on': 'Desktop reminders are on',
      'remind.blocked': 'Desktop reminders are blocked',
      'remind.blockedHint': 'Allow notifications for this site in the browser first.',

      'notes.subtitle': 'Capture sparks as ideas, shape them into notes — both stay in this board.',
      'notes.ideas': 'Ideas',
      'notes.notes': 'Notes',
      'notes.newIdea': 'New idea',
      'notes.newNote': 'New note',
      'notes.editIdea': 'Edit idea',
      'notes.editNote': 'Edit note',
      'notes.untitled': 'Untitled',
      'notes.open': 'Open',
      'notes.pinned': 'Pinned',
      'notes.normal': 'Normal',
      'notes.pin': 'Pin',
      'notes.unpin': 'Unpin',
      'notes.copy': 'Copy',
      'notes.copied': 'Content copied',
      'notes.copyEmpty': 'This slip has no content yet.',
      'notes.copyFailed': 'Could not copy: {message}',
      'notes.toNote': 'Turn into a note',
      'notes.toIdea': 'Back to an idea',
      'notes.delete': 'Delete',
      'notes.movedToNotes': 'Moved to Notes',
      'notes.movedToIdeas': 'Moved back to Ideas',
      'notes.emptyIdea': 'No ideas yet. Write the first one down.',
      'notes.emptyNote': 'No notes yet. When an idea is ready, move it here and shape it.',
      'notes.search': 'Search ideas and notes',
      'notes.titlePlaceholder': 'Title',
      'notes.ideaPlaceholder': 'Write it down as it comes — it need not be complete',
      'notes.notePlaceholder': 'Shape it into something reusable',
      'notes.tagsPlaceholder': 'Tags, separated by spaces',

      'settings.nav': 'Workbench',
      'settings.title': 'Workbench',
      'settings.intro': 'Volumes, prompts and skills are bound here; saving applies to the shelf immediately.',
      'settings.loading': 'Loading workbench settings…',
      'settings.saved': 'Saved',
      'settings.saveFailed': 'Could not save: {message}',
      'settings.backMatter': 'PRESS / IMPRINT',
      'settings.workspace': 'Working area',
      'settings.workspaceCode': 'WORKSPACE',
      'settings.workspaceLabel': 'Directory',
      'settings.workspaceApply': 'Apply',
      'settings.workspaceReset': 'Restore default',
      'settings.workspaceDefault': 'Default directory: {path}',
      'settings.boardWorkspaceHint': 'This main board and its sub-boards run here; leave empty to use the default workbench area ({path}).',
      'settings.workspaceInvalid': 'Enter an absolute path, for example E:\\DeepseekHarness\\工作台.',
      'settings.boards': 'Boards',
      'settings.boardsHint': 'Click to configure it below; drag to reorder; right-click for the menu.',
      'settings.configuration': 'Board configuration',
      'settings.scope': 'Scope',
      'settings.boardMeta': '{count} sub-boards',
      'settings.boardNameCn': 'Chinese name',
      'settings.boardNameEn': 'English cover',
      'settings.boardActive': 'Configuring',
      'settings.boardNew': 'New board',
      'settings.boardNewChild': 'New sub-board',
      'settings.boardRename': 'Rename',
      'settings.boardDelete': 'Delete board',
      'settings.boardDeleteChild': 'Delete sub-board',
      'settings.boardSelect': 'Select this board',
      'settings.boardEmpty': 'No boards yet. Create one.',
      'settings.confirmDeleteBoard': 'Delete the board “{name}” and everything in it?',
      'settings.confirmDeleteChild': 'Delete the sub-board “{name}”?',
      'settings.needBoards': 'Create a board first, then set its prompt and skills.',
      'settings.configHint': 'These settings apply only to “{name}”',

      'prompt.title': 'Prompt',
      'prompt.code': 'PROMPT',
      'prompt.nativeNote': 'Base prompt',
      'prompt.selectedNote': '{count} selected, appended to the base prompt',
      'prompt.hint': 'Default (base prompt): the chat volume and its sub-boards are fixed to chat mode (workbench-chat), and no other preset applies; every other volume and its sub-boards default to standard mode (standard) and may also choose another mode (ptc, minimal, cordis). Several prompts can be selected at once and are appended in library order on top of the base prompt.',
      'prompt.none': 'Default',
      'prompt.library': 'Prompt library',
      'mode.title': 'Mode',
      'mode.code': 'MODE',
      'mode.hint': 'Choose the Agent preset this board uses for new conversations; conversations already open keep the preset they were created with.',
      'mode.lockedChat': 'The chat volume and its sub-boards are fixed to chat mode (workbench-chat); no other preset is available.',
      'mode.standard': 'Standard',
      'mode.standardDesc': 'Handles code, files and research; the right fit for most work.',
      'mode.ptc': 'PTC',
      'mode.ptcDesc': 'Everything Standard offers, tuned for calling, filtering, counting and summarizing in batches.',
      'mode.minimal': 'Minimal',
      'mode.minimalDesc': 'Terminal and image reading only, with context compression; suited to tests and comparisons.',
      'mode.cordis': 'Creative',
      'mode.cordisDesc': 'Customize DSH through conversation: let the Agent write plugins, add features or create modes.',
      'prompt.hideLibrary': 'Hide prompt library',
      'prompt.empty': 'No prompts yet. Create one.',
      'prompt.new': 'New prompt',
      'prompt.newName': 'New prompt',
      'prompt.copySuffix': 'copy',
      'prompt.namePlaceholder': 'Prompt name',
      'prompt.textPlaceholder': 'Prompt text',
      'prompt.copy': 'Duplicate',
      'prompt.delete': 'Delete',
      'prompt.edit': 'Edit',
      'prompt.save': 'Save',
      'prompt.cancel': 'Cancel',

      'skills.title': 'Skills',
      'skills.code': 'SKILLS',
      'skills.subtitle': 'Switched-on skills ride along on every message from this board.',
      'skills.none': 'No skills',
      'skills.choose': 'Choose skills',
      'skills.remove': 'Remove skill: {name}',
      'skills.selected': '{count} skills',
      'skills.empty': 'No installed skills found. Put one under ~/.dsh/skills.',
      'skills.missing': 'Not installed (click to remove)',
      'skills.refresh': 'Refresh the skill list',
      'skills.loadError': 'Could not read the skill list: {message}',

      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.loading': 'Loading…',
      'common.error': 'The workbench could not load.',
      'error.generic': 'Request failed: {message}',
      'error.invalidDocument': 'The workbench document is invalid.',
      'error.limitReached': 'The limit has been reached; remove something first.',
      'error.notLoaded': 'Workbench data is not loaded yet; try again in a moment.',
      'error.sessionsUnavailable': 'The session service is not available.',
      'error.workspaceUnavailable': 'Could not open the workbench workspace; check the working-area directory in Settings › Workbench.',
    };

    const CSS = `
@import url("/workbench/fonts/fonts.css");

/* ============================================================================
   WORKBENCH / THE SHELF
   A private shelf of bound volumes. Cloth covers, upright spines, a right-hand
   inner page. Ink is warm paper-white on an olive-black ground, sage green is
   the only signal, and the day's work lives in a drawer behind the top bar.
   Square corners, 1px rules, no cards, no glass, no gradient chrome.
   ========================================================================= */

.wb_page,
.wb_sSection,
.wb_toasts{
  --wb-ground:#ffffff;
  --wb-deep:#f3f1ea;
  --wb-top:#fbfaf6;
  --wb-today:#f7f6f1;
  --wb-ink:#17150f;
  --wb-ink-2:#4f4a40;
  --wb-ink-3:#6e6759;
  --wb-accent:#5c6e3f;
  --wb-hot:#a8331d;
  --wb-ok:#3f6b4d;
  --wb-warn:#7a5200;
  --wb-active-bg:#aebe8f;
  --wb-active-ink:#11120f;
  --wb-active-dim:#3d4b2d;
  --wb-windowInk:#ffffff;
  --wb-focus:#5c6e3f;
  --wb-line:rgba(23,21,15,.30);
  --wb-line-soft:rgba(23,21,15,.16);
  --wb-line-faint:rgba(23,21,15,.08);
  --wb-wash:rgba(92,110,63,.07);
  --wb-fill:rgba(92,110,63,.12);
  --wb-cover-ink:#f2eadb;
  --wb-cover-dim:rgba(242,234,219,.64);
  --wb-cover-line:rgba(242,234,219,.42);
  --wb-shadow:0 24px 48px -34px rgba(23,21,15,.55);
  --wb-display:"IBM Plex Sans","Noto Sans SC Variable","PingFang SC","Microsoft YaHei",sans-serif;
  --wb-text:"IBM Plex Sans","Noto Sans SC Variable","PingFang SC","Microsoft YaHei",sans-serif;
  --wb-mono:"IBM Plex Mono","Cascadia Mono",Consolas,monospace;
  --wb-type-cjk:"Noto Sans SC Variable","PingFang SC","Microsoft YaHei",sans-serif;
  --wb-inset:22px;
}
body[data-ds-dark-theme] .wb_page,
body[data-ds-dark-theme] .wb_sSection,
body[data-ds-dark-theme] .wb_toasts{
  --wb-ground:#10120f;
  --wb-deep:#0a0c09;
  --wb-top:#0b0d0a;
  --wb-today:#12140f;
  --wb-ink:#efe9dd;
  --wb-ink-2:#c9c2b5;
  --wb-ink-3:#8e8a80;
  --wb-accent:#aebe8f;
  --wb-hot:#d96a52;
  --wb-ok:#9ab97a;
  --wb-warn:#d4b06a;
  --wb-active-bg:#aebe8f;
  --wb-active-ink:#11120f;
  --wb-active-dim:#3d4b2d;
  --wb-windowInk:#11120f;
  --wb-focus:#c5d2aa;
  --wb-line:rgba(239,233,221,.24);
  --wb-line-soft:rgba(239,233,221,.14);
  --wb-line-faint:rgba(239,233,221,.07);
  --wb-wash:rgba(174,190,143,.10);
  --wb-fill:rgba(174,190,143,.14);
  --wb-cover-ink:#f2eadb;
  --wb-cover-dim:rgba(242,234,219,.64);
  --wb-cover-line:rgba(242,234,219,.42);
  --wb-shadow:0 28px 55px -38px rgba(0,0,0,.9);
}

/* the two account pages carry the warm-yellow selection language */
.wb_page[data-surface="todo"],
.wb_page[data-surface="note"]{
  --wb-accent:#7a5a10;
  --wb-active-bg:#5b4815;
  --wb-active-ink:#f2eadb;
  --wb-active-dim:#c8b88a;
  --wb-focus:#7a5a10;
  --wb-wash:rgba(122,90,16,.08);
  --wb-fill:rgba(122,90,16,.12);
}
body[data-ds-dark-theme] .wb_page[data-surface="todo"],
body[data-ds-dark-theme] .wb_page[data-surface="note"]{
  --wb-accent:#d6b45c;
  --wb-active-bg:#5b4815;
  --wb-active-ink:#f2eadb;
  --wb-active-dim:#c8b88a;
  --wb-focus:#e0c06a;
  --wb-wash:rgba(214,180,92,.10);
  --wb-fill:rgba(214,180,92,.14);
}

.wb_page *,.wb_sSection *,.wb_menu *,.wb_dialog *,.wb_toasts *{box-sizing:border-box}
.wb_page ::selection,.wb_sSection ::selection,.wb_menu ::selection,.wb_dialog ::selection{background:var(--wb-accent);color:var(--wb-windowInk)}
.wb_page ::-webkit-scrollbar,.wb_sSection ::-webkit-scrollbar{width:8px;height:8px}
.wb_page ::-webkit-scrollbar-thumb,.wb_sSection ::-webkit-scrollbar-thumb{background:var(--wb-line-soft);border:2px solid transparent;background-clip:padding-box}
.wb_page ::-webkit-scrollbar-track,.wb_sSection ::-webkit-scrollbar-track{background:transparent}

/* ── the page and its frame ──────────────────────────────────────────────── */
.wb_page{position:relative;isolation:isolate;display:flex;flex-direction:column;width:100%;min-width:0;height:100%;min-height:0;overflow:hidden;
  color:var(--wb-ink);font:400 13px/1.55 var(--wb-text);-webkit-font-smoothing:antialiased;background:var(--wb-ground)}
.wb_shell{position:relative;z-index:1;display:flex;flex:1;flex-direction:column;min-width:0;min-height:0}
.wb_scroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--wb-line-soft) transparent}
.wb_sheet{display:flex;flex-direction:column;height:100%;min-height:100%;background:transparent}
.wb_empty{flex:1;display:flex;align-items:center;justify-content:center;padding:52px 24px;text-align:center;color:var(--wb-ink-3);font:400 12px/1.8 var(--wb-text);letter-spacing:.01em}
.wb_status{padding:0 var(--wb-inset)}
.wb_error{margin:0;padding:7px 0;border-top:1px solid var(--wb-hot);border-bottom:1px solid var(--wb-hot);color:var(--wb-hot);font:400 11px/1.7 var(--wb-text);overflow-wrap:anywhere}
.wb_quiet{margin:0;padding:5px 0;color:var(--wb-ink-3);font:400 11px/1.7 var(--wb-text)}

/* ── the top bar ─────────────────────────────────────────────────────────── */
.wb_sh_page{container-type:inline-size}
.wb_sh_sheet{height:100%;min-height:100%;display:flex;flex-direction:column;overflow:hidden}
.wb_sh_scroll{flex:1;min-height:0}
.wb_detail{display:block;min-width:0}
.wb_detailName{display:block;margin:0;overflow-wrap:anywhere}
.wb_line{position:relative;min-width:0}
.wb_name{min-width:0}
.wb_sh_top{position:relative;z-index:30;flex:none;height:58px;min-height:58px;display:flex;align-items:center;gap:28px;padding:0 40px;border-bottom:1px solid var(--wb-line);background:var(--wb-top)}
.wb_sh_brand{display:inline-flex;align-items:center;gap:10px;min-width:0;padding:0;border:0;background:transparent;color:var(--wb-ink);text-align:left}
.wb_sh_brand svg{width:18px;height:18px;color:var(--wb-ink-2)}
.wb_sh_brand b{font:500 15px/1 var(--wb-text);letter-spacing:.06em;white-space:nowrap}
.wb_sh_brand span{font:400 11px/1 var(--wb-mono);letter-spacing:.16em;color:var(--wb-ink-3);white-space:nowrap;margin-left:7px}
.wb_sh_series{display:inline-flex;align-items:center;min-height:28px;padding:0;color:var(--wb-ink-3);font:400 11px/1 var(--wb-mono);letter-spacing:.13em;white-space:nowrap}
.wb_sh_topRight{margin-left:auto;display:flex;align-items:center;gap:16px;min-width:0}
.wb_sh_counts{display:inline-flex;align-items:center;gap:13px;height:30px;padding:0;border:0;background:transparent;color:var(--wb-ink-3);font:400 11px/1 var(--wb-mono);cursor:pointer;white-space:nowrap}
.wb_sh_counts span{display:inline-flex;align-items:baseline;gap:4px}
.wb_sh_counts b{font-weight:500;color:var(--wb-ink);font-variant-numeric:tabular-nums}
.wb_sh_counts b[data-tone="today"]{color:var(--wb-warn)}
.wb_sh_counts b[data-tone="over"]{color:var(--wb-hot)}
.wb_sh_counts b[data-zero="true"]{color:var(--wb-ink-3)}
.wb_sh_counts:hover b{color:var(--wb-accent)}
.wb_sh_counts:focus-visible{outline:2px solid var(--wb-focus);outline-offset:3px}
.wb_sh_return{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border:0;background:transparent;color:var(--wb-ink-2);cursor:pointer;transition:color .18s ease}
.wb_sh_return svg{flex:none;color:currentColor;transition:color .18s ease}
.wb_sh_return:hover{color:var(--wb-accent)}
.wb_sh_return:focus-visible{outline:2px solid var(--wb-focus);outline-offset:3px}
.wb_sh_return[disabled]{color:var(--wb-ink-3);cursor:default}
.wb_sh_return[disabled] svg{opacity:.45}
.wb_sh_clock{display:inline-flex;align-items:baseline;gap:2px;padding:0 2px 0 4px;color:var(--wb-ink);white-space:nowrap;font-variant-numeric:tabular-nums}
.wb_sh_clock b{font:500 24px/1 var(--wb-display);letter-spacing:-.025em}
.wb_sh_clock i{font:400 11px/1 var(--wb-mono);font-style:normal;letter-spacing:.02em;color:var(--wb-accent)}

/* ── the press: cover + inner page over the shelf ────────────────────────── */
.wb_sh_press{flex:1;min-height:0;display:grid;grid-template-rows:minmax(0,1fr) 185px;position:relative;background:var(--wb-ground)}
.wb_sh_spread{display:grid;grid-template-columns:253px minmax(0,1fr);gap:56px;align-items:center;min-height:0;padding:24px 74px;overflow:hidden;perspective:1400px}
.wb_sh_empty{display:flex;align-items:center;justify-content:center;height:100%;padding:40px;color:var(--wb-ink-3);font:400 12px/1.8 var(--wb-text);text-align:center}

/* the cloth cover */
.wb_sh_coverWrap{position:relative;justify-self:start;align-self:center;width:253px;height:320px;perspective:900px;animation:wb_sh_coverWrapIn .5s cubic-bezier(.16,1,.3,1) both}
.wb_sh_coverShadow{position:absolute;z-index:0;left:12px;top:14px;width:100%;height:100%;background:rgba(0,0,0,.34);transform:translate(var(--cover-shadow-x,0px),var(--cover-shadow-y,0px)) rotate(3deg);transform-origin:50% 72%;filter:blur(11px);transition:transform .18s ease-out,opacity .5s ease}
.wb_sh_cover{position:relative;z-index:1;width:100%;height:100%;overflow:hidden;background:var(--cover,#263a32);color:var(--wb-cover-ink);padding:18px 19px 15px;display:flex;flex-direction:column;transform:rotate(calc(-2.4deg + var(--cover-tilt,0deg))) rotateX(var(--cover-rx,0deg)) rotateY(var(--cover-ry,0deg)) translateY(var(--cover-lift,0px));box-shadow:var(--wb-shadow);transition:transform .18s ease-out;animation:wb_sh_coverIn .52s cubic-bezier(.16,1,.3,1) backwards;transform-origin:50% 72%}
.wb_sh_cover::before{content:"";position:absolute;inset:9px;border:1px solid var(--wb-cover-line);pointer-events:none}
.wb_sh_cover::after{content:"";position:absolute;width:140px;height:140px;right:-50px;bottom:25px;border:1px solid rgba(242,234,219,.24);border-radius:50%;pointer-events:none}
.wb_sh_coverWrap:hover .wb_sh_cover{--cover-tilt:.9deg;--cover-lift:-6px}
.wb_sh_coverTop{position:relative;z-index:1;display:flex;justify-content:space-between;font:400 11px/1 var(--wb-mono);letter-spacing:.1em;color:var(--wb-cover-dim)}
.wb_sh_coverLetter{position:absolute;right:17px;top:61px;font:600 187px/.66 var(--wb-display);letter-spacing:-.12em;color:rgba(242,234,219,.08);pointer-events:none;user-select:none;text-shadow:none}
.wb_sh_coverTitle{position:relative;z-index:1;margin:auto 0 0;max-width:100%;font:500 44px/.93 var(--wb-display);letter-spacing:-.06em;color:var(--wb-cover-ink);overflow-wrap:anywhere;word-break:break-word;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
.wb_sh_coverTitle[data-tier="m"]{font-size:36px}
.wb_sh_coverTitle[data-tier="l"]{font-size:28px;line-height:1.02}
.wb_sh_coverTitle[data-tier="xl"]{font-size:22px;line-height:1.08}
.wb_sh_coverSub{margin-top:10px;font:500 11px/1.4 var(--wb-text);letter-spacing:.14em;color:var(--wb-cover-dim);position:relative;z-index:1;text-transform:uppercase}
.wb_sh_coverRule{position:absolute;left:19px;right:19px;bottom:38px;height:1px;background:var(--wb-cover-line)}
.wb_sh_coverFoot{position:relative;z-index:1;margin-top:auto;display:flex;flex-direction:column;justify-content:space-between;gap:2px;font:400 11px/1.3 var(--wb-mono);color:var(--wb-cover-dim)}
.wb_sh_coverPath{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;direction:rtl}

/* the inner page */
.wb_sh_copy{min-width:0;align-self:center;max-width:720px;max-height:100%;overflow:auto;scrollbar-gutter:stable;padding:12px 6px 8px 0;scrollbar-width:thin;scrollbar-color:var(--wb-line-soft) transparent;animation:wb_sh_pageIn .28s cubic-bezier(.16,1,.3,1) both}
.wb_sh_masthead{display:flex;align-items:flex-start;justify-content:space-between;gap:32px;margin-bottom:8px}
.wb_sh_datePlate{display:flex;flex-direction:column;gap:3px;width:208px;flex:none}
.wb_sh_dateValue{font:400 30px/.95 var(--wb-display);letter-spacing:-.02em;color:var(--wb-ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.wb_sh_dateRule{display:block;height:1px;margin:1px 0 1px;background:var(--wb-line)}
.wb_sh_dateMeta{font:400 11px/1.25 var(--wb-type-cjk);letter-spacing:.02em;color:var(--wb-ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_sh_copyHead{display:flex;align-items:baseline;gap:20px;font:400 11px/1 var(--wb-mono);letter-spacing:.1em;color:var(--wb-ink-3)}
.wb_sh_copyHead b{font-weight:400;color:var(--wb-ink-2)}
.wb_sh_kind{color:var(--wb-ink-3);white-space:nowrap}
.wb_sh_title{margin:25px 0 0;font:400 34px/1.22 var(--wb-display);letter-spacing:-.035em;color:var(--wb-ink);max-width:20em}
.wb_sh_lede{margin:18px 0 0;max-width:56ch;font:400 14px/1.85 var(--wb-text);color:var(--wb-ink-2)}
.wb_sh_scope{display:flex;align-items:baseline;gap:9px;min-width:0;margin:18px 0 0;font:400 10px/1.4 var(--wb-mono);letter-spacing:.1em;color:var(--wb-ink-3)}
.wb_sh_scopeLabel{flex:none;text-transform:uppercase}
.wb_sh_scopeName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:500 13px/1.4 var(--wb-type-cjk);letter-spacing:0;color:var(--wb-ink)}
.wb_sh_scopeBack{flex:none;margin-left:auto;padding:0;border:0;background:transparent;color:var(--wb-ink-3);font:400 11px/1.4 var(--wb-type-cjk);cursor:pointer}
.wb_sh_scopeBack:hover{color:var(--wb-accent)}
.wb_sh_scopeBack:focus-visible{outline:2px solid var(--wb-focus);outline-offset:2px}
.wb_sh_scope + .wb_sh_facts{margin-top:14px}
.wb_sh_facts{display:grid;grid-template-columns:1fr 1fr;gap:0 38px;margin:30px 0 0;padding:0;border-top:1px solid var(--wb-line)}
.wb_fact{display:block;min-width:0;padding:11px 0 12px;border-bottom:1px solid var(--wb-line-faint)}
.wb_fact dt{font:400 11px/1 var(--wb-mono);letter-spacing:.09em;color:var(--wb-ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_fact dd{margin:6px 0 0;min-width:0;font:400 12px/1.4 var(--wb-text);color:var(--wb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_sh_subs{margin-top:25px;min-width:0}
.wb_sh_subsHead{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding-bottom:2px;font:400 11px/1 var(--wb-mono);letter-spacing:.09em;color:var(--wb-ink-3)}
.wb_sh_subsHead span:last-child{font-variant-numeric:tabular-nums;color:var(--wb-accent)}
.wb_sh_recentEmpty{margin:0;padding:9px 0 7px;font:400 11px/1.65 var(--wb-text);color:var(--wb-ink-3);border-bottom:1px solid var(--wb-line-faint)}
.wb_sh_actions{display:flex;gap:9px;margin-top:27px;flex-wrap:wrap}
.wb_sh_key{height:33px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;border:1px solid var(--wb-line);background:transparent;color:var(--wb-ink);font:500 11px/1 var(--wb-text);letter-spacing:.01em;cursor:pointer;transition:background .16s,color .16s,border-color .16s}
.wb_sh_keyPrimary{background:var(--wb-ink);border-color:var(--wb-ink);color:var(--wb-windowInk)}
.wb_sh_keyPrimary:hover{background:var(--wb-accent);border-color:var(--wb-accent);color:var(--wb-active-ink)}
.wb_sh_keyGhost:hover{border-color:var(--wb-accent);color:var(--wb-accent);background:var(--wb-wash)}
.wb_sh_key:focus-visible{outline:2px solid var(--wb-focus);outline-offset:2px}
.wb_sh_key svg{color:currentColor}

/* chapter rows on the inner page */
.wb_subList{display:flex;flex-direction:column;min-width:0}
.wb_subBlock{min-width:0;border-bottom:1px solid var(--wb-line-faint)}
.wb_subBlock:last-child{border-bottom:0}
.wb_subBlock[data-open="true"] .wb_sh_subLine{background:var(--wb-wash)}
.wb_sh_subLine{display:flex;align-items:stretch;min-width:0}
.wb_subRow{display:grid;grid-template-columns:24px minmax(0,1fr) auto auto 12px;gap:9px;align-items:baseline;flex:1;min-width:0;min-height:34px;padding:8px 0 7px;border:0;background:transparent;color:var(--wb-ink);text-align:left;font:inherit;cursor:pointer}
.wb_subRow:hover .wb_subName{color:var(--wb-accent)}
.wb_subRow:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}
.wb_subNo{font:400 11px/1.5 var(--wb-mono);color:var(--wb-ink-3);font-variant-numeric:tabular-nums}
.wb_subName{min-width:0;font:500 12px/1.6 var(--wb-text);color:var(--wb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .15s}
.wb_subCount{font:400 11px/1.6 var(--wb-type-cjk);color:var(--wb-ink-3);white-space:nowrap}
.wb_subState{font:500 11px/1.6 var(--wb-type-cjk);color:var(--wb-ink-3);white-space:nowrap}
.wb_subState[data-tone="ok"]{color:var(--wb-ok)}
.wb_subState[data-tone="today"]{color:var(--wb-warn)}
.wb_subState[data-tone="over"]{color:var(--wb-hot)}
.wb_subState[data-tone="done"]{color:var(--wb-ok)}
.wb_subCaret{width:0;height:0;border-top:3px solid transparent;border-bottom:3px solid transparent;border-left:4px solid var(--wb-ink-3);align-self:center;justify-self:end;transition:transform .15s;transform-origin:2px 50%}
.wb_subBlock[data-open="true"] .wb_subCaret{transform:rotate(90deg)}
.wb_subAdd{display:inline-flex;align-items:center;justify-content:center;width:26px;min-width:26px;border:0;border-left:1px solid var(--wb-line-faint);background:transparent;color:var(--wb-ink-3);cursor:pointer;opacity:0;transition:opacity .15s,color .15s,background .15s}
.wb_sh_subLine:hover .wb_subAdd,.wb_subAdd:focus-visible{opacity:1}
.wb_subAdd:hover{color:var(--wb-accent);background:var(--wb-wash)}
.wb_subAdd:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}
.wb_subSessions{display:flex;flex-direction:column;min-width:0;margin:0 0 7px 33px;padding:0 0 3px 12px;border-left:1px solid var(--wb-line-soft)}
.wb_subSession{display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:8px;align-items:baseline;width:100%;min-height:29px;padding:4px 0;border:0;border-bottom:1px solid var(--wb-line-faint);background:transparent;color:var(--wb-ink);text-align:left;font:inherit;cursor:pointer}
.wb_subSession:last-child{border-bottom:0}
.wb_subSession:hover{background:var(--wb-wash)}
.wb_subSession:focus-visible{outline:2px solid var(--wb-focus);outline-offset:1px}
.wb_subSessionNo{font:400 11px/1.6 var(--wb-mono);color:var(--wb-ink-3);font-variant-numeric:tabular-nums}
.wb_subSessionTitle{min-width:0;font:400 12px/1.6 var(--wb-text);color:var(--wb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_subSessionMeta{font:400 11px/1.6 var(--wb-type-cjk);color:var(--wb-ink-3);white-space:nowrap}
.wb_subSession[data-running="true"] .wb_subSessionMeta{color:var(--wb-ok)}
.wb_subEmpty{margin:0 0 7px 33px;padding-left:12px;border-left:1px solid var(--wb-line-soft);font:400 11px/1.65 var(--wb-type-cjk);color:var(--wb-ink-3)}

/* recent records on a surface volume */
.wb_contentList{display:flex;flex-direction:column;min-width:0}
.wb_contentRow{display:grid;grid-template-columns:15px minmax(0,1fr) auto;gap:8px;align-items:start;min-height:34px;padding:8px 0 7px;border:0;border-bottom:1px solid var(--wb-line-faint);background:transparent;color:var(--wb-ink);text-align:left;font:inherit;cursor:default}
.wb_contentRow:last-child{border-bottom:0}
button.wb_contentRow{cursor:pointer}
.wb_contentRow:hover{background:var(--wb-wash)}
.wb_contentText{min-width:0;font:400 12px/1.65 var(--wb-text);color:var(--wb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_contentMeta{font:400 11px/1.65 var(--wb-type-cjk);color:var(--wb-ink-3);white-space:nowrap;letter-spacing:.01em}
.wb_contentRow[data-late="true"] .wb_contentMeta{color:var(--wb-hot)}
.wb_contentRow[data-today="true"] .wb_contentMeta{color:var(--wb-warn)}

/* ── the shelf ───────────────────────────────────────────────────────────── */
.wb_sh_shelf{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:flex-end;min-height:0;border-top:1px solid var(--wb-line);padding:6px 57px 8px;background:linear-gradient(to bottom,var(--wb-wash),transparent 45%),var(--wb-deep)}
.wb_sh_shelfHead{display:flex;align-items:baseline;justify-content:space-between;gap:20px;padding:0 3px 4px;font:400 11px/1 var(--wb-mono);letter-spacing:.11em;color:var(--wb-ink-3)}
.wb_sh_shelfHead span:first-child{color:var(--wb-ink-2)}
.wb_sh_spines{position:relative;z-index:3;display:flex;align-items:flex-end;min-height:0;overflow:visible;padding:8px 2px 0;perspective:1200px}
.wb_sh_spineTrack{position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:center;gap:14px;margin:0 auto;min-width:min-content;transform-style:preserve-3d}
.wb_sh_spineTrack[data-engaged="true"] .wb_sh_spine:not([data-active="true"]){opacity:.78;filter:saturate(.82)}
.wb_sh_shelfEmpty{margin:0 auto;padding:30px 0 10px;color:var(--wb-ink-3);font:400 11px/1.7 var(--wb-text)}
.wb_sh_shelf:after{content:"";position:absolute;left:57px;right:57px;bottom:7px;height:1px;background:var(--wb-line)}
.wb_sh_spine{position:relative;flex:none;width:101px;height:145px;perspective:760px;transform-origin:50% 100%;will-change:transform;transition:opacity .2s ease,filter .2s ease}
.wb_modMain{display:flex;flex-direction:column;min-width:0}
.wb_sh_mini{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;padding:9px 8px 7px;border:0;background:var(--cover,#263a32);color:var(--wb-cover-ink);text-align:center;cursor:pointer;overflow:hidden;box-shadow:var(--ms-x,0px) var(--ms-y,8px) var(--ms-blur,16px) var(--ms-spread,-14px) rgba(0,0,0,var(--ms-alpha,.9));transform:rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg));transform-origin:50% 100%;transform-style:preserve-3d;backface-visibility:hidden;will-change:transform;transition:box-shadow .32s ease,filter .32s ease}
.wb_sh_mini:before{content:"";position:absolute;inset:4px;border:1px solid rgba(242,234,219,.38);pointer-events:none}
.wb_sh_mini:after{content:"";position:absolute;width:54px;height:54px;right:-23px;bottom:10px;border:1px solid rgba(242,234,219,.22);border-radius:50%;pointer-events:none}
.wb_sh_mini:focus-visible{outline:2px solid var(--wb-focus);outline-offset:3px}
.wb_sh_spine:hover,.wb_sh_spine:focus-within,.wb_sh_spine[data-active="true"]{transform:translateY(-20px) scale(1.03);z-index:6}
.wb_sh_spine[data-active="true"] .wb_sh_mini{--ms-y:17px;--ms-blur:26px;--ms-spread:-16px;--ms-alpha:.95}
.wb_sh_spine:hover .wb_sh_mini,.wb_sh_spine:focus-within .wb_sh_mini,.wb_sh_spine[data-active="true"] .wb_sh_mini{filter:brightness(1.08)}
.wb_sh_miniLetter{position:absolute;right:7px;top:20px;font:600 98px/.66 var(--wb-display);letter-spacing:-.12em;color:rgba(242,234,219,.08);pointer-events:none;user-select:none;text-shadow:none}
.wb_sh_miniTitle{position:relative;z-index:1;margin:0;max-width:100%;font:500 14px/1.05 var(--wb-display);letter-spacing:-.04em;color:var(--wb-cover-ink);text-align:center;overflow-wrap:anywhere;word-break:break-word;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;text-shadow:none}
.wb_sh_miniTitle[data-tier="m"]{font-size:12px}
.wb_sh_miniTitle[data-tier="l"]{font-size:10px}
.wb_sh_miniTitle[data-tier="xl"]{font-size:9px}
.wb_sh_miniSub{position:relative;z-index:1;margin-top:5px;max-width:100%;font:500 7px/1.25 var(--wb-text);letter-spacing:.02em;color:var(--wb-cover-dim);text-align:center;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_sh_miniOpen{position:absolute;right:8px;bottom:22px;z-index:2;display:inline-flex;color:var(--wb-cover-ink);opacity:0;transform:translateY(3px);transition:opacity .2s,transform .2s;text-shadow:none}
.wb_sh_spine:hover .wb_sh_miniOpen,.wb_sh_spine:focus-within .wb_sh_miniOpen,.wb_sh_spine[data-active="true"] .wb_sh_miniOpen{opacity:.78;transform:none}

/* ── the foot ────────────────────────────────────────────────────────────── */
.wb_sh_foot{flex:none;height:32px;min-height:32px;display:flex;align-items:center;gap:12px;padding:0 40px;border-top:1px solid var(--wb-line);background:var(--wb-top);color:var(--wb-ink-3);font:400 11px/1 var(--wb-mono);letter-spacing:.03em;white-space:nowrap;overflow:hidden}
.wb_sh_footNote{min-width:0;overflow:hidden;text-overflow:ellipsis;color:var(--wb-ink-3)}
.wb_sh_grow{margin-left:auto}
.wb_sh_slash{color:var(--wb-line)}
.wb_sh_footLink{padding:0;border:0;background:transparent;color:var(--wb-ink-2);font:400 11px/1 var(--wb-mono);letter-spacing:.03em;cursor:pointer}
.wb_sh_footLink:hover{color:var(--wb-accent)}
.wb_sh_footLink:focus-visible{outline:2px solid var(--wb-focus);outline-offset:3px}
.wb_sh_footPress{color:var(--wb-ink-3)}
.wb_build{color:var(--wb-accent);user-select:text;font-variant-numeric:tabular-nums}

/* ── the day drawer ──────────────────────────────────────────────────────── */
.wb_sh_scrim{position:fixed;inset:0;z-index:1200;background:rgba(8,10,7,.42);animation:wb_sh_fade .2s ease both}
.wb_sh_day{position:fixed;z-index:1210;top:0;right:0;bottom:0;width:min(384px,94vw);display:flex;flex-direction:column;overflow:hidden;background:var(--wb-today);border-left:1px solid var(--wb-line);box-shadow:-28px 0 60px -42px rgba(0,0,0,.8);color:var(--wb-ink);animation:wb_sh_slide .32s cubic-bezier(.16,1,.3,1) both}
/* The drawer is a page of this book, not a generic shell dialog: restate its
   own surface at a specificity that survives a whole-shell dialog blanket. */
.wb_page .wb_sh_day[role="dialog"]{background:var(--wb-today)!important;color:var(--wb-ink)!important;border:0!important;border-left:1px solid var(--wb-line)!important;box-shadow:-28px 0 60px -42px rgba(0,0,0,.8)!important}
.wb_sh_dayHead{flex:none;height:58px;min-height:58px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 17px 0 20px;border-bottom:1px solid var(--wb-line);background:var(--wb-top)}
.wb_sh_dayHead b{font:500 11px/1 var(--wb-mono);letter-spacing:.14em;color:var(--wb-ink-2)}
.wb_sh_dayBody{flex:1;min-height:0;overflow-x:hidden;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--wb-line-soft) transparent}
.wb_sh_dayBody .wb_today{background:transparent;padding:18px 18px 14px;height:auto;min-height:100%}

/* ── controls shared by every page ───────────────────────────────────────── */
.wb_btn,.wb_sBtn{appearance:none;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:30px;padding:0 11px;
  border:1px solid var(--wb-line);border-radius:0;background:transparent;color:var(--wb-ink);font:500 11px/1 var(--wb-text);letter-spacing:.02em;
  cursor:pointer;white-space:nowrap;flex:none;transition:background .15s,color .15s,border-color .15s}
.wb_btn:hover,.wb_sBtn:hover{border-color:var(--wb-accent);background:var(--wb-wash);color:var(--wb-accent)}
.wb_btn:focus-visible,.wb_sBtn:focus-visible{outline:2px solid var(--wb-focus);outline-offset:2px}
.wb_btn:disabled,.wb_sBtn:disabled{border-color:var(--wb-line-faint);background:transparent;color:var(--wb-ink-3);cursor:default}
.wb_btn[data-variant="primary"],.wb_sBtnPrimary{background:var(--wb-ink);border-color:var(--wb-ink);color:var(--wb-windowInk)}
.wb_btn[data-variant="primary"]:hover,.wb_sBtnPrimary:hover{background:var(--wb-accent);border-color:var(--wb-accent);color:var(--wb-active-ink)}
.wb_btn[data-variant="primary"]:disabled,.wb_sBtnPrimary:disabled{background:transparent;border-color:var(--wb-line-faint);color:var(--wb-ink-3)}
.wb_btn[data-variant="danger"]{color:var(--wb-hot);border-color:var(--wb-line)}
.wb_btn[data-variant="danger"]:hover{background:var(--wb-hot);border-color:var(--wb-hot);color:var(--wb-windowInk)}
.wb_input,.wb_area{box-sizing:border-box;width:100%;min-width:0;height:32px;padding:3px 1px;border:0;border-bottom:1px solid var(--wb-line-soft);border-radius:0;
  background:transparent;color:var(--wb-ink);font:400 12px/21px var(--wb-text);caret-color:var(--wb-accent)}
.wb_area{height:auto;min-height:76px;padding:8px 9px;border:1px solid var(--wb-line-soft);background:color-mix(in srgb,var(--wb-ground) 75%,transparent);line-height:19px;resize:vertical}
.wb_input::placeholder,.wb_area::placeholder{color:var(--wb-ink-3)}
.wb_input:hover,.wb_area:hover{border-color:var(--wb-line)}
.wb_input:focus-visible,.wb_area:focus-visible{outline:none;border-color:var(--wb-accent);box-shadow:0 1px 0 var(--wb-accent)}
.wb_area:focus-visible{box-shadow:inset 0 0 0 1px var(--wb-accent)}
.wb_input[aria-invalid="true"]{border-color:var(--wb-hot)}
.wb_search{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 2px;flex:1;min-width:140px;max-width:320px;border:0;border-bottom:1px solid var(--wb-line-soft);
  border-radius:0;background:transparent;color:var(--wb-ink-3)}
.wb_search:focus-within{border-bottom-color:var(--wb-accent)}
.wb_search input{flex:1;min-width:0;border:0;background:transparent;color:var(--wb-ink);font:400 12px/21px var(--wb-text);outline:none;padding:0;caret-color:var(--wb-accent)}
.wb_search input::placeholder{color:var(--wb-ink-3)}
.wb_seg{display:inline-flex;align-items:center;gap:13px;border:0;background:transparent;flex:none}
.wb_seg button{position:relative;height:28px;padding:0 0 2px;border:0;border-bottom:1px solid transparent;background:transparent;color:var(--wb-ink-3);
  font:500 11px/1 var(--wb-text);letter-spacing:.02em;cursor:pointer;white-space:nowrap}
.wb_seg button:hover{color:var(--wb-ink)}
.wb_seg button[data-active="true"]{color:var(--wb-accent);border-bottom-color:var(--wb-accent)}
.wb_seg button:focus-visible{outline:2px solid var(--wb-focus);outline-offset:2px}

/* the tick and the check */
.wb_tick,.wb_check{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;margin-top:1px;padding:0;border:1px solid var(--wb-line);border-radius:0;
  background:transparent;color:transparent;cursor:pointer;flex:none;font:400 11px/1 var(--wb-mono)}
.wb_check{width:17px;height:17px;margin-top:0;margin-right:10px}
.wb_tick svg,.wb_check svg{display:none}
.wb_tick[aria-checked="true"],.wb_check[aria-checked="true"]{background:var(--wb-ok);border-color:var(--wb-ok);color:var(--wb-windowInk)}
.wb_tick[aria-checked="true"]::after,.wb_check[aria-checked="true"]::after{content:"";width:7px;height:3.5px;border-left:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(-45deg) translateY(-1px)}
.wb_tick:hover,.wb_check:hover{border-color:var(--wb-accent)}
.wb_tick:focus-visible,.wb_check:focus-visible{outline:2px solid var(--wb-focus);outline-offset:1px}

/* editor fields */
.wb_editor{position:relative;display:flex;flex-direction:column;gap:9px;margin:16px 0 0;padding:14px 15px 15px;border:1px solid var(--wb-line);border-top:2px solid var(--wb-accent);border-radius:0;background:var(--wb-deep)}
.wb_editorHead{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.wb_editorTitle{flex:1;min-width:0;margin:0;font:600 11px/20px var(--wb-mono);letter-spacing:.08em;color:var(--wb-ink);text-transform:uppercase}
.wb_editorActions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;flex:none}
.wb_fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.wb_field{display:flex;flex-direction:column;gap:4px;min-width:0}
.wb_fieldLabel{font:500 11px/1 var(--wb-mono);letter-spacing:.08em;color:var(--wb-ink-3);text-transform:uppercase}
.wb_notice{margin:0 0 10px;padding:6px 0;border-bottom:1px solid var(--wb-line-soft);background:transparent;color:var(--wb-ink-2);font:500 11px/1.7 var(--wb-text)}

/* ── menus, dialogs, toasts ─────────────────────────────────────────────── */
.wb_menu{box-sizing:border-box;position:fixed;z-index:1400;display:flex;flex-direction:column;min-width:172px;max-width:340px;padding:4px;border:1px solid var(--wb-line);border-radius:0;
  background:var(--wb-ground);box-shadow:0 12px 32px -14px color-mix(in srgb,var(--wb-ink) 42%,transparent)}

.wb_menuWrap{position:relative}
.wb_menuItem{box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;min-height:31px;padding:5px 8px;border:0;border-radius:0;background:transparent;
  cursor:pointer;font:400 11px/18px var(--wb-text);color:var(--wb-ink);text-align:left}
.wb_menuItem:hover:not(:disabled){background:var(--wb-accent);color:var(--wb-windowInk)}
.wb_menuItem:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}
.wb_menuItem:disabled{color:var(--wb-ink-3);cursor:default}
.wb_menuItem[data-danger="true"]{color:var(--wb-hot)}
.wb_menuItem[data-danger="true"]:hover{background:var(--wb-hot);color:var(--wb-windowInk)}
.wb_menuGlyph{display:inline-flex;flex:none;align-items:center;justify-content:center;width:13px;height:13px;color:currentColor}
.wb_menuText{display:flex;flex:1;flex-direction:column;gap:1px;min-width:0}
.wb_menuLabel{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wb_menuSep{height:1px;margin:4px 0;background:var(--wb-line-faint)}
.wb_overlay{position:fixed;inset:0;z-index:1500;display:grid;place-items:center;padding:24px;background:var(--dsw-alias-bg-mask-3)}
.wb_dialog{box-sizing:border-box;display:flex;flex-direction:column;gap:7px;width:min(408px,100%);padding:18px 18px 14px;border:1px solid var(--wb-line);border-top:2px solid var(--wb-accent);
  border-radius:0;background:var(--wb-ground);box-shadow:0 18px 44px -20px color-mix(in srgb,var(--wb-ink) 46%,transparent)}
.wb_dialogTitle{margin:0;font:600 11px/22px var(--wb-mono);letter-spacing:.1em;color:var(--wb-ink);text-transform:uppercase}
.wb_dialogBody{margin:0;font-size:12px;line-height:20px;color:var(--wb-ink-2);overflow-wrap:anywhere}
.wb_dialogActions{display:flex;justify-content:flex-end;gap:7px;margin-top:14px}
.wb_toasts{position:fixed;z-index:1450;top:0;left:50%;display:flex;flex-direction:column;align-items:center;gap:10px;width:min(384px,calc(100vw - 32px));max-height:calc(100vh - 8px);transform:translateX(-50%);
  overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--wb-line-soft) transparent;color:var(--wb-ink);font:400 13px/1.5 var(--wb-text);pointer-events:auto}
.wb_toast{box-sizing:border-box;display:flex;flex:none;flex-direction:column;width:100%;overflow:hidden;border:1px solid var(--wb-line);border-radius:0;
  background:var(--wb-ground);box-shadow:0 14px 36px -18px color-mix(in srgb,var(--wb-ink) 46%,transparent);pointer-events:auto;transition:border-color .16s ease,box-shadow .16s ease;animation:wb_toastIn .18s cubic-bezier(.2,.75,.25,1) both}
.wb_toast:hover,.wb_toast:focus-within{border-color:var(--wb-line-soft);box-shadow:0 18px 44px -20px color-mix(in srgb,var(--wb-ink) 52%,transparent)}
.wb_toastHead{display:flex;align-items:center;gap:7px;min-height:34px;padding:0 12px;border-bottom:1px solid var(--wb-line-faint);background:var(--wb-top)}
.wb_toastMark{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex:none;color:var(--wb-accent)}
.wb_toast[data-tone="overdue"] .wb_toastMark{color:var(--wb-hot)}
.wb_toastKind{font:600 11px/1 var(--wb-type-cjk);letter-spacing:.06em;color:var(--wb-ink-2);white-space:nowrap}
.wb_toastWord{font:400 11px/1 var(--wb-mono);letter-spacing:.1em;color:var(--wb-ink-3);white-space:nowrap}
.wb_toastStamp{display:inline-flex;align-items:baseline;gap:5px;margin-left:auto;color:var(--wb-ink-3);white-space:nowrap}
.wb_toastDay{font:500 11px/1 var(--wb-text);letter-spacing:.02em}
.wb_toastTime{font:500 11px/1 var(--wb-mono);letter-spacing:.03em;font-variant-numeric:tabular-nums}
.wb_toastBody{display:flex;flex-direction:column;gap:5px;min-width:0;padding:11px 12px 12px}
.wb_toastTitle{display:-webkit-box;overflow:hidden;margin:0;font:600 14px/1.55 var(--wb-text);letter-spacing:.002em;color:var(--wb-ink);overflow-wrap:anywhere;-webkit-box-orient:vertical;-webkit-line-clamp:3}
.wb_toast:hover .wb_toastTitle,.wb_toast:focus-within .wb_toastTitle{display:block;overflow:visible;-webkit-line-clamp:unset}
.wb_toastDue{display:inline-flex;align-items:center;gap:5px;font:500 11px/1.4 var(--wb-text);color:var(--wb-ink-3)}
.wb_toastDue::before{content:"";width:5px;height:5px;flex:none;background:currentColor;border-radius:50%}
.wb_toastDue[data-tone="overdue"]{color:var(--wb-hot)}
.wb_toastDue[data-tone="today"]{color:var(--wb-warn)}
.wb_toastMore{max-height:0;margin-top:0;opacity:0;overflow:hidden;transition:max-height .24s cubic-bezier(.16,1,.3,1),opacity .16s ease,margin-top .24s cubic-bezier(.16,1,.3,1)}
.wb_toast:hover .wb_toastMore,.wb_toast:focus-within .wb_toastMore{max-height:260px;margin-top:8px;opacity:1}
.wb_toastFacts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 14px;padding-top:7px;border-top:1px solid var(--wb-line-faint)}
.wb_toastFact{display:flex;flex-direction:column;gap:2px;min-width:0}
.wb_toastFact[data-wide="true"]{grid-column:1/-1}
.wb_toastFact span,.wb_toastNoteLabel{font:500 11px/1.2 var(--wb-type-cjk);letter-spacing:.05em;color:var(--wb-ink-3)}
.wb_toastFact b{font:500 11px/1.5 var(--wb-type-cjk);color:var(--wb-ink-2);overflow-wrap:anywhere}
.wb_toastNoteBlock{display:flex;flex-direction:column;gap:3px;margin-top:7px;padding-top:7px;border-top:1px solid var(--wb-line-faint)}
.wb_toastNoteBody{max-height:112px;margin:0;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--wb-line-soft) transparent;font:400 11px/1.65 var(--wb-text);color:var(--wb-ink-2);overflow-wrap:anywhere}
.wb_toastActions{display:grid;grid-template-columns:1.15fr 1fr .85fr;border-top:1px solid var(--wb-line);background:var(--wb-deep)}
.wb_toastActions .wb_btn{height:34px;min-width:0;padding:0 6px;border:0;border-left:1px solid var(--wb-line-faint);border-radius:0;background:transparent;color:var(--wb-ink-2);font:500 11px/1 var(--wb-text);letter-spacing:.02em}
.wb_toastActions .wb_btn:first-child{border-left:0}
.wb_toastActions .wb_btn:hover{border-color:transparent;background:var(--wb-wash);color:var(--wb-accent)}
.wb_toastActions .wb_btn[data-variant="primary"]{background:var(--wb-ink);border-color:transparent;color:var(--wb-windowInk)}
.wb_toastActions .wb_btn[data-variant="primary"]:hover{background:var(--wb-accent);color:var(--wb-active-ink)}
.wb_toastActions .wb_btn:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}
@keyframes wb_toastIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}

/* the board ticket beside the shipped session header: a cloth spine and its name */
.wb_headerAction{
  --wb-ink-2:#4f4a40;
  --wb-line-soft:rgba(23,21,15,.16);
  --wb-accent:#5c6e3f;
  --wb-wash:rgba(92,110,63,.08);
  --wb-hot:#a8331d;
  --wb-focus:#5c6e3f;
  --wb-text:"IBM Plex Sans","Noto Sans SC Variable","PingFang SC","Microsoft YaHei",sans-serif;
}
body[data-ds-dark-theme] .wb_headerAction{
  --wb-ink-2:#c9c2b5;
  --wb-line-soft:rgba(239,233,221,.14);
  --wb-accent:#aebe8f;
  --wb-wash:rgba(174,190,143,.10);
  --wb-hot:#d96a52;
  --wb-focus:#c5d2aa;
}
.wb_boardLabel{display:inline-flex;align-items:center;gap:8px;min-width:0;max-width:240px;height:26px;padding:0 2px 0 0;border:0;background:transparent;color:var(--wb-ink-2);font:500 12px/1 var(--wb-text);letter-spacing:.01em;flex:none}
.wb_boardLabelMark{display:block;width:6px;height:18px;flex:none;background:var(--wb-cloth,#5f2522);box-shadow:inset 0 0 0 1px rgba(242,234,219,.28)}
.wb_boardLabelText{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wb_newSession{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;min-width:24px;margin-left:2px;padding:0;border:1px solid var(--wb-line-soft);border-radius:0;background:transparent;color:var(--wb-ink-2);cursor:pointer;flex:none;transition:color .16s,border-color .16s,background .16s,opacity .16s}
.wb_newSession:hover:not(:disabled){color:var(--wb-accent);border-color:var(--wb-accent);background:var(--wb-wash)}
.wb_newSession:focus-visible{outline:2px solid var(--wb-focus);outline-offset:1px}
.wb_newSession:disabled{cursor:progress;opacity:.55}
.wb_newSession[data-error="true"]{color:var(--wb-hot);border-color:var(--wb-hot)}

/* ── the surface pages: to-do and notes ─────────────────────────────────── */
.wb_ix_top{display:flex;align-items:center;gap:14px;height:58px;min-height:58px;padding:0 24px;border-bottom:1px solid var(--wb-line);background:var(--wb-top)}
.wb_ix_word{font:400 11px/1 var(--wb-mono);letter-spacing:.16em;color:var(--wb-ink-3);white-space:nowrap}
.wb_ix_word b{font-weight:400;color:var(--wb-ink)}
.wb_ix_form{display:inline-flex;align-items:center;gap:7px;font:400 11px/1 var(--wb-mono);letter-spacing:.08em;color:var(--wb-ink-3);white-space:nowrap}
.wb_ix_form b{font-weight:400;color:var(--wb-accent)}
.wb_ix_form i{font-style:normal;color:var(--wb-ink-3)}
.wb_ix_topRight{margin-left:auto;display:flex;align-items:center;gap:14px;min-width:0}
.wb_ix_stamp{font:400 11px/1 var(--wb-mono);letter-spacing:.08em;color:var(--wb-ink-3);font-variant-numeric:tabular-nums;white-space:nowrap}
.wb_ix_actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.wb_ix_actions .wb_btn{height:29px;padding:0 10px;font-size:11px}
.wb_ix_actions .wb_btn[data-variant="primary"]{background:var(--wb-active-bg);border-color:var(--wb-active-bg);color:var(--wb-active-ink)}
.wb_ix_actions .wb_btn[data-variant="primary"]:hover{background:var(--wb-accent);border-color:var(--wb-accent);color:var(--wb-windowInk)}
.wb_ix_head{display:flex;align-items:flex-end;gap:18px;height:92px;min-height:92px;padding:0 32px 18px;border-bottom:1px solid var(--wb-line);background:var(--wb-ground)}
.wb_ix_headText{display:flex;align-items:baseline;gap:16px;min-width:0;flex:1}
.wb_ix_head h1{margin:0;font:600 50px/.95 var(--wb-display);letter-spacing:-.045em;color:var(--wb-ink);white-space:nowrap;min-width:0;overflow:hidden;text-overflow:ellipsis}
.wb_ix_sub{padding-bottom:5px;font:400 11px/1.4 var(--wb-text);color:var(--wb-ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_ix_headMeta{margin-left:auto;flex:none;text-align:right;padding-bottom:3px}
.wb_ix_headMeta b{display:block;font:500 13px/1 var(--wb-mono);letter-spacing:.03em;color:var(--wb-ink);font-variant-numeric:tabular-nums}
.wb_ix_headMeta span{display:block;margin-top:5px;font:400 11px/1 var(--wb-mono);letter-spacing:.12em;color:var(--wb-ink-3);white-space:nowrap}
.wb_ix_body{flex:1;min-height:0;display:grid;overflow:hidden}
.wb_ix_bodyTodo{grid-template-columns:204px minmax(0,1fr) 356px}
.wb_ix_bodyNote{grid-template-columns:330px minmax(0,1fr)}
.wb_ix_foot{display:flex;align-items:center;gap:12px;height:26px;min-height:26px;padding:0 32px;border-top:1px solid var(--wb-line);font:400 11px/1 var(--wb-mono);letter-spacing:.04em;color:var(--wb-ink-3)}
.wb_ix_workspace{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--wb-ink-3)}
.wb_ix_foot .wb_build{margin-left:auto}

/* filters */
.wb_ix_filters{background:var(--wb-today);border-right:1px solid var(--wb-line);padding:16px 0 14px;display:flex;flex-direction:column;min-height:0;overflow:hidden}
.wb_ix_filterCap{padding:0 18px 9px;margin:0;font:400 11px/1 var(--wb-mono);letter-spacing:.16em;color:var(--wb-ink-3)}
.wb_ix_filter{display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:8px;align-items:center;width:100%;height:42px;padding:0 18px;border:0;border-bottom:1px solid var(--wb-line-faint);background:transparent;color:var(--wb-ink-2);text-align:left;font:400 11px/1 var(--wb-text);cursor:pointer;transition:background .15s}
.wb_ix_filter:hover{background:var(--wb-wash)}
.wb_ix_filter:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}
.wb_ix_filter[data-active="true"]{background:var(--wb-active-bg);color:var(--wb-active-ink)}
.wb_ix_filterNo{font:500 11px/1 var(--wb-mono);letter-spacing:.06em;color:var(--wb-ink-3);font-style:normal}
.wb_ix_filter b{font:500 11px/1 var(--wb-mono);color:var(--wb-ink-3);font-variant-numeric:tabular-nums}
.wb_ix_filter b[data-tone="today"]{color:var(--wb-warn)}
.wb_ix_filter b[data-tone="over"]{color:var(--wb-hot)}
.wb_ix_filter b[data-tone="done"]{color:var(--wb-ok)}
.wb_ix_filter[data-active="true"] .wb_ix_filterNo,.wb_ix_filter[data-active="true"] b{color:var(--wb-active-dim)}
.wb_ix_search{flex:none;width:auto;max-width:none;height:31px;margin:16px 14px 0;padding:0 9px;border:1px solid var(--wb-line);background:var(--wb-ground)}
.wb_ix_filterFoot{margin-top:auto;padding:13px 18px 0;border-top:1px solid var(--wb-line)}
.wb_ix_bar{height:7px;background:var(--wb-deep);position:relative;border:1px solid var(--wb-line-faint)}
.wb_ix_bar i{position:absolute;inset:0 auto 0 0;background:var(--wb-accent)}
.wb_ix_filterFoot span{display:block;margin-top:6px;font:400 11px/1.4 var(--wb-mono);letter-spacing:.04em;color:var(--wb-ink-3);font-variant-numeric:tabular-nums}
.wb_ix_clear{display:block;margin-top:8px;padding:0;border:0;background:transparent;color:var(--wb-accent);font:500 11px/1.6 var(--wb-text);cursor:pointer;text-align:left}
.wb_ix_clear:hover{text-decoration:underline;text-underline-offset:2px}

/* working list */
.wb_ix_center{min-width:0;padding:16px 24px 14px;display:flex;flex-direction:column;border-right:1px solid var(--wb-line);min-height:0}
.wb_ix_add{display:flex;align-items:center;gap:10px;height:38px;min-height:38px;padding:0 12px;background:var(--wb-active-bg);color:var(--wb-active-ink)}
.wb_ix_plus{width:15px;height:15px;flex:none;display:grid;place-items:center;border:1px solid var(--wb-active-ink)}
.wb_ix_add input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:inherit;font:600 11.5px/1 var(--wb-text);caret-color:var(--wb-active-ink)}
.wb_ix_add input::placeholder{color:color-mix(in srgb,var(--wb-active-ink) 64%,transparent)}
.wb_ix_add > span:last-child{flex:none;font:400 11px/1 var(--wb-mono);letter-spacing:.12em;color:var(--wb-active-ink);opacity:.62}
.wb_ix_thead{display:grid;grid-template-columns:42px minmax(0,1fr) 94px 66px;gap:10px;align-items:center;height:31px;min-height:31px;padding:0 9px;border-bottom:1px solid var(--wb-line);font:400 11px/1 var(--wb-mono);letter-spacing:.13em;color:var(--wb-ink-3)}
.wb_ix_error{margin:6px 0 0}
.wb_ix_empty{margin:0;padding:18px 16px;color:var(--wb-ink-3);font:400 12px/1.8 var(--wb-text)}
.wb_ix_emptyState{display:flex;flex-direction:column;align-items:flex-start;padding:56px 8px 0}
.wb_ix_emptyNo{display:block;font:500 84px/1 var(--wb-mono);letter-spacing:-.08em;color:color-mix(in srgb,var(--wb-accent) 18%,transparent)}
.wb_ix_emptyState h2{margin:14px 0 6px;font-size:24px;line-height:1.35;font-weight:600;letter-spacing:-.02em;color:var(--wb-ink)}
.wb_ix_emptyState p{margin:0;font-size:11px;line-height:1.8;color:var(--wb-ink-3)}
.wb_ix_list{flex:1;min-height:0;overflow:auto;scrollbar-width:thin;scrollbar-color:var(--wb-line-soft) transparent}
.wb_ix_row{display:grid;grid-template-columns:42px minmax(0,1fr) 94px 66px;gap:10px;align-items:center;min-height:58px;padding:8px 9px;border-bottom:1px solid var(--wb-line-faint);cursor:pointer}
.wb_ix_row:hover{background:var(--wb-wash)}
.wb_ix_row:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}
.wb_ix_row[data-selected="true"]{background:var(--wb-active-bg);color:var(--wb-active-ink)}
.wb_ix_row[data-selected="true"] .wb_ix_rowNo,.wb_ix_row[data-selected="true"] .wb_ix_rowTitle,.wb_ix_row[data-selected="true"] .wb_ix_rowMeta,.wb_ix_row[data-selected="true"] .wb_ix_due,.wb_ix_row[data-selected="true"] .wb_ix_due small,.wb_ix_row[data-selected="true"] .wb_ix_prio,.wb_ix_row[data-selected="true"] .wb_metaChip{color:var(--wb-active-dim)}
.wb_ix_row[data-selected="true"] .wb_check{border-color:var(--wb-active-dim)}
.wb_ix_rowNo{font:400 11px/1 var(--wb-mono);letter-spacing:.04em;color:var(--wb-ink-3);font-variant-numeric:tabular-nums}
.wb_ix_rowMain{display:flex;align-items:center;min-width:0}
.wb_ix_rowMain .wb_check{width:17px;height:17px;margin-right:10px}
.wb_ix_rowText{min-width:0}
.wb_ix_rowTitle{font-size:13.5px;font-weight:600;line-height:1.4;color:var(--wb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_ix_row[data-done="true"] .wb_ix_rowTitle{color:var(--wb-ink-3);text-decoration:line-through}
.wb_ix_rowMeta{display:flex;align-items:center;gap:9px;margin-top:3px;min-width:0;font:500 11px/1 var(--wb-mono);color:var(--wb-ink-3)}
.wb_metaChip{display:inline-flex;align-items:center;gap:3px;font:400 11px/1.5 var(--wb-mono);color:var(--wb-ink-3);font-variant-numeric:tabular-nums;white-space:nowrap}
.wb_metaChip[data-state="over"]{color:var(--wb-hot)}
.wb_metaChip[data-state="today"]{color:var(--wb-warn)}
.wb_metaChip[data-state="remind"]{color:var(--wb-accent)}
.wb_metaChip[data-state="remind"] svg{position:relative;top:-1px}
.wb_ix_due{font:400 11px/1.3 var(--wb-mono);color:var(--wb-ink-2);font-variant-numeric:tabular-nums;white-space:nowrap}
.wb_ix_due small{display:block;margin-top:2px;font:400 11px/1 var(--wb-mono);letter-spacing:.05em;color:var(--wb-ink-3)}
.wb_ix_due[data-tone="over"]{color:var(--wb-hot)}
.wb_ix_due[data-tone="today"]{color:var(--wb-warn)}
.wb_ix_prio{font:400 11px/1 var(--wb-mono);letter-spacing:.1em;color:var(--wb-ink-3);white-space:nowrap}
.wb_ix_prio[data-tone="high"]{color:var(--wb-warn)}
.wb_ix_countline{flex:none;display:flex;justify-content:space-between;gap:12px;padding-top:9px;border-top:1px solid var(--wb-line);font:400 11px/1 var(--wb-mono);letter-spacing:.06em;color:var(--wb-ink-3)}

/* record panel */
.wb_ix_detail{background:var(--wb-today);padding:18px 22px 15px;display:flex;flex-direction:column;min-height:0;overflow:auto;position:relative}
.wb_ix_bigNo{position:absolute;top:4px;right:12px;font:500 84px/1 var(--wb-mono);letter-spacing:-.08em;color:color-mix(in srgb,var(--wb-accent) 14%,transparent);pointer-events:none;user-select:none}
.wb_ix_detailBody,.wb_ix_detailEmpty{display:flex;flex-direction:column;min-height:100%;position:relative;z-index:1}
.wb_ix_detailTop{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:9px;border-bottom:1px solid var(--wb-line)}
.wb_ix_detailTop span{font:400 11px/1 var(--wb-mono);letter-spacing:.14em;color:var(--wb-ink-3)}
.wb_ix_detailTop b{font:400 11px/1 var(--wb-mono);letter-spacing:.08em;color:var(--wb-accent)}
.wb_ix_detailTitle{margin:24px 0 5px;font-size:23px;line-height:1.35;letter-spacing:-.02em;font-weight:600;max-width:8em}
.wb_ix_detailSub{margin-top:4px;font:400 11px/1.4 var(--wb-mono);letter-spacing:.06em;color:var(--wb-ink-3)}
.wb_ix_facts{margin-top:20px;border-top:1px solid var(--wb-line)}
.wb_ix_fact{display:grid;grid-template-columns:68px minmax(0,1fr);gap:10px;padding:10px 0;border-bottom:1px solid var(--wb-line-faint);font-size:12px}
.wb_ix_fact span{font:400 11px/1.4 var(--wb-mono);letter-spacing:.1em;color:var(--wb-ink-3)}
.wb_ix_fact b{font-weight:500;color:var(--wb-ink)}
.wb_ix_noteLabel{margin-top:16px;font:400 11px/1 var(--wb-mono);letter-spacing:.12em;color:var(--wb-ink-3)}
.wb_ix_noteBody{margin:6px 0 0;font-size:12.5px;line-height:1.9;color:var(--wb-ink-2);overflow-wrap:anywhere}
.wb_ix_detailActions{margin-top:auto;display:flex;gap:7px;padding-top:16px}
.wb_ix_detailActions button{flex:1;min-width:0;height:32px;padding:0 6px;font-size:11.5px}
.wb_ix_detailEmpty h2{margin:30px 0 6px;font-size:26px;font-weight:600;line-height:1.35;max-width:8em}
.wb_ix_detailEmpty p{margin:0;font-size:12px;line-height:1.8;color:var(--wb-ink-3)}
.wb_ix_detailEditor{display:flex;flex-direction:column;min-height:100%}

/* editors live in the record panel */
.wb_ix_editor{margin:0;padding:14px 0 0;border:0;border-top:2px solid var(--wb-accent);background:transparent;min-height:100%}
.wb_ix_editor .wb_editorTitle{color:var(--wb-ink)}
.wb_ix_editor .wb_fields{grid-template-columns:minmax(0,1fr)}
.wb_ix_editor .wb_area{min-height:170px}
.wb_ix_editor .wb_btn[data-variant="primary"]{background:var(--wb-active-bg);border-color:var(--wb-active-bg);color:var(--wb-active-ink)}
.wb_ix_editor .wb_btn[data-variant="primary"]:hover{background:var(--wb-accent);border-color:var(--wb-accent);color:var(--wb-windowInk)}

/* the date field and its month grid */
.wb_ix_dateField{position:relative;width:100%}
.wb_ix_dateTrigger{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;height:32px;padding:3px 1px;border:0;border-bottom:1px solid var(--wb-line-soft);border-radius:0;background:transparent;color:var(--wb-ink);font:400 12px/21px var(--wb-text);text-align:left;cursor:pointer}
.wb_ix_dateTrigger:hover{border-bottom-color:var(--wb-line)}
.wb_ix_dateTrigger:focus-visible{outline:2px solid var(--wb-focus);outline-offset:2px}
.wb_ix_dateTrigger span[data-empty="true"]{color:var(--wb-ink-3)}
.wb_ix_dateTrigger svg{color:var(--wb-ink-3)}
.wb_ix_calPop{position:fixed;z-index:80;width:292px;max-height:calc(100vh - 16px);overflow:auto;padding:10px 10px 9px;background:var(--wb-today);border:1px solid var(--wb-line);border-top:2px solid var(--wb-accent);box-shadow:0 18px 40px rgba(0,0,0,.25);color:var(--wb-ink)}
.wb_ix_calHead{display:flex;align-items:center;gap:6px;height:30px;border-bottom:1px solid var(--wb-line);margin-bottom:6px}
.wb_ix_calHead b{flex:1;text-align:center;font:500 11px/1 var(--wb-mono);letter-spacing:.08em;color:var(--wb-ink)}
.wb_ix_calNav{width:26px;height:24px;border:0;background:transparent;color:var(--wb-ink-2);font:500 16px/1 var(--wb-mono);cursor:pointer}
.wb_ix_calNav:hover{color:var(--wb-accent)}
.wb_ix_calNav:focus-visible{outline:2px solid var(--wb-focus)}
.wb_ix_calDow{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;padding:2px 0 4px}
.wb_ix_calDow span{text-align:center;font:400 11px/1 var(--wb-mono);letter-spacing:.04em;color:var(--wb-ink-3)}
.wb_ix_calGrid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.wb_ix_calDay{aspect-ratio:1;border:1px solid transparent;background:transparent;color:var(--wb-ink-2);font:400 11px/1 var(--wb-mono);cursor:pointer}
.wb_ix_calDay:hover{background:var(--wb-wash);color:var(--wb-ink)}
.wb_ix_calDay[data-outside="true"]{color:var(--wb-ink-3);opacity:.45}
.wb_ix_calDay[data-today="true"]{border-color:var(--wb-accent)}
.wb_ix_calDay[data-selected="true"]{background:var(--wb-active-bg);border-color:var(--wb-active-bg);color:var(--wb-active-ink);opacity:1}
.wb_ix_calDay:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}
.wb_ix_calTime{display:flex;align-items:center;gap:10px;margin-top:8px;padding-top:8px;border-top:1px solid var(--wb-line)}
.wb_ix_calTime > span{font:400 11px/1 var(--wb-mono);letter-spacing:.12em;color:var(--wb-ink-3);white-space:nowrap}
.wb_ix_timeWheel{display:inline-flex;align-items:stretch;flex:none;height:50px;border:1px solid var(--wb-line);background:var(--wb-ground);color:var(--wb-ink);user-select:none}
.wb_ix_timeWheel:focus-within{border-color:var(--wb-focus)}
.wb_ix_timeDrum{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;width:34px;overflow:hidden;background:transparent;outline:0}
.wb_ix_timeDrum:hover{background:var(--wb-wash)}
.wb_ix_timeDrum:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px;background:var(--wb-wash)}
.wb_ix_timeDrum::before,.wb_ix_timeDrum::after{content:"";position:absolute;left:5px;right:5px;height:1px;background:var(--wb-line-faint);pointer-events:none}
.wb_ix_timeDrum::before{top:15px}
.wb_ix_timeDrum::after{bottom:15px}
.wb_ix_timeTrack{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:48px;will-change:transform}
.wb_ix_timeGhost{font:400 11px/14px var(--wb-mono);color:var(--wb-ink-3);opacity:.45;font-variant-numeric:tabular-nums;pointer-events:none;transition:opacity .16s ease}
.wb_ix_timeDrum:hover .wb_ix_timeGhost,.wb_ix_timeDrum:focus-visible .wb_ix_timeGhost{opacity:.8}
.wb_ix_timeValue{position:relative;z-index:1;font:500 16px/20px var(--wb-mono);letter-spacing:.04em;color:var(--wb-ink);font-variant-numeric:tabular-nums}
.wb_ix_timeTrack[data-roll="down"]{animation:wb_ix_timeReelDown .2s cubic-bezier(.2,.9,.3,1.08) both}
.wb_ix_timeTrack[data-roll="up"]{animation:wb_ix_timeReelUp .2s cubic-bezier(.2,.9,.3,1.08) both}
.wb_ix_timeColon{display:flex;align-items:center;justify-content:center;width:12px;border-left:1px solid var(--wb-line-faint);border-right:1px solid var(--wb-line-faint);background:var(--wb-today);font:500 16px/1 var(--wb-mono);color:var(--wb-ink-3)}
@keyframes wb_ix_timeReelDown{0%{transform:translateY(17px)}70%{transform:translateY(-1px)}100%{transform:translateY(0)}}
@keyframes wb_ix_timeReelUp{0%{transform:translateY(-17px)}70%{transform:translateY(1px)}100%{transform:translateY(0)}}
.wb_ix_calFoot{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid var(--wb-line)}
.wb_ix_calTools{display:flex;gap:4px}
.wb_ix_calTool,.wb_ix_calConfirm{height:25px;padding:0 8px;border:1px solid var(--wb-line);background:transparent;color:var(--wb-ink-2);font:500 11px/1 var(--wb-text);cursor:pointer}
.wb_ix_calTool:hover{border-color:var(--wb-accent);color:var(--wb-accent)}
.wb_ix_calConfirm{background:var(--wb-active-bg);border-color:var(--wb-active-bg);color:var(--wb-active-ink);font-weight:600}
.wb_ix_calConfirm:hover{background:var(--wb-accent);border-color:var(--wb-accent);color:var(--wb-windowInk)}

/* notes index */
.wb_ix_nav{background:var(--wb-today);border-right:1px solid var(--wb-line);display:flex;flex-direction:column;min-height:0;overflow:hidden}
.wb_ix_tabs{height:45px;min-height:45px;display:flex;border-bottom:1px solid var(--wb-line)}
.wb_ix_tab{flex:1;border:0;background:transparent;color:var(--wb-ink-3);font:400 11px/1 var(--wb-text);display:flex;align-items:center;justify-content:center;gap:7px;border-bottom:2px solid transparent;cursor:pointer}
.wb_ix_tab b{font:500 11px/1 var(--wb-mono);color:var(--wb-ink-3)}
.wb_ix_tab:hover{color:var(--wb-ink)}
.wb_ix_tab:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}
.wb_ix_tab[data-active="true"]{color:var(--wb-ink);border-bottom-color:var(--wb-accent)}
.wb_ix_tab[data-active="true"] b{color:var(--wb-accent)}
.wb_ix_searchState{padding:10px 16px 0;margin:0;font:400 11px/1 var(--wb-mono);letter-spacing:.12em;color:var(--wb-ink-3)}
.wb_ix_notice{margin:0 0 8px}
.wb_ix_noteList{flex:1;min-height:0;overflow:auto;scrollbar-width:thin;scrollbar-color:var(--wb-line-soft) transparent}
.wb_ix_noteItem{display:block;border-bottom:1px solid var(--wb-line-faint);background:transparent}
.wb_ix_noteItem:hover{background:var(--wb-wash)}
.wb_ix_noteItem[data-selected="true"]{background:var(--wb-active-bg)}
.wb_ix_noteItem[data-selected="true"] .wb_slipNo,.wb_ix_noteItem[data-selected="true"] .wb_slipTitle,.wb_ix_noteItem[data-selected="true"] .wb_slipBody,.wb_ix_noteItem[data-selected="true"] .wb_slipFoot,.wb_ix_noteItem[data-selected="true"] .wb_tag,.wb_ix_noteItem[data-selected="true"] .wb_slipKind{color:var(--wb-active-dim)}
.wb_ix_noteItem .wb_slipMain{display:grid;grid-template-columns:26px minmax(0,1fr) auto;grid-template-rows:auto auto auto;gap:3px 10px;width:100%;min-height:0;padding:11px 16px 10px;border:0;background:transparent;color:inherit;text-align:left;font:inherit;cursor:pointer}
.wb_ix_noteItem .wb_slipMain:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}
.wb_ix_noteItem .wb_slipNo{grid-column:1;grid-row:1;font:400 11px/1.4 var(--wb-mono);color:var(--wb-ink-3);font-variant-numeric:tabular-nums}
.wb_ix_noteItem .wb_slipTitleWrap{grid-column:2;grid-row:1;display:flex;align-items:baseline;gap:6px;min-width:0}
.wb_ix_noteItem .wb_slipTitle{flex:1;min-width:0;font-size:12px;line-height:1.45;font-weight:600;color:var(--wb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_ix_noteItem .wb_slipKind{flex:none;font:400 11px/1 var(--wb-mono);letter-spacing:.08em;color:var(--wb-ink-3);border:1px solid var(--wb-line);padding:3px 4px}
.wb_ix_noteItem .wb_slipBody{grid-column:2 / -1;grid-row:2;display:-webkit-box;max-height:52px;font-size:11px;line-height:1.55;color:var(--wb-ink-3);white-space:normal;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:3}
.wb_ix_noteItem .wb_tags{grid-column:2;grid-row:3;display:flex;flex-wrap:wrap;gap:6px;min-width:0;margin-top:2px}
.wb_ix_noteItem .wb_tag{font:400 11px/1.4 var(--wb-mono);color:var(--wb-ink-3);max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wb_ix_noteItem .wb_tag::before{content:"#";color:var(--wb-accent);margin-right:1px}
.wb_ix_noteItem .wb_slipFoot{grid-column:3;grid-row:3;align-self:end;font:400 11px/1.4 var(--wb-mono);color:var(--wb-ink-3);font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}
.wb_ix_noteItem .wb_pin{color:var(--wb-accent);display:inline-flex;align-items:center;padding-top:1px}
.wb_ix_navFoot{flex:none;height:34px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 16px;border-top:1px solid var(--wb-line);font:400 11px/1 var(--wb-mono);letter-spacing:.06em;color:var(--wb-ink-3)}

/* reader */
.wb_ix_reader{min-width:0;min-height:0;padding:28px 52px 20px;display:flex;flex-direction:column;background:var(--wb-ground);position:relative;overflow:auto;scrollbar-width:thin;scrollbar-color:var(--wb-line-soft) transparent}
.wb_ix_readerLayout{display:grid;grid-template-columns:minmax(0,1fr) 232px;gap:38px;flex:1;min-height:0;position:relative;z-index:1}
.wb_ix_readerBody,.wb_ix_emptyReader{display:flex;flex-direction:column;min-height:100%;position:relative;z-index:1}
.wb_ix_readerTop{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:10px;border-bottom:1px solid var(--wb-line)}
.wb_ix_readerTop span{font:400 11px/1 var(--wb-mono);letter-spacing:.16em;color:var(--wb-ink-3)}
.wb_ix_readerTop b{font:400 11px/1 var(--wb-mono);letter-spacing:.1em;color:var(--wb-accent)}
.wb_ix_readerTitle{margin:46px 0 8px;font-size:38px;font-weight:600;line-height:1.3;letter-spacing:-.035em;max-width:16em}
.wb_ix_readerMeta{font:400 11px/1 var(--wb-mono);letter-spacing:.06em;color:var(--wb-ink-3)}
.wb_ix_readerText{margin:24px 0 0;max-width:52em;font-size:14px;line-height:2.05;color:var(--wb-ink-2);white-space:pre-wrap;overflow-wrap:anywhere}
.wb_ix_readerAside{border-left:1px solid var(--wb-line);padding-left:22px;display:flex;flex-direction:column;gap:22px;min-width:0}
.wb_ix_asideBlock h3{margin:0 0 8px;font:400 11px/1 var(--wb-mono);letter-spacing:.14em;color:var(--wb-ink-3)}
.wb_ix_asideRow{display:grid;grid-template-columns:58px minmax(0,1fr);gap:8px;padding:7px 0;border-bottom:1px solid var(--wb-line-faint);font-size:11px}
.wb_ix_asideRow span{font:400 11px/1.4 var(--wb-mono);letter-spacing:.08em;color:var(--wb-ink-3)}
.wb_ix_asideRow b{font-weight:500;color:var(--wb-ink);overflow-wrap:anywhere}
.wb_ix_asideTags{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}
.wb_ix_asideTags span{font:400 11px/1 var(--wb-mono);letter-spacing:.04em;color:var(--wb-ink-3);border:1px solid var(--wb-line);padding:4px 6px}
.wb_ix_asideEmpty{margin:8px 0 0;font-size:11px;line-height:1.6;color:var(--wb-ink-3)}
.wb_ix_relatedItem{display:flex;flex-direction:column;gap:3px;width:100%;padding:8px 0;border:0;border-bottom:1px solid var(--wb-line-faint);background:transparent;color:var(--wb-ink);text-align:left;cursor:pointer}
.wb_ix_relatedItem:hover .wb_ix_relatedTitle{color:var(--wb-accent)}
.wb_ix_relatedItem:focus-visible{outline:2px solid var(--wb-focus);outline-offset:1px}
.wb_ix_relatedTitle{font-size:11px;font-weight:500;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wb_ix_relatedMeta{font:400 11px/1 var(--wb-mono);letter-spacing:.08em;color:var(--wb-ink-3)}
.wb_ix_asideRelated{margin-top:2px}
.wb_ix_readerFoot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:14px;padding-top:16px;border-top:1px solid var(--wb-line)}
.wb_ix_readerFoot > span{font:400 11px/1.4 var(--wb-mono);letter-spacing:.06em;color:var(--wb-ink-3)}
.wb_ix_readerActions{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}
.wb_ix_readerActions .wb_btn{height:29px;padding:0 9px;font-size:11px}
.wb_ix_readerActions .wb_btn[data-variant="primary"]{background:var(--wb-active-bg);border-color:var(--wb-active-bg);color:var(--wb-active-ink)}
.wb_ix_readerActions .wb_btn[data-variant="primary"]:hover{background:var(--wb-accent);border-color:var(--wb-accent);color:var(--wb-windowInk)}
.wb_ix_readerEditor{display:flex;flex-direction:column;height:100%;min-height:0}
.wb_ix_readerEditor .wb_editor{margin:0;min-height:100%;background:var(--wb-today);padding:16px 18px 18px;border:1px solid var(--wb-line);border-top:2px solid var(--wb-accent)}
.wb_ix_readerEditor .wb_area{min-height:260px}
.wb_ix_readerEditor .wb_fields{grid-template-columns:minmax(0,1fr)}
.wb_ix_emptyReader h2{margin:30px 0 6px;font-size:32px;font-weight:600;line-height:1.3;max-width:10em}
.wb_ix_emptyReader p{margin:0;font-size:12px;line-height:1.9;color:var(--wb-ink-3);max-width:30em}
.wb_ix_emptyActions{display:flex;gap:8px;margin-top:18px}

/* shared surfaces */
.wb_vBack{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border:1px solid var(--wb-line);border-radius:0;background:transparent;color:var(--wb-ink-2);cursor:pointer;flex:none}
.wb_vBack:hover{border-color:var(--wb-accent);color:var(--wb-accent)}
.wb_vBack:focus-visible{outline:2px solid var(--wb-focus);outline-offset:2px}
.wb_slip{display:block}
.wb_slipMain{display:flex;flex-direction:column;min-width:0}

/* ── settings: the imprint ──────────────────────────────────────────────── */
.wb_sSection{position:relative;isolation:isolate;display:flex;flex-direction:column;width:100%;max-width:none;min-width:0;padding:0;border:0;overflow:hidden;
  background:var(--wb-ground);color:var(--wb-ink);font:400 12.5px/1.55 var(--wb-text);container-type:inline-size}
.wb_sMasthead{position:relative;z-index:1;display:flex;flex-direction:column;min-width:0;padding:15px 24px 12px;border-bottom:1px solid var(--wb-line)}
.wb_sBand{display:flex;align-items:flex-start;gap:14px;min-height:0;padding:0}
.wb_sBrand{display:flex;align-items:center;gap:10px;min-width:0;color:var(--wb-ink)}
.wb_sBrand svg{color:var(--wb-accent)}
.wb_sBrandText{display:flex;flex-direction:column;gap:2px;min-width:0}
.wb_sBrandText b{font:600 18px/1.05 var(--wb-display);letter-spacing:.05em}
.wb_sBrandText span{font:400 10px/1.3 var(--wb-mono);letter-spacing:.14em;color:var(--wb-ink-3);white-space:nowrap}
.wb_sBandRight{display:flex;align-items:center;gap:12px;min-width:0;margin-left:auto;padding-top:2px}
.wb_sNote{color:var(--wb-ok);font:600 11px/1 var(--wb-mono);letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;border:1px solid var(--wb-ok);padding:3px 6px}
.wb_sIntro{margin:8px 0 0;max-width:72ch;color:var(--wb-ink-3);font:400 11px/1.65 var(--wb-text)}
.wb_sError{margin:8px 0 0;color:var(--wb-hot);font:500 11px/1.7 var(--wb-text);overflow-wrap:anywhere}
.wb_sHint{margin:0;color:var(--wb-ink-3);font:400 11px/1.65 var(--wb-text);overflow-wrap:anywhere}
.wb_sIndex{display:flex;align-items:stretch;gap:0;min-width:0;margin-top:12px;border-top:1px solid var(--wb-line-faint);border-bottom:1px solid var(--wb-line)}
.wb_sIndexItem{box-sizing:border-box;display:flex;flex:1 1 0;align-items:baseline;gap:8px;min-width:0;padding:12px 10px 10px;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:var(--wb-ink-3);font:500 13px/1.2 var(--wb-text);text-align:left;cursor:pointer}
.wb_sIndexItem + .wb_sIndexItem{border-left:1px solid var(--wb-line-faint)}
.wb_sIndexItem:hover{color:var(--wb-ink)}
.wb_sIndexItem:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}
.wb_sIndexItem[data-active="true"]{color:var(--wb-ink);border-bottom-color:var(--wb-accent)}
.wb_sIndexNo{flex:none;color:var(--wb-accent);font:500 11px/1 var(--wb-mono);letter-spacing:.04em}
.wb_sIndexName{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_sIndexMeta{margin-left:auto;min-width:0;color:var(--wb-ink-3);font:400 11px/1 var(--wb-mono);letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_sLedger{position:relative;z-index:1;display:block;min-width:0;max-width:760px;padding:16px 24px 34px}
.wb_sChapter{display:flex;flex-direction:column;min-width:0;margin:0;padding:0}
.wb_sChapterHead{display:flex;align-items:baseline;gap:8px;min-width:0;padding:0 0 6px;border-bottom:1px solid var(--wb-line)}
.wb_sChapterHead::before{content:"CH-" attr(data-no);color:var(--wb-accent);font:600 11px/1.2 var(--wb-mono);letter-spacing:.04em;white-space:nowrap}
.wb_sChapterHead::after{content:"";flex:1;min-width:10px;height:1px;margin-left:2px;background:var(--wb-line-faint)}
.wb_sChapterTitle{margin:0;font:600 14px/20px var(--wb-text);letter-spacing:.03em;color:var(--wb-ink);white-space:nowrap}
.wb_sChapterHint{margin:7px 0 0;max-width:62ch;color:var(--wb-ink-3);font:400 11px/1.65 var(--wb-text);overflow-wrap:anywhere}
.wb_sChapterBody{display:flex;flex-direction:column;min-width:0;padding-top:10px}
.wb_sScope{box-sizing:border-box;display:flex;align-items:baseline;gap:10px;margin:0 0 14px;padding:0;color:var(--wb-ink-2);font:500 11px/1.65 var(--wb-text);overflow-wrap:anywhere}
.wb_sScopeLabel{flex:none;font:500 9px/1.4 var(--wb-mono);letter-spacing:.1em;color:var(--wb-ink-3);text-transform:uppercase}
.wb_sScopeText{min-width:0;overflow-wrap:anywhere}
.wb_sNamePair{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:10px;flex:1;min-width:0}
.wb_sNameField{display:flex;flex-direction:column;gap:2px;min-width:0}
.wb_sNameField > span{font:500 11px/1 var(--wb-mono);letter-spacing:.04em;color:var(--wb-ink-3);white-space:nowrap}
.wb_sNameField .wb_sInput{height:24px;font-size:12px}
.wb_sChevron{position:absolute;right:11px;top:24px;width:6px;height:6px;border-right:1px solid var(--wb-ink-3);border-bottom:1px solid var(--wb-ink-3);transform:rotate(45deg);pointer-events:none}
.wb_sLibrary{margin-top:13px;padding-top:8px;border-top:1px solid var(--wb-line-faint)}
.wb_sLibraryTitle{margin:0 0 3px;font:500 11px/1.4 var(--wb-mono);letter-spacing:.05em;color:var(--wb-ink-3)}
.wb_sLibraryRow{padding-left:2px}
.wb_sRowActions{display:flex;align-items:center;gap:1px;flex:none}
.wb_sRowActions .wb_sIcon{width:23px;height:23px}
.wb_sPick{position:relative;min-width:0}
.wb_sPickMenu{position:fixed;z-index:1400;max-height:280px;overflow:auto;padding:4px;background:var(--wb-today);border:1px solid var(--wb-line);box-shadow:0 18px 40px -20px rgba(0,0,0,.55);color:var(--wb-ink)}
.wb_sPickRow{display:grid;grid-template-columns:12px minmax(0,1fr);gap:8px;align-items:start;width:100%;padding:7px 8px;border:0;background:transparent;color:var(--wb-ink);text-align:left;cursor:pointer}
.wb_sPickRow:hover{background:var(--wb-wash);color:var(--wb-accent)}
.wb_sPickRow[aria-selected="true"]{background:var(--wb-wash)}
.wb_sPickRow:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}
.wb_sPickCheck{display:inline-flex;justify-content:center;padding-top:1px;color:var(--wb-accent)}
.wb_sPickText{display:flex;flex-direction:column;gap:1px;min-width:0}
.wb_sPickName{font:500 11px/1.35 var(--wb-text)}
.wb_sPickDesc{min-width:0;color:var(--wb-ink-3);font:400 11px/1.4 var(--wb-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wb_sSub{display:grid;grid-template-columns:116px minmax(0,1fr);min-width:0;margin:0;padding:0;border-top:1px solid var(--wb-line-faint)}
.wb_sSub:first-of-type{border-top:0}
.wb_sSubRail{position:relative;display:flex;flex-direction:column;align-items:flex-start;min-width:0;padding:16px 16px 16px 0;border-right:1px solid var(--wb-line-faint)}
.wb_sSubRailText{display:flex;flex-direction:column;gap:5px;min-width:0}
.wb_sSubTitleRow{display:flex;align-items:flex-start;gap:4px;min-width:0}
.wb_sSubTitle{margin:0;font:600 13px/18px var(--wb-text);letter-spacing:0;color:var(--wb-ink);white-space:nowrap}
.wb_sSubCode{font:500 9px/1 var(--wb-mono);letter-spacing:.12em;color:var(--wb-ink-3);text-transform:uppercase;white-space:nowrap}
.wb_sInfoBtn{position:relative;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--wb-ink-3);cursor:help}
.wb_sInfoBtn:hover,.wb_sInfoBtn:focus-visible{color:var(--wb-accent)}
.wb_sInfoBtn:focus-visible{outline:1px solid var(--wb-focus);outline-offset:2px}
.wb_sInfoBtn::after{content:attr(data-tip);position:absolute;z-index:40;left:0;top:calc(100% + 8px);width:248px;padding:8px 10px;border:1px solid var(--wb-line);background:var(--wb-today);box-shadow:0 12px 28px -18px rgba(0,0,0,.65);color:var(--wb-ink-2);font:400 10.5px/1.55 var(--wb-text);text-align:left;white-space:normal;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s,visibility .12s}
.wb_sInfoBtn:hover::after,.wb_sInfoBtn:focus-visible::after{opacity:1;visibility:visible}
.wb_sSubBody{display:flex;flex-direction:column;min-width:0;padding:12px 0 16px 18px}
.wb_sSubHead{display:flex;align-items:flex-start;justify-content:flex-end;gap:10px;min-width:0;min-height:24px}
.wb_sSubPanel{display:flex;flex-direction:column;min-width:0;margin-top:0}
.wb_sActions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex:none;color:var(--wb-ink)}
.wb_cfgPathField{box-sizing:border-box;display:flex;align-items:center;gap:8px;min-height:36px;padding:0 10px;border:1px solid var(--wb-line-soft);color:var(--wb-ink)}
.wb_cfgPathIcon{display:inline-flex;align-items:center;justify-content:center;flex:none;color:var(--wb-ink-3)}
.wb_cfgPathInput{box-sizing:border-box;flex:1;min-width:0;height:34px;padding:0;border:0;background:transparent;color:var(--wb-ink);font:400 12px/20px var(--wb-text);caret-color:var(--wb-accent)}
.wb_cfgPathInput::placeholder{color:var(--wb-ink-3)}
.wb_cfgPathInput:focus-visible{outline:none}
.wb_cfgPathField:focus-within{border-color:var(--wb-accent);box-shadow:0 1px 0 var(--wb-accent)}
.wb_cfgPathFoot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:7px}
.wb_cfgPromptPlate{box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;min-height:62px;padding:9px 30px 9px 10px;border:1px solid var(--wb-line-soft);border-radius:0;background:var(--wb-ground);color:var(--wb-ink);text-align:left;cursor:pointer}
.wb_cfgPromptPlate:hover{border-color:var(--wb-line)}
.wb_cfgPromptPlate:focus-visible{outline:2px solid var(--wb-focus);outline-offset:2px;border-color:var(--wb-accent)}
.wb_cfgPromptGlyph{display:inline-flex;align-items:center;justify-content:center;flex:none;width:24px;height:30px;border-right:1px solid var(--wb-line-faint);color:var(--wb-ink-2)}
.wb_cfgPromptText{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.wb_cfgPromptName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 14px/1.5 var(--wb-text);color:var(--wb-ink)}
.wb_cfgPromptNote{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--wb-ink-3);font:400 10px/1.4 var(--wb-text)}
.wb_cfgSkillShelf{display:flex;flex-wrap:wrap;gap:6px;min-height:34px;align-items:flex-start;align-content:flex-start}
.wb_cfgSkillEmpty{display:inline-flex;align-items:center;min-height:30px;padding:0 10px;border:1px dashed var(--wb-line);color:var(--wb-ink-3);font:400 11px/1.4 var(--wb-text)}
.wb_cfgSkillChip{display:inline-flex;align-items:center;gap:6px;min-height:28px;padding:0 8px;border:1px solid var(--wb-line-soft);border-radius:0;background:transparent;color:var(--wb-ink-2);font:500 10px/1.3 var(--wb-text);cursor:pointer}
.wb_cfgSkillChip:hover{border-color:var(--wb-accent);color:var(--wb-ink)}
.wb_cfgSkillChip:focus-visible{outline:2px solid var(--wb-focus);outline-offset:2px}
.wb_cfgSkillChipName{max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wb_cfgSkillX{color:var(--wb-ink-3);font:400 13px/1 var(--wb-mono)}
.wb_cfgSkillTrigger{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;margin-top:9px}
.wb_cfgSkillTrigger.wb_sPickTrigger{padding-right:9px}
.wb_sBtn{height:28px;padding:0 9px;font-size:11px}
.wb_sModeRow{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:2px 0 4px}
.wb_sMode{box-sizing:border-box;display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-height:54px;padding:7px 8px;border:1px solid var(--wb-line-soft);border-radius:0;background:transparent;color:var(--wb-ink-2);text-align:left;cursor:pointer}
.wb_sMode:hover{border-color:var(--wb-accent);color:var(--wb-ink)}
.wb_sMode:focus-visible{outline:2px solid var(--wb-focus);outline-offset:2px}
.wb_sMode[data-active="true"]{border-color:var(--wb-accent);background:var(--wb-fill);color:var(--wb-ink)}
.wb_sModeLabel{font:600 11px/16px var(--wb-text)}
.wb_sModeDesc{font:400 10px/14px var(--wb-mono);color:var(--wb-ink-3)}
.wb_sIcon{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;flex:none;width:25px;height:25px;padding:0;border:1px solid transparent;border-radius:0;background:transparent;color:var(--wb-ink-3);cursor:pointer}
.wb_sIcon:hover{border-color:var(--wb-line-soft);color:var(--wb-ink)}
.wb_sIcon:focus-visible{outline:2px solid var(--wb-focus)}
.wb_sIcon:disabled{color:var(--wb-ink-3);cursor:default}
.wb_sIconBordered{border-color:var(--wb-line-soft)}
.wb_sInput{box-sizing:border-box;width:100%;min-width:0;height:30px;padding:3px 1px;border:0;border-bottom:1px solid var(--wb-line-soft);border-radius:0;background:transparent;color:var(--wb-ink);font:400 12px/20px var(--wb-text);caret-color:var(--wb-accent)}
.wb_sInput::placeholder{color:var(--wb-ink-3)}
.wb_sInput:hover{border-color:var(--wb-line)}
.wb_sInput:focus-visible{outline:none;border-color:var(--wb-accent);box-shadow:0 1px 0 var(--wb-accent)}
.wb_sInput[aria-invalid="true"]{border-color:var(--wb-hot)}
.wb_sArea{box-sizing:border-box;width:100%;min-width:0;min-height:74px;resize:vertical;padding:7px 8px;border:1px solid var(--wb-line-soft);border-radius:0;background:color-mix(in srgb,var(--wb-ground) 72%,transparent);color:var(--wb-ink);font:400 11px/19px var(--wb-text);caret-color:var(--wb-accent)}
.wb_sArea::placeholder{color:var(--wb-ink-3)}
.wb_sArea:focus-visible{outline:none;border-color:var(--wb-accent);box-shadow:inset 0 0 0 1px var(--wb-accent)}
.wb_sEditor{display:flex;flex-direction:column;gap:6px;min-width:0;padding:6px 0 8px}
.wb_sRow{position:relative;box-sizing:border-box;display:flex;align-items:center;gap:5px;min-width:0;min-height:34px;padding:2px 4px;border-bottom:1px solid var(--wb-line-faint);border-radius:0}
.wb_sRow:hover{background:var(--wb-wash)}
.wb_sRow[data-active="true"]{background:var(--wb-fill)}
.wb_sRow[data-active="true"]::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--wb-accent)}
.wb_sRow[draggable="true"]{cursor:grab}
.wb_sRow[data-dragging="true"]{opacity:.6}
.wb_sRow[data-drop="true"]{box-shadow:inset 0 1px 0 0 var(--wb-accent)}
.wb_sRowPick{display:flex;flex:1;align-items:center;gap:8px;min-width:0;min-height:29px;padding:0 4px 0 7px;border:0;border-radius:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.wb_sRowPick:focus-visible{outline:2px solid var(--wb-focus);outline-offset:2px}
.wb_sRowText{display:flex;flex:1;flex-direction:column;gap:0;min-width:0}
.wb_sRowName{font-size:11.5px;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_sRowHint{color:var(--wb-ink-3);font:400 11px/16px var(--wb-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_sGrid{display:flex;flex-direction:column;margin:2px 0 0;padding:0;list-style:none;border-top:1px solid var(--wb-line-soft)}
.wb_sCell{display:flex;min-width:0}
.wb_sCell[draggable="true"]{cursor:grab}
.wb_sCell[data-dragging="true"]{opacity:.42}
.wb_sCell[data-drop="true"] .wb_sCard{box-shadow:inset 0 1px 0 0 var(--wb-accent)}
.wb_sCard{position:relative;box-sizing:border-box;display:flex;flex:1;flex-direction:column;min-width:0;border:0;border-bottom:1px solid var(--wb-line-faint);border-radius:0;background:transparent}
.wb_sCard:hover{background:var(--wb-wash)}
.wb_sCard[data-active="true"]{background:var(--wb-fill)}
.wb_sCard[data-active="true"]::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--wb-accent)}
.wb_sCardMain{box-sizing:border-box;display:flex;flex:1;align-items:center;gap:10px;min-width:0;min-height:41px;padding:0 8px 0 14px;cursor:pointer}
.wb_sCardMain:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}
.wb_sCardMain .wb_sInput{flex:1;height:24px}
.wb_sCardSwatch{flex:none;width:7px;height:7px;opacity:.9}
.wb_sCardNum{flex:none;width:26px;color:var(--wb-accent);font:500 11px/1 var(--wb-mono);letter-spacing:.03em;font-variant-numeric:tabular-nums}
.wb_sCardText{display:flex;flex:1;align-items:baseline;gap:10px;min-width:0}
.wb_sCardName{font:500 12px/20px var(--wb-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_sCardMeta{color:var(--wb-ink-3);font:400 11px/1 var(--wb-mono);letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.wb_sCardState{flex:none;margin-left:auto;color:var(--wb-accent);font:400 11px/1 var(--wb-mono);letter-spacing:.04em;white-space:nowrap}
.wb_sCardFoot{display:flex;flex-wrap:wrap;gap:6px;padding:0 8px 9px 50px}
.wb_sChip{box-sizing:border-box;display:inline-flex;align-items:center;gap:4px;max-width:100%;min-height:22px;padding:0 6px;border:1px solid var(--wb-line-soft);border-radius:0;background:transparent;color:var(--wb-ink-2);font:500 11px/1 var(--wb-mono);cursor:pointer}
.wb_sChip:hover{border-color:var(--wb-accent);color:var(--wb-ink)}
.wb_sChip:focus-visible{outline:2px solid var(--wb-focus);outline-offset:2px}
.wb_sChip[data-active="true"]{border-color:var(--wb-accent);color:var(--wb-accent);background:var(--wb-fill)}
.wb_sChip[data-dragging="true"]{opacity:.42}
.wb_sChip[data-drop="true"]{box-shadow:inset 0 1px 0 0 var(--wb-accent)}
.wb_sChipName{max-width:168px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_sChipEditing{display:flex;flex:1 1 100%;padding:0}
.wb_sChipEditing .wb_sInput{height:22px;font-size:11px}
.wb_sCreator{box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:34px;margin-top:7px;border:1px dashed var(--wb-line-soft);border-radius:0;background:transparent;color:var(--wb-ink-2);font:500 11px/1 var(--wb-text);letter-spacing:.02em;cursor:pointer}
.wb_sCreator:hover{border-color:var(--wb-accent);color:var(--wb-accent);background:var(--wb-wash)}
.wb_sCreator:focus-visible{outline:2px solid var(--wb-focus);outline-offset:-2px}

/* ── today panel inside the drawer ──────────────────────────────────────── */
.wb_today{display:flex;flex-direction:column;min-width:0;min-height:0;color:var(--wb-ink)}
.wb_t9 p{margin:0}
.wb_t9 h2,.wb_t9 h3{margin:0}
.wb_t9 ul{margin:0;padding:0;list-style:none}
.wb_t9_top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex:none}
.wb_t9_top h2{font:500 22px/1 var(--wb-display);letter-spacing:.01em;color:var(--wb-ink)}
.wb_t9_meta{font:400 11px/1.5 var(--wb-mono);letter-spacing:.05em;color:var(--wb-ink-3);text-align:right;white-space:nowrap}
.wb_t9_meta b{display:block;font:500 12px/1 var(--wb-mono);letter-spacing:.01em;color:var(--wb-ink-2)}
.wb_t9_dateline{display:flex;align-items:baseline;gap:9px;margin-top:12px;padding:9px 0 7px;border-top:1px solid var(--wb-line);border-bottom:1px solid var(--wb-line);flex:none}
.wb_t9_day{font:500 42px/.95 var(--wb-display);letter-spacing:-.05em;color:var(--wb-ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.wb_t9_mw{display:flex;align-items:baseline;padding-bottom:5px;white-space:nowrap}
.wb_t9_mw span{font:500 13px/1.3 var(--wb-text);letter-spacing:.02em;color:var(--wb-ink-3)}
.wb_t9_mw b{font:500 13px/1.3 var(--wb-text);letter-spacing:.02em;color:var(--wb-ink-2)}
.wb_t9_doy{margin-left:auto;font:400 11px/1.4 var(--wb-mono);color:var(--wb-ink-3);text-align:right;white-space:nowrap}
.wb_t9_yearbar{height:1px;margin-top:12px;background:var(--wb-line);opacity:1;position:relative;flex:none}
.wb_t9_yearbar i{position:absolute;left:0;top:0;bottom:0;background:var(--wb-ink-2);opacity:.55}
.wb_t9_week{position:relative;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));margin-top:10px;flex:none}
.wb_t9_week::before,.wb_t9_week::after{content:"";position:absolute;left:0;right:-18px;height:1px;background:var(--wb-line);pointer-events:none}
.wb_t9_week::before{top:0}
.wb_t9_week::after{bottom:0}
.wb_t9_wday{position:relative;isolation:isolate;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;padding:8px 0 7px}
.wb_t9_wday[data-today="true"]::before{content:"";position:absolute;z-index:0;left:50%;top:0;bottom:0;width:30px;background:var(--wb-active-bg);transform:translateX(-50%)}
.wb_t9_wdname{position:relative;z-index:1;font:500 11px/1 var(--wb-type-cjk);letter-spacing:.04em;color:var(--wb-ink-3);white-space:nowrap}
.wb_t9_wdnum{position:relative;z-index:1;font:500 12px/1 var(--wb-mono);letter-spacing:.01em;color:var(--wb-ink-2);font-variant-numeric:tabular-nums}
.wb_t9_wday[data-today="true"] .wb_t9_wdname{color:var(--wb-active-ink);font-weight:500}
.wb_t9_wday[data-today="true"] .wb_t9_wdnum{color:var(--wb-active-ink);font-weight:600}
.wb_t9_sec{margin-top:12px;flex:none}
.wb_t9_week + .wb_t9_sec{margin-top:20px}
.wb_t9_sechead{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding-bottom:4px;border-bottom:1px solid var(--wb-line)}
.wb_t9_sechead h3{font:600 11px/1.3 var(--wb-type-cjk);letter-spacing:.07em;color:var(--wb-ink-2);white-space:nowrap}
.wb_t9_sechead span{font:400 11px/1.3 var(--wb-mono);color:var(--wb-ink-3);white-space:nowrap;font-variant-numeric:tabular-nums}
.wb_t9_list{flex:none;display:flex;flex-direction:column;min-height:0}
.wb_t9_taskRow{display:grid;grid-template-columns:15px minmax(0,1fr) auto;gap:8px;align-items:center;min-height:44px;border-bottom:1px solid var(--wb-line-faint)}
.wb_t9_taskRow:last-child{border-bottom:0}
.wb_t9_tick{width:14px;height:14px;display:grid;place-items:center;padding:0;border:1px solid var(--wb-line-soft);border-radius:0;background:transparent;color:var(--wb-active-ink);cursor:pointer}
.wb_t9_tick:focus-visible,.wb_t9_task:focus-visible,.wb_t9_rowline:focus-visible{outline:2px solid var(--wb-focus);outline-offset:2px}
.wb_t9_tick svg{display:block}
.wb_t9_task{min-width:0;padding:0;border:0;background:transparent;text-align:left;cursor:pointer;color:inherit}
.wb_t9_task b{display:block;font:500 14px/1.4 var(--wb-text);color:var(--wb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_t9_taskRow[data-late="true"] .wb_t9_task b{color:var(--wb-hot);font-weight:600}
.wb_t9_taskRow[data-today="true"] .wb_t9_task b{color:var(--wb-warn)}
.wb_t9_stamp{font:400 11px/1.3 var(--wb-mono);letter-spacing:.02em;color:var(--wb-ink-3);white-space:nowrap}
.wb_t9_taskRow[data-late="true"] .wb_t9_stamp{color:var(--wb-hot)}
.wb_t9_taskRow[data-today="true"] .wb_t9_stamp{color:var(--wb-warn)}
.wb_t9_rowline{display:grid;grid-template-columns:54px minmax(0,1fr);gap:8px;align-items:baseline;width:100%;padding:5px 0;border:0;border-bottom:1px solid var(--wb-line-faint);background:transparent;text-align:left;cursor:pointer;font:inherit;color:inherit}
.wb_t9_rowline:last-child{border-bottom:0}
.wb_t9_rowline time{font:400 11px/1.4 var(--wb-mono);color:var(--wb-ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_t9_rowline span{font:400 12px/1.4 var(--wb-text);color:var(--wb-ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_t9_rowline:hover span{color:var(--wb-accent)}
.wb_t9_quiet{padding:6px 0;font:400 11px/1.7 var(--wb-text);color:var(--wb-ink-3)}
.wb_t9_tail{margin-top:auto;padding-top:10px;border-top:1px solid var(--wb-line);display:flex;flex-direction:column;gap:8px;flex:none}
.wb_t9_ledger{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--wb-line-faint)}
.wb_t9_ledger div{min-width:0;padding:5px 0 0 8px;border-left:1px solid var(--wb-line-faint)}
.wb_t9_ledger div:first-child{padding-left:0;border-left:0}
.wb_t9_ledger b{display:block;font:500 16px/1 var(--wb-mono);letter-spacing:-.02em;color:var(--wb-ink);font-variant-numeric:tabular-nums}
.wb_t9_ledger div.done b:not([data-zero="true"]){color:var(--wb-ok)}
.wb_t9_ledger b[data-zero="true"]{color:var(--wb-ink-3)}
.wb_t9_ledger span{display:block;margin-top:3px;font:500 11px/1.2 var(--wb-type-cjk);color:var(--wb-ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb_t9_note{font:400 11px/1.5 var(--wb-text);color:var(--wb-ink-3)}
.wb_t9_permission{flex:none}
.wb_t9_permission .wb_btn{width:100%;justify-content:flex-start;border-color:transparent;color:var(--wb-ink-3);font-size:11px;height:26px;padding:0}
.wb_t9_permission .wb_btn:hover{background:transparent;color:var(--wb-ink);border-color:transparent}

/* ── motion ──────────────────────────────────────────────────────────────── */
@keyframes wb_sh_pageIn{from{opacity:.92;transform:translate3d(8px,2px,0)}to{opacity:1;transform:none}}
@keyframes wb_sh_coverIn{from{opacity:0;transform:rotate(-4.2deg) rotateY(-5deg) translateY(10px)}to{opacity:1;transform:rotate(-2.4deg)}}
@keyframes wb_sh_coverWrapIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes wb_sh_slide{from{transform:translateX(28px);opacity:.4}to{transform:none;opacity:1}}
@keyframes wb_sh_fade{from{opacity:0}to{opacity:1}}
@keyframes wb_sh_spineIn{from{opacity:0;filter:blur(2px)}to{opacity:1;filter:blur(0)}}
.wb_sh_spine{animation:wb_sh_spineIn .48s cubic-bezier(.16,1,.3,1) backwards}
.wb_sh_spine:nth-child(2){animation-delay:.035s}
.wb_sh_spine:nth-child(3){animation-delay:.07s}
.wb_sh_spine:nth-child(4){animation-delay:.105s}
.wb_sh_spine:nth-child(5){animation-delay:.14s}
.wb_sh_spine:nth-child(n+6){animation-delay:.17s}
.wb_slip{animation:wb_sh_pageIn .26s cubic-bezier(.16,1,.3,1) both}

/* ── responsive ─────────────────────────────────────────────────────────── */
@media (max-width:1280px){
  .wb_sh_top{padding:0 30px;gap:20px}
  .wb_sh_spread{grid-template-columns:220px minmax(0,1fr);gap:40px;padding:22px 42px}
  .wb_sh_coverWrap{width:220px;height:279px}
  .wb_sh_coverTitle{font-size:37px}
  .wb_sh_coverTitle[data-tier="m"]{font-size:31px}
  .wb_sh_coverTitle[data-tier="l"]{font-size:25px}
  .wb_sh_coverTitle[data-tier="xl"]{font-size:19px}
  .wb_sh_coverLetter{font-size:163px;top:52px}
  .wb_sh_title{font-size:30px}
  .wb_sh_press{grid-template-rows:minmax(0,1fr) 168px}
  .wb_sh_shelf{padding-left:42px;padding-right:42px}
  .wb_sh_shelf:after{left:42px;right:42px}
  .wb_sh_spine{width:89px;height:129px}
  .wb_sh_spineTrack{gap:12px}
  .wb_sh_miniTitle{font-size:12px}
  .wb_sh_miniTitle[data-tier="m"]{font-size:10px}
  .wb_sh_miniTitle[data-tier="l"]{font-size:9px}
  .wb_sh_miniTitle[data-tier="xl"]{font-size:8px}
  .wb_sh_miniSub{font-size:6px}
  .wb_sh_foot{padding:0 30px}
  .wb_ix_bodyTodo{grid-template-columns:184px minmax(0,1fr) 330px}
  .wb_ix_bodyNote{grid-template-columns:300px minmax(0,1fr)}
  .wb_ix_head h1{font-size:46px}
  .wb_ix_detailTitle{font-size:20px}
  .wb_ix_reader{padding:24px 38px 18px}
  .wb_ix_readerTitle{font-size:34px}
}
@media (max-width:1180px){
  .wb_sh_spread{grid-template-columns:200px minmax(0,1fr);gap:26px;padding:18px 34px}
  .wb_sh_datePlate{width:200px}
  .wb_sh_coverWrap{width:200px;height:253px}
  .wb_sh_coverTitle{font-size:33px}
  .wb_sh_coverTitle[data-tier="m"]{font-size:25px}
  .wb_sh_coverTitle[data-tier="l"]{font-size:20px}
  .wb_sh_coverTitle[data-tier="xl"]{font-size:16px}
  .wb_sh_coverLetter{font-size:147px;top:48px}
  .wb_sh_cover{padding:15px 16px 12px}
  .wb_sh_cover::before{inset:7px}
  .wb_sh_coverRule{left:16px;right:16px;bottom:32px}
  .wb_sh_title{font-size:27px}
  .wb_sh_lede{font-size:13px;line-height:1.8}
  .wb_sh_press{grid-template-rows:minmax(0,1fr) 155px}
  .wb_sh_shelf{padding-left:34px;padding-right:34px}
  .wb_sh_shelf:after{left:34px;right:34px}
  .wb_sh_spine{width:80px;height:115px}
  .wb_sh_spineTrack{gap:11px}
  .wb_sh_miniTitle{font-size:11px}
  .wb_sh_miniTitle[data-tier="m"]{font-size:9px}
  .wb_sh_miniTitle[data-tier="l"]{font-size:8px}
  .wb_sh_miniTitle[data-tier="xl"]{font-size:8px}
  .wb_sh_miniSub{font-size:6px}
  .wb_sh_foot{padding:0 24px;gap:9px}
  .wb_sh_footPress{display:none}
  .wb_ix_bodyTodo{grid-template-columns:168px minmax(0,1fr) 306px}
  .wb_ix_bodyNote{grid-template-columns:276px minmax(0,1fr)}
  .wb_ix_head{gap:12px;padding:0 24px 16px}
  .wb_ix_head h1{font-size:42px}
  .wb_ix_headMeta b{font-size:12px}
  .wb_ix_filters{padding-top:14px}
  .wb_ix_filter{padding:0 13px;height:40px}
  .wb_ix_filterCap{padding-left:13px}
  .wb_ix_search{margin-left:10px;margin-right:10px}
  .wb_ix_filterFoot{padding-left:13px;padding-right:13px}
  .wb_ix_center{padding:14px 18px 12px}
  .wb_ix_thead,.wb_ix_row{grid-template-columns:34px minmax(0,1fr) 82px 58px;gap:8px}
  .wb_ix_detail{padding:16px 18px 14px}
  .wb_ix_detailTitle{font-size:19px;max-width:none}
  .wb_ix_reader{padding:22px 30px 16px}
  .wb_ix_readerLayout{grid-template-columns:minmax(0,1fr) 204px;gap:28px}
  .wb_ix_readerTitle{font-size:30px;margin-top:36px}
  .wb_ix_readerActions .wb_btn{padding:0 7px;font-size:11px}
}
@media (max-width:1080px){
  .wb_sh_top{height:auto;min-height:58px;flex-wrap:wrap;padding:8px 22px;gap:8px 18px}
  .wb_sh_brand{flex:0 1 auto}
  .wb_sh_series{flex:0 1 auto}
  .wb_sh_topRight{gap:10px}
  .wb_sh_press{grid-template-rows:minmax(0,1fr) 141px}
  .wb_sh_spread{grid-template-columns:173px minmax(0,1fr);gap:20px;padding:14px 24px}
  .wb_sh_datePlate{width:190px}
  .wb_sh_coverWrap{width:173px;height:220px}
  .wb_sh_coverTitle{font-size:29px}
  .wb_sh_coverTitle[data-tier="m"]{font-size:25px}
  .wb_sh_coverTitle[data-tier="l"]{font-size:20px}
  .wb_sh_coverTitle[data-tier="xl"]{font-size:16px}
  .wb_sh_coverLetter{font-size:127px;top:41px}
  .wb_sh_cover{padding:13px 14px 11px}
  .wb_sh_cover::before{inset:6px}
  .wb_sh_coverRule{left:14px;right:14px;bottom:28px}
  .wb_sh_coverFoot{font-size:11px}
  .wb_sh_coverPath{display:none}
  .wb_sh_copy{padding-top:0}
  .wb_sh_title{font-size:24px;margin-top:14px}
  .wb_sh_lede{margin-top:10px;font-size:12.5px;line-height:1.7}
  .wb_sh_facts{margin-top:14px}
  .wb_fact{padding:6px 0}
  .wb_sh_subs{margin-top:12px}
  .wb_subRow{min-height:30px;padding:5px 0}
  .wb_subSession{min-height:26px}
  .wb_sh_actions{position:sticky;bottom:0;z-index:2;margin-top:12px;padding:8px 0 6px;background:linear-gradient(to top,var(--wb-ground) 68%,transparent)}
  .wb_sh_miniTitle{font-size:11px}
  .wb_sh_miniTitle[data-tier="m"]{font-size:9px}
  .wb_sh_miniTitle[data-tier="l"]{font-size:8px}
  .wb_sh_miniTitle[data-tier="xl"]{font-size:8px}
  .wb_sh_miniSub{font-size:6px;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.15}
  .wb_sh_shelf{padding:5px 24px 8px}
  .wb_sh_shelf:after{left:24px;right:24px}
  .wb_sh_spine{width:72px;height:103px}
  .wb_sh_spineTrack{gap:9px}
  .wb_sh_foot{padding:0 18px}
  .wb_sh_day{width:min(360px,96vw)}
}
@media (max-width:860px){
  .wb_sh_page .wb_scroll{overflow:auto}
  .wb_sh_sheet{height:auto;min-height:100%;overflow:visible}
  .wb_sh_press{display:flex;flex-direction:column;flex:none;min-height:0}
  .wb_sh_masthead{flex-wrap:wrap;gap:10px 24px}
  .wb_sh_datePlate{width:200px}
  .wb_sh_spread{display:flex;flex-direction:column;align-items:center;gap:24px;padding:20px 22px 26px;overflow:visible}
  .wb_sh_coverWrap{width:180px;height:227px;align-self:center}
  .wb_sh_coverTitle{font-size:31px}
  .wb_sh_copy{width:100%;max-width:none;max-height:none;overflow:visible;padding:0}
  .wb_sh_title{font-size:24px}
  .wb_sh_lede{font-size:13px}
  .wb_sh_shelf{flex:none;padding:10px 22px 14px;border-top:1px solid var(--wb-line)}
  .wb_sh_shelf:after{left:22px;right:22px}
  .wb_sh_spines{padding-top:10px;overflow-x:auto}
  .wb_sh_spineTrack{justify-content:flex-start;padding:0 6px;gap:10px}
  .wb_sh_spine{width:84px;height:120px}
  .wb_sh_miniTitle{font-size:11px}
  .wb_sh_miniTitle[data-tier="m"]{font-size:9px}
  .wb_sh_miniTitle[data-tier="l"]{font-size:8px}
  .wb_sh_miniTitle[data-tier="xl"]{font-size:8px}
  .wb_sh_miniSub{font-size:6px}
  .wb_sh_foot{flex-wrap:wrap;height:auto;min-height:32px;padding:7px 18px;white-space:normal;gap:4px 9px}
  .wb_sh_footNote{flex:1 1 100%;order:3}
  .wb_sh_counts{gap:9px}
  .wb_ix_top{flex-wrap:wrap;height:auto;min-height:0;padding:9px 14px;gap:8px}
  .wb_ix_word{display:none}
  .wb_ix_form{flex:1 1 auto}
  .wb_ix_topRight{margin-left:0;width:100%;justify-content:space-between;gap:8px}
  .wb_ix_stamp{font-size:11px}
  .wb_ix_actions{width:auto}
  .wb_ix_head{height:auto;min-height:0;padding:14px 16px 13px;flex-wrap:wrap;gap:6px}
  .wb_ix_headText{display:block}
  .wb_ix_head h1{font-size:34px}
  .wb_ix_sub{margin-top:5px;white-space:normal;line-height:1.5}
  .wb_ix_headMeta{margin-left:0;width:100%;text-align:left;padding-bottom:0}
  .wb_ix_headMeta b{font-size:11px}
  .wb_ix_bodyTodo,.wb_ix_bodyNote{grid-template-columns:minmax(0,1fr);overflow:auto}
  .wb_ix_filters{flex-direction:row;flex-wrap:wrap;align-items:center;gap:6px;border-right:0;border-bottom:1px solid var(--wb-line);padding:10px 12px}
  .wb_ix_filterCap{display:none}
  .wb_ix_filter{width:auto;min-height:32px;height:32px;padding:0 9px;border:1px solid var(--wb-line);grid-template-columns:16px auto auto;gap:5px;font-size:11px}
  .wb_ix_search{flex:1 1 100%;margin:4px 0 0;height:30px}
  .wb_ix_filterFoot{display:none}
  .wb_ix_center{border-right:0;padding:10px 12px 12px}
  .wb_ix_add{height:36px}
  .wb_ix_thead{display:none}
  .wb_ix_row{grid-template-columns:28px minmax(0,1fr) auto;gap:8px;min-height:56px;padding:8px 4px}
  .wb_ix_due{grid-column:3;grid-row:1;text-align:right}
  .wb_ix_prio{display:none}
  .wb_ix_rowNo{grid-column:1;grid-row:1}
  .wb_ix_rowMain{grid-column:2;grid-row:1}
  .wb_ix_detail{grid-column:1;max-height:none;border-top:1px solid var(--wb-line)}
  .wb_ix_nav{border-right:0;border-bottom:1px solid var(--wb-line);height:42vh;max-height:42vh}
  .wb_ix_nav .wb_ix_search{flex:none;margin:8px 14px 6px}
  .wb_ix_reader{padding:18px 16px 16px}
  .wb_ix_readerTitle{font-size:27px;margin-top:28px}
  .wb_ix_readerText{font-size:13px;line-height:1.95}
  .wb_ix_bigNo{font-size:58px}
  .wb_ix_readerFoot{align-items:flex-start}
  .wb_ix_readerActions{width:100%;justify-content:flex-start}
  .wb_sMasthead{padding:18px 16px 12px}
  .wb_sLedger{padding:16px 16px 28px}
  .wb_sChapterTitle{white-space:normal}
  .wb_sBand{flex-wrap:wrap;gap:8px}
  .wb_sBandRight{width:100%;margin-left:0;padding-top:0}
  .wb_sCardFoot{padding-left:14px}
  .wb_sCardText{flex-direction:column;gap:1px}
}
@media (max-width:620px){
  .wb_sh_top{padding:8px 14px}
  .wb_sh_brand b{font-size:14px}
  .wb_sh_brand span{display:none}
  .wb_sh_series{flex:1 1 100%;order:3;padding-left:0}
  .wb_sh_clock b{font-size:20px}
  .wb_sh_datePlate{width:190px}
  .wb_sh_dateValue{font-size:26px}
  .wb_sh_copyHead{gap:10px}
  .wb_sh_title{font-size:23px}
  .wb_sh_facts{grid-template-columns:1fr}
  .wb_fact{padding:8px 0}
  .wb_sh_coverWrap{width:160px;height:204px}
  .wb_sh_coverTitle{font-size:27px}
  .wb_sh_coverTitle[data-tier="m"]{font-size:22px}
  .wb_sh_coverTitle[data-tier="l"]{font-size:18px}
  .wb_sh_coverTitle[data-tier="xl"]{font-size:15px}
  .wb_sh_shelf{padding:8px 14px 13px}
  .wb_sh_shelf:after{left:14px;right:14px}
  .wb_sh_spine{width:72px;height:103px}
  .wb_sh_spineTrack{gap:8px}
  .wb_sh_mini{padding:9px 8px 7px}
  .wb_sh_miniTitle{font-size:10px}
  .wb_sh_miniTitle[data-tier="m"]{font-size:8px}
  .wb_sh_miniTitle[data-tier="l"]{font-size:8px}
  .wb_sh_miniTitle[data-tier="xl"]{font-size:8px}
  .wb_sh_miniSub{font-size:6px}
  .wb_sh_miniLetter{font-size:72px;right:6px;top:16px}
  .wb_sh_foot{padding:7px 12px}
  .wb_sh_footNote{flex:1 1 100%}
  .wb_sh_day{width:100vw}
  .wb_sh_dayHead{padding-left:14px}
  .wb_sh_dayBody .wb_today{padding:14px 14px 12px}
  .wb_t9_week::before,.wb_t9_week::after{right:-14px}
  .wb_toasts{width:calc(100vw - 24px);max-height:calc(100vh - 8px)}
  .wb_ix_head h1{font-size:30px}
  .wb_ix_actions .wb_btn{height:28px;padding:0 8px;font-size:11px}
  .wb_ix_filter{font-size:11px;padding:0 7px}
  .wb_ix_tab{font-size:11px}
  .wb_ix_readerAside{grid-template-columns:1fr}
  .wb_ix_noteItem .wb_slipMain{padding:10px 12px}
  .wb_ix_readerTitle{font-size:24px}
  .wb_ix_foot{padding:0 14px;height:24px}
  .wb_sMasthead{padding:15px 14px 11px}
  .wb_sLedger{padding:14px 14px 26px}
  .wb_sBrandText b{font-size:17px}
  .wb_sChapterTitle{font-size:12px;white-space:normal}
  .wb_sIndexItem{padding:11px 5px 9px;gap:5px;font-size:12px}
  .wb_sIndexMeta{display:none}
  .wb_sIndexName{white-space:normal;line-height:1.25}
  .wb_sSub{grid-template-columns:92px minmax(0,1fr)}
  .wb_sSubRail{padding:12px 10px 12px 0}
  .wb_sSubBody{padding:10px 0 13px 12px}
  .wb_sNamePair{grid-template-columns:minmax(0,1fr)}
  .wb_sModeRow{grid-template-columns:1fr}
  .wb_sCardFoot{padding-left:12px}
}
@container (max-width:720px){
  .wb_sLedger{padding:16px 20px 30px}
}
@container (max-width:430px){
  .wb_sMasthead{padding:15px 14px 11px}
  .wb_sLedger{padding:14px 14px 26px}
  .wb_sBrandText b{font-size:17px}
  .wb_sChapterTitle{font-size:12px;white-space:normal}
  .wb_sIndexItem{padding:11px 5px 9px;gap:5px;font-size:12px}
  .wb_sIndexMeta{display:none}
  .wb_sIndexName{white-space:normal;line-height:1.25}
  .wb_sSub{grid-template-columns:92px minmax(0,1fr)}
  .wb_sSubRail{padding:12px 10px 12px 0}
  .wb_sSubBody{padding:10px 0 13px 12px}
  .wb_sNamePair{grid-template-columns:minmax(0,1fr)}
  .wb_sModeRow{grid-template-columns:1fr}
  .wb_sCardFoot{padding-left:12px}
}
@media (prefers-reduced-motion:reduce){
  .wb_sh_coverWrap,.wb_sh_cover,.wb_sh_copy,.wb_sh_spine,.wb_sh_day,.wb_sh_scrim,.wb_slip,.wb_toast{animation:none}
  .wb_ix_timeTrack[data-roll]{animation:none !important}
  .wb_sh_mini{transform:none}
  .wb_sh_cover,.wb_sh_spine,.wb_sh_mini,.wb_sh_key,.wb_btn,.wb_sBtn,.wb_sIcon,.wb_subRow,.wb_subCaret,.wb_toast,.wb_toastMore,.wb_ix_timeGhost{transition:none}
}
`;
    /**
     * The icon set. One drawing language: 16px box, 1.5 stroke, round caps,
     * currentColor. Every glyph here is authored for this plugin, so the marks
     * on the page belong to one hand.
     */
    function Svg({ children, size = 16, stroke = 1.5, linecap = 'round' }) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: stroke,
          strokeLinecap: linecap,
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: 'false',
          style: { display: 'block', flex: 'none' },
        },
        children,
      );
    }

    const IconPlus = ({ size = 12 }) => h(Svg, { size }, h('path', { d: 'M8 3.5v9M3.5 8h9' }));
    const IconText = ({ size = 13 }) =>
      h(Svg, { size }, h('path', { d: 'M3.5 4.5h9M3.5 8h9M3.5 11.5h5.5' }));
    const IconTrash = ({ size = 13 }) =>
      h(
        Svg,
        { size },
        h('path', { key: 'a', d: 'M2.75 4.4h10.5M6.4 4.4V2.9h3.2v1.5M4.2 4.4l.6 8.4h6.4l.6-8.4' }),
        h('path', { key: 'b', d: 'M6.6 6.9v3.4M9.4 6.9v3.4' }),
      );
    const IconArchive = ({ size = 13 }) =>
      h(
        Svg,
        { size, stroke: 1.35 },
        h('path', { key: 'a', d: 'M2.7 5.1h10.6v7.2H2.7zM2.7 3.2h10.6v1.9H2.7z' }),
        h('path', { key: 'b', d: 'M6.2 8.1h3.6' }),
      );
    const IconCheck = ({ size = 11 }) => h(Svg, { size, stroke: 2.2 }, h('path', { d: 'M3.2 8.4l3.2 3.2 6.2-7' }));
    const IconRefresh = ({ size = 13 }) =>
      h(
        Svg,
        { size },
        h('path', { key: 'a', d: 'M13 8a5 5 0 1 1-1.6-3.7' }),
        h('path', { key: 'b', d: 'M13.2 2.6v3h-3' }),
      );
    const IconCopy = ({ size = 13 }) =>
      h(
        Svg,
        { size, stroke: 1.4 },
        h('rect', { key: 'a', x: 2.5, y: 2.5, width: 8, height: 8, rx: 1.6 }),
        h('path', { key: 'b', d: 'M5.5 13.5h6a1.6 1.6 0 0 0 1.6-1.6v-6' }),
      );
    const IconBack = ({ size = 14 }) => h(Svg, { size, stroke: 1.7 }, h('path', { d: 'M9.5 4.25L5.75 8l3.75 3.75' }));
    /**
     * The shelf's return key mark: the workbench's own folded-corner sheet,
     * with the return arrow printed inside its margin. The page is the object;
     * the arrow is the action, so the mark reads at 18px without a text label.
     */
    const IconReturnLatest = ({ size = 18 }) =>
      h(
        Svg,
        { size, stroke: 1.4 },
        h('path', { key: 'page', d: 'M3.2 2.8h7.4l2.6 2.6v7.8H3.2z' }),
        h('path', { key: 'fold', d: 'M10.6 2.8v2.6h2.6' }),
        h('path', { key: 'shaft', d: 'M10.6 8H6.2' }),
        h('path', { key: 'head', d: 'M8 6.1 6.1 8 8 9.9' }),
      );
    const IconCalendar = ({ size = 12 }) =>
      h(
        Svg,
        { size, stroke: 1.4 },
        h('path', { key: 'a', d: 'M2.9 4.4h10.2v9H2.9zM2.9 7h10.2' }),
        h('path', { key: 'b', d: 'M5.6 2.9v2.4M10.4 2.9v2.4' }),
      );
    const IconBell = ({ size = 13 }) =>
      h(
        Svg,
        { size },
        h('path', { key: 'a', d: 'M3.6 11h8.8M4.7 11V7.6a3.3 3.3 0 0 1 6.6 0V11' }),
        h('path', { key: 'b', d: 'M6.7 13.1a1.5 1.5 0 0 0 2.6 0' }),
      );
    const IconPin = ({ size = 11 }) =>
      h(
        Svg,
        { size, stroke: 1.4 },
        h('path', { key: 'a', d: 'M9.1 2.5l4.4 4.4-1.1 1.1-1.1-1.1-2.7 2.7.1 2.2-1 1-4.4-4.4 1-1 2.2.1L9.2 4.8 8.1 3.6z' }),
        h('path', { key: 'b', d: 'M5.9 10.1l-2.6 2.6' }),
      );
    const IconNotePage = ({ size = 13 }) =>
      h(
        Svg,
        { size },
        h('path', { key: 'a', d: 'M3.8 2.6h5.4l3 3v7.8h-8.4z' }),
        h('path', { key: 'b', d: 'M9 2.6v3.2h3.2M5.8 8.6h4.4M5.8 10.8h3' }),
      );
    const IconSearch = ({ size = 12 }) =>
      h(
        Svg,
        { size },
        h('circle', { key: 'a', cx: 7.1, cy: 7.1, r: 3.9 }),
        h('path', { key: 'b', d: 'M10.1 10.1l3 3' }),
      );
    const IconFolder = ({ size = 13 }) =>
      h(
        Svg,
        { size, stroke: 1.4 },
        h('path', { key: 'a', d: 'M2.5 4.2h4l1.2 1.4h5.8v6.8h-11z' }),
        h('path', { key: 'b', d: 'M2.5 6.1h11' }),
      );
    const IconInfo = ({ size = 12 }) =>
      h(
        Svg,
        { size, stroke: 1.35 },
        h('circle', { key: 'a', cx: 8, cy: 8, r: 5.9 }),
        h('path', { key: 'b', d: 'M8 7.2v3.2M8 4.9h.01' }),
      );
    const IconArrowRight = ({ size = 14 }) =>
      h(Svg, { size, stroke: 1.4 }, h('path', { d: 'M2.5 8h10M9 4.5L12.5 8 9 11.5' }));
    const IconArrowUpRight = ({ size = 14 }) =>
      h(Svg, { size, stroke: 1.4 }, h('path', { d: 'M4 12L12 4M6 4h6v6' }));

    /**
     * The product mark: one sheet with a folded top-right corner.
     *
     * The 36px plugin-card artwork is a paper-white page with a champagne fold
     * on transparency; this 16px line cut is the same page with a single rule,
     * so the mark survives the sidebar and Settings nav without a tile.
     */
    function WorkbenchMark({ size = 16 }) {
      return h(
        Svg,
        { size, stroke: 1.1, linecap: 'butt' },
        h('path', { key: 'sheet', d: 'M1.8 1.2h8.7l3.7 3.7v9.9H1.8V1.2Z' }),
        h('path', { key: 'fold', d: 'M10.5 1.2v3.7h3.7' }),
        h('path', { key: 'rule', d: 'M4.1 11.9h7.6' }),
      );
    }

    /** Sidebar seat occupant: the icon only; the sidebar draws the label beside it. */
    function WorkbenchIcon({ size }) {
      return h(WorkbenchMark, { size: size ?? 16 });
    }

    let counter = 0;
    /** A fresh stable id for a client-created record. */
    function uid(prefix) {
      counter += 1;
      return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    }

    /** Fill `{name}` placeholders. */
    function fill(template, values) {
      if (values === undefined) return String(template);
      return String(template).replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
    }

    /**
     * Fetch with a deadline.
     *
     * The Host normally answers in milliseconds, but a stopped Host or a
     * half-open connection must not leave a write queued forever: every later
     * save shares the same queue, so one hung request would freeze the whole
     * workbench until reload. Abort at the deadline and let the caller's normal
     * failure path run. A client without AbortController keeps the old
     * behaviour rather than throwing at startup.
     */
    async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
      if (typeof AbortController !== 'function' || typeof setTimeout !== 'function') {
        return fetch(url, options);
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
    }

    /**
     * Read a response body under its own deadline.
     *
     * `fetchWithTimeout` stops waiting for the response HEADERS. A half-open
     * connection can still stall while `response.json()` drains the body, and
     * that promise sits in the save queue / a loading surface forever. This
     * helper puts the same kind of deadline around the body read and releases
     * the stream when it expires.
     * @param response - a fetch Response.
     * @param timeoutMs - maximum time to wait for the body.
     * @returns the parsed JSON value.
     */
    async function readJsonWithTimeout(response, timeoutMs = 15000) {
      if (typeof setTimeout !== 'function') return response.json();
      let timer;
      try {
        return await Promise.race([
          response.json(),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('response body timed out')), timeoutMs);
          }),
        ]);
      } catch (error) {
        // The timeout leaves the original body stream open; release it so a
        // stalled connection cannot keep the page's fetch pool occupied.
        try {
          await response.body?.cancel?.();
        } catch {
          /* the body may already be locked or consumed */
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }

    /**
     * Release a response body that will not be read.
     *
     * A non-ok fetch response still owns a stream until it is consumed or
     * cancelled. Releasing it here keeps a burst of rejected saves, workspace
     * lookups or skill refreshes from occupying the page's fetch pool.
     * @param response - a fetch Response whose body is no longer needed.
     */
    function discardResponseBody(response) {
      try {
        Promise.resolve(response?.body?.cancel?.()).catch(() => {});
      } catch {
        /* an already-consumed or bodyless response is harmless */
      }
    }

    // ── boards, sessions, and the shared document ─────────────────────────────

    /** In-flight directory validation, keyed by path. */
    const directoryPending = new Map();
    /** Workspace registration ids keyed by their absolute path. */
    const workspaceIds = new Map();
    /** The Host's default working area, remembered after the first read. */
    let workspaceDefaultPath = '';
    /** Session ids already created, keyed by board key. */
    const boardSessions = new Map();
    /** In-flight Session creation, keyed by board key. */
    const sessionPending = new Map();
    /** Session id → the board's own label parts, for the board ticket beside the mode chip. */
    const sessionLabels = new Map();
    /** Components watching for a newly known board label. */
    const labelListeners = new Set();

    /** Wake every label watcher; one failed component must not strand the rest. */
    function notifyLabels() {
      for (const listener of labelListeners) {
        try {
          listener();
        } catch {
          /* a disposed or broken component is not a reason to stop the update */
        }
      }
    }

    /**
     * A board's Session ids, newest first.
     *
     * A board owns every conversation opened on it. Version 3 stored one id per
     * board, so a bare string still reads as a one-item list — that is what makes
     * an existing document readable without a migration step in the browser.
     */
    function sessionListOf(value) {
      const list = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
      const seen = new Set();
      const out = [];
      for (const item of list) {
        // Mirror the Host's prototype-key guard: a hand-edited document or a
        // broken proxy must not put an object-internal name into this list.
        if (typeof item !== 'string' || item.length === 0 || UNSAFE_KEYS.has(item) || seen.has(item)) continue;
        seen.add(item);
        out.push(item);
        if (out.length >= MAX_SESSIONS_PER_BOARD) break;
      }
      return out;
    }

    /**
     * A board's selected prompt ids.
     *
     * Version 5 stores a list. Version 4 stored one id under `promptId`; both
     * read as the same list, so the browser does not need to know which version
     * the Host normalized. Blank and duplicate ids are dropped here because the
     * result is used directly to mark switches.
     * @param bag - a board's settings bag, possibly from an older document.
     * @returns a clean list of prompt ids.
     */
    function promptIdsOf(bag) {
      const source = Array.isArray(bag?.promptIds)
        ? bag.promptIds
        : typeof bag?.promptId === 'string'
          ? [bag.promptId]
          : [];
      const seen = new Set();
      const out = [];
      for (const item of source) {
        if (typeof item !== 'string') continue;
        const id = item.trim();
        if (id.length === 0 || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
      }
      return out;
    }

    /**
     * Normalize a stored/projected model selection.
     *
     * Display names are never stored: the picker resolves provider/model ids
     * against the live catalog. An absent reasoning effort means "use the
     * model's advertised default", which is exactly what the Host materializes
     * when the selection is applied.
     * @param value - a ModelSelection-shaped candidate.
     * @returns `{provider, model, reasoningEffort?}`, or undefined.
     */
    function modelSelectionOfValue(value) {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
      const provider = typeof value.provider === 'string' ? value.provider.trim() : '';
      const model = typeof value.model === 'string' ? value.model.trim() : '';
      if (provider.length === 0 || model.length === 0) return undefined;
      if (provider.length > MAX_MODEL_ID || model.length > MAX_MODEL_ID) return undefined;
      const reasoningEffort = typeof value.reasoningEffort === 'string' ? value.reasoningEffort.trim() : '';
      if (reasoningEffort.length > MAX_MODEL_ID) return undefined;
      return {
        provider,
        model,
        ...(reasoningEffort.length === 0 ? {} : { reasoningEffort }),
      };
    }

    /** Read the model selection stored inside one board settings bag. */
    function modelSelectionFromBag(bag) {
      return modelSelectionOfValue(bag?.modelSelection);
    }

    /**
     * The complete model selection a new conversation under one board key
     * should use.
     *
     * Precedence is:
     *   1. an explicit `settings[key].modelSelection` remembered by the Host;
     *   2. the most recently active conversation under that exact key;
     *   3. the parent board's setting or most recent conversation;
     *   4. undefined, which means the deployment default.
     *
     * `document.sessions` is newest-first, but the list summary carries the
     * authoritative `updatedAt`; using it means a conversation the user
     * returned to later wins over one that was merely created later.
     * @param document - the workbench document.
     * @param key - `boardId` or `boardId/childId`.
     * @param ctx - client plugin context.
     * @returns the selection to carry into the next `sessions.create`.
     */
    function modelSelectionForBoard(document, key, ctx) {
      // The Host writes the last explicit user choice into this bag. It is the
      // first authority because a model change in an older conversation is
      // still the newest user intent even when a newer conversation exists.
      const explicit = modelSelectionFromBag(document?.settings?.[key]);
      if (explicit !== undefined) return explicit;

      const sessions = ctx?.get?.('sessions');
      let list;
      try {
        list = sessions?.list?.getSnapshot?.();
      } catch {
        list = undefined;
      }
      let best;
      for (const sessionId of sessionListOf(document?.sessions?.[key])) {
        const summary = list?.byId?.[sessionId];
        const projected = summary?.projectionValues?.modelSelection;
        const selection = modelSelectionOfValue(projected?.next ?? projected?.lastUsed);
        if (selection === undefined) continue;
        const at = Number(summary?.updatedAt) || 0;
        if (best === undefined || at > best.at) best = { at, selection };
      }
      if (best !== undefined) return best.selection;

      const slash = key.indexOf('/');
      if (slash > 0) {
        // A sub-board without its own choice follows its parent, including the
        // parent's explicit setting or latest conversation.
        const inherited = modelSelectionForBoard(document, key.slice(0, slash), ctx);
        if (inherited !== undefined) return inherited;
      }
      return undefined;
    }

    /**
     * Apply one model selection to a freshly created Session.
     *
     * The workbench Host owns the Session-local selection path so this call does
     * not go through `session/selectModel`, whose contract also saves the
     * deployment default. A stale board model is a recoverable miss: the Session
     * has already been created and is opened with the deployment default.
     * @param ctx - client plugin context.
     * @param sessionId - the created Session.
     * @param modelSelection - complete selection to install.
     * @returns whether the selection was installed.
     */
    async function applySessionModelSelection(ctx, sessionId, modelSelection) {
      try {
        const response = await fetchWithTimeout(
          `${API}/session/model`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId, modelSelection }),
          },
          15000,
        );
        if (response.ok) {
          // The success body is not needed; release it so the connection can
          // be reused instead of waiting for a response body nobody reads.
          discardResponseBody(response);
          return true;
        }
        let payload;
        try {
          payload = await readJsonWithTimeout(response);
        } catch {
          payload = undefined;
        }
        if (payload?.code === 'model-unavailable') {
          // A stale board model is recoverable: the Session has already been
          // created and opens with the deployment default. Do not print the
          // Session id or provider message into the browser console.
          return false;
        }
        throw new Error(payload?.message ?? `HTTP ${response.status}`);
      } catch {
        // Opening the conversation with the deployment default is better than
        // failing to open it because a board remembers a retired model.
        return false;
      }
    }

    /**
     * Remember the sessions the saved document already owns.
     *
     * The document records each board's session ids, so a page reload can still
     * tell a workbench session from an ordinary one without recreating them.
     */
    function adoptSavedSessions(document) {
      const sessions = document && typeof document === 'object' ? document.sessions : undefined;
      const boards = document !== null && typeof document === 'object' && Array.isArray(document.boards) ? document.boards : [];
      const nextBoardSessions = new Map();
      const nextLabels = new Map();
      if (sessions !== undefined && sessions !== null && typeof sessions === 'object') {
        for (const [key, value] of Object.entries(sessions)) {
          const list = sessionListOf(value);
          if (list.length === 0) continue;
          nextBoardSessions.set(key, list[0]);
          const [boardId, childId] = key.split('/');
          const board = boards.find((item) => item !== null && typeof item === 'object' && item.id === boardId);
          if (board === undefined) continue;
          const children = Array.isArray(board.children) ? board.children : [];
          const child = childId === undefined ? undefined : children.find((item) => item !== null && typeof item === 'object' && item.id === childId);
          // A stale key whose child was deleted in another tab must not be
          // labelled as the parent board: hide the ticket instead of showing a
          // misleading parent-only identity.
          if (childId !== undefined && child === undefined) continue;
          const label = boardLabel(board, child);
          for (const sessionId of list) {
            nextLabels.set(sessionId, label);
          }
        }
      }
      // A create flow writes the new id into `boardSessions` before its save is
      // acknowledged. Keep those in-memory entries while a write is in flight,
      // otherwise a forced re-read can make the next click create a duplicate.
      // The in-memory head must win even when the old document already had a
      // Session for the same board: `nextBoardSessions` is keyed by board, so
      // only replacing absent keys kept the OLD conversation and lost the one
      // the user just opened.
      if (store.pendingWrites > 0) {
        for (const [key, sessionId] of boardSessions) nextBoardSessions.set(key, sessionId);
        for (const [sessionId, label] of sessionLabels) nextLabels.set(sessionId, label);
      }
      boardSessions.clear();
      sessionLabels.clear();
      for (const [key, sessionId] of nextBoardSessions) boardSessions.set(key, sessionId);
      for (const [sessionId, label] of nextLabels) sessionLabels.set(sessionId, label);
      notifyLabels();
    }

    /**
     * The board ticket beside the mode chip.
     *
     * A header action, not a title replacement: the shipped title and the
     * agent-preset chip stay exactly as they are. It renders nothing for a
     * Session this plugin did not create.
     */
    function BoardLabelAction({ sessionId }) {
      // A locale switch renames the leading word, and a Settings rename changes
      // the board's own name; both should reach the ticket without a reload.
      useLocaleVersion();
      const document = useDocument();
      const [, setTick] = useState(0);
      useEffect(() => {
        const listener = () => setTick((value) => value + 1);
        labelListeners.add(listener);
        return () => {
          labelListeners.delete(listener);
        };
      }, []);
      const label = sessionLabels.get(sessionId);
      if (label === undefined || label === null) return null;
      const boards = Array.isArray(document.boards) ? document.boards : [];
      const board = boards.find((item) => item !== null && typeof item === 'object' && item.id === label.boardId);
      if (board === undefined) return null;
      const child =
        label.childId === ''
          ? undefined
          : (Array.isArray(board.children) ? board.children : []).find((item) => item.id === label.childId);
      // A sub-board deleted in this tab leaves its Session id in the live cache
      // until the next document adoption; do not render a misleading parent-only
      // label in the meantime.
      if (label.childId !== '' && child === undefined) return null;
      // The header names the place the conversation belongs to, not the shelf's
      // hierarchy: the sub-board's own name, or the main board's name when the
      // Session sits on the board itself. The full path stays in the tooltip.
      const name = child === undefined ? board.name : child.name;
      if (typeof name !== 'string' || name.length === 0) return null;
      const full = [translate()('panel'), board.name, child?.name]
        .filter((part) => typeof part === 'string' && part.length > 0)
        .join(' / ');
      return h(
        'span',
        {
          className: 'wb_headerAction wb_boardLabel',
          title: full.length > 0 ? full : name,
          // The cloth mark is the board's shelf position in the owner's fixed
          // red → orange → yellow → green → blue cycle: the same colour its
          // cover carries in the ledger, so the header speaks the shelf's
          // language without spelling out the hierarchy.
          style: { '--wb-cloth': clothForIndex(boards.indexOf(board)) },
        },
        h('span', { className: 'wb_boardLabelMark', 'aria-hidden': 'true' }),
        h('span', { className: 'wb_boardLabelText' }, name),
      );
    }

    /**
     * Resolve the conversation board that owns one Session.
     *
     * The durable document is the authority: a board key is `boardId` or
     * `boardId/childId`, and its `sessions` list names every Session the
     * workbench created there. The in-memory `sessionLabels` cache is good for
     * painting, but it must not be the only source: a reloaded page and a
     * Session opened straight from the shell's sidebar both need this lookup.
     * @param document - the shared workbench document.
     * @param sessionId - the Session whose board is being resolved.
     * @returns `{ board, child, key }`, or undefined for an ordinary Session.
     */
    function workbenchLocationOf(document, sessionId) {
      if (typeof sessionId !== 'string' || sessionId.length === 0) return undefined;
      const boards = Array.isArray(document?.boards) ? document.boards : [];
      const sessions =
        document !== null && typeof document === 'object' && document.sessions !== null && typeof document.sessions === 'object'
          ? document.sessions
          : {};
      for (const [key, value] of Object.entries(sessions)) {
        const list = sessionListOf(value);
        if (!list.includes(sessionId)) continue;
        const parts = key.split('/');
        if (parts.length > 2) continue;
        const board = boards.find((item) => item !== null && typeof item === 'object' && item.id === parts[0]);
        if (board === undefined || isSurfaceBoard(board)) continue;
        const child =
          parts.length === 2
            ? (Array.isArray(board.children) ? board.children : []).find(
                (item) => item !== null && typeof item === 'object' && item.id === parts[1],
              )
            : undefined;
        if (parts.length === 2 && (child === undefined || isSurfaceBoard(child))) continue;
        return { board, child, key };
      }
      return undefined;
    }

    /**
     * The "start another conversation here" key beside the board ticket.
     *
     * The label says where the current Session belongs; this key starts one
     * more Session under the SAME child key, without sending the reader back to
     * the shelf. It exists only for a conversation sub-board: a main board
     * keeps its single-session semantics, and a surface board has no Session
     * conversation to start.
     */
    function NewSessionAction({ sessionId }) {
      useLocaleVersion();
      const document = useDocument();
      const [, setTick] = useState(0);
      const [busy, setBusy] = useState(false);
      const [failure, setFailure] = useState('');
      useEffect(() => {
        const listener = () => setTick((value) => value + 1);
        labelListeners.add(listener);
        return () => {
          labelListeners.delete(listener);
        };
      }, []);
      // The ticket and the key are one visual pair: do not show a key without
      // the board chip that explains what it will use.
      const location = workbenchLocationOf(document, sessionId);
      if (location === undefined || location.child === undefined || sessionLabels.get(sessionId) === undefined) return null;
      const t = translate();
      const label = `${t('shelf.addTalk')} · ${location.child.name}`;
      const start = () => {
        if (busy) return;
        const ctx = pluginContext;
        if (ctx === null || ctx === undefined) return;
        const uiWorkspace = ctx.get('uiWorkspace');
        // Check navigation before creating: a missing service must not leave a
        // fresh Session recorded in the document without a way to open it.
        if (uiWorkspace === undefined || uiWorkspace === null || typeof uiWorkspace.openSession !== 'function') {
          setFailure(t('error.sessionsUnavailable'));
          return;
        }
        setBusy(true);
        setFailure('');
        createBoardSession(ctx, location.board, location.child, location.key)
          .then((createdSessionId) => {
            uiWorkspace.openSession(createdSessionId);
          })
          .catch((problem) => {
            setFailure(problem instanceof Error ? problem.message : String(problem));
          })
          .finally(() => {
            setBusy(false);
          });
      };
      return h(
        'button',
        {
          type: 'button',
          className: 'wb_headerAction wb_newSession',
          'data-busy': busy ? 'true' : undefined,
          'data-error': failure.length > 0 ? 'true' : undefined,
          title: failure.length > 0 ? failure : label,
          'aria-label': label,
          'aria-busy': busy ? 'true' : undefined,
          disabled: busy,
          onClick: (event) => {
            event.preventDefault();
            event.stopPropagation();
            start();
          },
        },
        h(IconPlus, { size: 11 }),
      );
    }

    /** Whether a value is a non-array object, the shape every document map has. */
    function isPlainRecord(value) {
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    /** Whether a value has the object shape the Host document always has. */
    function isDocument(value) {
      if (
        value === null ||
        typeof value !== 'object' ||
        Array.isArray(value) ||
        !Array.isArray(value.boards) ||
        value.boards.length > MAX_BOARDS
      ) {
        return false;
      }
      const validPreset = (preset, mode) =>
        preset === undefined ||
        (typeof preset === 'string' && (mode === 'chat' ? preset === CHAT_PRESET : AGENT_PRESETS.includes(preset)));
      // The Host normalizes every board to an object with a string id/name and
      // a children array. A proxy or a broken answer with a null/primitive/
      // partial board would otherwise crash the ledger on its first read, so
      // refuse the document before adopting it.
      const isBoardKind = (kind) => kind === 'chat' || kind === 'todo' || kind === 'note';
      if (
        !value.boards.every(
          (board) =>
            board !== null &&
            typeof board === 'object' &&
            !Array.isArray(board) &&
            typeof board.id === 'string' &&
            board.id.length > 0 &&
            board.id.length <= MAX_ID &&
            !UNSAFE_KEYS.has(board.id) &&
            !board.id.includes('/') &&
            typeof board.name === 'string' &&
            board.name.length <= MAX_BOARD_NAME &&
            isBoardKind(board.kind) &&
            (board.enName === undefined || (typeof board.enName === 'string' && board.enName.length <= MAX_BOARD_NAME)) &&
            (board.workspace === undefined || (typeof board.workspace === 'string' && board.workspace.length <= MAX_WORKSPACE_PATH)) &&
            (board.mode === 'chat' || board.mode === 'standard') &&
            validPreset(board.agentPreset, board.mode) &&
            Array.isArray(board.children) &&
            board.children.length <= MAX_CHILDREN_PER_BOARD &&
            board.children.every(
              (child) =>
                child !== null &&
                typeof child === 'object' &&
                !Array.isArray(child) &&
                typeof child.id === 'string' &&
                child.id.length > 0 &&
                child.id.length <= MAX_ID &&
                !UNSAFE_KEYS.has(child.id) &&
                !child.id.includes('/') &&
                typeof child.name === 'string' &&
                child.name.length <= MAX_BOARD_NAME &&
                isBoardKind(child.kind) &&
                (child.enName === undefined || (typeof child.enName === 'string' && child.enName.length <= MAX_BOARD_NAME)) &&
                (child.workspace === undefined || (typeof child.workspace === 'string' && child.workspace.length <= MAX_WORKSPACE_PATH)) &&
                (child.mode === 'chat' || child.mode === 'standard') &&
                validPreset(child.agentPreset, child.mode),
            ),
        )
      ) {
        return false;
      }
      // Duplicate ids would give React two children with the same key and make
      // board/session key lookups ambiguous. The Host already deduplicates its
      // own document, so a response that carries them is not one this plugin
      // should paint (or cache for every other surface).
      const seenBoardIds = new Set();
      const liveBoardKeys = new Set();
      for (const board of value.boards) {
        if (seenBoardIds.has(board.id)) return false;
        seenBoardIds.add(board.id);
        liveBoardKeys.add(board.id);
        const seenChildIds = new Set();
        for (const child of board.children) {
          if (seenChildIds.has(child.id)) return false;
          seenChildIds.add(child.id);
          liveBoardKeys.add(`${board.id}/${child.id}`);
        }
      }
      // Every keyed map is addressed by a live board key. A stale or malformed
      // key (for example `board/child/extra` from a hand-edited file or a broken
      // proxy) would be ignored by rendering but could still reach a recursive
      // parent lookup or keep orphaned records in the shared cache forever.
      for (const field of ['settings', 'sessions', 'todos', 'notes']) {
        if (value[field] === undefined) continue;
        if (!isPlainRecord(value[field])) return false;
        if (Object.keys(value[field]).some((key) => !liveBoardKeys.has(key))) return false;
      }
      // Settings reads prompt rows directly (`prompt.id`, `prompt.text`) and
      // renders them; a malformed prompt in an otherwise valid answer would
      // throw during the first paint. Validate the shape before adoption too.
      if (value.prompts !== undefined) {
        if (!Array.isArray(value.prompts) || value.prompts.length > MAX_PROMPTS) return false;
        const seenPromptIds = new Set();
        for (const prompt of value.prompts) {
          if (
            prompt === null ||
            typeof prompt !== 'object' ||
            Array.isArray(prompt) ||
            typeof prompt.id !== 'string' ||
            prompt.id.length === 0 ||
            prompt.id.length > MAX_ID ||
            typeof prompt.name !== 'string' ||
            prompt.name.length > MAX_PROMPT_NAME ||
            typeof prompt.text !== 'string' ||
            prompt.text.length > MAX_PROMPT_TEXT
          ) {
            return false;
          }
          if (seenPromptIds.has(prompt.id)) return false;
          seenPromptIds.add(prompt.id);
        }
      }
      // Session lists are consumed directly by the header and the ledger; keep
      // their shape bounded before any consumer walks them.
      if (value.sessions !== undefined) {
        const ownedSessionIds = new Set();
        for (const list of Object.values(value.sessions)) {
          if (
            !Array.isArray(list) ||
            list.length > MAX_SESSIONS_PER_BOARD ||
            !list.every((sessionId) => typeof sessionId === 'string' && sessionId.length > 0 && sessionId.length <= MAX_ID)
          ) {
            return false;
          }
          // A Session belongs to exactly one board. A document that lists the
          // same id under two keys makes the header label and the model-memory
          // writer disagree about its owner; the Host drops the later copy on
          // normalization, so reject the malformed answer before it is cached.
          for (const sessionId of list) {
            if (ownedSessionIds.has(sessionId)) return false;
            ownedSessionIds.add(sessionId);
          }
        }
      }
      // Settings bags are rendered directly (prompt switches and skill chips).
      // A malformed bag used to reach `enabled.map(...)` and could put an
      // object into a React child; require the exact collection shapes the
      // Host writes before adopting a response.
      if (value.settings !== undefined) {
        for (const bag of Object.values(value.settings)) {
          if (!isPlainRecord(bag)) return false;
          if (
            bag.promptIds !== undefined &&
            (!Array.isArray(bag.promptIds) ||
              bag.promptIds.length > MAX_PROMPTS ||
              !bag.promptIds.every((id) => typeof id === 'string' && id.length > 0 && id.length <= MAX_ID))
          ) {
            return false;
          }
          if (
            bag.skills !== undefined &&
            (!Array.isArray(bag.skills) ||
              bag.skills.length > MAX_SKILLS ||
              !bag.skills.every((name) => typeof name === 'string' && name.length > 0 && name.length <= MAX_SKILL_NAME))
          ) {
            return false;
          }
          if (bag.modelSelection !== undefined && modelSelectionOfValue(bag.modelSelection) === undefined) return false;
        }
      }
      // The to-do and note pages render these fields as React children. A
      // malformed record from a proxy could otherwise put an object where a
      // string belongs and crash the page during its first paint.
      const isTodoRow = (item) =>
        isPlainRecord(item) &&
        typeof item.id === 'string' &&
        item.id.length > 0 &&
        item.id.length <= MAX_ID &&
        typeof item.title === 'string' &&
        item.title.length <= MAX_TODO_TITLE &&
        typeof item.note === 'string' &&
        item.note.length <= MAX_TODO_NOTE;
      const isNoteRow = (item) =>
        isPlainRecord(item) &&
        typeof item.id === 'string' &&
        item.id.length > 0 &&
        item.id.length <= MAX_ID &&
        typeof item.title === 'string' &&
        item.title.length <= MAX_NOTE_TITLE &&
        typeof item.body === 'string' &&
        item.body.length <= MAX_NOTE_BODY &&
        (item.tags === undefined ||
          (Array.isArray(item.tags) &&
            item.tags.length <= MAX_NOTE_TAGS &&
            item.tags.every((tag) => typeof tag === 'string' && tag.length <= 40)));
      const isUniqueRowList = (list, check, limit) => {
        if (!Array.isArray(list) || list.length > limit) return false;
        const ids = new Set();
        for (const item of list) {
          if (!check(item) || ids.has(item.id)) return false;
          ids.add(item.id);
        }
        return true;
      };
      if (value.todos !== undefined) {
        for (const list of Object.values(value.todos)) {
          if (!isUniqueRowList(list, isTodoRow, MAX_TODOS_PER_BOARD)) return false;
        }
      }
      if (value.notes !== undefined) {
        for (const list of Object.values(value.notes)) {
          if (!isUniqueRowList(list, isNoteRow, MAX_NOTES_PER_BOARD)) return false;
        }
      }
      if (
        value.workspace !== undefined &&
        (typeof value.workspace !== 'string' || value.workspace.length > MAX_WORKSPACE_PATH)
      ) {
        return false;
      }
      return true;
    }

    /**
     * The one workbench document both surfaces read and write.
     *
     * The Host document stays the single source of truth. This is a cache with a
     * subscriber list, not a second source: every write goes through the Host and
     * the answer replaces the cache.
     */
    // A second WebGUI tab has its own module instance and its own cache. Without
    // a notification, two tabs that were opened before either save overwrite
    // each other with their stale whole-document POSTs. The channel only carries
    // a commit signal; the receiver re-reads the authoritative document.
    //
    // The channel is opened by the plugin effect rather than at module
    // evaluation: a disabled-then-re-enabled plugin used to keep a channel that
    // its own teardown had already closed, silently losing cross-tab sync until
    // a full page reload.
    let documentChannel = null;
    const documentChannelTag = uid('tab');

    /** Open one cross-tab channel, or null when the WebView refuses it. */
    function openDocumentChannel() {
      if (typeof BroadcastChannel !== 'function') return null;
      try {
        return new BroadcastChannel('dsh-workbench-document');
      } catch {
        // A WebView can expose the constructor but refuse it. Cross-tab sync is
        // an enhancement; refusing it must not take the whole plugin down.
        return null;
      }
    }
    /** Stable empty document for the first paint; a fresh object would break memo dependencies. */
    const EMPTY_DOCUMENT = { boards: [], prompts: [], settings: {}, sessions: {} };
    const store = {
      document: null,
      /** Last document the Host accepted (or a read adopted); the rollback target. */
      durable: null,
      version: 0,
      error: '',
      listeners: new Set(),
      writeSeq: 0,
      readSeq: 0,
      /** Writes that have started but not yet settled, so a read cannot overwrite one. */
      pendingWrites: 0,
      /** Serializes whole-document writes so their network order matches click order. */
      writeQueue: Promise.resolve(),
      /** An in-flight document read, shared by every surface that opens at once. */
      loadPromise: null,
      /** Whether the shared read was started with `force`; a forced caller must not inherit a non-forced one. */
      loadForce: false,
      current() {
        return store.document ?? EMPTY_DOCUMENT;
      },
      writable() {
        return store.document !== null;
      },
      notify() {
        store.version += 1;
        for (const listener of store.listeners) {
          try {
            listener();
          } catch {
            /* a broken subscriber must not break the write that notified it */
          }
        }
      },
      adopt(document) {
        store.document = document;
        store.durable = document;
        store.error = '';
        // The Session map is part of every adopted document, not only the one
        // a page load reads. Without this, a document refreshed by the reminder
        // clock or recovered after a failed save could leave `boardSessions`
        // pointing at an older conversation, so the next click creates a
        // duplicate instead of reopening the recorded one.
        adoptSavedSessions(document);
        store.notify();
      },
      async load(options) {
        const force = options?.force === true;
        if (store.document !== null && !force) return store.document;
        // Every surface asks for the document as it mounts: the plugin
        // bootstrap, the workbench page and Settings all open around the same
        // moment. Share the in-flight GET so one page open does not issue the
        // same read two or three times for one answer. A forced caller must
        // not inherit a non-forced read: that answer may predate the change it
        // is being asked to see.
        if (store.loadPromise !== null && (store.loadForce || !force)) return store.loadPromise;
        const task = store.loadOnce(options);
        store.loadPromise = task;
        store.loadForce = force;
        task.then(
          () => {
            if (store.loadPromise === task) {
              store.loadPromise = null;
              store.loadForce = false;
            }
          },
          () => {
            if (store.loadPromise === task) {
              store.loadPromise = null;
              store.loadForce = false;
            }
          },
        );
        return task;
      },
      async loadOnce(options) {
        if (store.document !== null && options?.force !== true) return store.document;
        const writeAtStart = store.writeSeq;
        // A read that starts or ends while a write is in flight must not adopt an
        // answer that can predate the optimistic edit. The sequence check alone
        // misses the case where the write started BEFORE this read.
        const pendingAtStart = store.pendingWrites;
        const seq = (store.readSeq += 1);
        try {
          const response = await fetchWithTimeout(`${API}/state`, { headers: { 'cache-control': 'no-cache' } }, 15000);
          if (!response.ok) {
            discardResponseBody(response);
            throw new Error(`HTTP ${response.status}`);
          }
          const document = await readJsonWithTimeout(response);
          if (pendingAtStart > 0 || store.pendingWrites > 0 || store.writeSeq !== writeAtStart || seq !== store.readSeq) {
            return store.current();
          }
          // A proxy or a broken Host must not turn an array/null answer into the
          // shared document: every consumer below assumes an object.
          if (!isDocument(document)) throw new Error(translate()('error.invalidDocument'));
          // The reminder clock re-reads the whole document every fifth beat. A
          // byte-identical answer is the common case, and re-adopting it would
          // re-render every `useDocument` consumer for no change.
          let unchanged = false;
          try {
            unchanged = store.document !== null && JSON.stringify(store.document) === JSON.stringify(document);
          } catch {
            /* a value JSON cannot stringify is not a document we adopted */
          }
          if (unchanged) {
            store.error = '';
            return store.document;
          }
          store.adopt(document);
          return document;
        } catch (problem) {
          // A stale read that was superseded by a newer one must not publish its
          // error over the newer answer.
          if (seq !== store.readSeq) return store.current();
          store.error = problem instanceof Error ? problem.message : String(problem);
          store.notify();
          return store.current();
        }
      },
      async save(next) {
        if (!store.writable()) throw new Error(store.error || translate()('error.notLoaded'));
        const previous = store.durable ?? store.document;
        const seq = (store.writeSeq += 1);
        store.pendingWrites += 1;
        store.document = next;
        store.notify();
        const operation = async () => {
          // The legacy /workspace route may change the shared default. A document
          // save queued before that change must not carry the old path back and
          // undo it, so the live workspace is read at send time.
          const payload = { ...next };
          if (store.document !== null && typeof store.document.workspace === 'string') {
            payload.workspace = store.document.workspace;
          }
          try {
            const response = await fetchWithTimeout(
              `${API}/state`,
              {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
              },
              30000,
            );
            if (!response.ok) {
              discardResponseBody(response);
              throw new Error(`HTTP ${response.status}`);
            }
            // The Host accepted this payload. Remember it as the rollback target
            // even when a newer optimistic save has already replaced the screen;
            // a failed newer save must fall back to the last durable document,
            // not to an earlier unacknowledged edit.
            store.durable = payload;
            // The success answer is `{saved:true}` and nothing reads it.
            discardResponseBody(response);
            // Announce only after the Host accepted the write, so another tab
            // never reloads a document that was still only optimistic here.
            // A superseded save must stay silent: its signal could make the
            // other tab adopt an intermediate document between two commits,
            // while the newer save will announce the final one.
            if (store.writeSeq === seq) {
              store.error = '';
              try {
                documentChannel?.postMessage({ type: 'saved', tag: documentChannelTag });
              } catch {
                /* the document is durably stored; only the signal was lost */
              }
            }
            return next;
          } catch (problem) {
            // A later save already owns the surface. Replacing it with the answer
            // to this older, failed request would lose the newer edit until reload.
            if (store.writeSeq !== seq) throw problem;
            store.error = problem instanceof Error ? problem.message : String(problem);
            const response = await fetchWithTimeout(`${API}/state`, {}, 15000).catch(() => null);
            let recovered = false;
            if (response !== null && response.ok) {
              // A save that started while this recovery read was in flight owns
              // the surface now; adopting this answer would undo it.
              if (store.writeSeq !== seq) {
                discardResponseBody(response);
                throw problem;
              }
              let document;
              try {
                document = await readJsonWithTimeout(response);
              } catch (error) {
                if (store.writeSeq !== seq) throw error;
                document = null;
              }
              if (store.writeSeq !== seq) {
                discardResponseBody(response);
                throw problem;
              }
              if (isDocument(document)) {
                // Put the durable document back on screen, but still reject:
                // the write itself failed, so a caller must not show "saved",
                // dismiss a reminder, or keep an optimistic edit.
                store.adopt(document);
                recovered = true;
              }
            } else if (response !== null) {
              discardResponseBody(response);
            }
            if (!recovered) {
              // The write failed and the durable copy could not be read back.
              // Keeping `next` on screen would present an edit the Host never
              // accepted as if it were saved; restore the last known document
              // and let the caller surface the failure. A newer queued save
              // owns the surface and must not be overwritten.
              if (store.writeSeq === seq) {
                store.document = previous;
                store.notify();
              }
            }
            throw problem;
          }
        };
        const result = store.writeQueue
          .then(operation, operation)
          .finally(() => {
            store.pendingWrites -= 1;
          });
        // Keep the chain alive after a refused write, exactly as the Host queue does.
        store.writeQueue = result.then(
          () => undefined,
          () => undefined,
        );
        return result;
      },
      update(patch) {
        const current = store.current();
        let changes;
        try {
          changes = typeof patch === 'function' ? patch(current) : patch;
        } catch (problem) {
          // Every caller already handles a rejected save; a synchronous throw
          // from an updater (for example while a foreign/malformed document is
          // being edited) must follow the same path instead of escaping the
          // event handler uncaught.
          return Promise.reject(problem);
        }
        return store.save({ ...current, ...changes });
      },
      saveSettings(key, patch) {
        return store.update((document) => {
          const settings = typeof document.settings === 'object' && document.settings !== null ? document.settings : {};
          const previous = { ...(settings[key] ?? {}) };
          // An updater is read from the LIVE document at write time. A rapid
          // pair of skill clicks used to both start from the array captured at
          // render time, so the second click could silently drop the first.
          const values = typeof patch === 'function' ? patch(previous) : patch;
          const bag = { ...previous, ...values };
          for (const [name, value] of Object.entries(bag)) {
            if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) delete bag[name];
          }
          const next = { ...settings };
          if (Object.keys(bag).length === 0) delete next[key];
          else next[key] = bag;
          return { settings: next };
        });
      },
    };

    /** Re-render the caller whenever the shared document changes. */
    function useDocument() {
      const [version, setVersion] = useState(store.version);
      useEffect(() => {
        const listener = () => setVersion(store.version);
        store.listeners.add(listener);
        // A store update can land between this render and the effect
        // subscription; without this catch-up the component would stay on the
        // old snapshot until the next unrelated update.
        if (store.version !== version) setVersion(store.version);
        return () => {
          store.listeners.delete(listener);
        };
        // `version` is intentionally read on mount only; later changes are
        // delivered by the subscription.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return store.current();
    }

    /**
     * The working area a board actually runs in.
     *
     * A main board's own override wins; otherwise the document's default applies.
     * Sub-boards pass their parent board and inherit it.
     */
    function workspaceForBoard(document, board) {
      const own = board !== null && typeof board === 'object' && typeof board.workspace === 'string' ? board.workspace : '';
      if (own.length > 0) return own;
      return typeof document?.workspace === 'string' && document.workspace.length > 0 ? document.workspace : WORKSPACE_FALLBACK;
    }

    /**
     * Ensure a board's working directory exists, without registering it as a
     * DSH Workspace here.
     *
     * The directory still has to exist before `session/create`; the Host's
     * `/workspace/ensure` route validates the same Windows path rules and
     * `mkdir`s it without changing the document's shared default. Workspace
     * registration itself is handled separately by {@link ensureWorkspace},
     * because the shell needs a Workspace to navigate to the Session. The
     * answer is shared by concurrent opens of the same path.
     * @param board - the main board whose working area is needed.
     * @returns the absolute path, or undefined when the Host refused it.
     */
    async function ensureDirectory(board) {
      let path = board !== undefined && typeof board.workspace === 'string' ? board.workspace : '';
      if (path.length === 0 && typeof store.current().workspace === 'string') path = store.current().workspace;
      if (path.length === 0) path = workspaceDefaultPath;
      if (path.length === 0) {
        try {
          const response = await fetchWithTimeout(`${API}/workspace`, { headers: { 'cache-control': 'no-cache' } }, 15000);
          if (response.ok) {
            const payload = await readJsonWithTimeout(response);
            if (typeof payload.path === 'string' && payload.path.length > 0) {
              path = payload.path;
              workspaceDefaultPath = path;
            }
          } else {
            discardResponseBody(response);
          }
        } catch {
          /* an unanswered route leaves the Host's own default in charge */
        }
      }
      if (path.length === 0) path = WORKSPACE_FALLBACK;
      const inFlight = directoryPending.get(path);
      if (inFlight !== undefined) return inFlight;
      const task = (async () => {
        try {
          const response = await fetchWithTimeout(
            `${API}/workspace/ensure`,
            {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ path }),
            },
            15000,
          );
          if (!response.ok) {
            // A client can briefly outlive an older Host after a hot reload.
            // That Host has no `/workspace/ensure`; skip the directory probe
            // and let `session/create` validate the existing path instead of
            // falling back to the settings route (which would persist the
            // board's path as the shared default).
            if (response.status === 404) return path;
            discardResponseBody(response);
            return undefined;
          }
          const payload = await readJsonWithTimeout(response);
          return typeof payload?.path === 'string' && payload.path.length > 0 ? payload.path : path;
        } catch {
          return undefined;
        } finally {
          directoryPending.delete(path);
        }
      })();
      directoryPending.set(path, task);
      return task;
    }

    /**
     * Resolve the DSH Workspace that owns a board's working area.
     *
     * Newer shells only navigate to a Session through a registered Workspace;
     * a Session created with a bare `cwd` is addressable but `openSession()`
     * falls back to the "choose a workspace" screen. Registering the board's
     * directory as a Workspace is idempotent, and the Workspace id lets the
     * Session be created and opened in one navigation action.
     * @param ctx - client plugin context.
     * @param path - absolute board working area.
     * @returns the Workspace id, or undefined when the service is unavailable.
     */
    async function ensureWorkspace(ctx, path) {
      const cached = workspaceIds.get(path);
      if (cached !== undefined) return cached;
      const workspaces = ctx.get('workspaces');
      if (workspaces === undefined || workspaces === null || typeof workspaces.create !== 'function') return undefined;
      try {
        const view = await workspaces.create({ path });
        if (view !== null && typeof view === 'object' && typeof view.workspaceId === 'string' && view.workspaceId.length > 0) {
          workspaceIds.set(path, view.workspaceId);
          return view.workspaceId;
        }
      } catch {
        /* an older shell may not register Workspaces; keep the cwd fallback */
      }
      return undefined;
    }

    /**
     * The board identity beside the mode chip.
     *
     * Stores the ids, not localized names: the header action resolves them
     * against the live document, so a board rename and a locale switch both show
     * the current words.
     */
    function boardLabel(board, child) {
      return { boardId: board.id, childId: child === undefined ? '' : child.id };
    }

    /**
     * Create one fresh Session for a board and record it.
     *
     * A board's prompt, skills and remembered model selection are properties of
     * the BOARD rather than of one conversation, so a conversation created here
     * carries the same instruction and starts on the same model as the board's
     * previous conversation.
     */
    async function createBoardSession(ctx, board, child, key) {
      // Two clicks can arrive before React commits the busy state. Share the
      // in-flight creation for one board key so the Host is asked for one
      // Session, not two identical conversations.
      const inFlight = sessionPending.get(key);
      if (inFlight !== undefined) return inFlight;
      const task = (async () => {
        const sessions = ctx.get('sessions');
        if (sessions === undefined || sessions === null) throw new Error(translate()('error.sessionsUnavailable'));
        const workspacePath = await ensureDirectory(board);
        if (workspacePath === undefined) throw new Error(translate()('error.workspaceUnavailable'));
        // Read the board's remembered selection before creating. The Session is
        // still created through the shipped service; the workbench Host applies
        // the selection immediately afterwards, without touching the deployment
        // default, so the first request already uses it. A forced read folds in
        // the Host-side `model/selection` write that happened outside this tab.
        const latestDocument = await store.load({ force: true }).catch(() => store.current());
        const modelSelection = modelSelectionForBoard(latestDocument, key, ctx);
        // A Workspace-attached Session is the one the shell can navigate to
        // directly. A bare `cwd` Session remains the fallback for older shells
        // that have no Workspace service, but in the current shell it lands on
        // the workspace chooser instead of the conversation.
        const workspaceId = await ensureWorkspace(ctx, workspacePath);
        const request = workspaceId === undefined ? { cwd: workspacePath } : { workspaceId };
        const preset = agentPresetOf(board, child);
        if (preset !== 'standard') request.agentPreset = preset;
        const sessionId = await sessions.create(request);
        // A service that answers without an id must not put `undefined` into the
        // document or hand it to `openSession`, where it becomes a dead selection.
        if (typeof sessionId !== 'string' || sessionId.length === 0) {
          throw new Error(translate()('error.sessionsUnavailable'));
        }
        if (modelSelection !== undefined) {
          await applySessionModelSelection(ctx, sessionId, modelSelection);
        }
        boardSessions.set(key, sessionId);
        sessionLabels.set(sessionId, boardLabel(board, child));
        notifyLabels();
        rememberSession(key, sessionId);
        return sessionId;
      })();
      sessionPending.set(key, task);
      try {
        return await task;
      } finally {
        if (sessionPending.get(key) === task) sessionPending.delete(key);
      }
    }

    /**
     * Open one board: ensure its Session exists, then select it through the
     * shipped navigation action.
     */
    async function openBoard(ctx, board, child, options) {
      const uiWorkspace = ctx.get('uiWorkspace');
      // Validate navigation before creating anything: a shell without
      // `uiWorkspace` must report the failure, not leave a brand-new Session
      // recorded in the document with no way to open it.
      if (uiWorkspace === undefined || uiWorkspace === null || typeof uiWorkspace.openSession !== 'function') {
        throw new Error(translate()('error.sessionsUnavailable'));
      }
      const key = child === undefined ? board.id : `${board.id}/${child.id}`;
      let sessionId;
      let createdHere = false;

      if (options?.fresh === true) {
        sessionId = await createBoardSession(ctx, board, child, key);
        createdHere = true;
      } else {
        sessionId = boardSessions.get(key);
        if (sessionId === undefined) {
          sessionId = await createBoardSession(ctx, board, child, key);
          createdHere = true;
        } else if (!sessionLabels.has(sessionId)) {
          sessionLabels.set(sessionId, boardLabel(board, child));
          notifyLabels();
        }
      }
      // Pre-workspace builds recorded `cwd`-only Sessions. Registering the
      // board's working area gives the shell a Workspace for that path; a
      // Session created just above already did this, so only the recorded path
      // pays for the second lookup.
      if (!createdHere) {
        const workspacePath = await ensureDirectory(board);
        if (workspacePath !== undefined) await ensureWorkspace(ctx, workspacePath);
      }
      uiWorkspace.openSession(sessionId);
      return sessionId;
    }

    /**
     * Whether a recorded Session can no longer be shown.
     *
     * `uiWorkspace.openSession()` only selects; it does not report a dead id.
     * An archived Session silently falls through to the workspace chooser, which
     * is why clicking a board could appear to do nothing. The workspace registry
     * is the authority on archiving, and the loaded Session list is the authority
     * on whether the id still exists; when the list is still loading, the open
     * path is left in charge rather than guessing.
     * @param ctx - client context.
     * @param sessionId - a recorded Session id.
     * @returns whether the id is archived or absent from a ready list.
     */
    function sessionUnavailable(ctx, sessionId) {
      try {
        const workspaces = ctx.get('workspaces');
        const state = workspaces?.list?.getSnapshot?.();
        if (Array.isArray(state?.archivedSessionIds) && state.archivedSessionIds.includes(sessionId)) return true;
        const sessions = ctx.get('sessions');
        const list = sessions?.list?.getSnapshot?.();
        if (list?.phase === 'ready' && list.byId !== undefined && list.byId[sessionId] === undefined) return true;
      } catch {
        /* an unavailable service leaves the existing open path in charge */
      }
      return false;
    }

    /**
     * Open a board, recovering from a Session that no longer exists.
     *
     * A recorded Session can be gone: archived elsewhere, deleted with its
     * workspace, or lost with an older profile. This retries ONCE with a brand-new
     * Session and records it, so a dead id heals itself.
     */
    async function openBoardResilient(ctx, board, child, options) {
      const key = child === undefined ? board.id : `${board.id}/${child.id}`;
      if (options?.fresh !== true) {
        const recorded = boardSessions.get(key);
        if (recorded !== undefined && sessionUnavailable(ctx, recorded)) {
          boardSessions.delete(key);
          sessionLabels.delete(recorded);
          notifyLabels();
          await forgetSession(key, recorded);
          return openBoard(ctx, board, child, { fresh: true });
        }
      }
      try {
        return await openBoard(ctx, board, child, options);
      } catch (problem) {
        const dead = boardSessions.get(key);
        const message = problem instanceof Error ? problem.message : String(problem);
        // The shipped services carry a stable code on their not-found errors;
        // matching the code first keeps the recovery working when the visible
        // message is localized or wrapped by another layer.
        const code = problem !== null && typeof problem === 'object' && typeof problem.code === 'string' ? problem.code : '';
        const missingSession =
          /unknown session|no such session/i.test(message) ||
          /session[^\n]*not found|not found[^\n]*session/i.test(message) ||
          /(^|\/)session\/not-found$|SESSION_QUERY_SESSION_NOT_FOUND/i.test(code);
        if (dead === undefined || !missingSession) {
          throw problem;
        }
        boardSessions.delete(key);
        sessionLabels.delete(dead);
        notifyLabels();
        forgetSession(key, dead);
        return openBoard(ctx, board, child, { fresh: true });
      }
    }

    /** Remove one Session id from a board's recorded list. */
    function forgetSession(key, sessionId) {
      store
        .update((document) => {
          const sessions = document.sessions && typeof document.sessions === 'object' ? document.sessions : {};
          const list = sessionListOf(sessions[key]).filter((item) => item !== sessionId);
          const next = { ...sessions };
          if (list.length === 0) delete next[key];
          else next[key] = list;
          return { sessions: next };
        })
        .catch(() => {
          /* the mapping is a convenience; a failure only costs a reload */
        });
    }

    /**
     * Retire the blank Sessions that older workbench builds registered in a
     * user's Workspace.
     *
     * Before board Sessions were created with `cwd`, a Workbench board could
     * leave a blank Session in `workspace.sessionIds`; the shell's workspace
     * new-session action would then reuse it as if it were an ordinary blank.
     * Only a Session that both the workbench document records and a Workspace
     * still contains is eligible, and only while it is genuinely blank. The
     * archive set is global, so this is safe even after a Workspace row has
     * been removed; `forgetSession` then drops the dead id from the document.
     * @param ctx - client plugin context.
     * @param document - current workbench document.
     * @returns a promise that settles after every eligible id is processed.
     */
    async function retireLegacyBlankBoardSessions(ctx, document) {
      const sessions = ctx === null || ctx === undefined ? undefined : ctx.get('sessions');
      const workspaces = ctx === null || ctx === undefined ? undefined : ctx.get('workspaces');
      const byId = sessions?.list?.getSnapshot?.()?.byId;
      const workspaceSnapshot = workspaces?.list?.getSnapshot?.();
      const items = Array.isArray(workspaceSnapshot?.items) ? workspaceSnapshot.items : [];
      if (byId === undefined || items.length === 0) return;
      const attached = new Set();
      for (const item of items) {
        if (item === null || typeof item !== 'object' || !Array.isArray(item.sessionIds)) continue;
        for (const sessionId of item.sessionIds) {
          if (typeof sessionId === 'string' && sessionId.length > 0) attached.add(sessionId);
        }
      }
      if (attached.size === 0) return;
      const jobs = [];
      const recorded =
        document !== null && typeof document === 'object' && document.sessions !== null && typeof document.sessions === 'object'
          ? document.sessions
          : {};
      const now = Date.now();
      // The cleanup was written for blank Sessions left by older `cwd`-only
      // builds. Now that new board Sessions are created with a `workspaceId`,
      // they are also blank until the first message and are listed in the same
      // Workspace. Never archive the newest conversation of a board, the
      // currently retained one, or one created moments ago: those are exactly
      // what a user gets after clicking “new conversation” and has not typed
      // into yet.
      const BLANK_SESSION_GRACE_MS = 10 * 60 * 1000;
      for (const [key, value] of Object.entries(recorded)) {
        for (const sessionId of sessionListOf(value)) {
          const summary = byId[sessionId];
          if (summary === null || typeof summary !== 'object' || summary.blank !== true || !attached.has(sessionId)) continue;
          if (boardSessions.get(key) === sessionId) continue;
          if (summary.running === true || (Number(summary.retainedBy?.mainView) || 0) > 0) continue;
          const updatedAt = Number(summary.updatedAt);
          if (Number.isFinite(updatedAt) && now - updatedAt < BLANK_SESSION_GRACE_MS) continue;
          jobs.push(
            (async () => {
              try {
                if (typeof workspaces.archiveSession !== 'function') return;
                await workspaces.archiveSession(sessionId);
              } catch {
                return;
              }
              sessionLabels.delete(sessionId);
              if (boardSessions.get(key) === sessionId) boardSessions.delete(key);
              notifyLabels();
              await forgetSession(key, sessionId);
            })(),
          );
        }
      }
      await Promise.all(jobs);
    }

    /** Persist one board's new Session id at the head of its list. */
    function rememberSession(key, sessionId) {
      store
        .update((document) => {
          const sessions = document.sessions && typeof document.sessions === 'object' ? document.sessions : {};
          const list = sessionListOf(sessions[key]).filter((item) => item !== sessionId);
          // A board keeps at most forty conversations. Prepending without
          // re-applying the same bound left the optimistic document at 41 and
          // made the header/list disagree with what the Host stored.
          return { sessions: { ...sessions, [key]: sessionListOf([sessionId, ...list]) } };
        })
        .catch(() => {
          /* the mapping is a convenience; a failure only costs a reload */
        });
    }

    /**
     * Whether a board (or sub-board) opens a surface of its own rather than a
     * conversation.
     */
    function isSurfaceBoard(board) {
      return board !== undefined && board !== null && (board.kind === 'todo' || board.kind === 'note');
    }

    /**
     * The mode a conversation Session under one board key should run.
     *
     * A chat folder is the user's mode choice for its whole branch: its chat
     * sub-boards inherit `chat` even when an older build stamped them with the
     * generic `standard` default. Outside a chat folder, the sub-board's own
     * mode wins.
     */
    function sessionModeOf(board, child) {
      if (child === undefined || child === null) return board.mode;
      if (board.mode === 'chat') return 'chat';
      return child.mode;
    }

    /**
     * The Agent preset a new Session under one board key should run.
     *
     * `workbench-chat` is reserved for a chat branch. Every other board runs
     * one of the four built-in presets, with `standard` as the omitted default.
     * Missing or malformed values fall back to `standard` instead of sending an
     * unknown preset to `sessions.create`.
     */
    function agentPresetOf(board, child) {
      if (sessionModeOf(board, child) === 'chat') return CHAT_PRESET;
      const value = child === undefined || child === null ? board.agentPreset : child.agentPreset;
      return AGENT_PRESETS.includes(value) ? value : 'standard';
    }

    /**
     * Repair sub-boards a previous build created under a chat folder.
     *
     * Settings used to stamp every new sub-board with `standard`, so chat
     * folders carried children that opened the standard preset. The parent's
     * mode is the real intent; only conversation children are touched.
     * @param document - the workbench document.
     * @returns the repaired document, or null when nothing needed repair.
     */
    function normalizeChatSubBoards(document) {
      const boards = document !== null && typeof document === 'object' && Array.isArray(document.boards) ? document.boards : null;
      if (boards === null) return null;
      let changed = false;
      const next = boards.map((board) => {
        if (board === null || typeof board !== 'object' || board.mode !== 'chat' || !Array.isArray(board.children)) return board;
        let childChanged = false;
        const children = board.children.map((child) => {
          if (child === null || typeof child !== 'object' || child.kind !== 'chat') return child;
          if (child.mode === 'chat' && child.agentPreset === undefined) return child;
          childChanged = true;
          const next = { ...child, mode: 'chat' };
          // A chat branch cannot carry a non-default preset; leaving the field
          // behind would make a hand-edited document disagree with its mode.
          delete next.agentPreset;
          return next;
        });
        if (!childChanged) return board;
        changed = true;
        return { ...board, children };
      });
      return changed ? { ...document, boards: next } : null;
    }

    // ── dates, records, and ordering ──────────────────────────────────────────

    /**
     * Which build this is: the time it was compiled and a hash of the bytes it
     * wrote. The plugin bundle is served as a year-cached immutable resource, so
     * a page can keep running an older build than the one on disk — and nothing
     * on screen would say so. This stamp is printed in the ledger's footer.
     */
    const BUILD_STAMP = { at: "2026-11-12T13:01:20.186Z", rev: "0d541185" };

    /** Two digits, zero padded. */
    function pad2(value) {
      return value < 10 ? `0${value}` : String(value);
    }

    /** The local calendar day of a date, as `YYYY-MM-DD`. */
    function dayKeyOf(date) {
      return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    }

    /** Today, as the local calendar day. */
    function todayKey() {
      return dayKeyOf(new Date());
    }

    /** A local `YYYY-MM-DDTHH:mm` stamp, the shape both date fields edit. */
    function stampOf(date) {
      return `${dayKeyOf(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    }

    /** Milliseconds of a stamp, or NaN when it is not one. */
    function stampMs(value) {
      if (typeof value !== 'string' || value.length === 0) return NaN;
      const at = Date.parse(value);
      return Number.isFinite(at) ? at : NaN;
    }

    /**
     * The calendar day a due or reminder value names.
     *
     * `dueAt` is stored as a day (`YYYY-MM-DD`) because a to-do is due on a day,
     * not at a minute; a reminder is stored as the full local stamp. Both answer
     * this function.
     */
    function dayOfStamp(value) {
      if (typeof value !== 'string') return '';
      const at = value.indexOf('T');
      return at > 0 ? value.slice(0, at) : value;
    }

    /** The `HH:mm` part of a stamp, or "". */
    function timeLabel(value) {
      if (typeof value !== 'string') return '';
      const at = value.indexOf('T');
      return at > 0 ? value.slice(at + 1, at + 6) : '';
    }

    /** A day as the user says it: 今天 / 明天 / 昨天, then a short date. */
    function dayLabel(day, t) {
      if (typeof day !== 'string' || day.length === 0) return '';
      const now = new Date();
      if (day === dayKeyOf(now)) return t('time.today');
      // Calendar arithmetic, not a fixed 24 h: a daylight-saving transition can
      // make tomorrow's local date 23 or 25 hours after this instant.
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      if (day === dayKeyOf(tomorrow)) return t('time.tomorrow');
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      if (day === dayKeyOf(yesterday)) return t('time.yesterday');
      const parts = day.split('-').map((part) => Number(part));
      // A hand-edited or partially typed stamp must not render as `NaN月NaN日`.
      if (parts.length !== 3 || !parts.every((part) => Number.isFinite(part))) return day;
      if (parts[1] < 1 || parts[1] > 12 || parts[2] < 1 || parts[2] > 31) return day;
      const current = new Date().getFullYear();
      return parts[0] === current
        ? fill(t('time.monthDay'), { month: parts[1], day: parts[2] })
        : fill(t('time.yearMonthDay'), { year: parts[0], month: parts[1], day: parts[2] });
    }

    /** A whole stamp as the user says it: 今天 18:00. */
    function stampLabel(value, t) {
      const day = dayLabel(dayOfStamp(value), t);
      const time = timeLabel(value);
      if (day.length === 0) return '';
      return time.length === 0 ? day : `${day} ${time}`;
    }

    /** How a to-do stands against today. */
    function dueState(item) {
      const day = dayOfStamp(item !== null && typeof item === 'object' ? item.dueAt : '');
      if (day.length === 0) return 'none';
      const today = todayKey();
      if (day < today) return 'overdue';
      if (day === today) return 'today';
      return 'later';
    }

    /**
     * A moment as the user says it: 刚刚 / 12 分钟前 / 昨天 / 10月26日.
     *
     * Notes show when they were last touched, and an absolute date there reads as
     * administration; the relative form is what a note surface wants.
     */
    function agoLabel(value, t) {
      const at = Number(value);
      if (!Number.isFinite(at) || at <= 0) return '';
      const delta = Date.now() - at;
      if (delta < 60000) return t('time.justNow');
      if (delta < 3600000) return fill(t('time.minutesAgo'), { count: Math.floor(delta / 60000) });
      if (delta < DAY_MS) return fill(t('time.hoursAgo'), { count: Math.floor(delta / 3600000) });
      return dayLabel(dayKeyOf(new Date(at)), t);
    }

    /** One board's to-do list, or an empty list. */
    function todoListOf(document, key) {
      const bag = document !== null && typeof document === 'object' ? document.todos : undefined;
      const list = bag !== null && typeof bag === 'object' ? bag[key] : undefined;
      return Array.isArray(list) ? list.filter((item) => item !== null && typeof item === 'object') : [];
    }

    /** One board's note list, or an empty list. */
    function noteListOf(document, key) {
      const bag = document !== null && typeof document === 'object' ? document.notes : undefined;
      const list = bag !== null && typeof bag === 'object' ? bag[key] : undefined;
      return Array.isArray(list) ? list.filter((item) => item !== null && typeof item === 'object') : [];
    }

    /**
     * Rewrite one board's list in a collection and persist it.
     *
     * The transform reads the list from the document it is given rather than
     * taking one computed during a render: two writes can be queued in one task,
     * and a list captured at render time would make the second write silently
     * drop the first one's change. An emptied list drops its key entirely.
     */
    function writeCollection(name, key, records, transform) {
      return store.update((document) => {
        const bag =
          document !== null && typeof document === 'object' && document[name] !== null && typeof document[name] === 'object'
            ? document[name]
            : {};
        const next = transform(records(document, key));
        const collections = { ...bag };
        if (next.length === 0) delete collections[key];
        else collections[key] = next;
        return { [name]: collections };
      });
    }

    /** Rewrite a board's to-do list from its current one. */
    function updateTodos(key, transform) {
      return writeCollection('todos', key, todoListOf, transform);
    }

    /** Rewrite a board's note list from its current one. */
    function updateNotes(key, transform) {
      return writeCollection('notes', key, noteListOf, transform);
    }

    /** A fresh to-do, with the fields the surfaces read. */
    function newTodo(title, note) {
      return {
        id: uid('todo'),
        title: String(title).slice(0, MAX_TODO_TITLE),
        note: typeof note === 'string' ? note.slice(0, MAX_TODO_NOTE) : '',
        done: false,
        priority: 'normal',
        dueAt: '',
        remindAt: '',
        remindedAt: '',
        createdAt: Date.now(),
        doneAt: 0,
      };
    }

    /** A fresh note or idea. */
    function newNote(block) {
      return {
        id: uid('note'),
        block: block === 'note' ? 'note' : 'idea',
        title: '',
        body: '',
        tags: [],
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    /**
     * Whether one to-do answers the selected view.
     *
     * The four count tiles are the filters, and `all` is the escape from them.
     */
    function matchesFilter(item, filter) {
      if (filter === 'all') return true;
      if (filter === 'done') return item.done === true;
      if (filter === 'today') return item.done !== true && dueState(item) === 'today';
      if (filter === 'overdue') return item.done !== true && dueState(item) === 'overdue';
      return item.done !== true;
    }

    /**
     * The order a to-do list is read in: open before done, then by due day, then
     * by priority, then by age — so the next thing to do is always the top row.
     */
    function sortTodos(list) {
      const rank = (priority) => {
        const at = PRIORITIES.indexOf(priority);
        return at < 0 ? 1 : at;
      };
      // The day drawer passes `{ key, item }` rows while the pages pass raw
      // records. Read through the wrapper so both callers sort by the record's
      // own due date, priority and age instead of three always-undefined fields.
      const itemOf = (row) =>
        row !== null && typeof row === 'object' && row.item !== null && typeof row.item === 'object' ? row.item : row;
      return [...list].sort((left, right) => {
        const leftItem = itemOf(left);
        const rightItem = itemOf(right);
        const leftDone = leftItem.done === true ? 1 : 0;
        const rightDone = rightItem.done === true ? 1 : 0;
        if (leftDone !== rightDone) return leftDone - rightDone;
        const leftDue = dayOfStamp(leftItem.dueAt).length > 0 ? dayOfStamp(leftItem.dueAt) : '9999-12-31';
        const rightDue = dayOfStamp(rightItem.dueAt).length > 0 ? dayOfStamp(rightItem.dueAt) : '9999-12-31';
        if (leftDue !== rightDue) return leftDue < rightDue ? -1 : 1;
        const leftRank = rank(leftItem.priority);
        const rightRank = rank(rightItem.priority);
        if (leftRank !== rightRank) return leftRank - rightRank;
        return Number(leftItem.createdAt ?? 0) - Number(rightItem.createdAt ?? 0);
      });
    }

    /** Notes read pinned first, then newest edit first. */
    function sortNotes(list) {
      return [...list].sort((left, right) => {
        const leftPinned = left.pinned === true ? 0 : 1;
        const rightPinned = right.pinned === true ? 0 : 1;
        if (leftPinned !== rightPinned) return leftPinned - rightPinned;
        return Number(right.updatedAt ?? 0) - Number(left.updatedAt ?? 0);
      });
    }

    /** The board key a line addresses: `boardId`, or `boardId/childId`. */
    function boardKeyOf(board, child) {
      return child === undefined ? board.id : `${board.id}/${child.id}`;
    }

    // ── reminders ─────────────────────────────────────────────────────────────

    /**
     * Reminders that have come due and have not been dealt with yet.
     *
     * The list is memory, not storage: what is stored is `remindedAt`, which is
     * what stops one reminder from firing twice, so a reload never repeats a
     * reminder the user already dismissed.
     */
    const reminderFeed = {
      items: [],
      listeners: new Set(),
    };
    /** Live desktop notifications, keyed by reminder id, so a dismissal closes them too. */
    const reminderNotifications = new Map();
    /** Reminders already announced in this page, so a refused write cannot loop. */
    const announced = new Set();
    /** The most announced ids remembered. */
    const MAX_ANNOUNCED = 400;

    function publishReminders() {
      for (const listener of reminderFeed.listeners) {
        try {
          listener();
        } catch {
          /* one reminder view failing must not suppress the others */
        }
      }
    }

    /**
     * Show one reminder: in the frame, and through the browser's own notification
     * when the user has allowed that. The second path is what reaches a user who
     * is in a conversation rather than on the to-do page.
     */
    function announceReminder(entry) {
      // Keep every due reminder visible in the scrollable stack. Capping the
      // list at four while acknowledging all of them silently dropped the
      // remainder; replacing the same reminder, even if a scanner produced it
      // under a different temporary id, keeps a retried acknowledgement from
      // producing a duplicate strip.
      const identity = (item) =>
        `${item.todoId ?? item.id ?? ''}\u0000${item.key ?? ''}\u0000${String(item.remindAt ?? '').slice(0, 16)}\u0000${item.title ?? ''}`;
      const key = identity(entry);
      reminderFeed.items = [entry, ...reminderFeed.items.filter((item) => item.id !== entry.id && identity(item) !== key)];
      publishReminders();
      try {
        const notify = typeof window !== 'undefined' ? window.Notification : undefined;
        // Replace the previous OS notification for the same reminder, so a
        // retried or renamed reminder cannot leave a stale sheet behind.
        const previous = reminderNotifications.get(entry.id);
        if (previous !== undefined) {
          reminderNotifications.delete(entry.id);
          try {
            previous.close();
          } catch {
            /* an already-closed notification is harmless */
          }
        }
        if (notify !== undefined && notify.permission === 'granted') {
          const note = new notify(entry.title, { body: stampLabel(entry.remindAt, translate()), tag: entry.id });
          reminderNotifications.set(entry.id, note);
          note.onclick = () => {
            if (typeof window !== 'undefined' && typeof window.focus === 'function') window.focus();
          };
          note.onclose = () => {
            if (reminderNotifications.get(entry.id) === note) reminderNotifications.delete(entry.id);
          };
        }
      } catch {
        /* a refused or unsupported notification never costs the in-frame one */
      }
    }

    /**
     * Fire every reminder that has come due.
     *
     * `remindedAt` is written back with the stamp that fired, so the same reminder
     * is announced once; a snooze clears it and sets a later stamp, which is what
     * makes 推迟 work.
     */
    async function scanReminders(now, options) {
      if (options?.fresh === true) {
        try {
          await store.load({ force: true });
        } catch {
          /* an unreachable Host leaves the cached document in charge */
        }
      }
      const document = store.current();
      const todos =
        document !== null && typeof document === 'object' && document.todos !== null && typeof document.todos === 'object'
          ? document.todos
          : {};
      const due = [];
      /** Announced rows whose acknowledgement has not landed yet. */
      const retry = [];
      for (const [key, list] of Object.entries(todos)) {
        if (!Array.isArray(list)) continue;
        for (const item of list) {
          if (item === null || typeof item !== 'object' || item.done === true) continue;
          const at = stampMs(item.remindAt);
          if (!Number.isFinite(at) || at > now) continue;
          if (item.remindedAt === item.remindAt) continue;
          const id = `${key}:${item.id}:${item.remindAt}`;
          if (announced.has(id)) {
            // Keep the toast single, but retry its durable acknowledgement:
            // a failed POST during a Host restart must not leave the reminder
            // permanently unacknowledged until the page is reloaded.
            retry.push({ key, item, at, id });
            continue;
          }
          due.push({ key, item, at, id });
        }
      }
      if (due.length === 0 && retry.length === 0) return;
      for (const entry of due) {
        announced.add(entry.id);
        while (announced.size > MAX_ANNOUNCED) {
          const oldest = announced.values().next();
          if (oldest.done) break;
          announced.delete(oldest.value);
        }
        announceReminder({
          id: entry.id,
          key: entry.key,
          todoId: entry.item.id,
          title:
            typeof entry.item.title === 'string' && entry.item.title.length > 0 ? entry.item.title : translate()('todo.untitled'),
          note: typeof entry.item.note === 'string' ? entry.item.note : '',
          priority: typeof entry.item.priority === 'string' ? entry.item.priority : 'normal',
          board: boardNameOf(document, entry.key),
          remindAt: entry.item.remindAt,
          dueAt: typeof entry.item.dueAt === 'string' ? entry.item.dueAt : '',
        });
      }
      // A retry only updates `remindedAt`; it must not publish a second toast.
      const acknowledge = due.length === 0 ? retry : [...due, ...retry];
      try {
        await store.update((current) => {
          const bag =
            current !== null && typeof current === 'object' && current.todos !== null && typeof current.todos === 'object'
              ? current.todos
              : {};
          const next = { ...bag };
          for (const entry of acknowledge) {
            const list = Array.isArray(next[entry.key]) ? next[entry.key] : [];
            next[entry.key] = list.map((row) =>
              // Acknowledge only the reminder that was actually announced. If
              // another tab moved the SAME to-do to a later time while this
              // scan was in flight, stamping `remindedAt` here would mark the
              // new reminder as already delivered and it would never fire.
              row !== null && typeof row === 'object' && row.id === entry.item.id && row.remindAt === entry.item.remindAt
                ? { ...row, remindedAt: entry.item.remindAt }
                : row,
            );
          }
          return { todos: next };
        });
      } catch {
        // The acknowledgement failed, but the toast has already been shown.
        // Keeping the id in `announced` prevents the next 20 s beat from
        // repeating the browser notification and stacking a duplicate toast;
        // the retry list above still re-attempts the durable stamp later.
      }
    }

    /** The board's current name for a reminder entry, or "" after a board is deleted. */
    function boardNameOf(document, key) {
      const boards =
        document !== null && typeof document === 'object' && Array.isArray(document.boards) ? document.boards : [];
      const [boardId, childId] = String(key).split('/');
      const board = boards.find((item) => item !== null && typeof item === 'object' && item.id === boardId);
      if (board === undefined) return '';
      if (childId === undefined || childId === '') return typeof board.name === 'string' ? board.name : '';
      const child = (Array.isArray(board.children) ? board.children : []).find(
        (item) => item !== null && typeof item === 'object' && item.id === childId,
      );
      return child !== undefined && typeof child.name === 'string' ? child.name : '';
    }

    /** Drop one announcement from the frame and close its desktop notification. */
    function dismissReminder(id) {
      reminderFeed.items = reminderFeed.items.filter((item) => item.id !== id);
      const note = reminderNotifications.get(id);
      if (note !== undefined) {
        reminderNotifications.delete(id);
        try {
          note.close();
        } catch {
          /* an already-closed notification is harmless */
        }
      }
      publishReminders();
    }

    /** Mark a reminded to-do done from the reminder itself. */
    function completeReminder(entry) {
      updateTodos(entry.key, (list) =>
        list.map((row) => (row.id === entry.todoId ? { ...row, done: true, doneAt: Date.now() } : row)),
      )
        .then(() => dismissReminder(entry.id))
        .catch(() => {
          /* keep the toast so a failed write can be retried */
        });
    }

    /** Push one reminder back by ten minutes. */
    function snoozeReminder(entry) {
      const later = stampOf(new Date(Date.now() + 10 * 60000));
      updateTodos(entry.key, (list) =>
        list.map((row) => (row.id === entry.todoId ? { ...row, remindAt: later, remindedAt: '' } : row)),
      )
        .then(() => dismissReminder(entry.id))
        .catch(() => {
          /* keep the toast so a failed write can be retried */
        });
    }

    // ── shared pieces ─────────────────────────────────────────────────────────

    /**
     * The menu: a small schedule strip, positioned at the pointer.
     *
     * A right-click is an accelerator, never a dead end: modules that carry their
     * own control open this same menu from it, and a row without a visible button
     * keeps the keyboard's ContextMenu / Shift+F10 route. Positioned at the
     * pointer, clamped inside the viewport, and dismissed by an outside press, a
     * scroll, Escape, or choosing an item.
     */
    function ContextMenu({ at, items, onClose }) {
      const ref = useRef(null);
      const closeRef = useRef(onClose);
      closeRef.current = onClose;
      const openerRef = useRef(null);
      const [place, setPlace] = useState({ x: at.x, y: at.y });

      useEffect(() => {
        const node = ref.current;
        if (node === null || typeof node.getBoundingClientRect !== 'function') return;
        const rect = node.getBoundingClientRect();
        const x = Math.max(8, Math.min(at.x, window.innerWidth - rect.width - 8));
        const y = Math.max(8, Math.min(at.y, window.innerHeight - rect.height - 8));
        if (x !== place.x || y !== place.y) setPlace({ x, y });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [at.x, at.y]);

      useEffect(() => {
        const node = ref.current;
        // Remember the control that opened the menu so closing it returns the
        // keyboard to that control instead of dropping focus to the body.
        openerRef.current = typeof document !== 'undefined' ? document.activeElement : null;
        const menuItems = () =>
          node === null ? [] : [...node.querySelectorAll('[role="menuitem"]:not(:disabled)')];
        const first = menuItems()[0];
        if (first !== undefined) first.focus();
        const away = (event) => {
          if (node !== null && event.target instanceof Node && node.contains(event.target)) return;
          closeRef.current();
        };
        const key = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closeRef.current();
            return;
          }
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') return;
          const rows = menuItems();
          if (rows.length === 0) return;
          event.preventDefault();
          const active = rows.indexOf(document.activeElement);
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? rows.length - 1
                : event.key === 'ArrowDown'
                  ? (active + 1) % rows.length
                  : (active <= 0 ? rows.length - 1 : active - 1);
          rows[next].focus();
        };
        const close = () => closeRef.current();
        window.addEventListener('pointerdown', away, true);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        window.addEventListener('keydown', key);
        return () => {
          window.removeEventListener('pointerdown', away, true);
          window.removeEventListener('scroll', close, true);
          window.removeEventListener('resize', close);
          window.removeEventListener('keydown', key);
          const opener = openerRef.current;
          if (opener !== null && typeof opener.focus === 'function' && opener.isConnected !== false) {
            opener.focus();
          }
        };
      }, []);

      const menu = h(
        'div',
        {
          ref,
          className: 'wb_menu',
          role: 'menu',
          tabIndex: -1,
          'data-window-drag-exclude': 'true',
          style: { left: `${place.x}px`, top: `${place.y}px` },
          onContextMenu: (event) => event.preventDefault(),
        },
        items.map((item) =>
          h(
            'div',
            { key: item.key, className: 'wb_menuWrap' },
            item.separated === true ? h('div', { className: 'wb_menuSep', role: 'separator' }) : null,
            h(
              'button',
              {
                type: 'button',
                className: 'wb_menuItem',
                role: 'menuitem',
                disabled: item.disabled === true,
                'data-danger': item.danger === true ? 'true' : undefined,
                onClick: () => {
                  if (item.disabled === true) return;
                  onClose();
                  item.onSelect();
                },
              },
              h('span', { className: 'wb_menuGlyph' }, item.glyph ?? null),
              h('span', { className: 'wb_menuText' }, h('span', { className: 'wb_menuLabel' }, item.label)),
            ),
          ),
        ),
      );
      // The menu can be opened from a card inside the scrolling sheet, whose
      // transform/animation would otherwise become the containing block for
      // `position:fixed`. A portal keeps the viewport coordinates literal.
      // Mount inside the page (not body) so the menu inherits the page's
      // `--wb-*` theme variables and native text size.
      if (typeof document === 'undefined') return menu;
      const host = document.querySelector('.wb_page') ?? document.querySelector('.wb_sSection') ?? document.body;
      if (host === null || host === undefined) return menu;
      return ReactDOM.createPortal(menu, host);
    }

    /**
     * A confirmation dialog on the same drawing sheet.
     *
     * `window.confirm` is a Chromium modal: it carries the app package name as
     * its title and the operating system's own chrome, so it looks like a foreign
     * window dropped into the middle of the page. Escape cancels, the backdrop
     * cancels, and the confirm button takes focus.
     */
    function ConfirmDialog({ title, body, confirmLabel, cancelLabel, danger, onConfirm, onCancel }) {
      const confirmRef = useRef(null);
      const cancelRef = useRef(onCancel);
      cancelRef.current = onCancel;
      const openerRef = useRef(null);
      useEffect(() => {
        // Focus once, on mount. Depending on `onCancel` here used to re-focus
        // the confirm button after every unrelated parent re-render.
        openerRef.current = typeof document !== 'undefined' ? document.activeElement : null;
        if (confirmRef.current !== null) confirmRef.current.focus();
        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancelRef.current();
          }
        };
        document.addEventListener('keydown', onKey, true);
        return () => {
          document.removeEventListener('keydown', onKey, true);
          const opener = openerRef.current;
          if (opener !== null && typeof opener.focus === 'function' && opener.isConnected !== false) opener.focus();
        };
      }, []);

      return h(
        'div',
        {
          className: 'wb_overlay',
          'data-window-drag-exclude': 'true',
          onPointerDown: (event) => {
            if (event.target === event.currentTarget) onCancel();
          },
        },
        h(
          'div',
          {
            className: 'wb_dialog',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': title,
            onPointerDown: (event) => event.stopPropagation(),
          },
          h('h2', { className: 'wb_dialogTitle' }, title),
          body ? h('p', { className: 'wb_dialogBody' }, body) : null,
          h(
            'div',
            { className: 'wb_dialogActions' },
            h('button', { type: 'button', className: 'wb_btn', onClick: onCancel }, cancelLabel),
            h(
              'button',
              {
                ref: confirmRef,
                type: 'button',
                className: 'wb_btn',
                'data-variant': danger ? 'danger' : 'primary',
                onClick: onConfirm,
              },
              confirmLabel,
            ),
          ),
        ),
      );
    }

    /** An inline name field, sized for the row it replaces. */
    function RenameInput({ value, onCommit, onCancel, maxLength = MAX_BOARD_NAME, ariaLabel = 'rename' }) {
      const [draft, setDraft] = useState(value);
      const ref = useRef(null);
      /** Set by the first answer, so the second path cannot fire. */
      const settled = useRef(false);

      useEffect(() => {
        if (ref.current !== null) {
          ref.current.focus();
          ref.current.select();
        }
      }, []);

      const finish = (keep) => {
        if (settled.current) return;
        settled.current = true;
        if (keep) onCommit(draft);
        else onCancel();
      };

      return h('input', {
        ref,
        className: 'wb_sInput',
        value: draft,
        maxLength,
        'aria-label': ariaLabel,
        onChange: (event) => setDraft(event.target.value),
        onBlur: () => finish(true),
        onKeyDown: (event) => {
          if (event.key === 'Enter' && !event.nativeEvent?.isComposing) {
            event.preventDefault();
            finish(true);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            finish(false);
          }
        },
      });
    }

    // ── shared pieces ─────────────────────────────────────────────────────────
    // ── the surface frame ─────────────────────────────────────────────────────
    //
    // Both account pages sit in one chrome: a narrow machine strip, a very large
    // page name, and an index rail + record body. The palette and the type are
    // the workbench's own; only the structure changes.

    /** A local clock that ticks gently while a surface page is mounted. */
    function useSurfaceNow(intervalMs = 30000) {
      const [now, setNow] = useState(() => new Date());
      useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), intervalMs);
        return () => clearInterval(timer);
      }, [intervalMs]);
      return now;
    }

    /**
     * A calendar-day clock for surfaces whose labels only change at midnight.
     *
     * The to-do list compares due days, so a minute tick would re-sort and
     * re-render a potentially long list for no visible change. This hook wakes
     * every interval but publishes only when the local day actually changes.
     */
    function useSurfaceDay(intervalMs = 60000) {
      const [day, setDay] = useState(() => dayKeyOf(new Date()));
      useEffect(() => {
        const timer = setInterval(() => {
          const next = dayKeyOf(new Date());
          setDay((current) => (current === next ? current : next));
        }, intervalMs);
        return () => clearInterval(timer);
      }, [intervalMs]);
      return day;
    }

    /** The numeric day of the year of a date. */
    function surfaceDayOfYear(date) {
      const start = Date.UTC(date.getFullYear(), 0, 1);
      const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
      return Math.floor((today - start) / DAY_MS) + 1;
    }

    /** `YYYY.MM.DD` for the surface's machine strip. */
    function surfaceDate(date) {
      return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
    }

    /** `HH:MM` for the surface's machine strip. */
    function surfaceTime(date) {
      return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    }

    /** The day line printed in the page head. */
    function surfaceDayLine(date, t) {
      const weekday = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
      return fill(t('surface.dayLine'), { day: surfaceDayOfYear(date), weekday: t(`day.week.${weekday}`) });
    }

    /**
     * The frame both account pages sit in.
     *
     * `kind` is `todo` or `note`; it chooses the body grid and the page word.
     * `count` feeds the small index line under the day line.
     */
    function SurfaceFrame({ t, kind, title, subtitle, sheet, count, workspace, actions, onBack, children }) {
      const now = useSurfaceNow();
      const word = kind === 'todo' ? t('surface.wordTodo') : t('surface.wordNote');
      return h(
        'div',
        { className: 'wb_page', 'data-surface': kind },
        h(
          'header',
          { className: 'wb_ix_top' },
          h(
            'button',
            { type: 'button', className: 'wb_vBack', title: t('surface.back'), 'aria-label': t('surface.back'), onClick: onBack },
            h(IconBack, { size: 14 }),
          ),
          h('span', { className: 'wb_ix_word' }, word),
          h('span', { className: 'wb_ix_form' }, h('b', null, sheet), h('i', null, t('surface.scale'))),
          h(
            'div',
            { className: 'wb_ix_topRight' },
            h('span', { className: 'wb_ix_stamp' }, `${surfaceDate(now)} · ${surfaceTime(now)}`),
            h('div', { className: 'wb_ix_actions' }, actions),
          ),
        ),
        h(
          'div',
          { className: 'wb_ix_head' },
          h('div', { className: 'wb_ix_headText' }, h('h1', null, title), h('p', { className: 'wb_ix_sub' }, subtitle)),
          h(
            'div',
            { className: 'wb_ix_headMeta' },
            h('b', null, surfaceDayLine(now, t)),
            h('span', null, fill(t('surface.indexMeta'), { count })),
          ),
        ),
        h('div', { className: `wb_ix_body ${kind === 'todo' ? 'wb_ix_bodyTodo' : 'wb_ix_bodyNote'}` }, children),
        h(
          'footer',
          { className: 'wb_ix_foot' },
          h('span', { className: 'wb_ix_workspace', title: workspace ?? '' }, workspace ?? ''),
          h('span', { className: 'wb_build', 'data-build': `${BUILD_STAMP.at} ${BUILD_STAMP.rev}` }, BUILD_STAMP.rev),
        ),
      );
    }

    // ── the to-do account ─────────────────────────────────────────────────────

    /** One index row in the left filter rail. */
    function TodoFilter({ no, label, value, tone, active, onSelect }) {
      return h(
        'button',
        {
          type: 'button',
          className: 'wb_ix_filter',
          'data-active': active ? 'true' : 'false',
          'aria-pressed': active ? 'true' : 'false',
          onClick: onSelect,
        },
        h('i', { className: 'wb_ix_filterNo' }, pad2(no)),
        h('span', null, label),
        h('b', { 'data-tone': value === 0 ? 'plain' : tone ?? 'plain' }, String(value)),
      );
    }

    /**
     * One to-do line: the tick, the title, what it carries, and its due cell.
     *
     * The whole row selects; Enter opens the editor and Space toggles. The
     * context-menu key opens the same menu as the pointer's right click, so
     * removing a visible three-dot control costs the keyboard nothing.
     */
    function TodoRow({ t, no, item, selected, onSelect, onToggle, onEdit, onMenu }) {
      // A finished to-do is not overdue: the due chip is a state of open work.
      const state = item.done === true ? 'none' : dueState(item);
      const due = dayLabel(dayOfStamp(item.dueAt), t);
      // A done row's reminder cannot fire; hide the chip rather than imply it will.
      const remind = item.done === true ? '' : stampLabel(item.remindAt, t);
      const priority = PRIORITIES.includes(item.priority) ? item.priority : 'normal';
      const openMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const box = typeof event.currentTarget?.getBoundingClientRect === 'function' ? event.currentTarget.getBoundingClientRect() : { left: 0, bottom: 0 };
        onMenu(item, { x: box.left, y: box.bottom + 4 });
      };
      return h(
        'div',
        {
          className: 'wb_ix_row',
          'data-done': item.done === true ? 'true' : 'false',
          'data-selected': selected ? 'true' : 'false',
          role: 'button',
          tabIndex: 0,
          'aria-label': item.title,
          onClick: () => onSelect(item),
          onContextMenu: (event) => {
            event.preventDefault();
            onMenu(item, { x: event.clientX, y: event.clientY });
          },
          onKeyDown: (event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) openMenu(event);
            else if (event.key === 'Enter') {
              event.preventDefault();
              onEdit(item);
            } else if (event.key === ' ') {
              event.preventDefault();
              onToggle(item);
            }
          },
        },
        h('span', { className: 'wb_ix_rowNo' }, pad2(no)),
        h(
          'div',
          { className: 'wb_ix_rowMain' },
          h(
            'button',
            {
              type: 'button',
              className: 'wb_check',
              role: 'checkbox',
              'aria-checked': item.done === true ? 'true' : 'false',
              'aria-label': t('todo.toggle'),
              onClick: (event) => {
                event.stopPropagation();
                onToggle(item);
              },
            },
            item.done === true ? h(IconCheck, { size: 9 }) : null,
          ),
          h(
            'div',
            { className: 'wb_ix_rowText' },
            h('div', { className: 'wb_ix_rowTitle' }, item.title),
            h(
              'div',
              { className: 'wb_ix_rowMeta' },
              remind.length > 0
                ? h('span', { className: 'wb_metaChip', 'data-state': 'remind' }, h(IconBell, { size: 13 }), remind)
                : null,
              typeof item.note === 'string' && item.note.length > 0
                ? h('span', { className: 'wb_metaChip', 'data-state': 'note' }, t('todo.hasNote'))
                : null,
            ),
          ),
        ),
        h('span', { className: 'wb_ix_due', 'data-tone': state === 'overdue' ? 'over' : state === 'today' ? 'today' : 'none' }, due.length > 0 ? due : '—', state === 'overdue' ? h('small', null, t('todo.statOverdue')) : state === 'today' ? h('small', null, t('time.today')) : null),
        h('span', { className: 'wb_ix_prio', 'data-tone': priority }, t(`todo.priority.${priority}`)),
      );
    }

    /**
     * One number wheel of the time field.
     *
     * A wheel notch is a detent, not a text edit: it advances one value, rolls
     * the new digit in from the direction of travel, and gives a short hardware
     * pulse where the platform exposes one. Arrow keys and typed digits keep the
     * same control usable without a mouse.
     */
    function TimeDrum({ label, value, max, onChange }) {
      const drumRef = useRef(null);
      const wheelRef = useRef(0);
      const typedRef = useRef({ text: '', at: 0 });
      const [roll, setRoll] = useState({ n: 0, dir: 0 });
      // The wheel and keyboard handlers are installed once. Reading the live
      // value through a ref (rather than through the render closure) means two
      // detents that arrive before React commits the first one still advance
      // twice, not once with the second one lost.
      const valueRef = useRef(value);
      valueRef.current = value;
      // Keep the once-installed wheel listener on the latest callback as well;
      // the parent may hand a new closure after any unrelated re-render.
      const changeRef = useRef(onChange);
      changeRef.current = onChange;

      const settle = (next, dir) => {
        valueRef.current = next;
        // A new detent starts a fresh accumulation window; a prior partial
        // wheel gesture must not add its leftover pixels to this one.
        wheelRef.current = 0;
        setRoll((current) => ({ n: current.n + 1, dir }));
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          try {
            navigator.vibrate(4);
          } catch {
            /* vibration is optional hardware feedback */
          }
        }
        changeRef.current(next);
      };

      const step = (dir) => {
        settle((valueRef.current + dir + max + 1) % (max + 1), dir);
      };

      const jump = (next) => {
        settle(next, next >= valueRef.current ? 1 : -1);
      };

      useEffect(() => {
        const drum = drumRef.current;
        if (drum === null) return undefined;
        const onWheel = (event) => {
          event.preventDefault();
          // A mouse notch reports ~100px, a trackpad a stream of small deltas.
          // Accumulate to 32px so one gesture is one detent, not ten.
          const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
          wheelRef.current += event.deltaY * unit;
          if (Math.abs(wheelRef.current) < 32) return;
          const dir = wheelRef.current > 0 ? 1 : -1;
          step(dir);
        };
        drum.addEventListener('wheel', onWheel, { passive: false });
        return () => drum.removeEventListener('wheel', onWheel);
      }, [max]);

      const onKeyDown = (event) => {
        const base = valueRef.current;
        let next = null;
        if (event.key === 'ArrowUp' || event.key === 'ArrowRight') next = (base + 1) % (max + 1);
        else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') next = (base - 1 + max + 1) % (max + 1);
        else if (event.key === 'PageUp') next = (base + 5) % (max + 1);
        else if (event.key === 'PageDown') next = (base - 5 + max + 1) % (max + 1);
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = max;
        else if (/^\d$/.test(event.key)) {
          const now = Date.now();
          const typed = typedRef.current;
          if (now - typed.at > 900) typed.text = '';
          typed.at = now;
          typed.text = `${typed.text}${event.key}`.slice(-2);
          if (Number(typed.text) > max) typed.text = event.key;
          next = Number(typed.text);
        }
        if (next === null) return;
        event.preventDefault();
        if (next !== base) jump(next);
      };

      const previous = (value - 1 + max + 1) % (max + 1);
      const following = (value + 1) % (max + 1);
      return h(
        'div',
        {
          ref: drumRef,
          className: 'wb_ix_timeDrum',
          role: 'spinbutton',
          tabIndex: 0,
          'aria-label': label,
          'aria-valuemin': 0,
          'aria-valuemax': max,
          'aria-valuenow': value,
          'aria-valuetext': pad2(value),
          onKeyDown,
        },
        h(
          'div',
          {
            key: roll.n,
            className: 'wb_ix_timeTrack',
            'data-roll': roll.n === 0 ? 'none' : roll.dir > 0 ? 'down' : 'up',
          },
          h('span', { className: 'wb_ix_timeGhost', 'aria-hidden': 'true' }, pad2(previous)),
          h('span', { className: 'wb_ix_timeValue' }, pad2(value)),
          h('span', { className: 'wb_ix_timeGhost', 'aria-hidden': 'true' }, pad2(following)),
        ),
      );
    }

    /** The two-drum time field used by a reminder. Its value is always `HH:MM`. */
    function TimeWheel({ t, value, onChange }) {
      const match = /^(\d{1,2}):(\d{2})$/.exec(typeof value === 'string' ? value : '');
      const hours = match === null ? 9 : Math.min(23, Math.max(0, Number(match[1])));
      const minutes = match === null ? 0 : Math.min(59, Math.max(0, Number(match[2])));
      // A drum's wheel listener is attached once for its own value; the other
      // half must still be read live or a minute step keeps the hour from before
      // the last hour step. Updating the ref in the same turn as the change also
      // keeps a fast hour-then-minute gesture from losing the hour step while
      // React is still committing it.
      const live = useRef({ hours, minutes });
      live.current = { hours, minutes };
      const commitHour = (next) => {
        live.current = { hours: next, minutes: live.current.minutes };
        onChange(`${pad2(next)}:${pad2(live.current.minutes)}`);
      };
      const commitMinute = (next) => {
        live.current = { hours: live.current.hours, minutes: next };
        onChange(`${pad2(live.current.hours)}:${pad2(next)}`);
      };
      return h(
        'div',
        { className: 'wb_ix_timeWheel', role: 'group', 'aria-label': t('calendar.time'), title: t('calendar.wheelHint') },
        h(TimeDrum, { label: t('calendar.hour'), value: hours, max: 23, onChange: commitHour }),
        h('span', { className: 'wb_ix_timeColon', 'aria-hidden': 'true' }, ':'),
        h(TimeDrum, { label: t('calendar.minute'), value: minutes, max: 59, onChange: commitMinute }),
      );
    }

    /**
     * A date / date-time control drawn in the desk's own language.
     *
     * Native date inputs open the browser's calendar, which belongs to no design
     * system. This control keeps the same field rhythm as the rest of the editor
     * and opens a square, sage-selected month grid instead.
     */
    function CalendarField({ t, mode, value, onChange }) {
      const text = typeof value === 'string' ? value : '';
      const day = /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : '';
      const foundTime = /T(\d{2}:\d{2})/.exec(text);
      const [open, setOpen] = useState(false);
      const [view, setView] = useState(() => {
        const at = day.length > 0 ? new Date(`${day}T00:00:00`) : new Date();
        return { year: at.getFullYear(), month: at.getMonth() };
      });
      const [draftDay, setDraftDay] = useState(day.length > 0 ? day : todayKey());
      const [time, setTime] = useState(foundTime === null ? '09:00' : foundTime[1]);
      // Placed off-screen until the first measurement, so opening the calendar
      // never paints it at the viewport's top-left for one frame.
      const [place, setPlace] = useState({ left: -9999, top: -9999 });
      const triggerRef = useRef(null);
      const popRef = useRef(null);

      const openCalendar = () => {
        const at = day.length > 0 ? new Date(`${day}T00:00:00`) : new Date();
        setView({ year: at.getFullYear(), month: at.getMonth() });
        setDraftDay(day.length > 0 ? day : todayKey());
        setTime(foundTime === null ? '09:00' : foundTime[1]);
        setPlace({ left: -9999, top: -9999 });
        setOpen(true);
      };

      useEffect(() => {
        if (!open) return undefined;
        let lastPlacement = 0;
        const placePopover = () => {
          const now = Date.now();
          if (now - lastPlacement < 16) return;
          lastPlacement = now;
          const box = triggerRef.current === null ? null : triggerRef.current.getBoundingClientRect();
          if (box === null) return;
          const pop = popRef.current;
          const width = pop === null ? 292 : pop.offsetWidth;
          const height = pop === null ? (mode === 'datetime' ? 442 : 392) : pop.offsetHeight;
          const left = Math.max(8, Math.min(box.left, window.innerWidth - width - 8));
          const top = box.bottom + height + 8 <= window.innerHeight ? box.bottom + 6 : Math.max(8, box.top - height - 6);
          // Updating with an equal object on every scroll frame re-rendered the
          // whole 42-cell calendar. Keep the previous object when unchanged.
          setPlace((current) => (current.left === left && current.top === top ? current : { left, top }));
        };
        placePopover();
        window.addEventListener('resize', placePopover);
        window.addEventListener('scroll', placePopover, true);
        return () => {
          window.removeEventListener('resize', placePopover);
          window.removeEventListener('scroll', placePopover, true);
        };
      }, [open, mode]);

      useEffect(() => {
        if (!open) return undefined;
        const away = (event) => {
          const pop = popRef.current;
          const trigger = triggerRef.current;
          if (pop !== null && event.target instanceof Node && pop.contains(event.target)) return;
          if (trigger !== null && event.target instanceof Node && trigger.contains(event.target)) return;
          setOpen(false);
        };
        const key = (event) => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          setOpen(false);
        };
        document.addEventListener('pointerdown', away, true);
        window.addEventListener('keydown', key);
        return () => {
          document.removeEventListener('pointerdown', away, true);
          window.removeEventListener('keydown', key);
        };
      }, [open]);

      const cells = useMemo(() => {
        const first = new Date(view.year, view.month, 1);
        const offset = (first.getDay() + 6) % 7;
        return Array.from({ length: 42 }, (_, index) => {
          const at = new Date(view.year, view.month, 1 - offset + index);
          return { key: dayKeyOf(at), day: at.getDate(), inMonth: at.getMonth() === view.month };
        });
      }, [view.year, view.month]);

      const display =
        day.length === 0
          ? t('calendar.none')
          : `${day.slice(0, 4)}.${day.slice(5, 7)}.${day.slice(8, 10)}${mode === 'datetime' ? ` ${foundTime === null ? '09:00' : foundTime[1]}` : ''}`;

      const commitDay = (key) => {
        if (mode === 'date') {
          onChange(key);
          setOpen(false);
          return;
        }
        setDraftDay(key);
      };

      const commitDateTime = () => {
        onChange(`${draftDay}T${time}`);
        setOpen(false);
      };

      const weekdays = t('calendar.weekdays').split(/\s+/);
      return h(
        'div',
        { className: 'wb_ix_dateField' },
        h(
          'button',
          {
            ref: triggerRef,
            type: 'button',
            className: 'wb_ix_dateTrigger',
            'aria-haspopup': 'dialog',
            'aria-expanded': open ? 'true' : 'false',
            'aria-label': mode === 'datetime' ? t('todo.remind') : t('todo.due'),
            onClick: openCalendar,
          },
          h('span', { 'data-empty': day.length === 0 ? 'true' : 'false' }, display),
          h(IconCalendar, { size: 12 }),
        ),
        open
          ? h(
              'div',
              { ref: popRef, className: 'wb_ix_calPop', role: 'dialog', 'data-window-drag-exclude': 'true', 'aria-label': mode === 'datetime' ? t('todo.remind') : t('todo.due'), style: { left: `${place.left}px`, top: `${place.top}px` } },
              h(
                'div',
                { className: 'wb_ix_calHead' },
                h('button', { type: 'button', className: 'wb_ix_calNav', 'aria-label': t('calendar.prev'), onClick: () => setView((current) => (current.month === 0 ? { year: current.year - 1, month: 11 } : { ...current, month: current.month - 1 })) }, h(IconBack, { size: 12 })),
                h('b', null, fill(t('calendar.month'), { year: view.year, month: view.month + 1 })),
                h('button', { type: 'button', className: 'wb_ix_calNav', 'aria-label': t('calendar.next'), onClick: () => setView((current) => (current.month === 11 ? { year: current.year + 1, month: 0 } : { ...current, month: current.month + 1 })) }, h(IconArrowRight, { size: 12 })),
              ),
              // English weekday initials repeat (T, S), so the position — not
              // the label — is the stable React key for these seven cells.
              h('div', { className: 'wb_ix_calDow' }, weekdays.map((label, index) => h('span', { key: `${index}-${label}` }, label))),
              h(
                'div',
                { className: 'wb_ix_calGrid' },
                cells.map((cell) =>
                  h(
                    'button',
                    {
                      key: cell.key,
                      type: 'button',
                      className: 'wb_ix_calDay',
                      'data-outside': cell.inMonth ? 'false' : 'true',
                      'data-today': cell.key === todayKey() ? 'true' : 'false',
                      'data-selected': cell.key === (mode === 'datetime' ? draftDay : day) ? 'true' : 'false',
                      onClick: () => commitDay(cell.key),
                    },
                    String(cell.day),
                  ),
                ),
              ),
              mode === 'datetime'
                ? h(
                    'div',
                    { className: 'wb_ix_calTime' },
                    h('span', null, t('calendar.time')),
                    h(TimeWheel, { t, value: time, onChange: setTime }),
                  )
                : null,
              h(
                'div',
                { className: 'wb_ix_calFoot' },
                h(
                  'div',
                  { className: 'wb_ix_calTools' },
                  h('button', { type: 'button', className: 'wb_ix_calTool', onClick: () => { setDraftDay(todayKey()); setView({ year: new Date().getFullYear(), month: new Date().getMonth() }); if (mode === 'date') { onChange(todayKey()); setOpen(false); } } }, t('time.today')),
                  h('button', { type: 'button', className: 'wb_ix_calTool', onClick: () => { onChange(''); setOpen(false); } }, t('calendar.clear')),
                ),
                mode === 'datetime' ? h('button', { type: 'button', className: 'wb_ix_calConfirm', onClick: commitDateTime }, t('calendar.confirm')) : null,
              ),
            )
          : null,
      );
    }

    /**
     * The editor for one to-do.
     *
     * It lives in the record panel, not inside the list: opening it must not
     * reflow the row it came from. The draft initializers read the record once;
     * the caller keys the component by id so another record never inherits it.
     */
    function TodoEditor({ t, item, onSave, onDelete, onCancel }) {
      const [title, setTitle] = useState(typeof item.title === 'string' ? item.title : '');
      const [note, setNote] = useState(typeof item.note === 'string' ? item.note : '');
      const [priority, setPriority] = useState(PRIORITIES.includes(item.priority) ? item.priority : 'normal');
      const [due, setDue] = useState(dayOfStamp(item.dueAt));
      const [remind, setRemind] = useState(typeof item.remindAt === 'string' ? item.remindAt : '');
      const titleRef = useRef(null);
      /** Set while one Save is in flight, so a double click cannot append twice. */
      const saving = useRef(false);

      useEffect(() => {
        if (titleRef.current !== null) titleRef.current.focus();
      }, []);

      const commit = () => {
        if (saving.current) return;
        saving.current = true;
        const next = title.trim();
        try {
          Promise.resolve(
            onSave({
              title: (next.length === 0 ? t('todo.untitled') : next).slice(0, MAX_TODO_TITLE),
              note: note.slice(0, MAX_TODO_NOTE),
              priority,
              dueAt: due,
              remindAt: remind,
              remindedAt: remind === item.remindAt ? (item.remindedAt ?? '') : '',
            }),
          ).finally(() => {
            saving.current = false;
          });
        } catch {
          saving.current = false;
        }
      };

      return h(
        'div',
        { className: 'wb_editor wb_ix_editor' },
        h(
          'div',
          { className: 'wb_editorHead' },
          h('h2', { className: 'wb_editorTitle' }, t('todo.editTitle')),
          h(
            'div',
            { className: 'wb_editorActions' },
            h('button', { type: 'button', className: 'wb_btn', 'data-variant': 'danger', onClick: onDelete }, t('todo.delete')),
            h('button', { type: 'button', className: 'wb_btn', onClick: onCancel }, t('surface.cancel')),
            h('button', { type: 'button', className: 'wb_btn', 'data-variant': 'primary', onClick: commit }, t('surface.save')),
          ),
        ),
        h('input', {
          ref: titleRef,
          className: 'wb_input',
          value: title,
          maxLength: MAX_TODO_TITLE,
          placeholder: t('todo.titlePlaceholder'),
          'aria-label': t('todo.titlePlaceholder'),
          onChange: (event) => setTitle(event.target.value),
          onKeyDown: (event) => {
            if (event.key === 'Enter' && !event.nativeEvent?.isComposing) {
              event.preventDefault();
              commit();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          },
        }),
        h('textarea', {
          className: 'wb_area',
          value: note,
          maxLength: MAX_TODO_NOTE,
          placeholder: t('todo.notePlaceholder'),
          'aria-label': t('todo.notePlaceholder'),
          onChange: (event) => setNote(event.target.value),
        }),
        h(
          'div',
          { className: 'wb_fields' },
          h(
            'label',
            { className: 'wb_field' },
            h('span', { className: 'wb_fieldLabel' }, t('todo.priority')),
            h(
              'span',
              { className: 'wb_seg' },
              PRIORITIES.map((value) =>
                h(
                  'button',
                  {
                    key: value,
                    type: 'button',
                    'data-active': priority === value ? 'true' : 'false',
                    'aria-pressed': priority === value ? 'true' : 'false',
                    onClick: () => setPriority(value),
                  },
                  t(`todo.priority.${value}`),
                ),
              ),
            ),
          ),
          h(
            'div',
            { className: 'wb_field' },
            h('span', { className: 'wb_fieldLabel' }, t('todo.due')),
            h(CalendarField, { t, mode: 'date', value: due, onChange: setDue }),
          ),
          h(
            'div',
            { className: 'wb_field' },
            h('span', { className: 'wb_fieldLabel' }, t('todo.remind')),
            h(CalendarField, { t, mode: 'datetime', value: remind, onChange: setRemind }),
          ),
        ),
      );
    }

    /**
     * The next time of day at `hour:minute`: today if it has not passed yet,
     * otherwise tomorrow.
     */
    function nextDailyTime(hour, minute) {
      const now = new Date();
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
      if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
      return target;
    }

    /** Tomorrow at `hour:minute`. */
    function tomorrowTime(hour, minute) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour, minute, 0, 0);
    }

    /** `offset` milliseconds from now. */
    function timeFromNow(offset) {
      return new Date(Date.now() + offset);
    }

    /**
     * The 待办任务 page: an index rail, a working list, and the selected record.
     */
    function TodoPage({ t, boardKey, title, onBack }) {
      const document = useDocument();
      // Wake at midnight, not every minute: the due/overdue chips only change
      // when the local calendar day changes, and re-sorting the whole list on
      // a timer would compete with the user's typing.
      const today = useSurfaceDay();
      const [filter, setFilter] = useState('open');
      const [query, setQuery] = useState('');
      const [draft, setDraft] = useState('');
      const draftRef = useRef('');
      const [editing, setEditing] = useState(null);
      /** A quick-add write is in flight; Enter must not append the same title twice. */
      const adding = useRef(false);
      /** Only the newest write may publish its failure/success into this page. */
      const runSeq = useRef(0);
      const [menu, setMenu] = useState(null);
      const [failure, setFailure] = useState('');
      const [selectedId, setSelectedId] = useState('');

      // `boardKey` may be a sub-board key (`parent/child`); workspace is always
      // inherited from the parent board.
      const [boardId] = String(boardKey).split('/');
      const board = Array.isArray(document.boards) ? document.boards.find((item) => item !== null && item.id === boardId) : undefined;
      // Keep the source list stable across the 30-second surface clock and
      // local editor state. Without this every keystroke rebuilt it and made
      // the stale-editor effect below run on every render.
      const list = useMemo(() => todoListOf(document, boardKey), [document, boardKey]);
      const open = useMemo(() => list.filter((item) => item.done !== true), [list]);
      const done = list.length - open.length;
      const dueToday = useMemo(() => open.filter((item) => dueState(item) === 'today').length, [open, today]);
      const overdue = useMemo(() => open.filter((item) => dueState(item) === 'overdue').length, [open, today]);
      const ratio = list.length === 0 ? 0 : Math.round((done / list.length) * 100);

      const run = (operation) => {
        const seq = (runSeq.current += 1);
        setFailure('');
        return Promise.resolve()
          .then(() => (typeof operation === 'function' ? operation() : operation))
          .then(() => {
            // A slower, older rejection must not overwrite the outcome of a
            // newer action with a stale error.
            if (seq === runSeq.current) setFailure('');
            return true;
          })
          .catch((error) => {
            if (seq === runSeq.current) {
              setFailure(fill(t('error.generic'), { message: error instanceof Error ? error.message : String(error) }));
            }
            return false;
          });
      };

      const startNew = () => {
        if (editing !== null) return;
        if (list.length >= MAX_TODOS_PER_BOARD) {
          setFailure(t('error.limitReached'));
          return;
        }
        setEditing({ draft: newTodo(t('todo.newTitle')) });
      };

      const needle = query.trim().toLowerCase();
      const visible = useMemo(
        () =>
          sortTodos(
            list.filter((item) => {
              if (!matchesFilter(item, filter)) return false;
              if (needle.length === 0) return true;
              const haystack = `${item.title}\n${typeof item.note === 'string' ? item.note : ''}`.toLowerCase();
              return haystack.includes(needle);
            }),
          ),
        [list, filter, needle, today],
      );

      const selected = (selectedId.length > 0 ? visible.find((item) => item.id === selectedId) : undefined) ?? visible[0] ?? null;
      const selectedNo = selected === null ? 0 : visible.indexOf(selected) + 1;

      // Another tab (or a failed save's recovery read) can remove the record
      // that is being edited. Without this the editor pane disappears while
      // `editing` stays set, which blocks every other row and the New button.
      useEffect(() => {
        if (editing === null || editing.id === undefined) return;
        if (list.some((item) => item.id === editing.id)) return;
        setEditing(null);
      }, [editing, list]);

      const add = () => {
        // Read through a ref as well as state: a second Enter can arrive before
        // React has committed the first setDraft(''), so a state-only guard
        // still sees the old text and can create a duplicate.
        const next = draftRef.current.trim();
        if (next.length === 0 || adding.current) return;
        if (list.length >= MAX_TODOS_PER_BOARD) {
          setFailure(t('error.limitReached'));
          return;
        }
        adding.current = true;
        draftRef.current = '';
        setDraft('');
        const record = newTodo(next);
        run(updateTodos(boardKey, (current) => [...current, record]))
          .then((saved) => {
            if (!saved) {
              // Restore the failed title only when the user has not started a
              // new one meanwhile.
              if (draftRef.current.length === 0) {
                draftRef.current = next;
                setDraft(next);
              }
              return;
            }
            // The new row must be visible even if a filter/search was active.
            setFilter('all');
            setQuery('');
            setSelectedId(record.id);
          })
          .finally(() => {
            adding.current = false;
          });
      };

      const toggle = (item) => {
        const nowDone = item.done !== true;
        run(
          updateTodos(boardKey, (current) =>
            current.map((row) => (row.id === item.id ? { ...row, done: nowDone, doneAt: nowDone ? Date.now() : 0 } : row)),
          ),
        );
      };

      const patch = (id, values) => {
        return run(updateTodos(boardKey, (current) => current.map((row) => (row.id === id ? { ...row, ...values } : row))));
      };

      const remove = (id) => {
        return run(updateTodos(boardKey, (current) => current.filter((row) => row.id !== id))).then((saved) => {
          if (!saved) return;
          if (editing !== null && editing.id === id) setEditing(null);
          if (selectedId === id) setSelectedId('');
        });
      };

      /** Write one reminder stamp onto a to-do. */
      const quickRemind = (item, when) => {
        const at = when === 'clear' ? '' : stampOf(when);
        patch(item.id, { remindAt: at, remindedAt: '' });
      };

      const clearDone = () => {
        const removed = new Set(list.filter((item) => item.done === true).map((item) => item.id));
        run(updateTodos(boardKey, (current) => current.filter((item) => item.done !== true))).then((saved) => {
          if (!saved) return;
          if (editing !== null && editing.id !== undefined && removed.has(editing.id)) setEditing(null);
          if (removed.has(selectedId)) setSelectedId('');
        });
      };

      /**
       * The quick-reminder rows.
       *
       * Each row is BUILT for the moment the menu is opened, so both the time it
       * schedules and the words that describe it are decided together.
       */
      const reminderItems = (item) => {
        const choices = [
          { key: 'evening', when: nextDailyTime(18, 0), label: t('todo.presetEvening') },
          { key: 'morning', when: tomorrowTime(9, 0), label: t('todo.presetMorning') },
          { key: 'hour', when: timeFromNow(3600000), label: t('todo.presetHour') },
        ];
        return choices.map((choice) => ({
          key: choice.key,
          label: fill(choice.label, { when: stampLabel(stampOf(choice.when), t) }),
          glyph: h(IconBell, { size: 13 }),
          onSelect: () => quickRemind(item, choice.when),
        }));
      };

      const menuItems = (item) => [
        {
          key: 'edit',
          label: t('todo.edit'),
          glyph: h(IconText, { size: 13 }),
          // The visible row already refuses to switch records while an editor
          // is open; the right-click menu must follow the same rule, otherwise
          // it can discard an unsaved draft without warning.
          onSelect: () => {
            if (editing !== null) return;
            setEditing({ id: item.id });
          },
        },
        // The scanner only fires open to-dos. Offering "remind me" on a done
        // row would create a chip that can never announce.
        ...(item.done === true ? [] : reminderItems(item)),
        {
          key: 'clear-remind',
          label: t('todo.remindClear'),
          glyph: h(IconBell, { size: 13 }),
          disabled: typeof item.remindAt !== 'string' || item.remindAt.length === 0,
          separated: true,
          onSelect: () => quickRemind(item, 'clear'),
        },
        {
          key: 'delete',
          label: t('todo.delete'),
          glyph: h(IconTrash, { size: 13 }),
          danger: true,
          separated: true,
          onSelect: () => remove(item.id),
        },
      ];

      const current = editing === null || editing.id === undefined ? undefined : list.find((item) => item.id === editing.id);
      const editorReady = editing !== null && (current !== undefined || editing.draft !== undefined);

      return h(
        SurfaceFrame,
        {
          t,
          kind: 'todo',
          title,
          subtitle: t('todo.subtitle'),
          sheet: t('surface.sheetTodo'),
          count: list.length,
          workspace: workspaceForBoard(document, board),
          onBack,
          actions: [
            h(ReminderPermissionButton, { key: 'remind', t }),
            h(
              'button',
              { key: 'new', type: 'button', className: 'wb_btn', 'data-variant': 'primary', onClick: startNew },
              h(IconPlus, { size: 11 }),
              h('span', null, t('todo.new')),
            ),
          ],
        },

        h(
          'aside',
          { className: 'wb_ix_filters' },
          h('p', { className: 'wb_ix_filterCap' }, t('surface.filter')),
          h(TodoFilter, { no: 1, label: t('todo.filterAll'), value: list.length, active: filter === 'all', onSelect: () => setFilter('all') }),
          h(TodoFilter, { no: 2, label: t('todo.statOpen'), value: open.length, active: filter === 'open', onSelect: () => setFilter('open') }),
          h(TodoFilter, { no: 3, label: t('todo.statToday'), value: dueToday, tone: 'today', active: filter === 'today', onSelect: () => setFilter('today') }),
          h(TodoFilter, { no: 4, label: t('todo.statOverdue'), value: overdue, tone: 'over', active: filter === 'overdue', onSelect: () => setFilter('overdue') }),
          h(TodoFilter, { no: 5, label: t('todo.statDone'), value: done, tone: 'done', active: filter === 'done', onSelect: () => setFilter('done') }),
          h(
            'span',
            { className: 'wb_search wb_ix_search' },
            h(IconSearch, { size: 11 }),
            h('input', {
              value: query,
              placeholder: t('todo.search'),
              'aria-label': t('todo.search'),
              onChange: (event) => setQuery(event.target.value),
            }),
          ),
          h(
            'div',
            { className: 'wb_ix_filterFoot' },
            h(
              'div',
              { className: 'wb_ix_bar', role: 'progressbar', 'aria-valuenow': ratio, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': t('todo.progressLabel') },
              h('i', { style: { width: `${ratio}%` } }),
            ),
            h('span', null, fill(t('todo.progress'), { done, total: list.length })),
            done > 0
              ? h('button', { type: 'button', className: 'wb_ix_clear', onClick: clearDone }, t('todo.clearDone'))
              : null,
          ),
        ),

        h(
          'section',
          { className: 'wb_ix_center' },
          h(
            'div',
            { className: 'wb_ix_add' },
            h('span', { className: 'wb_ix_plus' }, h(IconPlus, { size: 9 })),
            h('input', {
              value: draft,
              maxLength: MAX_TODO_TITLE,
              placeholder: t('todo.addPlaceholder'),
              'aria-label': t('todo.addPlaceholder'),
              onChange: (event) => {
                draftRef.current = event.target.value;
                setDraft(event.target.value);
              },
              onKeyDown: (event) => {
                if (event.key === 'Enter' && !event.nativeEvent?.isComposing) {
                  event.preventDefault();
                  add();
                }
              },
            }),
            h('span', null, t('surface.enter')),
          ),
          h(
            'div',
            { className: 'wb_ix_thead' },
            h('span', null, 'NO.'),
            h('span', null, t('surface.task')),
            h('span', null, t('surface.due')),
            h('span', null, t('surface.priority')),
          ),
          failure.length > 0 ? h('p', { className: 'wb_error wb_ix_error' }, failure) : null,
          visible.length === 0
            ? h(
                'div',
                { className: 'wb_ix_emptyState' },
                h('span', { className: 'wb_ix_emptyNo' }, '00'),
                h('h2', null, list.length === 0 ? t('surface.emptyTodoTitle') : t('todo.emptyFilter')),
                h('p', null, list.length === 0 ? t('todo.empty') : t('todo.emptyFilter')),
              )
            : h(
                'div',
                { className: 'wb_ix_list' },
                visible.map((item, index) =>
                  h(TodoRow, {
                    key: item.id,
                    t,
                    no: index + 1,
                    item,
                    selected: selected !== null && selected.id === item.id,
                    // While an editor is open, its record owns the detail pane.
                    // Letting the highlight move to another row made Save write
                    // the old record while the new one looked selected.
                    onSelect: (target) => {
                      if (editing !== null) return;
                      setSelectedId(target.id);
                    },
                    onToggle: toggle,
                    onEdit: (target) => {
                      if (editing !== null) return;
                      setEditing({ id: target.id });
                    },
                    onMenu: (target, at) => setMenu({ item: target, at }),
                  }),
                ),
              ),
          h(
            'div',
            { className: 'wb_ix_countline' },
            h('span', null, fill(t('ledger.slips'), { count: visible.length })),
            h('span', null, t('surface.sortedByDue')),
          ),
        ),

        h(
          'aside',
          { className: 'wb_ix_detail' },
          editorReady
            ? h(
                'div',
                { className: 'wb_ix_detailEditor' },
                h(TodoEditor, {
                  key: current === undefined ? `draft:${editing.draft.id}` : current.id,
                  t,
                  item: current === undefined ? editing.draft : current,
                  onSave: (values) => {
                    if (current === undefined) {
                      if (list.length >= MAX_TODOS_PER_BOARD) {
                        setFailure(t('error.limitReached'));
                        return Promise.resolve(false);
                      }
                      const record = { ...editing.draft, ...values, createdAt: Date.now() };
                      return run(updateTodos(boardKey, (rows) => [...rows, record])).then((saved) => {
                        if (!saved) return false;
                        setFilter('all');
                        setQuery('');
                        setSelectedId(record.id);
                        setEditing(null);
                        return true;
                      });
                    }
                    return patch(current.id, values).then((saved) => {
                      if (saved) setEditing(null);
                      return saved;
                    });
                  },
                  onDelete: () => {
                    if (current !== undefined) remove(current.id);
                    else setEditing(null);
                  },
                  onCancel: () => setEditing(null),
                }),
              )
            : selected === null
              ? h(
                  'div',
                  { className: 'wb_ix_detailEmpty' },
                  h('span', { className: 'wb_ix_bigNo' }, '—'),
                  h('h2', null, t('surface.emptyTitle')),
                  h('p', null, t('surface.pickTodo')),
                )
              : h(
                  'div',
                  { className: 'wb_ix_detailBody' },
                  h('span', { className: 'wb_ix_bigNo' }, pad2(selectedNo)),
                  h(
                    'div',
                    { className: 'wb_ix_detailTop' },
                    h('span', null, t('surface.record')),
                    h('b', null, `${pad2(selectedNo)} · ${t('surface.current')}`),
                  ),
                  h('h2', { className: 'wb_ix_detailTitle' }, selected.title),
                  h('div', { className: 'wb_ix_detailSub' }, selected.dueAt ? dayLabel(dayOfStamp(selected.dueAt), t) : t('surface.noDue')),
                  h(
                    'div',
                    { className: 'wb_ix_facts' },
                    h('div', { className: 'wb_ix_fact' }, h('span', null, t('surface.priority')), h('b', null, t(`todo.priority.${PRIORITIES.includes(selected.priority) ? selected.priority : 'normal'}`))),
                    h('div', { className: 'wb_ix_fact' }, h('span', null, t('todo.due')), h('b', null, selected.dueAt ? dayLabel(dayOfStamp(selected.dueAt), t) : t('surface.noDue'))),
                    h('div', { className: 'wb_ix_fact' }, h('span', null, t('todo.remind')), h('b', null, selected.remindAt ? stampLabel(selected.remindAt, t) : '—')),
                    h('div', { className: 'wb_ix_fact' }, h('span', null, t('surface.created')), h('b', null, selected.createdAt ? dayLabel(dayKeyOf(new Date(Number(selected.createdAt))), t) : '—')),
                  ),
                  h('div', { className: 'wb_ix_noteLabel' }, t('surface.noteLabel')),
                  h('p', { className: 'wb_ix_noteBody' }, typeof selected.note === 'string' && selected.note.length > 0 ? selected.note : '—'),
                  h(
                    'div',
                    { className: 'wb_ix_detailActions' },
                    h('button', { type: 'button', className: 'wb_btn', 'data-variant': 'danger', onClick: () => remove(selected.id) }, t('todo.delete')),
                    h('button', { type: 'button', className: 'wb_btn', onClick: () => setEditing({ id: selected.id }) }, t('surface.edit')),
                    h('button', { type: 'button', className: 'wb_btn', 'data-variant': 'primary', onClick: () => toggle(selected) }, selected.done === true ? t('surface.reopen') : t('surface.complete')),
                  ),
                ),
        ),

        menu === null ? null : h(ContextMenu, { at: menu.at, items: menuItems(menu.item), onClose: () => setMenu(null) }),
      );
    }
    // ── the note account ──────────────────────────────────────────────────────

    /** The exact text one slip hands to the clipboard: its title, then its body. */
    function noteTextOf(item) {
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const body = typeof item.body === 'string' ? item.body : '';
      if (title.length === 0) return body;
      if (body.trim().length === 0) return title;
      return `${title}\n\n${body}`;
    }

    /** Clean, deduplicated tags for one slip; a malformed list renders as none. */
    function tagsOf(item) {
      if (!Array.isArray(item.tags)) return [];
      return [
        ...new Set(
          item.tags
            .filter((tag) => typeof tag === 'string')
            .map((tag) => tag.trim().replace(/^#+/, ''))
            .filter((tag) => tag.length > 0),
        ),
      ].slice(0, MAX_NOTE_TAGS);
    }

    /**
     * Write one string to the system clipboard.
     *
     * The async Clipboard API is the normal path. A WebView that refuses it
     * without a granted permission falls back to the selection command, which
     * is still a user gesture because the menu item's click started this call.
     */
    async function copyText(value) {
      const text = String(value);
      const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
      if (clipboard !== undefined && typeof clipboard.writeText === 'function') {
        try {
          await clipboard.writeText(text);
          return;
        } catch {
          /* fall through to the DOM path */
        }
      }
      // The fallback is DOM-only; a caller in a non-browser context (or an
      // early WebView without a body) gets the same clean rejection as a
      // refused clipboard write instead of a ReferenceError.
      if (
        typeof document === 'undefined' ||
        typeof document.createElement !== 'function' ||
        document.body === null ||
        document.body === undefined
      ) {
        throw new Error('clipboard unavailable');
      }
      const area = document.createElement('textarea');
      const previous = typeof document.activeElement === 'object' ? document.activeElement : null;
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      area.style.top = '0';
      try {
        document.body.appendChild(area);
        area.select();
        const copied = typeof document.execCommand === 'function' && document.execCommand('copy');
        if (copied !== true) throw new Error('clipboard unavailable');
      } finally {
        // A refused `execCommand` must not leave the hidden textarea (or the
        // user's focus) behind in the page. `remove` is newer than the WebView
        // this plugin supports, so fall back to the parent when it is absent.
        if (typeof area.remove === 'function') area.remove();
        else if (area.parentNode !== null && area.parentNode !== undefined) area.parentNode.removeChild(area);
        // Restoring focus is best-effort: the element may have been removed by
        // the same click that started the copy.
        try {
          if (previous !== null && typeof previous.focus === 'function') previous.focus();
        } catch {
          /* the copy already succeeded; a detached opener is harmless */
        }
      }
    }

    /** One line in the 灵感 or 笔记 index. */
    function NoteCard({ t, item, no, selected, showKind, onOpen, onMenu }) {
      const tags = tagsOf(item);
      const body = typeof item.body === 'string' ? item.body.trim() : '';
      const updated = agoLabel(item.updatedAt ?? item.createdAt, t);
      const untitled = typeof item.title !== 'string' || item.title.length === 0;
      return h(
        'div',
        {
          className: 'wb_slip wb_ix_noteItem',
          'data-id': item.id,
          'data-selected': selected ? 'true' : 'false',
          'data-pinned': item.pinned === true ? 'true' : 'false',
          onContextMenu: (event) => {
            event.preventDefault();
            onMenu(item, { x: event.clientX, y: event.clientY });
          },
        },
        h(
          'button',
          {
            type: 'button',
            className: 'wb_slipMain',
            title: t('notes.open'),
            onClick: () => onOpen(item),
            onKeyDown: (event) => {
              if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
              event.preventDefault();
              const box = event.currentTarget.getBoundingClientRect();
              onMenu(item, { x: box.right - 8, y: box.bottom + 4 });
            },
          },
          h('span', { className: 'wb_slipNo' }, pad2(no)),
          h(
            'span',
            { className: 'wb_slipTitleWrap' },
            item.pinned === true ? h('span', { className: 'wb_pin', title: t('notes.pinned') }, h(IconPin, { size: 10 })) : null,
            h('span', { className: 'wb_slipTitle' }, untitled ? t('notes.untitled') : item.title),
            showKind === true ? h('span', { className: 'wb_slipKind' }, item.block === 'note' ? t('notes.notes') : t('notes.ideas')) : null,
          ),
          body.length > 0 ? h('span', { className: 'wb_slipBody' }, body) : h('span', { className: 'wb_slipBody', 'aria-hidden': 'true' }),
          tags.length > 0
            ? h(
                'span',
                { className: 'wb_tags' },
                tags.slice(0, 5).map((tag) => h('span', { key: tag, className: 'wb_tag' }, tag)),
              )
            : h('span', { className: 'wb_tags', 'aria-hidden': 'true' }),
          updated.length > 0 ? h('span', { className: 'wb_slipFoot' }, updated) : null,
        ),
      );
    }

    /** The editor for one note or idea. */
    function NoteEditor({ t, block, item, onSave, onCancel }) {
      const [title, setTitle] = useState(item === undefined ? '' : item.title);
      const [body, setBody] = useState(item === undefined ? '' : item.body);
      const [tags, setTags] = useState(item === undefined || !Array.isArray(item.tags) ? '' : item.tags.join(' '));
      const titleRef = useRef(null);
      /** Set while one Save is in flight, so a double click cannot append twice. */
      const saving = useRef(false);

      useEffect(() => {
        if (titleRef.current !== null) titleRef.current.focus();
      }, []);

      const commit = () => {
        if (saving.current) return;
        saving.current = true;
        // Deduplicate here as well as in the Host: React keys are tag strings,
        // and a duplicated tag in the same unsaved draft would be two equal keys.
        const nextTags = [
          ...new Set(
            tags
              .split(/[\s,，、]+/)
              // The card supplies its own `#` marker; strip a typed one so the
              // same tag never renders as `##tag`. Match the Host's per-tag
              // 40-character ceiling so the optimistic copy does not differ
              // from the stored copy.
              .map((tag) => tag.trim().replace(/^#+/, '').slice(0, 40))
              .filter((tag) => tag.length > 0),
          ),
        ].slice(0, MAX_NOTE_TAGS);
        try {
          Promise.resolve(
            onSave({ title: title.trim().slice(0, MAX_NOTE_TITLE), body: body.slice(0, MAX_NOTE_BODY), tags: nextTags }),
          ).finally(() => {
            saving.current = false;
          });
        } catch {
          saving.current = false;
        }
      };

      return h(
        'div',
        { className: 'wb_editor wb_ix_editor' },
        h(
          'div',
          { className: 'wb_editorHead' },
          h(
            'h2',
            { className: 'wb_editorTitle' },
            item === undefined
              ? block === 'idea'
                ? t('notes.newIdea')
                : t('notes.newNote')
              : block === 'idea'
                ? t('notes.editIdea')
                : t('notes.editNote'),
          ),
          h(
            'div',
            { className: 'wb_editorActions' },
            h('button', { type: 'button', className: 'wb_btn', onClick: onCancel }, t('surface.cancel')),
            h('button', { type: 'button', className: 'wb_btn', 'data-variant': 'primary', onClick: commit }, t('surface.save')),
          ),
        ),
        h('input', {
          ref: titleRef,
          className: 'wb_input',
          value: title,
          maxLength: MAX_NOTE_TITLE,
          placeholder: t('notes.titlePlaceholder'),
          'aria-label': t('notes.titlePlaceholder'),
          onChange: (event) => setTitle(event.target.value),
          onKeyDown: (event) => {
            if (event.key === 'Enter' && !event.nativeEvent?.isComposing) {
              event.preventDefault();
              commit();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          },
        }),
        h('textarea', {
          className: 'wb_area',
          value: body,
          maxLength: MAX_NOTE_BODY,
          placeholder: block === 'idea' ? t('notes.ideaPlaceholder') : t('notes.notePlaceholder'),
          'aria-label': block === 'idea' ? t('notes.ideaPlaceholder') : t('notes.notePlaceholder'),
          onChange: (event) => setBody(event.target.value),
        }),
        h('input', {
          className: 'wb_input',
          value: tags,
          maxLength: 400,
          placeholder: t('notes.tagsPlaceholder'),
          'aria-label': t('notes.tagsPlaceholder'),
          onChange: (event) => setTags(event.target.value),
        }),
      );
    }

    /**
     * The 灵感笔记 page: an index rail of slips and one reading record.
     */
    function NotePage({ t, boardKey, title, onBack }) {
      const document = useDocument();
      // Refresh relative timestamps while the page stays open.
      useSurfaceNow(60000);
      const [query, setQuery] = useState('');
      const [activeBlock, setActiveBlock] = useState('idea');
      const [editing, setEditing] = useState(null);
      const [menu, setMenu] = useState(null);
      const [failure, setFailure] = useState('');
      const [notice, setNotice] = useState('');
      const [selectedId, setSelectedId] = useState('');
      /** Only the newest write may publish its failure/success into this page. */
      const runSeq = useRef(0);

      const [boardId] = String(boardKey).split('/');
      const board = Array.isArray(document.boards) ? document.boards.find((item) => item !== null && item.id === boardId) : undefined;
      // `useDocument` returns the same document object until a real save
      // replaces it, so the raw list can be memoized. Without this every
      // 60-second timestamp tick re-sorted all four lists.
      const list = useMemo(() => noteListOf(document, boardKey), [document, boardKey]);
      const needle = query.trim().toLowerCase();
      const matches = (item) => {
        if (needle.length === 0) return true;
        const tags = Array.isArray(item.tags) ? item.tags.join(' ') : '';
        return `${item.title}\n${item.body}\n${tags}`.toLowerCase().includes(needle);
      };
      const allIdeas = useMemo(() => sortNotes(list.filter((item) => item.block !== 'note')), [list]);
      const allNotes = useMemo(() => sortNotes(list.filter((item) => item.block === 'note')), [list]);
      const pickedInitialBlock = useRef(false);
      useEffect(() => {
        if (pickedInitialBlock.current || list.length === 0) return;
        if (allIdeas.length === 0 && allNotes.length > 0) setActiveBlock('note');
        pickedInitialBlock.current = true;
      }, [allIdeas.length, allNotes.length, list.length]);
      const ideas = useMemo(
        () => sortNotes(list.filter((item) => item.block !== 'note' && matches(item))),
        [list, needle],
      );
      const notes = useMemo(
        () => sortNotes(list.filter((item) => item.block === 'note' && matches(item))),
        [list, needle],
      );
      const searching = needle.length > 0;
      const visible = useMemo(
        () => (searching ? sortNotes([...ideas, ...notes]) : activeBlock === 'note' ? notes : ideas),
        [searching, activeBlock, ideas, notes],
      );
      const selected =
        (selectedId.length > 0 ? list.find((item) => item.id === selectedId && visible.some((row) => row.id === selectedId)) : undefined) ??
        visible[0] ??
        null;
      const selectedNo = selected === null ? 0 : visible.indexOf(selected) + 1;
      const selectedTags = selected === null ? [] : tagsOf(selected);
      const relatedNotes = useMemo(
        () => (selected === null ? [] : sortNotes(list.filter((item) => item.id !== selected.id)).slice(0, 4)),
        [list, selected],
      );

      // The edited slip can disappear from another tab or a failed-save
      // recovery read. Clear the stale editor state so the other rows and the
      // New buttons are not silently blocked forever.
      useEffect(() => {
        if (editing === null || editing.id === undefined) return;
        if (list.some((item) => item.id === editing.id)) return;
        setEditing(null);
      }, [editing, list]);

      const run = (operation) => {
        const seq = (runSeq.current += 1);
        setFailure('');
        return Promise.resolve()
          .then(() => (typeof operation === 'function' ? operation() : operation))
          .then(() => {
            // A slower, older rejection must not overwrite the outcome of a
            // newer action with a stale error.
            if (seq === runSeq.current) setFailure('');
            return true;
          })
          .catch((error) => {
            if (seq === runSeq.current) {
              setFailure(fill(t('error.generic'), { message: error instanceof Error ? error.message : String(error) }));
            }
            return false;
          });
      };

      useEffect(() => {
        if (notice.length === 0) return undefined;
        const timer = setTimeout(() => setNotice(''), 2600);
        return () => clearTimeout(timer);
      }, [notice]);

      const patch = (id, values, touch = true) => {
        return run(
          updateNotes(boardKey, (current) =>
            current.map((item) =>
              item.id === id ? { ...item, ...values, ...(touch ? { updatedAt: Date.now() } : {}) } : item,
            ),
          ),
        );
      };

      const remove = (id) => {
        return run(updateNotes(boardKey, (current) => current.filter((item) => item.id !== id))).then((saved) => {
          if (!saved) return;
          if (editing !== null && editing.id === id) setEditing(null);
          if (selectedId === id) setSelectedId('');
        });
      };

      const startNew = (block) => {
        if (editing !== null) return;
        if (list.length >= MAX_NOTES_PER_BOARD) {
          setFailure(t('error.limitReached'));
          return;
        }
        setEditing({ block, draft: newNote(block) });
      };

      const startEdit = (item) => {
        if (editing !== null && editing.id !== item.id) return;
        setActiveBlock(item.block === 'note' ? 'note' : 'idea');
        setSelectedId(item.id);
        setEditing({ block: item.block === 'note' ? 'note' : 'idea', id: item.id });
      };

      const selectBlock = (block) => {
        setActiveBlock(block);
        setSelectedId('');
        setQuery('');
      };

      /**
       * Move one slip between the two blocks.
       */
      const convert = (item, block) => {
        if (editing !== null && editing.draft !== undefined && editing.draft.id === item.id) {
          setActiveBlock(block);
          setEditing({ ...editing, block, draft: { ...editing.draft, block } });
          return;
        }
        setActiveBlock(block);
        setSelectedId(item.id);
        patch(item.id, { block }).then((saved) => {
          // A failed write already publishes `failure`; claiming the slip
          // moved would then be a second, false receipt.
          if (saved) setNotice(block === 'note' ? t('notes.movedToNotes') : t('notes.movedToIdeas'));
        });
        if (editing !== null && editing.id === item.id) setEditing({ block, id: item.id });
      };

      const copy = (item) => {
        const text = noteTextOf(item);
        if (text.trim().length === 0) {
          setNotice(t('notes.copyEmpty'));
          return;
        }
        setFailure('');
        copyText(text)
          .then(() => setNotice(t('notes.copied')))
          .catch((error) => setFailure(fill(t('notes.copyFailed'), { message: error instanceof Error ? error.message : String(error) })));
      };

      const menuItems = (item) => [
        { key: 'edit', label: t('notes.open'), glyph: h(IconText, { size: 13 }), onSelect: () => startEdit(item) },
        {
          key: 'pin',
          label: item.pinned === true ? t('notes.unpin') : t('notes.pin'),
          glyph: h(IconPin, { size: 13 }),
          onSelect: () => patch(item.id, { pinned: item.pinned !== true }, false),
        },
        { key: 'copy', label: t('notes.copy'), glyph: h(IconCopy, { size: 13 }), onSelect: () => copy(item) },
        {
          key: 'flip',
          label: item.block === 'note' ? t('notes.toIdea') : t('notes.toNote'),
          glyph: h(IconNotePage, { size: 13 }),
          separated: true,
          onSelect: () => convert(item, item.block === 'note' ? 'idea' : 'note'),
        },
        {
          key: 'delete',
          label: t('notes.delete'),
          glyph: h(IconTrash, { size: 13 }),
          danger: true,
          separated: true,
          onSelect: () => remove(item.id),
        },
      ];

      const current = editing === null || editing.id === undefined ? undefined : list.find((item) => item.id === editing.id);
      const editingReady = editing !== null && (current !== undefined || editing.draft !== undefined);

      return h(
        SurfaceFrame,
        {
          t,
          kind: 'note',
          title,
          subtitle: t('notes.subtitle'),
          sheet: t('surface.sheetNote'),
          count: list.length,
          workspace: workspaceForBoard(document, board),
          onBack,
          actions: [
            h(
              'button',
              { key: 'idea', type: 'button', className: 'wb_btn', onClick: () => startNew('idea') },
              h(IconPlus, { size: 11 }),
              h('span', null, t('notes.newIdea')),
            ),
            h(
              'button',
              { key: 'note', type: 'button', className: 'wb_btn', 'data-variant': 'primary', onClick: () => startNew('note') },
              h(IconPlus, { size: 11 }),
              h('span', null, t('notes.newNote')),
            ),
          ],
        },

        h(
          'aside',
          { className: 'wb_ix_nav' },
          h(
            'div',
            { className: 'wb_ix_tabs' },
            h(
              'button',
              { type: 'button', className: 'wb_ix_tab', 'data-active': activeBlock === 'idea' ? 'true' : 'false', 'aria-pressed': activeBlock === 'idea' ? 'true' : 'false', onClick: () => selectBlock('idea') },
              t('notes.ideas'),
              h('b', null, String(allIdeas.length)),
            ),
            h(
              'button',
              { type: 'button', className: 'wb_ix_tab', 'data-active': activeBlock === 'note' ? 'true' : 'false', 'aria-pressed': activeBlock === 'note' ? 'true' : 'false', onClick: () => selectBlock('note') },
              t('notes.notes'),
              h('b', null, String(allNotes.length)),
            ),
          ),
          h(
            'span',
            { className: 'wb_search wb_ix_search' },
            h(IconSearch, { size: 11 }),
            h('input', {
              value: query,
              placeholder: t('notes.search'),
              'aria-label': t('notes.search'),
              onChange: (event) => setQuery(event.target.value),
            }),
          ),
          searching ? h('p', { className: 'wb_ix_searchState' }, fill(t('surface.searchResults'), { count: visible.length })) : null,
          visible.length === 0
            ? h('p', { className: 'wb_ix_empty' }, searching ? t('surface.noMatch') : activeBlock === 'note' ? t('notes.emptyNote') : t('notes.emptyIdea'))
            : h(
                'div',
                { className: 'wb_ix_noteList' },
                visible.map((item, index) =>
                  h(NoteCard, {
                    key: item.id,
                    t,
                    item,
                    no: index + 1,
                    selected: selected !== null && selected.id === item.id,
                    showKind: searching,
                    onOpen: (target) => {
                      // The open editor owns the reader; moving the highlight to
                      // another slip would make Save write the old slip.
                      if (editing !== null) return;
                      setActiveBlock(target.block === 'note' ? 'note' : 'idea');
                      setSelectedId(target.id);
                    },
                    onMenu: (target, at) => setMenu({ item: target, at }),
                  }),
                ),
              ),
          h(
            'div',
            { className: 'wb_ix_navFoot' },
            h('span', null, fill(t('ledger.slips'), { count: visible.length })),
            h('span', null, fill(t('surface.blockCount'), { ideas: allIdeas.length, notes: allNotes.length })),
          ),
        ),

        h(
          'article',
          { className: 'wb_ix_reader' },
          notice.length > 0 ? h('p', { className: 'wb_notice wb_ix_notice' }, notice) : null,
          failure.length > 0 ? h('p', { className: 'wb_error wb_ix_error' }, failure) : null,
          editingReady
            ? h(
                'div',
                { className: 'wb_ix_readerEditor' },
                h(NoteEditor, {
                  key: current === undefined ? `draft:${editing.draft.id}` : current.id,
                  t,
                  block: editing.block,
                  item: current === undefined ? editing.draft : current,
                  onSave: (values) => {
                    if (current === undefined) {
                      if (list.length >= MAX_NOTES_PER_BOARD) {
                        setFailure(t('error.limitReached'));
                        return Promise.resolve(false);
                      }
                      const record = { ...editing.draft, ...values, updatedAt: Date.now() };
                      return run(updateNotes(boardKey, (rows) => [...rows, record])).then((saved) => {
                        if (!saved) return false;
                        // A new slip must be visible even when a search was active.
                        setQuery('');
                        setActiveBlock(editing.block);
                        setSelectedId(record.id);
                        setEditing(null);
                        return true;
                      });
                    }
                    return patch(current.id, values).then((saved) => {
                      if (saved) setEditing(null);
                      return saved;
                    });
                  },
                  onCancel: () => setEditing(null),
                }),
              )
            : selected === null
              ? h(
                  'div',
                  { className: 'wb_ix_emptyReader' },
                  h('span', { className: 'wb_ix_bigNo' }, '—'),
                  h('h2', null, t('surface.emptyTitle')),
                  h('p', null, t('surface.emptyBody')),
                  h(
                    'div',
                    { className: 'wb_ix_emptyActions' },
                    h('button', { type: 'button', className: 'wb_btn', onClick: () => startNew('idea') }, t('notes.newIdea')),
                    h('button', { type: 'button', className: 'wb_btn', 'data-variant': 'primary', onClick: () => startNew('note') }, t('notes.newNote')),
                  ),
                )
              : h(
                  'div',
                  { className: 'wb_ix_readerLayout' },
                  h(
                    'div',
                    { className: 'wb_ix_readerBody' },
                    h('span', { className: 'wb_ix_bigNo' }, pad2(selectedNo)),
                    h(
                      'div',
                      { className: 'wb_ix_readerTop' },
                      h('span', null, selected.block === 'note' ? t('surface.kindNote') : t('surface.kindIdea')),
                      h('b', null, selected.pinned === true ? t('notes.pinned') : ''),
                    ),
                    h('h2', { className: 'wb_ix_readerTitle' }, typeof selected.title === 'string' && selected.title.length > 0 ? selected.title : t('notes.untitled')),
                    h('div', { className: 'wb_ix_readerMeta' }, agoLabel(selected.updatedAt ?? selected.createdAt, t)),
                    h('p', { className: 'wb_ix_readerText' }, typeof selected.body === 'string' && selected.body.trim().length > 0 ? selected.body : t('notes.copyEmpty')),
                    h(
                      'div',
                      { className: 'wb_ix_readerFoot' },
                      h('span', null, `${fill(t('surface.lastModified'), { when: agoLabel(selected.updatedAt ?? selected.createdAt, t) })} · ${t('surface.synced')}`),
                      h(
                        'div',
                        { className: 'wb_ix_readerActions' },
                        h('button', { type: 'button', className: 'wb_btn', onClick: () => startEdit(selected) }, t('surface.edit')),
                        h('button', { type: 'button', className: 'wb_btn', onClick: () => patch(selected.id, { pinned: selected.pinned !== true }, false) }, selected.pinned === true ? t('notes.unpin') : t('notes.pin')),
                        h('button', { type: 'button', className: 'wb_btn', onClick: () => copy(selected) }, t('notes.copy')),
                        h('button', { type: 'button', className: 'wb_btn', onClick: () => convert(selected, selected.block === 'note' ? 'idea' : 'note') }, selected.block === 'note' ? t('notes.toIdea') : t('notes.toNote')),
                      ),
                    ),
                  ),
                  h(
                    'aside',
                    { className: 'wb_ix_readerAside' },
                    h(
                      'div',
                      { className: 'wb_ix_asideBlock' },
                      h('h3', null, t('surface.record')),
                      h('div', { className: 'wb_ix_asideRow' }, h('span', null, t('surface.type')), h('b', null, selected.block === 'note' ? t('surface.kindNote') : t('surface.kindIdea'))),
                      h('div', { className: 'wb_ix_asideRow' }, h('span', null, t('surface.status')), h('b', null, selected.pinned === true ? t('notes.pinned') : t('notes.normal'))),
                      h('div', { className: 'wb_ix_asideRow' }, h('span', null, t('surface.created')), h('b', null, selected.createdAt ? dayLabel(dayKeyOf(new Date(Number(selected.createdAt))), t) : '—')),
                      h('div', { className: 'wb_ix_asideRow' }, h('span', null, t('surface.updated')), h('b', null, agoLabel(selected.updatedAt ?? selected.createdAt, t))),
                    ),
                    h(
                      'div',
                      { className: 'wb_ix_asideBlock' },
                      h('h3', null, t('surface.tags')),
                      selectedTags.length > 0
                        ? h(
                            'div',
                            { className: 'wb_ix_asideTags' },
                            selectedTags.map((tag) => h('span', { key: tag }, tag)),
                          )
                        : h('p', { className: 'wb_ix_asideEmpty' }, t('surface.noTags')),
                    ),
                    h(
                      'div',
                      { className: 'wb_ix_asideBlock wb_ix_asideRelated' },
                      h('h3', null, t('surface.related')),
                      relatedNotes.length === 0
                        ? h('p', { className: 'wb_ix_asideEmpty' }, t('surface.noRelated'))
                        : relatedNotes.map((item) =>
                            h(
                              'button',
                              {
                                key: item.id,
                                type: 'button',
                                className: 'wb_ix_relatedItem',
                                onClick: () => {
                                  if (editing !== null) return;
                                  setQuery('');
                                  setActiveBlock(item.block === 'note' ? 'note' : 'idea');
                                  setSelectedId(item.id);
                                },
                              },
                              h('span', { className: 'wb_ix_relatedTitle' }, typeof item.title === 'string' && item.title.length > 0 ? item.title : t('notes.untitled')),
                              h('span', { className: 'wb_ix_relatedMeta' }, item.block === 'note' ? t('notes.notes') : t('notes.ideas')),
                            ),
                          ),
                    ),
                  ),
                ),
        ),

        menu === null ? null : h(ContextMenu, { at: menu.at, items: menuItems(menu.item), onClose: () => setMenu(null) }),
      );
    }

    /**
     * The reminder toasts, registered in the frame-wide overlay.
     *
     * They live outside the workbench panel on purpose: a reminder must reach the
     * user while they are in a conversation, which is exactly when the to-do page
     * is not mounted.
     */
    function ReminderToasts() {
      useLocaleVersion();
      const t = translate();
      const [, setVersion] = useState(0);
      useEffect(() => {
        const listener = () => setVersion((value) => value + 1);
        reminderFeed.listeners.add(listener);
        return () => {
          reminderFeed.listeners.delete(listener);
          // The overlay is the only owner of these OS notifications; a plugin
          // unload must not leave system trays behind after the toasts vanish.
          for (const note of reminderNotifications.values()) {
            try {
              note.close();
            } catch {
              /* an already-closed notification is harmless */
            }
          }
          reminderNotifications.clear();
          // The feed and its acknowledgement set are owned by this overlay too.
          // Without clearing them a plugin unload (or a hot reload) keeps up to
          // 400 announced ids and every queued toast alive in the discarded
          // module for the life of the page.
          reminderFeed.items = [];
          announced.clear();
        };
      }, []);
      const items = reminderFeed.items;
      if (items.length === 0) return null;
      // One visual sheet per reminder, even if two scanners or a hot-reloaded
      // client produced the same todo/minute under different temporary ids.
      const seen = new Set();
      const visible = [];
      for (const item of items) {
        // Two different to-dos on one board can share a title and a minute;
        // only the to-do identity plus the board/time/title identifies one
        // reminder. Without it the second card was silently dropped.
        const key = `${item.todoId ?? item.id}\u0000${item.key ?? ''}\u0000${String(item.remindAt ?? '').slice(0, 16)}\u0000${item.title ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        visible.push(item);
      }
      return h(
        'div',
        { className: 'wb_toasts', role: 'status', 'data-window-drag-exclude': 'true', 'aria-live': 'polite' },
        visible.map((item) => {
          const due = dueState({ dueAt: item.dueAt });
          const note = typeof item.note === 'string' ? item.note.trim() : '';
          const board = typeof item.board === 'string' ? item.board : '';
          const priority = PRIORITIES.includes(item.priority) ? item.priority : 'normal';
          const dueDay = dayLabel(dayOfStamp(item.dueAt), t);
          return h(
            'div',
            {
              key: item.id,
              className: 'wb_toast',
              'data-tone': due === 'overdue' ? 'overdue' : due === 'today' ? 'today' : undefined,
            },
            h(
              'div',
              { className: 'wb_toastHead' },
              h('span', { className: 'wb_toastMark', 'aria-hidden': 'true' }, h(IconBell, { size: 12 })),
              h('span', { className: 'wb_toastKind' }, t('remind.badge')),
              h('span', { className: 'wb_toastWord' }, t('remind.word')),
              h(
                'span',
                { className: 'wb_toastStamp' },
                dayLabel(dayOfStamp(item.remindAt), t).length > 0
                  ? h('span', { className: 'wb_toastDay' }, dayLabel(dayOfStamp(item.remindAt), t))
                  : null,
                timeLabel(item.remindAt).length > 0 ? h('span', { className: 'wb_toastTime' }, timeLabel(item.remindAt)) : null,
              ),
            ),
            h(
              'div',
              { className: 'wb_toastBody' },
              h('p', { className: 'wb_toastTitle', title: item.title }, item.title),
              due === 'overdue' || due === 'today'
                ? h(
                    'span',
                    { className: 'wb_toastDue', 'data-tone': due },
                    due === 'overdue' ? t('todo.statOverdue') : t('todo.statToday'),
                  )
                : null,
              h(
                'div',
                { className: 'wb_toastMore' },
                h(
                  'div',
                  { className: 'wb_toastFacts' },
                  board.length > 0
                    ? h(
                        'div',
                        { className: 'wb_toastFact', 'data-wide': 'true' },
                        h('span', null, t('remind.detailBoard')),
                        h('b', null, board),
                      )
                    : null,
                  h(
                    'div',
                    { className: 'wb_toastFact' },
                    h('span', null, t('remind.detailPriority')),
                    h('b', null, t(`todo.priority.${priority}`)),
                  ),
                  dueDay.length > 0
                    ? h(
                        'div',
                        { className: 'wb_toastFact' },
                        h('span', null, t('remind.detailDue')),
                        h('b', null, dueDay),
                      )
                    : null,
                ),
                note.length > 0
                  ? h(
                      'div',
                      { className: 'wb_toastNoteBlock' },
                      h('span', { className: 'wb_toastNoteLabel' }, t('remind.detailNote')),
                      h('p', { className: 'wb_toastNoteBody' }, note),
                    )
                  : null,
              ),
            ),
            h(
              'div',
              { className: 'wb_toastActions' },
              h('button', { type: 'button', className: 'wb_btn', 'data-variant': 'primary', onClick: () => completeReminder(item) }, t('remind.done')),
              h('button', { type: 'button', className: 'wb_btn', onClick: () => snoozeReminder(item) }, t('remind.snooze')),
              h('button', { type: 'button', className: 'wb_btn', onClick: () => dismissReminder(item.id) }, t('remind.dismiss')),
            ),
          );
        }),
      );
    }

    /**
     * Ask the browser for notification permission, from a click.
     *
     * A notification permission may only be requested from a gesture — so the
     * to-do header carries the control instead of asking on load.
     */
    function ReminderPermissionButton({ t }) {
      const [, setVersion] = useState(0);
      const notify = typeof window !== 'undefined' ? window.Notification : undefined;
      if (notify === undefined) return null;
      const permission = notify.permission;
      const label =
        permission === 'granted'
          ? t('remind.on')
          : permission === 'denied'
            ? t('remind.blocked')
            : t('remind.enable');
      return h(
        'button',
        {
          type: 'button',
          className: 'wb_btn',
          disabled: permission === 'denied',
          title: permission === 'denied' ? t('remind.blockedHint') : t('remind.enableHint'),
          onClick: () => {
            try {
              const request = notify.requestPermission;
              if (typeof request !== 'function') return;
              Promise.resolve(request.call(notify))
                .then(() => setVersion((value) => value + 1))
                .catch(() => {});
            } catch {
              /* a browser without a usable permission request keeps the button inert */
            }
          },
        },
        h(IconBell, { size: 11 }),
        h('span', null, label),
      );
    }
    // ── the shelf page ───────────────────────────────────────────────────────
    //
    // The main surface is a private shelf of volumes. Each board is one bound
    // book: cover, spine, a right-hand inner page with its facts and chapters,
    // and the same Session/to-do/note behaviour the desk always had. Settings
    // live in the footer; today's tasks live in a drawer. The page stays sparse
    // until the pointer asks a question.

    /**
     * Everything one volume states about a board, read from the document.
     *
     * The fixed prompts come from the shared library through the board's own
     * settings bag, the skill count from that same bag, the conversation count
     * from the Session map, and the sub-board count from the tree itself.
     * `sessionSummaries` (when supplied) drops blank or vanished Sessions: a
     * Session that has only been provisioned is not a conversation yet and must
     * not be counted or listed as one.
     */
    function boardFacts(document, board, child, sessionSummaries) {
      const key = boardKeyOf(board, child);
      const bag = document !== null && typeof document === 'object' ? document.settings?.[key] : undefined;
      const prompts = Array.isArray(document !== null && typeof document === 'object' ? document.prompts : undefined)
        ? document.prompts
        : [];
      const selectedPrompts = new Set(promptIdsOf(bag));
      const promptNames = prompts
        .filter((item) => item !== null && typeof item === 'object' && selectedPrompts.has(item.id))
        .map((item) => item.name)
        .filter((name) => typeof name === 'string' && name.length > 0);
      const prompt = promptNames.length === 0 ? undefined : promptNames.join(' / ');
      const skillIds =
        bag !== null && typeof bag === 'object' && Array.isArray(bag.skills)
          ? [...new Set(bag.skills.filter((item) => typeof item === 'string' && item.length > 0))]
          : [];
      const skills = skillIds.length;
      const recorded =
        document !== null && typeof document === 'object' && document.sessions !== null && typeof document.sessions === 'object'
          ? sessionListOf(document.sessions[key])
          : [];
      const sessions =
        sessionSummaries === undefined
          ? recorded
          : recorded.filter((sessionId) => {
              const summary = sessionSummaries[sessionId];
              return summary !== undefined && summary !== null && summary.blank !== true;
            });
      const children = child === undefined && Array.isArray(board.children) ? board.children.length : 0;
      return { key, prompt, skills, skillIds, sessions, children };
    }

    /** The state a volume reports, as a word plus a lamp — never colour alone. */
    function boardState(t, board, facts, document) {
      if (board.kind === 'todo') {
        const list = todoListOf(document, facts.key);
        const open = list.filter((item) => item.done !== true);
        const overdue = open.filter((item) => dueState(item) === 'overdue').length;
        const today = open.filter((item) => dueState(item) === 'today').length;
        if (overdue > 0) return { label: t('ledger.stateOver'), tone: 'over' };
        if (today > 0) return { label: t('ledger.stateToday'), tone: 'today' };
        if (open.length > 0) return { label: t('ledger.stateIdle') };
        return { label: t('ledger.stateDone'), tone: 'done' };
      }
      if (board.kind === 'note') return { label: t('ledger.stateNote'), tone: 'ok' };
      return facts.sessions.length > 0 ? { label: t('ledger.stateReady'), tone: 'ok' } : { label: t('ledger.stateIdle') };
    }

    /** What one volume holds, said in the unit that volume actually holds. */
    function boardHold(t, document, board, facts) {
      if (board.kind === 'todo') {
        const list = todoListOf(document, facts.key);
        const done = list.filter((item) => item.done === true).length;
        return fill(t('today.done'), { done, total: list.length });
      }
      if (board.kind === 'note') return fill(t('ledger.slips'), { count: noteListOf(document, facts.key).length });
      return fill(t('ledger.talks'), { count: facts.sessions.length });
    }

    /** The day's ordinal in its year, and the year's length. */
    function yearPosition(now) {
      // UTC calendar arithmetic avoids a one-day drift when the local zone
      // crosses a daylight-saving boundary inside the year.
      const start = Date.UTC(now.getFullYear(), 0, 1);
      const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const day = Math.floor((today - start) / DAY_MS) + 1;
      const leap = (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || now.getFullYear() % 400 === 0;
      return { day, total: leap ? 366 : 365 };
    }

    /** The ISO week number the date sits in. */
    function weekOfYear(now) {
      const at = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const day = at.getUTCDay() || 7;
      at.setUTCDate(at.getUTCDate() + 4 - day);
      const start = new Date(Date.UTC(at.getUTCFullYear(), 0, 1));
      return Math.ceil((((at - start) / DAY_MS) + 1) / 7);
    }

    /** The preset word a board's inner page should show. */
    function presetLabel(t, preset) {
      if (preset === 'ptc') return t('mode.ptc');
      if (preset === 'minimal') return t('mode.minimal');
      if (preset === 'cordis') return t('mode.cordis');
      return t('ledger.kindStandard');
    }

    /** The mode word a board carries on its inner page. */
    function boardKindLabel(t, board) {
      if (board.kind === 'todo') return t('ledger.kindTodo');
      if (board.kind === 'note') return t('ledger.kindNote');
      return board.mode === 'chat' ? t('ledger.kindChat') : presetLabel(t, board.agentPreset);
    }

    /** The short machine word a volume carries on its spine and cover. */
    function boardCodeWord(board) {
      if (board.kind === 'todo') return 'TODO';
      if (board.kind === 'note') return 'NOTES';
      if (board.mode === 'chat') return 'CHAT';
      if (board.agentPreset === 'ptc') return 'PTC';
      if (board.agentPreset === 'minimal') return 'MINIMAL';
      if (board.agentPreset === 'cordis') return 'CORDIS';
      const name = String(board.name ?? '').toLowerCase();
      if (/文档|文檔|资料|資料|doc|file/.test(name)) return 'DOCS';
      if (/媒体|媒體|图|圖|影|media|photo|video/.test(name)) return 'MEDIA';
      return 'STD';
    }

    /** The five book-cloth colours, in the owner's red → orange → yellow → green → blue order. */
    const CLOTH = ['#5f2522', '#663a1b', '#5b4815', '#27463a', '#233b4f'];

    /** A cloth colour by shelf position: the sequence repeats after blue. */
    function clothForIndex(index) {
      if (!Number.isFinite(index)) return CLOTH[0];
      return CLOTH[((Math.trunc(index) % CLOTH.length) + CLOTH.length) % CLOTH.length];
    }

    /**
     * The English words a board name can be built from.
     *
     * This is a suggestion, not a translation service: it covers the working
     * vocabulary a workbench board is normally named after, while the Settings
     * editor keeps the English cover line editable for everything else. The
     * order matters — it is the order the words appear on the cover.
     */
    const BOARD_EN_WORDS = [
      [/聊天|chat|talk/i, 'CHAT'],
      [/对话|對話|conversation/i, 'CONVERSATION'],
      [/文档|文檔|资料|資料|doc|file/i, 'DOCS'],
      [/处理|處理|process/i, 'PROCESSING'],
      [/媒体|媒體|media|photo|video/i, 'MEDIA'],
      [/创作|創作|creat/i, 'CREATION'],
      [/待办|待辦|todo/i, 'TODO'],
      [/任务|任務|task/i, 'TASKS'],
      [/灵感|靈感|idea/i, 'IDEAS'],
      [/笔记|筆記|note/i, 'NOTES'],
      [/阅读|閱讀|read/i, 'READING'],
      [/学习|學習|study/i, 'STUDY'],
      [/写作|寫作|writ/i, 'WRITING'],
      [/设计|設計|design/i, 'DESIGN'],
      [/项目|項目|project/i, 'PROJECT'],
      [/会议|會議|meeting/i, 'MEETINGS'],
      [/计划|計劃|plan/i, 'PLANS'],
      [/复盘|復盤|review/i, 'REVIEW'],
      [/周报|週報|weekly/i, 'WEEKLY'],
      [/客户|客戶|client/i, 'CLIENT'],
      [/产品|產品|product/i, 'PRODUCT'],
      [/市场|市場|market/i, 'MARKET'],
      [/调研|調研|research/i, 'RESEARCH'],
      [/运营|運營|ops/i, 'OPS'],
      [/财务|財務|finance/i, 'FINANCE'],
      [/旅行|travel/i, 'TRAVEL'],
      [/健康|health/i, 'HEALTH'],
      [/家庭|family/i, 'FAMILY'],
      [/生活|life/i, 'LIFE'],
      [/收藏|collection/i, 'COLLECTION'],
      [/清单|清單|list/i, 'LIST'],
      [/新板块|新板塊/i, 'NEW BOARD'],
      [/未命名/i, 'UNTITLED'],
    ];

    /**
     * Suggest the English cover line for a board name.
     *
     * The seeded five are exact, so their covers never drift. A custom board is
     * built from the vocabulary above (e.g. 阅读计划 → READING / PLANS) and gets
     * the kind's family word when nothing matches. Settings writes the final
     * value to `enName`; this is only the first draft and the fallback.
     */
    function suggestEnglishCover(board) {
      const name = String(board.name ?? '').trim();
      if (name.length === 0) {
        return board.kind === 'todo' ? 'TODO / TASKS' : board.kind === 'note' ? 'NOTES / IDEAS' : 'CHAT / CONVERSATION';
      }
      if (name === '聊天') return 'CHAT / CONVERSATION';
      if (/^[\x20-\x7E]+$/.test(name)) return name.toUpperCase();
      const words = [];
      for (const [pattern, word] of BOARD_EN_WORDS) {
        if (!pattern.test(name) || words.includes(word)) continue;
        words.push(word);
        if (words.length === 2) break;
      }
      if (words.length > 0) return words.join(' / ');
      return board.kind === 'todo' ? 'TODO / TASKS' : board.kind === 'note' ? 'NOTES / IDEAS' : 'CHAT / CONVERSATION';
    }

    /** The faded letter behind the cover title. */
    function coverLetter(board) {
      const explicit = String(board.enName ?? '').trim();
      const label = explicit.length > 0 ? explicit : suggestEnglishCover(board);
      return (label.slice(0, 1) || boardCodeWord(board).slice(0, 1)).toUpperCase();
    }

    /**
     * The English translation printed under the Chinese volume name.
     *
     * The shelf's covers speak Chinese first; this line is the same title in
     * English, not a machine state. The explicit Settings value wins, then the
     * seeded pairing or the suggested vocabulary covers the first draft.
     */
    function coverSub(board) {
      const explicit = String(board.enName ?? '').trim();
      return explicit.length > 0 ? explicit.toUpperCase() : suggestEnglishCover(board);
    }

    /** A cover title tier, so a long volume name never breaks the cover. */
    function coverTier(name) {
      const length = [...String(name ?? '')].length;
      if (length <= 4) return 's';
      if (length <= 7) return 'm';
      if (length <= 10) return 'l';
      return 'xl';
    }

    /**
     * The fixed motto printed as the lead of each seeded volume.
     *
     * The five named volumes each carry their own line; a volume the user
     * creates later has no seeded motto and keeps the record-drawn lead.
     */
    function bookMotto(t, board) {
      if (board.id === 'chat') return t('shelf.mottoChat');
      if (board.id === 'docs') return t('shelf.mottoDocs');
      if (board.id === 'media') return t('shelf.mottoMedia');
      if (board.id === 'todos') return t('shelf.mottoTodo');
      if (board.id === 'notes') return t('shelf.mottoNote');
      return '';
    }

    /** The one-line volume lead: a seeded volume's motto, else the record. */
    function bookLead(t, document, board, facts) {
      const motto = bookMotto(t, board);
      if (motto.length > 0) return motto;
      if (board.kind === 'todo') {
        const list = todoListOf(document, facts.key);
        const open = list.filter((item) => item.done !== true).length;
        if (list.length === 0) return t('shelf.leadTodoEmpty');
        if (open === 0) return t('shelf.leadTodoClear');
        return fill(t('shelf.leadTodoOpen'), { open });
      }
      if (board.kind === 'note') {
        const count = noteListOf(document, facts.key).length;
        return count === 0 ? t('shelf.leadNoteEmpty') : fill(t('shelf.leadNote'), { count });
      }
      if (facts.children > 0) return fill(t('shelf.leadChatSubs'), { count: facts.children });
      return facts.sessions.length > 0 ? t('shelf.leadChatReady') : t('shelf.leadChatEmpty');
    }

    /** The standing description of what a volume is for. */
    function bookLede(t, board) {
      if (board.kind === 'todo') return t('shelf.ledeTodo');
      if (board.kind === 'note') return t('shelf.ledeNote');
      if (board.id === 'chat') return t('shelf.ledeChat');
      if (board.id === 'docs') return t('shelf.ledeDocs');
      if (board.id === 'media') return t('shelf.ledeMedia');
      return t('shelf.ledeOther');
    }

    /**
     * The four facts printed on the inner page.
     *
     * When a chapter is selected, `child` is that sub-board and `facts` is its
     * own facts bag; `board` stays the parent so its workspace and branch mode
     * are inherited exactly as a new Session would inherit them. MODE only
     * appears where an agent exists.
     */
    function bookFacts(t, document, board, child, facts, workspace) {
      // A hand-edited document may put a to-do or note child under a board of
      // another kind; the fact block must describe the subject actually shown,
      // not always the parent board's kind.
      const kind = child === undefined ? board.kind : child.kind;
      if (kind === 'todo') {
        const list = todoListOf(document, facts.key);
        const open = list.filter((item) => item.done !== true);
        const today = open.filter((item) => dueState(item) === 'today').length;
        const reminders = open.filter((item) => typeof item.remindAt === 'string' && item.remindAt.length > 0).length;
        const done = list.filter((item) => item.done === true).length;
        return [
          [t('shelf.factList'), fill(t('today.done'), { done, total: list.length })],
          [t('shelf.factToday'), String(today)],
          [t('shelf.factReminders'), String(reminders)],
          [t('settings.workspace'), workspace],
        ];
      }
      if (kind === 'note') {
        const list = noteListOf(document, facts.key);
        const pinned = list.filter((item) => item.pinned === true).length;
        const tags = new Set();
        for (const item of list) {
          for (const tag of Array.isArray(item.tags) ? item.tags : []) {
            if (typeof tag === 'string' && tag.length > 0) tags.add(tag);
          }
        }
        return [
          [t('shelf.factRecords'), String(list.length)],
          [t('shelf.factPinned'), String(pinned)],
          [t('shelf.factTags'), String(tags.size)],
          [t('settings.workspace'), workspace],
        ];
      }
      const mode = child === undefined ? board.mode : sessionModeOf(board, child);
      const subject = child === undefined ? board : { ...child, mode };
      const preset = agentPresetOf(board, child);
      return [
        [t('today.prompt'), facts.prompt ?? t('ledger.noPrompt')],
        [t('today.mode'), `${boardKindLabel(t, subject)} · ${preset === CHAT_PRESET ? 'chat' : preset}`],
        [t('today.skills'), facts.skills === 0 ? t('ledger.noSkills') : facts.skillIds.join(' / ')],
        [t('settings.workspace'), workspace],
      ];
    }

    /** The kind label in the inner page's running head. */
    function bookKindLine(t, board) {
      if (board.kind === 'todo') return t('shelf.kindTodo');
      if (board.kind === 'note') return t('shelf.kindNote');
      return t('shelf.kindChat');
    }

    /**
     * Live metadata for the session ids a board records.
     *
     * The workbench document owns the ids; the Session controller owns the
     * titles and activity stamps. Reading the second here keeps the list useful
     * without writing a second copy of a Session's name into the document.
     * Archived Sessions stay in the Session catalog, so the Workspace registry's
     * archive set is applied here as well; otherwise one would remain listed in
     * a sub-board until it was clicked (the open path would then report it gone).
     */
    const EMPTY_SESSION_SUMMARIES = {};
    function useSessionSummaries() {
      const sessions = pluginContext === null ? undefined : pluginContext.get('sessions');
      const workspaces = pluginContext === null ? undefined : pluginContext.get('workspaces');
      const [, setVersion] = useState(0);
      useEffect(() => {
        const listener = () => setVersion((value) => value + 1);
        const subscriptions = [];
        const sessionList = sessions === undefined || sessions === null ? undefined : sessions.list;
        if (sessionList !== undefined && sessionList !== null && typeof sessionList.subscribe === 'function') {
          const unsubscribe = sessionList.subscribe(listener);
          if (typeof unsubscribe === 'function') subscriptions.push(unsubscribe);
        }
        const workspaceList = workspaces === undefined || workspaces === null ? undefined : workspaces.list;
        if (workspaceList !== undefined && workspaceList !== null && typeof workspaceList.subscribe === 'function') {
          const unsubscribe = workspaceList.subscribe(listener);
          if (typeof unsubscribe === 'function') subscriptions.push(unsubscribe);
        }
        if (subscriptions.length === 0) return undefined;
        return () => {
          for (const unsubscribe of subscriptions) unsubscribe();
        };
      }, [sessions, workspaces]);
      let byId = EMPTY_SESSION_SUMMARIES;
      let archivedIds = null;
      try {
        byId = sessions?.list?.getSnapshot?.()?.byId ?? EMPTY_SESSION_SUMMARIES;
        const archivedState = workspaces?.list?.getSnapshot?.();
        archivedIds = Array.isArray(archivedState?.archivedSessionIds) ? archivedState.archivedSessionIds : null;
      } catch {
        byId = EMPTY_SESSION_SUMMARIES;
      }
      // Keep the summary object stable between renders: `latestReturnTarget`
      // runs on every shelf render, and an unconditional `Object.fromEntries`
      // here made every render look like new session data.
      return useMemo(() => {
        if (archivedIds === null || archivedIds.length === 0) return byId;
        const archived = new Set(archivedIds);
        return Object.fromEntries(Object.entries(byId).filter(([sessionId]) => !archived.has(sessionId)));
      }, [byId, archivedIds]);
    }

    /**
     * The Session a "return to the latest conversation" control should open.
     *
     * The exact return is the Session the shell still holds as its main view
     * while a global panel is showing: that is the conversation the user just
     * left, and it is available even when no board recorded it. When there is
     * no such Session, the newest workbench conversation is used instead. A
     * recorded id can be archived or gone, so it is filtered with the same
     * check the session lines use; blank provisioned Sessions are not
     * conversations and are skipped.
     * @param document - the workbench document.
     * @param sessionSummaries - the live Session list indexed by id.
     * @param ctx - client plugin context.
     * @returns the target, or undefined when there is nothing to return to.
     */
    function latestReturnTarget(document, sessionSummaries, ctx) {
      const summaries = sessionSummaries !== null && typeof sessionSummaries === 'object' ? sessionSummaries : {};
      // More than one Session can be marked as retained by the main view (for
      // example after a split view closes). The map's key order is not a
      // recency order, so pick the most recently updated retained Session
      // instead of whichever object happened to be inserted first.
      let current;
      for (const id of Object.keys(summaries)) {
        const summary = summaries[id];
        if (summary === null || typeof summary !== 'object') continue;
        if (summary.blank === true) continue;
        if ((summary.retainedBy?.mainView ?? 0) <= 0) continue;
        if (sessionUnavailable(ctx, id)) continue;
        const at = Number(summary.updatedAt) || 0;
        if (current === undefined || at > current.at) current = { id, at };
      }
      if (current !== undefined) return { id: current.id, source: 'current' };

      const boards = document !== null && typeof document === 'object' && Array.isArray(document.boards) ? document.boards : [];
      const boardsById = new Map();
      for (const board of boards) {
        if (board !== null && typeof board === 'object' && typeof board.id === 'string') boardsById.set(board.id, board);
      }
      const sessions =
        document !== null && typeof document === 'object' && document.sessions !== null && typeof document.sessions === 'object'
          ? document.sessions
          : {};
      let best;
      for (const key of Object.keys(sessions)) {
        const value = sessions[key];
        const parts = key.split('/');
        if (parts.length > 2) continue;
        const board = boardsById.get(parts[0]);
        if (board === undefined || isSurfaceBoard(board)) continue;
        const child =
          parts.length === 2
            ? (Array.isArray(board.children) ? board.children : []).find(
                (item) => item !== null && typeof item === 'object' && item.id === parts[1],
              )
            : undefined;
        if (parts.length === 2 && (child === undefined || isSurfaceBoard(child))) continue;
        for (const id of sessionListOf(value)) {
          const summary = summaries[id];
          if (summary === null || typeof summary !== 'object' || summary.blank === true) continue;
          if (sessionUnavailable(ctx, id)) continue;
          const at = Number(summary.updatedAt) || 0;
          if (best !== undefined && at <= best.at) continue;
          best = {
            id,
            board,
            child,
            source: 'board',
            at,
          };
        }
      }
      if (best === undefined) return undefined;
      return { id: best.id, board: best.board, child: best.child, source: 'board' };
    }

    /** The sessions a chapter owns, newest first, each one a way back in. */
    function SubSessionList({ t, board, child, facts, sessionSummaries, onOpenSession, onArchiveSession }) {
      const [menu, setMenu] = useState(null);
      const sessions = facts.sessions;
      if (sessions.length === 0) return h('p', { className: 'wb_subEmpty' }, t('session.empty'));
      const openMenu = (sessionId, at) => setMenu({ sessionId, at });
      return h(
        'div',
        { className: 'wb_subSessions' },
        sessions.map((sessionId, index) => {
          const summary = sessionSummaries[sessionId];
          const ordinal = sessions.length - index;
          const title =
            summary !== null && summary !== undefined && typeof summary.title === 'string' && summary.title.trim().length > 0
              ? summary.title.trim()
              : fill(t('session.talkNo'), { index: ordinal });
          const when =
            summary !== null && summary !== undefined && Number(summary.updatedAt) > 0 ? agoLabel(summary.updatedAt, t) : '';
          return h(
            'button',
            {
              key: sessionId,
              type: 'button',
              className: 'wb_subSession',
              'data-session-id': sessionId,
              'data-running': summary?.running === true ? 'true' : undefined,
              title,
              onClick: (event) => {
                event.stopPropagation();
                onOpenSession(sessionId, board, child);
              },
              onContextMenu: (event) => {
                if (typeof onArchiveSession !== 'function') return;
                event.preventDefault();
                event.stopPropagation();
                openMenu(sessionId, { x: event.clientX, y: event.clientY });
              },
              onKeyDown: (event) => {
                if (typeof onArchiveSession !== 'function') return;
                if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
                event.preventDefault();
                event.stopPropagation();
                const box = event.currentTarget.getBoundingClientRect();
                openMenu(sessionId, { x: box.right - 8, y: box.bottom + 4 });
              },
            },
            h('span', { className: 'wb_subSessionNo' }, pad2(ordinal)),
            h('span', { className: 'wb_subSessionTitle' }, title),
            h('span', { className: 'wb_subSessionMeta' }, summary?.running === true ? t('session.running') : when),
          );
        }),
        menu === null
          ? null
          : h(ContextMenu, {
              at: menu.at,
              items: [
                {
                  key: 'archive',
                  label: t('session.archive'),
                  glyph: h(IconArchive, { size: 13 }),
                  onSelect: () => {
                    const sessionId = menu.sessionId;
                    setMenu(null);
                    onArchiveSession(board, child, sessionId);
                  },
                },
              ],
              onClose: () => setMenu(null),
            }),
      );
    }

    /**
     * The right-hand inner page's record block: chapters when a folder owns
     * them, otherwise the latest records the volume actually holds. A to-do
     * volume can tick a task from here; a note volume can open its reader; a
     * conversation volume lists the Sessions that already exist.
     */
    function ShelfContents({
      t,
      document,
      board,
      facts,
      sessionSummaries,
      openSub,
      onToggleSub,
      onOpen,
      onOpenSession,
      onNewTalk,
      onArchiveSession,
      onMenu,
      onToggleTodo,
    }) {
      const children = Array.isArray(board.children) ? board.children : [];
      // Children are rendered every time the active volume changes or its
      // page state ticks; scanning every child's prompts and Session list on
      // each of those renders is avoidable work for a folder with many
      // chapters. The map is stable until the document or the live summaries
      // change.
      const childFactsById = useMemo(() => {
        const factsById = new Map();
        for (const child of children) {
          if (child !== null && typeof child === 'object' && typeof child.id === 'string') {
            factsById.set(child.id, boardFacts(document, board, child, sessionSummaries));
          }
        }
        return factsById;
      }, [document, board, children, sessionSummaries]);
      // The two record previews scan the whole list; a drawer toggle or a
      // pointer-only volume change must not repeat that work.
      const todoPreview = useMemo(
        () =>
          board.kind === 'todo'
            ? sortTodos(todoListOf(document, facts.key).filter((item) => item.done !== true)).slice(0, 4)
            : [],
        [board.kind, document, facts.key],
      );
      const notePreview = useMemo(
        () => (board.kind === 'note' ? sortNotes(noteListOf(document, facts.key)).slice(0, 3) : []),
        [board.kind, document, facts.key],
      );
      if (children.length > 0) {
        return h(
          'div',
          { className: 'wb_sh_subs' },
          h(
            'div',
            { className: 'wb_sh_subsHead' },
            h('span', null, t('shelf.subs')),
            h('span', null, pad2(children.length)),
          ),
          h(
            'div',
            { className: 'wb_subList' },
            children.map((child, index) => {
              const childFacts = childFactsById.get(child.id);
              const childState = boardState(t, child, childFacts, document);
              const key = `${board.id}/${child.id}`;
              const surface = isSurfaceBoard(child);
              const expanded = !surface && openSub === key;
              return h(
                'div',
                { key: child.id, className: 'wb_subBlock', 'data-open': expanded ? 'true' : undefined },
                h(
                  'div',
                  { className: 'wb_sh_subLine' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'wb_subRow',
                      'data-board-key': key,
                      'data-sub': 'true',
                      'aria-expanded': surface ? undefined : expanded ? 'true' : 'false',
                      title: surface ? t('ledger.hintSurface') : t('ledger.subHint'),
                      onClick: (event) => {
                        event.stopPropagation();
                        if (surface) {
                          onOpen(board, child);
                          return;
                        }
                        onToggleSub(key);
                      },
                      onContextMenu: (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (surface) return;
                        onMenu(board, child, { x: event.clientX, y: event.clientY });
                      },
                      onKeyDown: (event) => {
                        if (surface) return;
                        if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
                        event.preventDefault();
                        event.stopPropagation();
                        const box = event.currentTarget.getBoundingClientRect();
                        onMenu(board, child, { x: box.right - 8, y: box.bottom + 4 });
                      },
                    },
                    h('span', { className: 'wb_subNo' }, pad2(index + 1)),
                    h('span', { className: 'wb_subName', title: child.name }, child.name),
                    h('span', { className: 'wb_subCount' }, boardHold(t, document, child, childFacts)),
                    h('span', { className: 'wb_subState', 'data-tone': childState.tone ?? undefined }, childState.label),
                    surface ? null : h('span', { className: 'wb_subCaret', 'aria-hidden': 'true' }),
                  ),
                  surface
                    ? null
                    : h(
                        'button',
                        {
                          type: 'button',
                          className: 'wb_subAdd',
                          title: t('shelf.addTalk'),
                          'aria-label': `${t('shelf.addTalk')} · ${child.name}`,
                          onClick: (event) => {
                            event.stopPropagation();
                            onNewTalk(board, child);
                          },
                        },
                        h(IconPlus, { size: 11 }),
                      ),
                ),
                expanded ? h(SubSessionList, { t, board, child, facts: childFacts, sessionSummaries, onOpenSession, onArchiveSession }) : null,
              );
            }),
          ),
        );
      }

      if (board.kind === 'todo') {
        const list = todoPreview;
        return h(
          'div',
          { className: 'wb_sh_subs' },
          h('div', { className: 'wb_sh_subsHead' }, h('span', null, t('shelf.recent')), h('span', null, pad2(list.length))),
          list.length === 0
            ? h('p', { className: 'wb_sh_recentEmpty' }, t('shelf.recentEmpty'))
            : h(
                'div',
                { className: 'wb_contentList' },
                list.map((item) => {
                  const state = dueState(item);
                  return h(
                    'div',
                    {
                      key: item.id,
                      className: 'wb_contentRow',
                      'data-late': state === 'overdue' ? 'true' : undefined,
                      'data-today': state === 'today' ? 'true' : undefined,
                    },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'wb_tick',
                        role: 'checkbox',
                        'aria-checked': 'false',
                        'aria-label': t('todo.toggle'),
                        onClick: () => onToggleTodo(facts.key, item),
                      },
                      null,
                    ),
                    h('span', { className: 'wb_contentText', title: item.title }, item.title),
                    h(
                      'span',
                      { className: 'wb_contentMeta' },
                      state === 'overdue' ? t('ledger.stateOver') : state === 'today' ? t('time.today') : t('today.onList'),
                    ),
                  );
                }),
              ),
        );
      }

      if (board.kind === 'note') {
        const list = notePreview;
        return h(
          'div',
          { className: 'wb_sh_subs' },
          h('div', { className: 'wb_sh_subsHead' }, h('span', null, t('shelf.recent')), h('span', null, pad2(list.length))),
          list.length === 0
            ? h('p', { className: 'wb_sh_recentEmpty' }, t('shelf.recentEmpty'))
            : h(
                'div',
                { className: 'wb_contentList' },
                list.map((item) =>
                  h(
                    'button',
                    { key: item.id, type: 'button', className: 'wb_contentRow', onClick: () => onOpen(board) },
                    h('span', { 'aria-hidden': 'true' }),
                    h('span', { className: 'wb_contentText', title: item.title || t('notes.untitled') }, item.title || t('notes.untitled')),
                    h('span', { className: 'wb_contentMeta' }, item.pinned === true ? t('notes.pinned') : agoLabel(item.updatedAt ?? item.createdAt, t)),
                  ),
                ),
              ),
        );
      }

      const recent = facts.sessions.slice(0, 3);
      return h(
        'div',
        { className: 'wb_sh_subs' },
        h('div', { className: 'wb_sh_subsHead' }, h('span', null, t('shelf.recent')), h('span', null, pad2(recent.length))),
        recent.length === 0
          ? h('p', { className: 'wb_sh_recentEmpty' }, t('shelf.recentEmpty'))
          : h(SubSessionList, { t, board, child: undefined, facts: { ...facts, sessions: recent }, sessionSummaries, onOpenSession, onArchiveSession }),
      );
    }

    /**
     * One cover: cloth, inner rule, a faded letter, the volume name and its desk.
     *
     * The cover is the one large physical object; it leans under the pointer
     * with a moving cast shadow, and each volume change gives it a short
     * spring-loaded scale bump from its foot, shadow included, before it
     * settles back onto the spread.
     */
    function ShelfCover({ t, board, no, total, clothIndex, workspace }) {
      const wrapRef = useRef(null);
      const coverRef = useRef(null);
      const shadowRef = useRef(null);
      const lastBoardId = useRef(null);
      const bump = useRef(null);
      const bumpRaf = useRef(0);
      const bumpLast = useRef(0);
      /** Coalesce high-frequency pointer moves into one paint per frame. */
      const pointerRaf = useRef(0);
      const pointerAt = useRef(null);
      if (bump.current === null) bump.current = springAxis(1.03, 300, 12);

      const paintBump = () => {
        const cover = coverRef.current;
        const shadow = shadowRef.current;
        if (cover === null) return;
        const scale = bump.current.value;
        cover.style.scale = scale.toFixed(4);
        if (shadow !== null) shadow.style.scale = (1 + (scale - 1) * 0.7).toFixed(4);
      };

      const startBump = () => {
        if (reducedMotion() || typeof requestAnimationFrame !== 'function') {
          bump.current.value = bump.current.target;
          bump.current.velocity = 0;
          paintBump();
          return;
        }
        if (bumpRaf.current !== 0) return;
        bumpLast.current = performance.now();
        const tick = (now) => {
          const dt = Math.min(1 / 30, Math.max(0.001, (now - bumpLast.current) / 1000));
          bumpLast.current = now;
          const done = stepSpring(bump.current, dt);
          paintBump();
          if (done) {
            bumpRaf.current = 0;
            return;
          }
          bumpRaf.current = requestAnimationFrame(tick);
        };
        bumpRaf.current = requestAnimationFrame(tick);
      };

      useLayoutEffect(() => {
        // The active volume rests slightly larger than its base size; paint it
        // before the first frame so the shelf opens at its settled scale.
        paintBump();
      }, []);

      useEffect(() => {
        if (lastBoardId.current === null) {
          lastBoardId.current = board.id;
          return;
        }
        if (lastBoardId.current === board.id) return;
        lastBoardId.current = board.id;
        if (reducedMotion()) return;
        // Energy carries across fast sweeps: a second volume adds to the
        // spring instead of restarting it, so the cover answers the hand.
        bump.current.velocity = Math.min(4, bump.current.velocity + 2.6);
        startBump();
      }, [board.id]);

      useEffect(
        () => () => {
          if (bumpRaf.current !== 0) cancelAnimationFrame(bumpRaf.current);
          if (pointerRaf.current !== 0) cancelAnimationFrame(pointerRaf.current);
        },
        [],
      );

      const paintPointer = (event) => {
        const wrap = wrapRef.current;
        if (wrap === null) return;
        // One layout read per frame, not one per pointer event: the cover is
        // large and its shadow follows the pointer, so a 120 Hz trackpad used
        // to force 120 synchronous `getBoundingClientRect()` calls per second.
        const rect = wrap.getBoundingClientRect();
        const x = Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5));
        const y = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5));
        wrap.style.setProperty('--cover-rx', `${(-y * 3.1).toFixed(2)}deg`);
        wrap.style.setProperty('--cover-ry', `${(x * 3.6).toFixed(2)}deg`);
        wrap.style.setProperty('--cover-shadow-x', `${(-x * 12).toFixed(1)}px`);
        wrap.style.setProperty('--cover-shadow-y', `${(5 + y * 9).toFixed(1)}px`);
      };

      const onPointerMove = (event) => {
        if (event.pointerType === 'touch' || reducedMotion()) return;
        pointerAt.current = { clientX: event.clientX, clientY: event.clientY };
        if (pointerRaf.current !== 0 || typeof requestAnimationFrame !== 'function') {
          if (typeof requestAnimationFrame !== 'function') paintPointer(pointerAt.current);
          return;
        }
        pointerRaf.current = requestAnimationFrame(() => {
          pointerRaf.current = 0;
          const point = pointerAt.current;
          if (point !== null) paintPointer(point);
        });
      };

      const resetPointer = () => {
        pointerAt.current = null;
        if (pointerRaf.current !== 0) {
          cancelAnimationFrame(pointerRaf.current);
          pointerRaf.current = 0;
        }
        const wrap = wrapRef.current;
        if (wrap === null) return;
        wrap.style.setProperty('--cover-rx', '0deg');
        wrap.style.setProperty('--cover-ry', '0deg');
        wrap.style.setProperty('--cover-shadow-x', '0px');
        wrap.style.setProperty('--cover-shadow-y', '0px');
      };

      return h(
        'div',
        {
          ref: wrapRef,
          className: 'wb_sh_coverWrap',
          onPointerMove,
          onPointerLeave: resetPointer,
        },
        h('div', { ref: shadowRef, className: 'wb_sh_coverShadow', 'aria-hidden': 'true' }),
        h(
          'article',
          { ref: coverRef, className: 'wb_sh_cover', style: { '--cover': clothForIndex(clothIndex) }, 'aria-label': board.name },
          h(
            'div',
            { className: 'wb_sh_coverTop' },
            h('span', null, `WORKBENCH / VOL. ${pad2(no)}`),
            h('span', null, String(new Date().getFullYear())),
          ),
          h('div', { className: 'wb_sh_coverLetter', 'aria-hidden': 'true' }, coverLetter(board)),
          h(
            'h1',
            { className: 'wb_sh_coverTitle wb_detailName', 'data-tier': coverTier(board.name), title: board.name },
            board.name,
          ),
          h('div', { className: 'wb_sh_coverSub' }, coverSub(board)),
          h('div', { className: 'wb_sh_coverRule', 'aria-hidden': 'true' }),
          h(
            'div',
            { className: 'wb_sh_coverFoot' },
            h('span', null, 'ONE WORKSPACE', h('br'), `${pad2(total)} VOLUMES`),
            h('span', { className: 'wb_sh_coverPath', title: workspace }, workspace),
          ),
        ),
      );
    }

    /** The date plate that heads the inner page, below the press bar. */
    function ShelfDatePlate({ t }) {
      const now = useSurfaceNow(60000);
      const weekday = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
      const position = yearPosition(now);
      return h(
        'div',
        { className: 'wb_sh_datePlate' },
        h(
          'time',
          {
            className: 'wb_sh_dateValue',
            dateTime: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
          },
          `${pad2(now.getMonth() + 1)} / ${pad2(now.getDate())}`,
        ),
        h('span', { className: 'wb_sh_dateRule', 'aria-hidden': 'true' }),
        h(
          'span',
          { className: 'wb_sh_dateMeta' },
          `${t(`day.week.${weekday}`)} · ${fill(t('watch.dayOfYear'), { day: position.day, total: position.total })}`,
        ),
      );
    }

    /** The right-hand inner page: running head, lead sentence, facts, chapters, keys. */
    function ShelfCopy({
      t,
      document,
      board,
      no,
      total,
      facts,
      sessionSummaries,
      openSub,
      onToggleSub,
      onClearSub,
      onOpen,
      onOpenSession,
      onNewTalk,
      onArchiveSession,
      onMenu,
      onConfigure,
      onToggleTodo,
    }) {
      const copyRef = useRef(null);
      useLayoutEffect(() => {
        const node = copyRef.current;
        if (node !== null) node.scrollTop = 0;
      }, [board.id]);
      /** The chapter whose facts the inner page is currently showing, if any. */
      const selectedChild = (() => {
        if (typeof openSub !== 'string' || !openSub.startsWith(`${board.id}/`)) return undefined;
        const child = (Array.isArray(board.children) ? board.children : []).find(
          (item) => item !== null && typeof item === 'object' && `${board.id}/${item.id}` === openSub,
        );
        return child !== undefined && !isSurfaceBoard(child) ? child : undefined;
      })();
      // Selecting a chapter or focusing another volume re-renders this page
      // without changing the record data. Keep the per-board fact scan out of
      // that path; it walks the prompt library and every recorded Session.
      const subjectFacts = useMemo(
        () => (selectedChild === undefined ? facts : boardFacts(document, board, selectedChild, sessionSummaries)),
        [document, board, selectedChild, facts, sessionSummaries],
      );
      const subjectKind = selectedChild === undefined ? board.kind : selectedChild.kind;
      const workspace = workspaceForBoard(document, board);
      // The inner page re-renders when the selected volume, the open chapter or
      // a drawer changes. Scanning the to-do/note lists on every one of those
      // renders is avoidable; the facts and the lead only depend on the record
      // document and the subject being shown.
      const factRows = useMemo(
        () => bookFacts(t, document, board, selectedChild, subjectFacts, workspace),
        [t, document, board, selectedChild, subjectFacts, workspace],
      );
      const lead = useMemo(() => bookLead(t, document, board, facts), [t, document, board, facts]);
      const emptyConversationFolder = subjectKind === 'chat' && subjectFacts.children === 0 && subjectFacts.sessions.length === 0;
      const actionLabel =
        subjectKind === 'todo'
          ? t('ledger.openList')
          : subjectKind === 'note'
            ? t('ledger.openNotes')
            : emptyConversationFolder
              ? t('ledger.newTalk')
              : t('ledger.continue');
      // A conversation folder with chapters but no Session of its own is a
      // folder, not a conversation target: its primary key must not create a
      // stray Session on the parent key. A selected chapter is a real target,
      // so the same key follows that chapter instead of the parent folder.
      const canOpenSelf = subjectKind !== 'chat' || subjectFacts.children === 0 || subjectFacts.sessions.length > 0;
      return h(
        'div',
        { ref: copyRef, className: 'wb_sh_copy' },
        h(
          'div',
          { className: 'wb_sh_masthead' },
          h(
            'div',
            { className: 'wb_sh_copyHead' },
            h('span', null, `VOL. ${pad2(no)} / ${pad2(total)}`),
            h('span', { className: 'wb_sh_kind' }, bookKindLine(t, board)),
          ),
          h(ShelfDatePlate, { t }),
        ),
        h('h2', { className: 'wb_sh_title' }, lead),
        h('p', { className: 'wb_sh_lede' }, bookLede(t, board)),
        selectedChild === undefined
          ? null
          : h(
              'div',
              { className: 'wb_sh_scope' },
              h('span', { className: 'wb_sh_scopeLabel' }, t('shelf.subScope')),
              h('span', { className: 'wb_sh_scopeName', title: selectedChild.name }, selectedChild.name),
              h('button', { type: 'button', className: 'wb_sh_scopeBack', onClick: onClearSub }, t('shelf.backToBoard')),
            ),
        h(
          'dl',
          { className: 'wb_sh_facts' },
          factRows.map(([label, value]) =>
            h('div', { key: label, className: 'wb_fact' }, h('dt', null, label), h('dd', { title: value }, value)),
          ),
        ),
        h(ShelfContents, {
          t,
          document,
          board,
          facts,
          sessionSummaries,
          openSub,
          onToggleSub,
          onOpen,
          onOpenSession,
          onNewTalk,
          onArchiveSession,
          onMenu,
          onToggleTodo,
        }),
        h(
          'div',
          { className: 'wb_sh_actions' },
          canOpenSelf
            ? h(
                'button',
                { type: 'button', className: 'wb_sh_key wb_sh_keyPrimary', onClick: () => onOpen(board, selectedChild) },
                actionLabel,
                h(IconArrowUpRight, { size: 13 }),
              )
            : null,
          h(
            'button',
            { type: 'button', className: 'wb_sh_key wb_sh_keyGhost', onClick: onConfigure },
            t('ledger.configure'),
          ),
        ),
      );
    }

    /** One spring axis for the shelf's physical covers. */
    function springAxis(value, stiffness, damping) {
      return { value, target: value, velocity: 0, stiffness, damping };
    }

    /** Advance one spring axis; report whether it has come to rest. */
    function stepSpring(axis, dt) {
      const force = (axis.target - axis.value) * axis.stiffness - axis.velocity * axis.damping;
      axis.velocity += force * dt;
      axis.value += axis.velocity * dt;
      if (Math.abs(axis.target - axis.value) < 0.01 && Math.abs(axis.velocity) < 0.05) {
        axis.value = axis.target;
        axis.velocity = 0;
        return true;
      }
      return false;
    }

    /** The reduced-motion face keeps every end state but no travel. */
    let reducedMotionQuery;
    function reducedMotion() {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
      // Pointer paths call this on every frame; keep one MediaQueryList instead
      // of constructing a fresh query object for each sample. Its `matches`
      // value stays live when the OS preference changes.
      if (reducedMotionQuery === undefined) reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      return reducedMotionQuery !== null && reducedMotionQuery !== undefined && reducedMotionQuery.matches === true;
    }

    /**
     * One mini cover on the shelf.
     *
     * Hovering pulls the volume off the shelf on an under-damped spring; the
     * cover then tilts under the pointer with carried angular velocity, its
     * shadow spreading as it rises, and its neighbours leaning away from the
     * gap. Clicking a surface volume opens it; clicking a conversation volume
     * pins it.
     */
    function ShelfSpine({ t, board, index, activePosition, active, onSelect, onOpen }) {
      const surface = isSurfaceBoard(board);
      const spineRef = useRef(null);
      const miniRef = useRef(null);
      const hoverTimer = useRef(0);
      const motion = useRef(null);
      /** Coalesce pointer samples so the hover spring reads layout once a frame. */
      const pointerRaf = useRef(0);
      const pointerAt = useRef(null);
      if (motion.current === null) {
        motion.current = {
          lift: springAxis(0, 300, 19),
          lean: springAxis(0, 220, 20),
          tiltX: springAxis(0, 360, 18),
          tiltY: springAxis(0, 360, 18),
          scale: springAxis(1, 380, 24),
          hovered: false,
          pressed: false,
          raf: 0,
          last: 0,
        };
      }

      const leanTarget = () => {
        if (activePosition < 0 || index < 0 || index === activePosition) return 0;
        const distance = index - activePosition;
        const gap = Math.abs(distance);
        const magnitude = gap === 1 ? 5.4 : gap === 2 ? 2.8 : 0.7;
        return Math.sign(distance) * magnitude;
      };

      const paint = () => {
        const m = motion.current;
        const wrap = spineRef.current;
        const mini = miniRef.current;
        if (wrap === null || mini === null) return;
        const lift = Math.max(0, m.lift.value);
        wrap.style.transform = `translate3d(${m.lean.value.toFixed(2)}px, ${(-lift).toFixed(2)}px, 0) rotateZ(${(m.lean.value * 0.16).toFixed(3)}deg) scale(${m.scale.value.toFixed(4)})`;
        mini.style.transform = `rotateX(${m.tiltX.value.toFixed(2)}deg) rotateY(${m.tiltY.value.toFixed(2)}deg)`;
        mini.style.setProperty('--ms-x', `${(-m.tiltY.value * 0.45).toFixed(1)}px`);
        mini.style.setProperty('--ms-y', `${(8 + lift * 0.55).toFixed(1)}px`);
        mini.style.setProperty('--ms-blur', `${(16 + lift * 0.5).toFixed(1)}px`);
        mini.style.setProperty('--ms-spread', `${(-14 - lift * 0.12).toFixed(1)}px`);
        mini.style.setProperty('--ms-alpha', `${Math.min(0.97, 0.9 + lift * 0.004).toFixed(3)}`);
      };

      const settleTargets = () => {
        const m = motion.current;
        const reduced = reducedMotion();
        const lifted = active || m.hovered;
        m.lift.target = reduced ? (active ? 20 : 0) : (lifted ? 20 : 0) - (m.pressed ? 3 : 0);
        m.scale.target = reduced ? (active ? 1.03 : 1) : m.pressed ? 0.982 : lifted ? 1.03 : 1;
        m.lean.target = reduced ? 0 : leanTarget();
        if (!m.hovered || reduced) {
          m.tiltX.target = 0;
          m.tiltY.target = 0;
        }
      };

      const startSpring = () => {
        const m = motion.current;
        if (reducedMotion() || typeof requestAnimationFrame !== 'function') {
          for (const axis of [m.lift, m.lean, m.tiltX, m.tiltY, m.scale]) {
            axis.value = axis.target;
            axis.velocity = 0;
          }
          paint();
          return;
        }
        if (m.raf !== 0) return;
        m.last = performance.now();
        const tick = (now) => {
          const dt = Math.min(1 / 30, Math.max(0.001, (now - m.last) / 1000));
          m.last = now;
          const liftDone = stepSpring(m.lift, dt);
          const leanDone = stepSpring(m.lean, dt);
          const tiltXDone = stepSpring(m.tiltX, dt);
          const tiltYDone = stepSpring(m.tiltY, dt);
          const scaleDone = stepSpring(m.scale, dt);
          paint();
          if (liftDone && leanDone && tiltXDone && tiltYDone && scaleDone) {
            m.raf = 0;
            return;
          }
          m.raf = requestAnimationFrame(tick);
        };
        m.raf = requestAnimationFrame(tick);
      };

      useEffect(() => {
        settleTargets();
        startSpring();
      }, [active, activePosition, index]);

      useEffect(
        () => () => {
          if (motion.current !== null && motion.current.raf !== 0) cancelAnimationFrame(motion.current.raf);
          if (pointerRaf.current !== 0) cancelAnimationFrame(pointerRaf.current);
          if (hoverTimer.current !== 0) window.clearTimeout(hoverTimer.current);
        },
        [],
      );

      const clearHoverTimer = () => {
        if (hoverTimer.current !== 0) {
          window.clearTimeout(hoverTimer.current);
          hoverTimer.current = 0;
        }
      };

      const cancelPointerFrame = () => {
        pointerAt.current = null;
        if (pointerRaf.current !== 0) {
          cancelAnimationFrame(pointerRaf.current);
          pointerRaf.current = 0;
        }
      };

      const paintPointer = (point) => {
        const m = motion.current;
        if (m === null || reducedMotion()) return;
        const mini = miniRef.current;
        if (mini === null) return;
        const rect = mini.getBoundingClientRect();
        const x = Math.max(-0.5, Math.min(0.5, (point.clientX - rect.left) / Math.max(1, rect.width) - 0.5));
        const y = Math.max(-0.5, Math.min(0.5, (point.clientY - rect.top) / Math.max(1, rect.height) - 0.5));
        m.tiltX.target = -y * 7;
        m.tiltY.target = x * 8;
        m.lift.target = (active || m.hovered ? 20 : 0) + Math.max(0, -y) * 4;
        startSpring();
      };

      const onPointerMove = (event) => {
        if (event.pointerType === 'touch') return;
        const m = motion.current;
        m.hovered = true;
        if (reducedMotion()) return;
        pointerAt.current = { clientX: event.clientX, clientY: event.clientY };
        if (typeof requestAnimationFrame !== 'function') {
          paintPointer(pointerAt.current);
          return;
        }
        if (pointerRaf.current !== 0) return;
        pointerRaf.current = requestAnimationFrame(() => {
          pointerRaf.current = 0;
          const point = pointerAt.current;
          if (point !== null) paintPointer(point);
        });
      };

      return h(
        'div',
        {
          ref: spineRef,
          className: 'wb_line wb_sh_spine',
          'data-board-key': board.id,
          'data-kind': board.kind,
          'data-active': active ? 'true' : 'false',
          style: { '--cover': clothForIndex(index) },
          onPointerEnter: (event) => {
            // Touch has no hover state: a tap already fires onClick, and the
            // delayed preview here would change the selected volume after a
            // stray contact while scrolling the shelf.
            if (event.pointerType === 'touch') return;
            motion.current.hovered = true;
            cancelPointerFrame();
            clearHoverTimer();
            hoverTimer.current = window.setTimeout(() => {
              hoverTimer.current = 0;
              onSelect(board.id);
            }, 90);
            settleTargets();
            startSpring();
          },
          onPointerMove,
          onPointerLeave: () => {
            const m = motion.current;
            m.hovered = false;
            m.pressed = false;
            cancelPointerFrame();
            clearHoverTimer();
            settleTargets();
            startSpring();
          },
          onPointerDown: () => {
            motion.current.pressed = true;
            settleTargets();
            startSpring();
          },
          onPointerUp: () => {
            motion.current.pressed = false;
            settleTargets();
            startSpring();
          },
          onPointerCancel: () => {
            motion.current.pressed = false;
            settleTargets();
            startSpring();
          },
          onContextMenu: (event) => event.preventDefault(),
        },
        h(
          'button',
          {
            ref: miniRef,
            type: 'button',
            className: 'wb_modMain wb_sh_mini',
            title: board.name,
            onClick: () => {
              clearHoverTimer();
              if (surface) onOpen(board);
              else onSelect(board.id);
            },
            onFocus: () => {
              clearHoverTimer();
              onSelect(board.id);
            },
            onKeyDown: (event) => {
              const rack = event.currentTarget.closest('.wb_sh_spines');
              const rows = rack === null ? [] : [...rack.querySelectorAll('.wb_modMain')];
              const at = rows.indexOf(event.currentTarget);
              let next = -1;
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(rows.length - 1, at + 1);
              else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(0, at - 1);
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = rows.length - 1;
              if (next >= 0 && next !== at && rows[next] !== undefined) {
                event.preventDefault();
                rows[next].focus();
              }
            },
          },
          h('span', { className: 'wb_sh_miniLetter', 'aria-hidden': 'true' }, coverLetter(board)),
          h(
            'span',
            { className: 'wb_sh_miniTitle wb_name', 'data-tier': coverTier(board.name), title: board.name },
            board.name,
          ),
          h('span', { className: 'wb_sh_miniSub' }, coverSub(board)),
          h('span', { className: 'wb_sh_miniOpen', 'aria-hidden': 'true' }, h(IconArrowUpRight, { size: 12 })),
        ),
      );
    }

    /**
     * The live clock, isolated from the press bar.
     *
     * The seconds tick independently so the counters, brand and series behind
     * them do not re-render once per second for the life of the page.
     */
    function ShelfClock({ t }) {
      const now = useSurfaceNow(1000);
      return h(
        'span',
        { className: 'wb_sh_clock', title: t('shelf.clock') },
        h('b', null, `${pad2(now.getHours())}:${pad2(now.getMinutes())}`),
        h('i', null, `:${pad2(now.getSeconds())}`),
      );
    }

    /** The top bar: brand, press series, day readout and the live clock. */
    function ShelfHeader({ t, total, dueToday, overdue, reminders, onToday, onReturnLatest, returnDisabled }) {
      const series = fill(t('shelf.series'), { count: pad2(total), year: new Date().getFullYear() });
      return h(
        'header',
        { className: 'wb_sh_top' },
        h(
          'div',
          { className: 'wb_sh_brand', title: t('panel') },
          h(WorkbenchMark, { size: 18 }),
          h('b', null, t('panel')),
          h('span', null, 'WORKBENCH'),
        ),
        h('span', { className: 'wb_sh_series' }, series),
        h(
          'div',
          { className: 'wb_sh_topRight' },
          h(
            'button',
            {
              type: 'button',
              className: 'wb_sh_return',
              onClick: onReturnLatest,
              disabled: returnDisabled === true,
              title: t('shelf.returnLatest'),
              'aria-label': t('shelf.returnLatest'),
            },
            h(IconReturnLatest, { size: 18 }),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'wb_sh_counts',
              onClick: onToday,
              title: fill(t('ledger.spaces'), { spaces: total, due: dueToday, over: overdue, remind: reminders }),
            },
            h('span', null, t('shelf.todayCount'), h('b', { 'data-tone': dueToday > 0 ? 'today' : undefined, 'data-zero': dueToday === 0 ? 'true' : 'false' }, String(dueToday))),
            h('span', null, t('shelf.overdueCount'), h('b', { 'data-tone': overdue > 0 ? 'over' : undefined, 'data-zero': overdue === 0 ? 'true' : 'false' }, String(overdue))),
            h('span', null, t('shelf.reminderCount'), h('b', { 'data-zero': reminders === 0 ? 'true' : 'false' }, String(reminders))),
          ),
          h(ShelfClock, { t }),
        ),
      );
    }

    /**
     * The day, in a drawer that slides over the shelf rather than replacing it.
     *
     * The drawer has no close key of its own: the shell's window close sits in
     * the same corner and the two would overlap. Escape and the scrim dismiss
     * it, and keyboard focus lands on the drawer itself when it opens.
     */
    function DayDrawer({ t, open, onClose, children }) {
      const panelRef = useRef(null);
      const closeRef = useRef(onClose);
      closeRef.current = onClose;
      const openerRef = useRef(null);
      useEffect(() => {
        if (!open) return undefined;
        openerRef.current = typeof document !== 'undefined' ? document.activeElement : null;
        if (panelRef.current !== null) panelRef.current.focus();
        const onKey = (event) => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          closeRef.current();
        };
        window.addEventListener('keydown', onKey);
        return () => {
          window.removeEventListener('keydown', onKey);
          const opener = openerRef.current;
          if (opener !== null && typeof opener.focus === 'function' && opener.isConnected !== false) opener.focus();
        };
      }, [open]);
      if (!open) return null;
      return h(
        React.Fragment,
        null,
        h('div', { className: 'wb_sh_scrim', onPointerDown: onClose }),
        h(
          'aside',
          {
            ref: panelRef,
            className: 'wb_sh_day',
            'data-window-drag-exclude': 'true',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': t('shelf.dayTitle'),
            tabIndex: -1,
          },
          h('div', { className: 'wb_sh_dayHead' }, h('b', null, t('shelf.dayTitle'))),
          h('div', { className: 'wb_sh_dayBody' }, children),
        ),
      );
    }

    /** Today's received page, reused inside the drawer. */
    function ShelfToday({ t, todos, totalTodos, doneToday, reminders, notes, week, hasTodoBoard, onToggleTodo, onOpenTodo, onOpenNote }) {
      // The drawer can stay open across midnight; keep its week ruler and day
      // counters on the same local clock as the surface frame.
      const now = useSurfaceNow(60000);
      const today = dayKeyOf(now);
      // The drawer is open only while this component is mounted, but its
      // 60-second clock still re-renders it; keep the potentially large row
      // scan out of that tick except when the day itself changes.
      const open = useMemo(() => sortTodos(todos.filter((row) => row.item.done !== true)), [todos]);
      const visible = useMemo(() => {
        // Rank each row once rather than twice per comparator call. The drawer
        // only needs five rows, but it still reads the full open list when
        // deciding which five, so keep the scan linear and stable.
        const rankOf = (row) => {
          const state = dueState(row.item);
          return state === 'overdue' ? 0 : state === 'today' ? 1 : 2;
        };
        const ranked = open.map((row) => ({ row, rank: rankOf(row) }));
        ranked.sort((left, right) => left.rank - right.rank);
        return ranked.slice(0, 5).map((entry) => entry.row);
      }, [open, today]);
      const month = now.getMonth() + 1;
      const weekday = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
      const position = yearPosition(now);
      const weekNo = weekOfYear(now);
      const weekdays = t('calendar.weekdays').split(/\s+/);
      const weekdayIndex = (now.getDay() + 6) % 7;
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekdayIndex);
      const weekDates = Array.from({ length: 7 }, (_, offset) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + offset);
        return date;
      });
      return h(
        'div',
        { className: 'wb_today wb_t9' },
        h(
          'div',
          { className: 'wb_t9_top' },
          h('h2', null, t('ledger.siteNotes')),
          h('div', { className: 'wb_t9_meta' }, h('b', null, String(now.getFullYear())), h('span', null, fill(t('watch.weekOfYear'), { week: weekNo }))),
        ),
        h(
          'div',
          { className: 'wb_t9_dateline' },
          h('b', { className: 'wb_t9_day' }, pad2(now.getDate())),
          h('div', { className: 'wb_t9_mw' }, h('span', null, `${fill(t('watch.month'), { month })}/`), h('b', null, t(`day.week.${weekday}`))),
          h('span', { className: 'wb_t9_doy' }, fill(t('watch.dayOfYear'), { day: position.day, total: position.total })),
        ),
        h('div', { className: 'wb_t9_yearbar', 'aria-hidden': 'true' }, h('i', { style: { width: `${(position.day / position.total) * 100}%` } })),
        h(
          'div',
          { className: 'wb_t9_week', role: 'group', 'aria-label': fill(t('watch.weekOfYear'), { week: weekNo }) },
          weekDates.map((date, index) =>
            h(
              'div',
              {
                key: `${weekdays[index]}-${date.getMonth() + 1}-${date.getDate()}`,
                className: 'wb_t9_wday',
                'data-today': index === weekdayIndex ? 'true' : undefined,
                'aria-current': index === weekdayIndex ? 'date' : undefined,
                title: fill(t('time.monthDay'), { month: date.getMonth() + 1, day: date.getDate() }),
              },
              h('span', { className: 'wb_t9_wdname' }, weekdays[index]),
              h('b', { className: 'wb_t9_wdnum' }, pad2(date.getDate())),
            ),
          ),
        ),
        h(
          'section',
          { className: 'wb_t9_sec' },
          h('div', { className: 'wb_t9_sechead' }, h('h3', null, t('watch.dayPage')), h('span', null, fill(t('today.done'), { done: doneToday, total: totalTodos }))),
          visible.length === 0
            ? h('p', { className: 'wb_t9_quiet' }, hasTodoBoard ? t('today.none') : t('today.noBoard'))
            : h(
                'ul',
                { className: 'wb_t9_list' },
                visible.map((row) => {
                  const state = dueState(row.item);
                  return h(
                    'li',
                    { key: `${row.key}:${row.item.id}`, className: 'wb_t9_taskRow', 'data-late': state === 'overdue' ? 'true' : undefined, 'data-today': state === 'today' ? 'true' : undefined },
                    h(
                      'button',
                      { type: 'button', className: 'wb_t9_tick', role: 'checkbox', 'aria-checked': row.item.done === true ? 'true' : 'false', 'aria-label': t('todo.toggle'), onClick: () => onToggleTodo(row.key, row.item) },
                      row.item.done === true ? h(IconCheck, { size: 9 }) : null,
                    ),
                    h('button', { type: 'button', className: 'wb_t9_task', onClick: () => onOpenTodo(row) }, h('b', null, row.item.title)),
                    h('span', { className: 'wb_t9_stamp' }, state === 'overdue' ? t('ledger.stateOver') : state === 'today' ? t('time.today') : t('watch.onList')),
                  );
                }),
                open.length > visible.length ? h('li', { className: 'wb_t9_quiet' }, fill(t('today.more'), { count: open.length - visible.length })) : null,
              ),
        ),
        h(
          'section',
          { className: 'wb_t9_sec' },
          h('div', { className: 'wb_t9_sechead' }, h('h3', null, t('watch.reminders')), h('span', null, String(reminders.length))),
          reminders.length === 0
            ? h('p', { className: 'wb_t9_quiet' }, t('watch.noReminders'))
            : reminders.slice(0, 3).map((row) =>
                h('button', { key: `${row.key}:${row.item.id}`, type: 'button', className: 'wb_t9_rowline', onClick: () => onOpenTodo(row) }, h('time', null, stampLabel(row.item.remindAt, t)), h('span', null, row.item.title)),
              ),
        ),
        h(
          'section',
          { className: 'wb_t9_sec' },
          h('div', { className: 'wb_t9_sechead' }, h('h3', null, t('ledger.materials')), h('span', null, String(notes.length))),
          notes.length === 0
            ? h('p', { className: 'wb_t9_quiet' }, t('ledger.noMaterials'))
            : notes.slice(0, 3).map((row) =>
                h('button', { key: `${row.key}:${row.item.id}`, type: 'button', className: 'wb_t9_rowline', onClick: () => onOpenNote(row) }, h('time', null, agoLabel(row.item.updatedAt ?? row.item.createdAt, t)), h('span', null, row.item.title || t('notes.untitled'))),
              ),
        ),
        h(
          'div',
          { className: 'wb_t9_tail' },
          h(
            'div',
            { className: 'wb_t9_ledger' },
            h('div', { className: 'done' }, h('b', { 'data-zero': week.done === 0 ? 'true' : undefined }, String(week.done)), h('span', null, t('watch.weekDone'))),
            h('div', null, h('b', { 'data-zero': week.created === 0 ? 'true' : undefined }, String(week.created)), h('span', null, t('watch.weekNew'))),
            h('div', null, h('b', { 'data-zero': week.notes === 0 ? 'true' : undefined }, String(week.notes)), h('span', null, t('watch.weekNotes'))),
          ),
          h('p', { className: 'wb_t9_note' }, t('watch.logNote')),
          h('div', { className: 'wb_t9_permission' }, h(ReminderPermissionButton, { t })),
        ),
      );
    }

    /** The page foot: the book's motto and the quiet links. */
    function ShelfFooter({ t, workspace, onToday, onSettings }) {
      return h(
        'footer',
        { className: 'wb_sh_foot' },
        h('span', { className: 'wb_sh_footNote', title: workspace }, t('shelf.footNote')),
        h('span', { className: 'wb_sh_grow' }),
        h('button', { type: 'button', className: 'wb_sh_footLink', onClick: onToday }, t('shelf.footToday')),
        h('span', { className: 'wb_sh_slash', 'aria-hidden': 'true' }, '/'),
        h('button', { type: 'button', className: 'wb_sh_footLink', onClick: onSettings }, t('ledger.configure')),
        h('span', { className: 'wb_sh_slash', 'aria-hidden': 'true' }, '/'),
        h('span', { className: 'wb_sh_footPress' }, t('watch.desk')),
        h('span', { className: 'wb_build', 'data-build': `${BUILD_STAMP.at} ${BUILD_STAMP.rev}` }, `REV. ${BUILD_STAMP.rev}`),
      );
    }

    /**
     * The shelf page.
     *
     * Every part reads the same document; hovering a spine previews a volume,
     * clicking it pins the volume (or opens a surface page), and the rest of the
     * workbench — Sessions, to-dos, notes, reminders — behaves exactly as before.
     */
    function LedgerPage({ t, document, onOpen, onOpenSession, onNewTalk, onConfigure, onReturnLatest, notice }) {
      const [activeId, setActiveId] = useState('');
      const busyKeys = useRef(new Set());
      /** Only the newest action may publish a failure; an older request must not overwrite it. */
      const runSeq = useRef(0);
      const [failure, setFailure] = useState('');
      const [openSub, setOpenSub] = useState('');
      const [menu, setMenu] = useState(null);
      const [dayOpen, setDayOpen] = useState(false);
      const sessionSummaries = useSessionSummaries();
      const returnTarget = useMemo(
        () => latestReturnTarget(document, sessionSummaries, pluginContext),
        // The target only depends on the board tree and the Session map; a
        // settings/todo save replacing the outer document must not rescan it.
        [document?.boards, document?.sessions, sessionSummaries],
      );
      // The day's counters (today / overdue / this week) must roll over at
      // midnight without a document write. Publishing only when the local day
      // changes keeps the shelf from re-rendering every minute all day long.
      const today = useSurfaceDay();

      const boards = Array.isArray(document.boards) ? document.boards : [];
      // JSON rather than a separator join: a hand-edited board id may contain
      // any character, and two different id lists must not compare equal.
      const boardIds = JSON.stringify(boards.map((board) => board.id));

      useEffect(() => {
        if (boards.length === 0) {
          if (activeId !== '') setActiveId('');
          return;
        }
        if (!boards.some((board) => board.id === activeId)) setActiveId(boards[0].id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [boardIds]);

      const activeBoard = boards.find((board) => board.id === activeId) ?? boards[0];
      const activeNo = activeBoard === undefined ? 1 : boards.indexOf(activeBoard) + 1;

      useEffect(() => {
        setOpenSub('');
        setMenu(null);
      }, [activeBoard === undefined ? '' : activeBoard.id]);

      /** Every to-do row, including sub-board owners. */
      const todoRows = useMemo(() => {
        const rows = [];
        for (const board of boards) {
          const walk = (owner, child) => {
            if ((child === undefined ? owner.kind : child.kind) !== 'todo') return;
            const key = boardKeyOf(owner, child);
            for (const item of todoListOf(document, key)) rows.push({ key, board: owner, child, item });
          };
          walk(board, undefined);
          for (const child of Array.isArray(board.children) ? board.children : []) walk(board, child);
        }
        return rows;
      }, [boards, document]);

      const openTodos = useMemo(() => todoRows.filter((row) => row.item.done !== true), [todoRows]);
      const dueToday = useMemo(() => openTodos.filter((row) => dueState(row.item) === 'today').length, [openTodos, today]);
      const overdue = useMemo(() => openTodos.filter((row) => dueState(row.item) === 'overdue').length, [openTodos, today]);
      const reminders = useMemo(
        () =>
          openTodos
            .filter((row) => typeof row.item.remindAt === 'string' && row.item.remindAt.length > 0)
            .sort((left, right) => String(left.item.remindAt).localeCompare(String(right.item.remindAt))),
        [openTodos],
      );
      const doneToday = useMemo(
        () =>
          todoRows.filter(
            (row) => row.item.done === true && Number(row.item.doneAt) > 0 && dayKeyOf(new Date(Number(row.item.doneAt))) === today,
          ).length,
        [todoRows, today],
      );

      /** Recent note-board records, for today's materials strip. */
      const noteRows = useMemo(() => {
        // The strip only exists while the day drawer is open; walking every
        // note board on every document save was wasted work.
        if (!dayOpen) return [];
        const rows = [];
        for (const board of boards) {
          const walk = (owner, child) => {
            if ((child === undefined ? owner.kind : child.kind) !== 'note') return;
            const key = boardKeyOf(owner, child);
            for (const item of noteListOf(document, key)) rows.push({ key, board: owner, child, item });
          };
          walk(board, undefined);
          for (const child of Array.isArray(board.children) ? board.children : []) walk(board, child);
        }
        return rows.sort((left, right) => Number(right.item.updatedAt ?? right.item.createdAt ?? 0) - Number(left.item.updatedAt ?? left.item.createdAt ?? 0));
      }, [boards, document, dayOpen]);

      /** This week's counters, read from the records' own stamps. */
      const week = useMemo(() => {
        if (!dayOpen) return { done: 0, created: 0, notes: 0 };
        const floor = Date.now() - 7 * DAY_MS;
        let done = 0;
        let created = 0;
        let notes = 0;
        for (const board of boards) {
          const walk = (owner, child) => {
            const subject = child === undefined ? owner : child;
            const key = boardKeyOf(owner, child);
            if (subject.kind === 'todo') {
              for (const item of todoListOf(document, key)) {
                // A hand-edited record may keep a done stamp while saying it is
                // open; only a record that is actually done belongs in the count.
                if (item.done === true && Number(item.doneAt) >= floor) done += 1;
                if (Number(item.createdAt) >= floor) created += 1;
              }
            }
            if (subject.kind === 'note') {
              for (const item of noteListOf(document, key)) {
                if (Number(item.createdAt) >= floor) created += 1;
                if (Number(item.updatedAt ?? item.createdAt) >= floor) notes += 1;
              }
            }
          };
          walk(board, undefined);
          for (const child of Array.isArray(board.children) ? board.children : []) walk(board, child);
        }
        return { done, created, notes };
        // `today` is a dependency even though the scan uses Date.now(): the
        // midnight publication is exactly what makes the rolling week window
        // refresh while the shelf stays open. `dayOpen` triggers the first
        // scan when the drawer opens.
      }, [boards, document, today, dayOpen]);

      const workspace = workspaceForBoard(document, activeBoard);
      // Hovering/selecting a volume and local page toggles re-render the
      // ledger; the active volume's fact scan only needs to run when its
      // record data changes.
      const activeFacts = useMemo(
        () => (activeBoard === undefined ? undefined : boardFacts(document, activeBoard, undefined, sessionSummaries)),
        [document, activeBoard, sessionSummaries],
      );
      const activePosition = activeBoard === undefined ? -1 : boards.findIndex((board) => board.id === activeBoard.id);
      const summary = fill(t('ledger.spaces'), { spaces: boards.length, due: dueToday, over: overdue, remind: reminders.length });

      const run = (operation, key, failureTemplate = t('board.openFailed')) => {
        const token = typeof key === 'string' ? key : '';
        // Serialize only the same action. A session open elsewhere on the
        // ledger must not make a to-do tick or a second board unresponsive.
        if (token.length > 0 && busyKeys.current.has(token)) return;
        if (token.length > 0) busyKeys.current.add(token);
        const seq = (runSeq.current += 1);
        setFailure('');
        Promise.resolve()
          .then(() => (typeof operation === 'function' ? operation() : operation))
          .catch((error) => {
            if (seq !== runSeq.current) return;
            setFailure(fill(failureTemplate, { message: error instanceof Error ? error.message : String(error) }));
          })
          .finally(() => {
            if (token.length > 0) busyKeys.current.delete(token);
          });
      };

      const open = (board, child) => {
        const kind = child === undefined ? board.kind : child.kind;
        if (kind === 'todo' || kind === 'note') {
          onOpen(board, child);
          return;
        }
        run(() => onOpen(board, child), boardKeyOf(board, child));
      };

      /** A chapter's left click folds its session list open or shut. */
      const toggleSub = (key) => setOpenSub((current) => (current === key ? '' : key));

      /** A session line opens that exact Session, not the newest one. */
      const openSession = (sessionId, board, child) =>
        run(() => onOpenSession(board, child, sessionId), sessionId);

      /**
       * Archive one recorded Session from its shelf row.
       *
       * `workspaces.archiveSession` is a global Session-id operation: it does
       * not require the Session to belong to a Workspace, so it keeps working
       * after board Sessions are created with `cwd` instead of `workspaceId`.
       * A running Session is refused by the Host; the ordinary error strip
       * reports that instead of silently stopping the work.
       */
      const archiveSession = (board, child, sessionId) => {
        const key = boardKeyOf(board, child);
        run(
          async () => {
            const ctx = pluginContext;
            const workspaces = ctx === null || ctx === undefined ? undefined : ctx.get('workspaces');
            if (workspaces === undefined || workspaces === null || typeof workspaces.archiveSession !== 'function') {
              throw new Error(translate()('error.sessionsUnavailable'));
            }
            await workspaces.archiveSession(sessionId);
            sessionLabels.delete(sessionId);
            notifyLabels();
            await forgetSession(key, sessionId);
            const remaining = sessionListOf(store.current()?.sessions?.[key]).filter((id) => id !== sessionId);
            if (remaining.length > 0) boardSessions.set(key, remaining[0]);
            else boardSessions.delete(key);
          },
          `archive:${sessionId}`,
          t('session.archiveFailed'),
        );
      };

      /** Return to the current Session, or the newest recorded workbench one. */
      const returnLatest = () => {
        if (returnTarget === undefined) {
          setFailure(t('shelf.noRecent'));
          return;
        }
        // Call the navigation immediately. `run` deliberately defers through
        // a microtask, which is right for board opens but adds a frame of
        // latency to the one action that should feel like a back button.
        try {
          Promise.resolve(onReturnLatest(returnTarget)).catch((error) => {
            setFailure(fill(t('board.openFailed'), { message: error instanceof Error ? error.message : String(error) }));
          });
        } catch (error) {
          setFailure(fill(t('board.openFailed'), { message: error instanceof Error ? error.message : String(error) }));
        }
      };

      /** A chapter's right-click, or its + key, starts one fresh Session. */
      const startTalk = (board, child) => run(() => onNewTalk(board, child), boardKeyOf(board, child));

      const toggleTodo = (key, item) => {
        const nextDone = item.done !== true;
        run(
          updateTodos(key, (current) =>
            current.map((row) => (row.id === item.id ? { ...row, done: nextDone, doneAt: nextDone ? Date.now() : 0 } : row)),
          ),
          `todo:${key}:${item.id}`,
        );
      };

      const openTodo = (row) => onOpen(row.board, row.child);

      const toggleDay = () => setDayOpen((current) => !current);

      return h(
        'div',
        { className: 'wb_page wb_sh_page' },
        h(
          'div',
          { className: 'wb_shell' },
          h(
            'div',
            { className: 'wb_scroll wb_sh_scroll', 'data-build': `${BUILD_STAMP.at} ${BUILD_STAMP.rev}` },
            h(
              'div',
              { className: 'wb_sheet wb_sh_sheet' },
              h(ShelfHeader, {
                t,
                total: boards.length,
                dueToday,
                overdue,
                reminders: reminders.length,
                onToday: toggleDay,
                onReturnLatest: returnLatest,
                returnDisabled: returnTarget === undefined,
              }),
              failure.length > 0 ? h('div', { className: 'wb_status' }, h('p', { className: 'wb_error' }, failure)) : null,
              notice !== undefined && notice.length > 0
                ? h('div', { className: 'wb_status' }, h('p', { className: 'wb_quiet', role: 'status' }, notice))
                : null,
              h(
                'main',
                { className: 'wb_sh_press' },
                activeBoard === undefined
                  ? h('div', { className: 'wb_sh_empty' }, h('p', null, t('ledger.empty')))
                  : h(
                      'section',
                      { className: 'wb_sh_spread wb_detail', 'data-board-key': activeBoard.id, 'aria-live': 'polite' },
                      h(ShelfCover, {
                        t,
                        board: activeBoard,
                        no: activeNo,
                        total: boards.length,
                        clothIndex: boards.indexOf(activeBoard),
                        workspace,
                      }),
                      h(ShelfCopy, {
                        t,
                        document,
                        board: activeBoard,
                        no: activeNo,
                        total: boards.length,
                        facts: activeFacts,
                        sessionSummaries,
                        openSub,
                        onToggleSub: toggleSub,
                        onClearSub: () => setOpenSub(''),
                        onOpen: open,
                        onOpenSession: openSession,
                        onNewTalk: startTalk,
                        onArchiveSession: archiveSession,
                        onMenu: (board, child, at) => setMenu({ board, child, at }),
                        onConfigure,
                        onToggleTodo: toggleTodo,
                      }),
                    ),
                h(
                  'nav',
                  { className: 'wb_sh_shelf', 'aria-label': summary, title: t('watch.hint') },
                  h(
                    'div',
                    { className: 'wb_sh_shelfHead' },
                    h('span', null, fill(t('shelf.volumes'), { count: pad2(boards.length) })),
                    h('span', null, t('shelf.shelfHint')),
                  ),
                  h(
                    'div',
                    { className: 'wb_sh_spines' },
                    boards.length === 0
                      ? h('p', { className: 'wb_sh_shelfEmpty' }, t('ledger.empty'))
                      : h(
                          'div',
                          {
                            className: 'wb_sh_spineTrack',
                            onPointerEnter: (event) => {
                              event.currentTarget.dataset.engaged = 'true';
                            },
                            onPointerLeave: (event) => {
                              delete event.currentTarget.dataset.engaged;
                            },
                          },
                          boards.map((board, position) =>
                            h(ShelfSpine, {
                              key: board.id,
                              t,
                              board,
                              index: position,
                              activePosition,
                              active: activeBoard !== undefined && activeBoard.id === board.id,
                              onSelect: setActiveId,
                              onOpen: open,
                            }),
                          ),
                        ),
                  ),
                ),
              ),
              h(ShelfFooter, {
                t,
                workspace,
                onToday: toggleDay,
                onSettings: onConfigure,
              }),
            ),
          ),
        ),
        menu === null
          ? null
          : h(ContextMenu, {
              at: menu.at,
              items: [
                {
                  key: 'new-session',
                  label: t('ledger.newTalk'),
                  glyph: h(IconPlus, { size: 13 }),
                  onSelect: () => startTalk(menu.board, menu.child),
                },
              ],
              onClose: () => setMenu(null),
            }),
        h(
          DayDrawer,
          { t, open: dayOpen, onClose: () => setDayOpen(false) },
          h(ShelfToday, {
            t,
            todos: todoRows,
            totalTodos: todoRows.length,
            doneToday,
            reminders,
            notes: noteRows,
            week,
            hasTodoBoard: boards.some(
              (board) =>
                board.kind === 'todo' ||
                (Array.isArray(board.children) && board.children.some((child) => child.kind === 'todo')),
            ),
            onToggleTodo: toggleTodo,
            onOpenTodo: openTodo,
            onOpenNote: (row) => onOpen(row.board, row.child),
          }),
        ),
      );
    }
    // ── the Settings section: the wire desk's back matter ─────────────────────

    /**
     * One chapter of the back matter.
     *
     * The chapter's name is set into a rule that runs to the right edge, so the
     * eye gets a hard stop between chapters while the dialog scrolls. A chapter
     * owns no background and no border box: separation is carried by the rule,
     * the air above it, and the change in type size.
     */
    function SettingsChapter({ no, title, hint, children }) {
      return h(
        'section',
        { className: 'wb_sChapter' },
        h('div', { className: 'wb_sChapterHead', 'data-no': no ?? '' }, h('h3', { className: 'wb_sChapterTitle' }, title)),
        hint ? h('p', { className: 'wb_sChapterHint' }, hint) : null,
        h('div', { className: 'wb_sChapterBody' }, children),
      );
    }

    /**
     * The imprint's table of contents.
     *
     * Only one chapter is set on the page at a time. The settings that are not
     * being used stay as two quiet contents lines, which is the point: the
     * workbench's back matter should read like a book's colophon, not a
     * dashboard that shows every control at once.
     */
    function SettingsIndex({ t, chapter, targetLabel, onPick }) {
      const items = [
        { id: 'boards', no: '01', label: t('settings.boards'), meta: '' },
        { id: 'config', no: '02', label: t('settings.configuration'), meta: targetLabel },
      ];
      return h(
        'nav',
        { className: 'wb_sIndex', role: 'tablist', 'aria-label': t('settings.title') },
        items.map((item) =>
          h(
            'button',
            {
              key: item.id,
              type: 'button',
              className: 'wb_sIndexItem',
              role: 'tab',
              'data-active': chapter === item.id ? 'true' : 'false',
              'aria-selected': chapter === item.id ? 'true' : 'false',
              onClick: () => onPick(item.id),
            },
            h('span', { className: 'wb_sIndexNo' }, item.no),
            h('span', { className: 'wb_sIndexName' }, item.label),
            item.meta.length > 0 ? h('span', { className: 'wb_sIndexMeta', title: item.meta }, item.meta) : null,
          ),
        ),
      );
    }

    /**
     * One row of the CH-02 configuration ledger.
     *
     * The Chinese label and its mono sub-label form a fixed left rail; the
     * controls sit on the right. Explanatory copy is deliberately not printed
     * into the page — the small info mark exposes it on hover and keyboard
     * focus, keeping the ledger calm.
     */
    function SettingsSubBlock({ title, code, hint, actions, children }) {
      return h(
        'section',
        { className: 'wb_sSub' },
        h(
          'div',
          { className: 'wb_sSubRail' },
          h(
            'div',
            { className: 'wb_sSubRailText' },
            h(
              'div',
              { className: 'wb_sSubTitleRow' },
              h('h4', { className: 'wb_sSubTitle' }, title),
              hint
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'wb_sInfoBtn',
                      'aria-label': hint,
                      'data-tip': hint,
                    },
                    h(IconInfo, { size: 12 }),
                  )
                : null,
            ),
            code ? h('span', { className: 'wb_sSubCode' }, code) : null,
          ),
        ),
        h(
          'div',
          { className: 'wb_sSubBody' },
          actions ? h('div', { className: 'wb_sSubHead' }, h('div', { className: 'wb_sActions' }, actions)) : null,
          h('div', { className: 'wb_sSubPanel' }, children),
        ),
      );
    }

    /**
     * The bilingual name editor for one board.
     *
     * The Chinese name is the cover title; the English line is the translation
     * under it. While the English line still equals the suggestion for the old
     * name, editing the Chinese name carries it along; once the user types their
     * own English, that value is kept. The pair commits together so the cover
     * can never show one name from before and one from after.
     */
    function BoardRenameInput({ t, board, onCommit, onCancel }) {
      const suggested = suggestEnglishCover(board);
      const stored = String(board.enName ?? '').trim();
      const [name, setName] = useState(board.name);
      const [enName, setEnName] = useState(stored.length > 0 ? stored : suggested);
      const nameRef = useRef(null);
      const autoEnglish = useRef(suggested);
      const settled = useRef(false);

      useEffect(() => {
        if (nameRef.current !== null) {
          nameRef.current.focus();
          nameRef.current.select();
        }
      }, []);

      const finish = (keep) => {
        if (settled.current) return;
        settled.current = true;
        if (!keep) {
          onCancel();
          return;
        }
        const nextName = name.trim();
        if (nextName.length === 0) {
          onCancel();
          return;
        }
        const suggestedNext = suggestEnglishCover({ ...board, name: nextName, enName: '' });
        const nextEnglish = enName.trim();
        onCommit(nextName, nextEnglish === suggestedNext ? '' : nextEnglish);
      };

      const onNameChange = (event) => {
        const next = event.target.value;
        setName(next);
        if (enName === autoEnglish.current) {
          const suggestion = suggestEnglishCover({ ...board, name: next, enName: '' });
          setEnName(suggestion);
          autoEnglish.current = suggestion;
        }
      };

      const keydown = (event) => {
        if (event.key === 'Enter' && !event.nativeEvent?.isComposing) {
          event.preventDefault();
          finish(true);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          finish(false);
        }
      };

      return h(
        'div',
        {
          className: 'wb_sNamePair',
          onBlur: (event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) finish(true);
          },
        },
        h(
          'label',
          { className: 'wb_sNameField' },
          h('span', null, t('settings.boardNameCn')),
          h('input', {
            ref: nameRef,
            className: 'wb_sInput',
            value: name,
            maxLength: MAX_BOARD_NAME,
            'aria-label': t('settings.boardNameCn'),
            onChange: onNameChange,
            onKeyDown: keydown,
          }),
        ),
        h(
          'label',
          { className: 'wb_sNameField' },
          h('span', null, t('settings.boardNameEn')),
          h('input', {
            className: 'wb_sInput',
            value: enName,
            maxLength: MAX_BOARD_NAME,
            'aria-label': t('settings.boardNameEn'),
            placeholder: 'CHAT / CONVERSATION',
            onChange: (event) => setEnName(event.target.value),
            onKeyDown: keydown,
          }),
        ),
      );
    }

    /**
     * One main board's working area.
     *
     * The document carries the shared default; this field is the main-board
     * override that makes each board configurable on its own. An empty field
     * inherits the shared default, and sub-boards inherit their main board — the
     * field is shown only for a main board.
     */
    function BoardWorkspaceField({ t, document, board, onPatch, onError }) {
      const inherited =
        typeof document.workspace === 'string' && document.workspace.length > 0 ? document.workspace : WORKSPACE_FALLBACK;
      const saved = typeof board.workspace === 'string' ? board.workspace : '';
      const [draft, setDraft] = useState(saved);

      useEffect(() => {
        setDraft(saved);
      }, [saved, board.id]);

      const apply = () => {
        const wanted = draft.trim();
        // Match the Host's local-absolute rule and reject characters Windows
        // cannot create before a save round-trip. A drive path and a rooted
        // path (`/work`, `\work`) are both absolute on Windows; a UNC path is
        // not a local working area. The directory itself is still
        // validated/created by the Host when the board opens.
        const hasDrive = /^[A-Za-z]:/.test(wanted);
        const tail = hasDrive ? wanted.slice(2) : wanted;
        const absolute = hasDrive ? /^[A-Za-z]:[\\/]/.test(wanted) : /^[\\/](?![\\/])/.test(wanted);
        const segmentHazard = tail
          .split(/[\\/]+/)
          .some((segment) => segment.length > 0 && segment !== '.' && segment !== '..' && /[. ]$/.test(segment));
        const invalid =
          wanted.length > 0 &&
          (!absolute ||
            /^[\\/]{2}/.test(wanted) ||
            /[<>:"|?*\x00-\x1f\x7f]/.test(tail) ||
            segmentHazard);
        if (invalid) {
          onError(t('settings.workspaceInvalid'));
          return;
        }
        onError('');
        onPatch(board.id, { workspace: wanted });
      };

      return h(
        SettingsSubBlock,
        {
          title: t('settings.workspace'),
          code: t('settings.workspaceCode'),
          hint: fill(t('settings.boardWorkspaceHint'), { path: inherited }),
          actions: h(
            'button',
            {
              type: 'button',
              className: 'wb_sBtn',
              onClick: () => {
                setDraft('');
                onError('');
                onPatch(board.id, { workspace: '' });
              },
            },
            t('settings.workspaceReset'),
          ),
        },
        h(
          'div',
          { className: 'wb_cfgPathField' },
          h('span', { className: 'wb_cfgPathIcon' }, h(IconFolder, { size: 14 })),
          h('input', {
            className: 'wb_cfgPathInput',
            value: draft,
            maxLength: MAX_WORKSPACE_PATH,
            title: draft.length > 0 ? draft : inherited,
            placeholder: inherited,
            'aria-label': t('settings.workspaceLabel'),
            onChange: (event) => setDraft(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter' && !event.nativeEvent?.isComposing) {
                event.preventDefault();
                apply();
              }
            },
          }),
        ),
        h(
          'div',
          { className: 'wb_cfgPathFoot' },
          h('span', { className: 'wb_sHint' }, fill(t('settings.workspaceDefault'), { path: inherited })),
          h(
            'button',
            {
              type: 'button',
              className: 'wb_sBtn wb_sBtnPrimary',
              disabled: draft.trim().length === 0,
              onClick: apply,
            },
            t('settings.workspaceApply'),
          ),
        ),
      );
    }

    /** The four built-in presets a non-chat conversation board may choose. */
    const MODE_OPTIONS = ['standard', 'ptc', 'minimal', 'cordis'];

    /** The localized label for one mode option. */
    function modeLabel(t, id) {
      if (id === 'ptc') return t('mode.ptc');
      if (id === 'minimal') return t('mode.minimal');
      if (id === 'cordis') return t('mode.cordis');
      return t('mode.standard');
    }

    /** The localized one-line description for one mode option. */
    function modeDescription(t, id) {
      if (id === 'ptc') return t('mode.ptcDesc');
      if (id === 'minimal') return t('mode.minimalDesc');
      if (id === 'cordis') return t('mode.cordisDesc');
      return t('mode.standardDesc');
    }

    /**
     * The Agent preset for one conversation board.
     *
     * A chat board owns its whole branch and is shown as locked; every other
     * conversation board can choose one of the four built-in presets. The
     * selection applies to the NEXT Session; open conversations keep the preset
     * they were created with.
     */
    function ModeBlock({ t, board, child, onPatch }) {
      const locked = sessionModeOf(board, child) === 'chat';
      const current = locked ? CHAT_PRESET : agentPresetOf(board, child);
      const choose = (preset) => {
        if (locked) return;
        if (child === undefined) {
          onPatch(board.id, { agentPreset: preset === 'standard' ? undefined : preset });
          return;
        }
        onPatch(board.id, (currentBoard) => ({
          children: (Array.isArray(currentBoard.children) ? currentBoard.children : []).map((item) =>
            item.id === child.id
              ? { ...item, mode: 'standard', agentPreset: preset === 'standard' ? undefined : preset }
              : item,
          ),
        }));
      };
      return h(
        SettingsSubBlock,
        {
          title: t('mode.title'),
          code: t('mode.code'),
          hint: t('mode.hint'),
        },
        locked
          ? h('p', { className: 'wb_sHint' }, t('mode.lockedChat'))
          : h(
              'div',
              { className: 'wb_sModeRow' },
              MODE_OPTIONS.map((option) =>
                h(
                  'button',
                  {
                    key: option,
                    type: 'button',
                    className: 'wb_sMode',
                    'data-active': current === option ? 'true' : undefined,
                    onClick: () => choose(option),
                  },
                  h('span', { className: 'wb_sModeLabel' }, modeLabel(t, option)),
                  h('span', { className: 'wb_sModeDesc' }, modeDescription(t, option)),
                ),
              ),
            ),
      );
    }

    /**
     * The boards, as the account's own lines.
     *
     * A line is the selector AND the row: clicking it chooses the board whose
     * prompt and skills are configured below; dragging it reorders the boards; a
     * right-click opens the structural menu. The SELECTED line unfolds its
     * sub-boards along its own foot, so the hierarchy is visible exactly where it
     * belongs instead of in a second list beside it.
     */
    function BoardsBlock({ t, boards, activeKey, renaming, onSelect, onRename, onPatch, onCreate, onMenu, onMove, onMoveChild }) {
      /** The board being dragged, and the board it would land on. */
      const [dragId, setDragId] = useState(null);
      const [overId, setOverId] = useState(null);
      /** The child chip being dragged, scoped to its parent board. */
      const [dragChild, setDragChild] = useState(null);
      const [overChild, setOverChild] = useState(null);

      const commitBoard = (board, name, enName) => {
        const next = name.trim().slice(0, MAX_BOARD_NAME);
        if (next.length === 0) {
          onRename(null);
          return;
        }
        const nextEn = String(enName ?? '').trim().slice(0, MAX_BOARD_NAME);
        if (next !== board.name || nextEn !== String(board.enName ?? '').trim()) {
          onPatch(board.id, { name: next, enName: nextEn });
        }
        onRename(null);
      };

      const commitChild = (board, child, name) => {
        const next = name.trim().slice(0, MAX_BOARD_NAME);
        if (next.length > 0 && next !== child.name) {
          onPatch(board.id, (current) => ({
            children: (Array.isArray(current.children) ? current.children : []).map((item) =>
              item.id === child.id ? { ...item, name: next } : item,
            ),
          }));
        }
        onRename(null);
      };

      return h(
        SettingsChapter,
        { no: '01', title: t('settings.boards'), hint: t('settings.boardsHint') },
        boards.length === 0
          ? h('p', { className: 'wb_sHint' }, t('settings.boardEmpty'))
          : h(
              'ul',
              { className: 'wb_sGrid' },
              boards.map((board, index) => {
            const renamingBoard = renaming !== null && renaming.boardId === board.id && renaming.childId === null;
            const opened =
              board.id === activeKey || board.children.some((child) => `${board.id}/${child.id}` === activeKey);
            return h(
              'li',
              {
                key: board.id,
                className: 'wb_sCell',
                'data-board-id': board.id,
                // The whole line is the drag handle: there is no separate grip to
                // find, which is what keeps the surface as plain as a native row.
                draggable: renamingBoard ? false : true,
                'data-dragging': dragId === board.id ? 'true' : undefined,
                'data-drop': overId === board.id && dragId !== board.id ? 'true' : undefined,
                onDragStart: (event) => {
                  // The whole line is the drag handle, so a drag that starts on
                  // its text/content still reorders the board. Inputs keep their
                  // native text selection, and a child chip's own drag handler
                  // stops propagation before this listener runs.
                  const target = event.target;
                  if (target !== event.currentTarget && typeof target.closest === 'function' && target.closest('input, textarea, button, a') !== null) {
                    return;
                  }
                  setDragId(board.id);
                  if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move';
                    try {
                      event.dataTransfer.setData('text/plain', board.id);
                    } catch {
                      /* a read-only dataTransfer must not cancel the move */
                    }
                  }
                },
                onDragOver: (event) => {
                  if (dragId === null) return;
                  event.preventDefault();
                  if (overId !== board.id) setOverId(board.id);
                },
                onDrop: (event) => {
                  event.preventDefault();
                  if (dragId !== null && dragId !== board.id) onMove(dragId, board.id);
                  setDragId(null);
                  setOverId(null);
                },
                onDragEnd: () => {
                  setDragId(null);
                  setOverId(null);
                },
              },
              h(
                'div',
                {
                  className: 'wb_sCard',
                  'data-active': opened ? 'true' : 'false',
                  onContextMenu: (event) => {
                    event.preventDefault();
                    onMenu(board, undefined, { x: event.clientX, y: event.clientY });
                  },
                },
                renamingBoard
                  ? h(
                      'div',
                      { className: 'wb_sCardMain' },
                      h('span', { className: 'wb_sCardSwatch', 'aria-hidden': 'true', style: { background: clothForIndex(index) } }),
                      h('span', { className: 'wb_sCardNum' }, String(index + 1).padStart(2, '0')),
                      h(BoardRenameInput, {
                        t,
                        board,
                        onCommit: (name, enName) => commitBoard(board, name, enName),
                        onCancel: () => onRename(null),
                      }),
                    )
                  : h(
                      'div',
                      {
                        className: 'wb_sCardMain',
                        role: 'button',
                        tabIndex: 0,
                        'aria-pressed': opened ? 'true' : 'false',
                        title: t('settings.boardSelect'),
                        onClick: () => onSelect(board.id),
                        onKeyDown: (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onSelect(board.id);
                            return;
                          }
                          if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
                            event.preventDefault();
                            const next = boards[index + (event.key === 'ArrowUp' ? -1 : 1)];
                            if (next !== undefined) onMove(board.id, next.id);
                          }
                        },
                      },
                      h('span', { className: 'wb_sCardSwatch', 'aria-hidden': 'true', style: { background: clothForIndex(index) } }),
                      h(
                        'span',
                        { className: 'wb_sCardNum' },
                        String(index + 1).padStart(2, '0'),
                      ),
                      h(
                        'span',
                        { className: 'wb_sCardText' },
                        h('span', { className: 'wb_sCardName', title: board.name }, board.name),
                        // The second line is the SIZE of the hierarchy, not its
                        // kind: what a board IS is decided when it is made.
                        h('span', { className: 'wb_sCardMeta' }, fill(t('settings.boardMeta'), { count: board.children.length })),
                      ),
                      opened ? h('span', { className: 'wb_sCardState' }, t('settings.boardActive')) : null,
                    ),
                opened
                  ? h(
                      'div',
                      { className: 'wb_sCardFoot' },
                      board.children.map((child, childIndex) => {
                        const renamingChild = renaming !== null && renaming.boardId === board.id && renaming.childId === child.id;
                        const key = `${board.id}/${child.id}`;
                        if (renamingChild) {
                          return h(
                            'div',
                            { key: child.id, className: 'wb_sChip wb_sChipEditing', 'data-child-id': child.id },
                            h(RenameInput, {
                              value: child.name,
                              maxLength: MAX_BOARD_NAME,
                              ariaLabel: t('settings.boardRename'),
                              onCommit: (name) => commitChild(board, child, name),
                              onCancel: () => onRename(null),
                            }),
                          );
                        }
                        const childDragging = dragChild !== null && dragChild.boardId === board.id && dragChild.childId === child.id;
                        const childOver =
                          overChild !== null &&
                          overChild.boardId === board.id &&
                          overChild.childId === child.id &&
                          !childDragging;
                        return h(
                          'button',
                          {
                            key: child.id,
                            type: 'button',
                            className: 'wb_sChip',
                            'data-active': key === activeKey ? 'true' : 'false',
                            'data-child-id': child.id,
                            // The chip is the child's drag handle, mirroring the
                            // main board line; stopPropagation keeps the parent
                            // `li` drag from also starting.
                            draggable: true,
                            'data-dragging': childDragging ? 'true' : undefined,
                            'data-drop': childOver ? 'true' : undefined,
                            title: child.name,
                            onClick: () => onSelect(key),
                            onDragStart: (event) => {
                              event.stopPropagation();
                              setDragChild({ boardId: board.id, childId: child.id });
                              setOverChild(null);
                              if (event.dataTransfer) {
                                event.dataTransfer.effectAllowed = 'move';
                                try {
                                  event.dataTransfer.setData('text/plain', child.id);
                                } catch {
                                  /* a read-only dataTransfer must not cancel the move */
                                }
                              }
                            },
                            onDragOver: (event) => {
                              if (dragChild === null || dragChild.boardId !== board.id) return;
                              event.preventDefault();
                              event.stopPropagation();
                              if (!childOver) setOverChild({ boardId: board.id, childId: child.id });
                            },
                            onDrop: (event) => {
                              if (dragChild === null || dragChild.boardId !== board.id) return;
                              event.preventDefault();
                              event.stopPropagation();
                              if (dragChild.childId !== child.id) onMoveChild(board.id, dragChild.childId, child.id);
                              setDragChild(null);
                              setOverChild(null);
                            },
                            onDragEnd: () => {
                              setDragChild(null);
                              setOverChild(null);
                            },
                            onKeyDown: (event) => {
                              if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
                              event.preventDefault();
                              event.stopPropagation();
                              const next = board.children[childIndex + (event.key === 'ArrowUp' ? -1 : 1)];
                              if (next !== undefined) onMoveChild(board.id, child.id, next.id);
                            },
                            onContextMenu: (event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onMenu(board, child, { x: event.clientX, y: event.clientY });
                            },
                          },
                          h('span', { className: 'wb_sChipName' }, child.name),
                        );
                      }),
                    )
                  : null,
              ),
            );
          }),
        ),
        // One dashed line closes the list, which is the only control that makes a
        // new board: two buttons for one action would be the duplication this
        // round removed.
        h(
          'button',
          { type: 'button', className: 'wb_sCreator', onClick: onCreate },
          h(IconPlus, { size: 12 }),
          h('span', null, t('settings.boardNew')),
        ),
      );
    }

    /**
     * The editing id that stands for a prompt not in the library yet.
     *
     * A prompt is created by SAVE, so its editor opens before the document has
     * anything to name. Every stored id is minted by `uid('prompt')`, so no record
     * can ever carry a value that starts with a character a minted id cannot.
     */
    const NEW_PROMPT = '@new-prompt';

    /** The inline editor for one prompt: a name and a body, saved together. */
    function PromptEditor({ t, prompt, onSave, onCancel }) {
      const [name, setName] = useState(prompt.name);
      const [body, setBody] = useState(prompt.text);
      const nameRef = useRef(null);
      /** Set while one Save is in flight, so a double click cannot append twice. */
      const saving = useRef(false);
      useEffect(() => {
        if (nameRef.current !== null) {
          nameRef.current.focus();
          nameRef.current.select();
        }
      }, []);

      const commit = () => {
        if (saving.current) return;
        saving.current = true;
        const title = name.trim();
        try {
          Promise.resolve(
            onSave({
              name: (title.length === 0 ? t('prompt.newName') : title).slice(0, MAX_PROMPT_NAME),
              text: body.slice(0, MAX_PROMPT_TEXT),
            }),
          ).finally(() => {
            saving.current = false;
          });
        } catch {
          saving.current = false;
        }
      };

      return h(
        'div',
        { className: 'wb_sEditor' },
        h('input', {
          ref: nameRef,
          className: 'wb_sInput',
          value: name,
          maxLength: MAX_PROMPT_NAME,
          placeholder: t('prompt.namePlaceholder'),
          'aria-label': t('prompt.namePlaceholder'),
          onChange: (event) => setName(event.target.value),
          onKeyDown: (event) => {
            if (event.key === 'Enter' && !event.nativeEvent?.isComposing) {
              event.preventDefault();
              commit();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          },
        }),
        h('textarea', {
          className: 'wb_sArea',
          value: body,
          maxLength: MAX_PROMPT_TEXT,
          placeholder: t('prompt.textPlaceholder'),
          'aria-label': t('prompt.textPlaceholder'),
          onChange: (event) => setBody(event.target.value),
          onKeyDown: (event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          },
        }),
        h(
          'div',
          { className: 'wb_sActions' },
          h('button', { type: 'button', className: 'wb_sBtn', onClick: onCancel }, t('prompt.cancel')),
          h('button', { type: 'button', className: 'wb_sBtn wb_sBtnPrimary', onClick: commit }, t('prompt.save')),
        ),
      );
    }

    /**
     * The prompt library and the prompts selected for the selected board.
     *
     * One list, because the two questions ("which prompts does this board use?"
     * and "what is in the library?") have the same answer surface: every checked
     * row IS part of the setting, and a click toggles it without closing the
     * menu — a second click on a checked row removes it.
     */
    function PromptBlock({ t, document, target, onSaveSettings, editing, onEdit, onError, onMenu }) {
      const prompts = Array.isArray(document.prompts) ? document.prompts : [];
      const selected = target === null ? [] : promptIdsOf(document.settings?.[target.key]);
      // Read the selection through the library so display and application share
      // its order, and a dead id left by an old document is not shown as a row.
      const selectedIds = prompts.filter((prompt) => selected.includes(prompt.id)).map((prompt) => prompt.id);
      const [dragId, setDragId] = useState(null);
      const [overId, setOverId] = useState(null);
      const [libraryOpen, setLibraryOpen] = useState(false);
      const [menuOpen, setMenuOpen] = useState(false);
      const [menuPlace, setMenuPlace] = useState(null);
      const pickRef = useRef(null);
      const pickTriggerRef = useRef(null);

      useEffect(() => {
        if (editing !== '') setLibraryOpen(true);
      }, [editing]);

      // A prompt deleted in another tab disappears from this table while its
      // editor id is still set; without this the library would reopen with no
      // editor and the dead id would keep blocking the next edit.
      useEffect(() => {
        if (editing === '' || editing === NEW_PROMPT) return;
        if (!prompts.some((prompt) => prompt.id === editing)) onEdit('');
      }, [editing, prompts, onEdit]);

      useEffect(() => {
        if (!menuOpen) return undefined;
        const trigger = pickTriggerRef.current;
        if (trigger !== null) {
          const rect = trigger.getBoundingClientRect();
          const menuHeight = 280;
          // Keep the fixed-position panel inside the viewport. A long board
          // name or a narrow window can otherwise push the right edge off
          // screen, where its prompt rows are unreachable.
          const width = Math.max(120, Math.min(rect.width, window.innerWidth - 16));
          const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
          const below = rect.bottom + 4;
          const opensUp = below + menuHeight > window.innerHeight - 8;
          setMenuPlace({
            left,
            top: opensUp ? Math.max(8, rect.top - menuHeight - 4) : below,
            width,
          });
        }
        const away = (event) => {
          if (pickRef.current !== null && event.target instanceof Node && pickRef.current.contains(event.target)) return;
          setMenuOpen(false);
        };
        const key = (event) => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          setMenuOpen(false);
        };
        const close = (event) => {
          // A scroll inside the picker itself is how a long prompt list is
          // browsed; closing the menu on that scroll removed the very panel
          // the user was reading. Only a scroll outside the picker dismisses it.
          if (pickRef.current !== null && event?.target instanceof Node && pickRef.current.contains(event.target)) return;
          setMenuOpen(false);
        };
        window.addEventListener('pointerdown', away, true);
        window.addEventListener('keydown', key);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
          window.removeEventListener('pointerdown', away, true);
          window.removeEventListener('keydown', key);
          window.removeEventListener('scroll', close, true);
          window.removeEventListener('resize', close);
        };
      }, [menuOpen]);

      /**
       * Write the prompt library back to the document.
       *
       * `change` receives the CURRENT library from the document rather than a
       * list captured at render time: a save posts the whole document, so writing
       * back a render-time array would replace a newer edit.
       */
      const savePrompts = (change) => {
        onError('');
        return store
          .update((current) => {
            const latest = Array.isArray(current.prompts) ? current.prompts : [];
            return { prompts: change(latest) };
          })
          .then(() => true)
          .catch((problem) => {
            const message = problem instanceof Error ? problem.message : String(problem);
            onError(fill(t('settings.saveFailed'), { message }));
            return false;
          });
      };

      const addPrompt = () => {
        if (prompts.length >= MAX_PROMPTS) {
          onError(t('error.limitReached'));
          return;
        }
        // Creating a prompt is a SAVE, not a click: nothing is written here, the
        // editor opens on an unsaved draft and only Save appends a record.
        onEdit(NEW_PROMPT);
      };

      const createPrompt = (draft) => {
        if (prompts.length >= MAX_PROMPTS) {
          onError(t('error.limitReached'));
          return Promise.resolve(false);
        }
        const created = { id: uid('prompt'), name: draft.name, text: draft.text };
        return savePrompts((list) => [...list, created]);
      };

      const duplicatePrompt = (id) => {
        if (prompts.length >= MAX_PROMPTS) {
          onError(t('error.limitReached'));
          return Promise.resolve(false);
        }
        const copy = {
          id: uid('prompt'),
          name: `${prompts.find((item) => item.id === id)?.name ?? t('prompt.newName')} ${t('prompt.copySuffix')}`.slice(
            0,
            MAX_PROMPT_NAME,
          ),
          text: (prompts.find((item) => item.id === id)?.text ?? '').slice(0, MAX_PROMPT_TEXT),
        };
        savePrompts((list) => {
          const at = list.findIndex((item) => item.id === id);
          if (at < 0) return list;
          const next = list.slice();
          next.splice(at + 1, 0, copy);
          return next;
        });
      };

      const deletePrompt = (id) => {
        savePrompts((list) => list.filter((item) => item.id !== id)).then((saved) => {
          if (!saved) return;
          // Only clear a board that selected this prompt AFTER the prompt
          // library write landed; otherwise a failed delete would silently drop
          // the board's valid prompt selection too. The updater reads the LIVE
          // bag so a rapid second deletion cannot restore the first dead id.
          if (selectedIds.includes(id) && target !== null) {
            onSaveSettings(target.key, (bag) => ({
              promptIds: promptIdsOf(bag).filter((item) => item !== id),
            }));
          }
          if (editing === id) onEdit('');
        });
      };

      const updatePrompt = (id, patch) => {
        return savePrompts((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)));
      };

      const movePrompt = (fromId, toId) => {
        savePrompts((list) => {
          const next = list.slice();
          const from = next.findIndex((item) => item.id === fromId);
          const to = next.findIndex((item) => item.id === toId);
          if (from < 0 || to < 0 || from === to) return list;
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return next;
        });
      };

      /**
       * The menu for one prompt row.
       *
       * ORDER IS NOT A MENU ACTION — a prompt is dragged to its new place, exactly
       * as a board line is, so one gesture reorders both lists.
       */
      const promptMenu = (prompt, at) => {
        onMenu(at, [
          { key: 'edit', label: t('prompt.edit'), glyph: h(IconText, { size: 13 }), onSelect: () => onEdit(prompt.id) },
          { key: 'copy', label: t('prompt.copy'), glyph: h(IconCopy, { size: 13 }), onSelect: () => duplicatePrompt(prompt.id) },
          {
            key: 'delete',
            label: t('prompt.delete'),
            glyph: h(IconTrash, { size: 13 }),
            danger: true,
            separated: true,
            onSelect: () => deletePrompt(prompt.id),
          },
        ]);
      };

      const selectedNames = prompts
        .filter((prompt) => selectedIds.includes(prompt.id))
        .map((prompt) => prompt.name);
      const selectedPrompt = selectedNames.length === 0 ? t('prompt.none') : selectedNames.join('、');
      const togglePrompt = (id) => {
        if (target === null) return;
        // Toggling writes through an updater: two quick clicks both land on the
        // live bag instead of racing a list captured at render time.
        onSaveSettings(target.key, (bag) => {
          const current = promptIdsOf(bag);
          return { promptIds: current.includes(id) ? current.filter((item) => item !== id) : [...current, id] };
        });
      };
      const clearPrompts = () => {
        if (target === null) return;
        onSaveSettings(target.key, { promptIds: [] });
      };

      return h(
        SettingsSubBlock,
        {
          title: t('prompt.title'),
          code: t('prompt.code'),
          hint: t('prompt.hint'),
          actions: h(
            'button',
            { type: 'button', className: 'wb_sBtn', onClick: () => setLibraryOpen((value) => !value) },
            libraryOpen ? t('prompt.hideLibrary') : t('prompt.library'),
          ),
        },
        h(
          React.Fragment,
          null,
          h(
            'div',
            { className: 'wb_sPick', ref: pickRef },
            h(
              'button',
              {
                ref: pickTriggerRef,
                type: 'button',
                className: 'wb_cfgPromptPlate wb_sPickTrigger',
                'data-testid': 'prompt-select',
                'aria-haspopup': 'listbox',
                'aria-expanded': menuOpen ? 'true' : 'false',
                'aria-label': t('prompt.title'),
                onClick: () => setMenuOpen((value) => !value),
              },
              h('span', { className: 'wb_cfgPromptGlyph', 'aria-hidden': 'true' }, h(IconText, { size: 14 })),
              h(
                'span',
                { className: 'wb_cfgPromptText' },
                h('span', { className: 'wb_cfgPromptName', title: selectedNames.join('、') }, selectedPrompt),
                h(
                  'span',
                  { className: 'wb_cfgPromptNote' },
                  selectedIds.length === 0
                    ? t('prompt.nativeNote')
                    : fill(t('prompt.selectedNote'), { count: selectedIds.length }),
                ),
              ),
              h('span', { className: 'wb_sChevron', 'aria-hidden': 'true' }),
            ),
            menuOpen && menuPlace !== null
              ? h(
                  'div',
                  {
                    className: 'wb_sPickMenu',
                    role: 'listbox',
                    'data-window-drag-exclude': 'true',
                    'aria-label': t('prompt.title'),
                    'aria-multiselectable': 'true',
                    style: { left: `${menuPlace.left}px`, top: `${menuPlace.top}px`, width: `${menuPlace.width}px` },
                  },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'wb_sPickRow',
                      role: 'option',
                      'aria-selected': selectedIds.length === 0 ? 'true' : 'false',
                      onClick: clearPrompts,
                    },
                    h(
                      'span',
                      { className: 'wb_sPickCheck', 'aria-hidden': 'true' },
                      selectedIds.length === 0 ? h(IconCheck, { size: 10 }) : null,
                    ),
                    h('span', { className: 'wb_sPickText' }, h('span', { className: 'wb_sPickName' }, t('prompt.none'))),
                  ),
                  prompts.map((prompt) =>
                    h(
                      'button',
                      {
                        key: prompt.id,
                        type: 'button',
                        className: 'wb_sPickRow',
                        role: 'option',
                        'aria-selected': selectedIds.includes(prompt.id) ? 'true' : 'false',
                        onClick: () => togglePrompt(prompt.id),
                      },
                      h(
                        'span',
                        { className: 'wb_sPickCheck', 'aria-hidden': 'true' },
                        selectedIds.includes(prompt.id) ? h(IconCheck, { size: 10 }) : null,
                      ),
                      h(
                        'span',
                        { className: 'wb_sPickText' },
                        h('span', { className: 'wb_sPickName' }, prompt.name),
                        prompt.text.length > 0 ? h('span', { className: 'wb_sPickDesc' }, prompt.text.slice(0, 72)) : null,
                      ),
                    ),
                  ),
                )
              : null,
          ),
          libraryOpen
            ? h(
                React.Fragment,
                null,
                h(
                  'div',
                  { className: 'wb_sLibrary' },
                  h('p', { className: 'wb_sLibraryTitle' }, t('prompt.library')),
                  prompts.length === 0 ? h('p', { className: 'wb_sHint' }, t('prompt.empty')) : null,
                  prompts.map((prompt, index) => {
                    if (editing === prompt.id) {
                      return h(PromptEditor, {
                        key: prompt.id,
                        t,
                        prompt,
                        onCancel: () => onEdit(''),
                        onSave: (patch) =>
                          updatePrompt(prompt.id, patch).then((saved) => {
                            if (saved) onEdit('');
                            return saved;
                          }),
                      });
                    }
                    return h(
                      'div',
                      {
                        key: prompt.id,
                        className: 'wb_sRow wb_sLibraryRow',
                        'data-prompt-id': prompt.id,
                        draggable: true,
                        'data-dragging': dragId === prompt.id ? 'true' : undefined,
                        'data-drop': overId === prompt.id && dragId !== prompt.id ? 'true' : undefined,
                        onDragStart: (event) => {
                          setDragId(prompt.id);
                          if (event.dataTransfer) {
                            event.dataTransfer.effectAllowed = 'move';
                            try {
                              event.dataTransfer.setData('text/plain', prompt.id);
                            } catch {
                              /* a read-only dataTransfer must not cancel the move */
                            }
                          }
                        },
                        onDragOver: (event) => {
                          if (dragId === null) return;
                          event.preventDefault();
                          if (overId !== prompt.id) setOverId(prompt.id);
                        },
                        onDrop: (event) => {
                          event.preventDefault();
                          if (dragId !== null && dragId !== prompt.id) movePrompt(dragId, prompt.id);
                          setDragId(null);
                          setOverId(null);
                        },
                        onDragEnd: () => {
                          setDragId(null);
                          setOverId(null);
                        },
                        onContextMenu: (event) => {
                          event.preventDefault();
                          promptMenu(prompt, { x: event.clientX, y: event.clientY });
                        },
                      },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'wb_sRowPick',
                          onClick: () => onEdit(prompt.id),
                          title: prompt.text.slice(0, 180),
                          onKeyDown: (event) => {
                            if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
                            event.preventDefault();
                            const next = prompts[index + (event.key === 'ArrowUp' ? -1 : 1)];
                            if (next !== undefined) movePrompt(prompt.id, next.id);
                          },
                        },
                        h(
                          'span',
                          { className: 'wb_sRowText' },
                          h('span', { className: 'wb_sRowName', title: prompt.name }, prompt.name),
                          prompt.text.length > 0 ? h('span', { className: 'wb_sRowHint' }, prompt.text.slice(0, 72)) : null,
                        ),
                      ),
                      h(
                        'span',
                        { className: 'wb_sRowActions' },
                        h(
                          'button',
                          { type: 'button', className: 'wb_sIcon', title: t('prompt.edit'), 'aria-label': t('prompt.edit'), onClick: () => onEdit(prompt.id) },
                          h(IconText, { size: 12 }),
                        ),
                        h(
                          'button',
                          { type: 'button', className: 'wb_sIcon', title: t('prompt.copy'), 'aria-label': t('prompt.copy'), onClick: () => duplicatePrompt(prompt.id) },
                          h(IconCopy, { size: 12 }),
                        ),
                        h(
                          'button',
                          { type: 'button', className: 'wb_sIcon', title: t('prompt.delete'), 'aria-label': t('prompt.delete'), onClick: () => deletePrompt(prompt.id) },
                          h(IconTrash, { size: 12 }),
                        ),
                      ),
                    );
                  }),
                  editing === NEW_PROMPT
                    ? h(PromptEditor, {
                        key: NEW_PROMPT,
                        t,
                        prompt: { name: '', text: '' },
                        onCancel: () => onEdit(''),
                        onSave: (draft) =>
                          createPrompt(draft).then((saved) => {
                            if (saved) onEdit('');
                            return saved;
                          }),
                      })
                    : null,
                ),
                h(
                  'div',
                  { className: 'wb_sActions' },
                  h(
                    'button',
                    { type: 'button', className: 'wb_sBtn', onClick: addPrompt },
                    h(IconPlus, { size: 11 }),
                    h('span', null, t('prompt.new')),
                  ),
                ),
              )
            : null,
        ),
      );
    }

    /**
     * The skill switches for the edited board.
     *
     * The catalog is re-read from the Host when this block first mounts, so a
     * skill installed while the page is open appears without a restart. A short
     * shared cache keeps chapter switches and Settings re-opens from issuing
     * the same directory scan again; the refresh key forces a fresh read. The
     * NAME is the row's label — it is what the user installs under `~/.dsh/skills`
     * and what the document records.
     */
    const SKILLS_CACHE_TTL = 15_000;
    let skillsCache = null;
    let skillsCacheAt = 0;

    function SkillBlock({ t, enabled, onToggle, onError }) {
      const [skills, setSkills] = useState(() => skillsCache);
      const [busy, setBusy] = useState(false);
      const [open, setOpen] = useState(false);
      const [place, setPlace] = useState(null);
      const rootRef = useRef(null);
      const triggerRef = useRef(null);
      const loadSeq = useRef(0);

      const load = (force = false) => {
        const seq = (loadSeq.current += 1);
        if (!force && skillsCache !== null && Date.now() - skillsCacheAt < SKILLS_CACHE_TTL) {
          setSkills(skillsCache);
          setBusy(false);
          onError('');
          return;
        }
        setBusy(true);
        onError('');
        fetchWithTimeout(`${API}/skills`, { headers: { 'cache-control': 'no-cache' } }, 15000)
          .then((response) => {
            if (!response.ok) {
              discardResponseBody(response);
              throw new Error(`HTTP ${response.status}`);
            }
            return readJsonWithTimeout(response);
          })
          .then((payload) => {
            if (seq !== loadSeq.current) return;
            // `/skills` is a Host answer, not a local constant: a broken proxy
            // could put null or primitive rows in the array, and rendering
            // `skill.name` would then throw during the next paint.
            const rows = Array.isArray(payload?.skills)
              ? payload.skills
                  .filter(
                    (skill) =>
                      skill !== null &&
                      typeof skill === 'object' &&
                      typeof skill.name === 'string' &&
                      skill.name.length > 0 &&
                      skill.name.length <= MAX_SKILL_NAME,
                  )
                  .map((skill) => ({
                    name: skill.name,
                    description: typeof skill.description === 'string' ? skill.description.slice(0, 300) : '',
                  }))
                  .slice(0, MAX_SKILLS)
              : [];
            skillsCache = rows;
            skillsCacheAt = Date.now();
            setSkills(rows);
            onError('');
          })
          .catch((problem) => {
            if (seq !== loadSeq.current) return;
            onError(fill(t('skills.loadError'), { message: problem instanceof Error ? problem.message : String(problem) }));
          })
          .finally(() => {
            if (seq === loadSeq.current) setBusy(false);
          });
      };

      useEffect(() => {
        load();
        return () => {
          // Invalidate a response that arrives after the block unmounts or is
          // superseded by a refresh click.
          loadSeq.current += 1;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      useEffect(() => {
        if (!open) return undefined;
        const trigger = triggerRef.current;
        if (trigger !== null) {
          const rect = trigger.getBoundingClientRect();
          const rootWidth = rootRef.current === null ? rect.width : rootRef.current.getBoundingClientRect().width;
          const menuHeight = 280;
          // Same viewport fence as the prompt picker: the menu is wider than
          // its trigger, so clamp before it is positioned, not after.
          const width = Math.max(120, Math.min(Math.max(rect.width, rootWidth), window.innerWidth - 16));
          const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
          const below = rect.bottom + 4;
          const opensUp = below + menuHeight > window.innerHeight - 8;
          setPlace({
            left,
            top: opensUp ? Math.max(8, rect.top - menuHeight - 4) : below,
            // The trigger is a small “选择技能” key; the menu is a full
            // configuration panel and must align with the shelf above it.
            width,
          });
        }
        const away = (event) => {
          if (rootRef.current !== null && event.target instanceof Node && rootRef.current.contains(event.target)) return;
          setOpen(false);
        };
        const key = (event) => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          setOpen(false);
        };
        const close = (event) => {
          // The skill list scrolls inside its own popover; that scroll must
          // not dismiss the list. A scroll elsewhere still closes it.
          if (rootRef.current !== null && event?.target instanceof Node && rootRef.current.contains(event.target)) return;
          setOpen(false);
        };
        window.addEventListener('pointerdown', away, true);
        window.addEventListener('keydown', key);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
          window.removeEventListener('pointerdown', away, true);
          window.removeEventListener('keydown', key);
          window.removeEventListener('scroll', close, true);
          window.removeEventListener('resize', close);
        };
      }, [open]);

      const list = skills ?? [];
      // A stored switch can name a skill that was uninstalled after it was
      // selected. Keep that row visible and removable instead of making the
      // unknown name impossible to clear.
      const missing = skills === null ? [] : enabled.filter((name) => !list.some((skill) => skill.name === name));

      return h(
        SettingsSubBlock,
        {
          title: t('skills.title'),
          code: t('skills.code'),
          hint: t('skills.subtitle'),
          actions: [
            busy ? h('span', { key: 'busy', className: 'wb_sHint' }, t('common.loading')) : null,
            h(
              'button',
              {
                key: 'refresh',
                type: 'button',
                className: 'wb_sIcon wb_sIconBordered',
                'aria-label': t('skills.refresh'),
                title: t('skills.refresh'),
                disabled: busy,
                onClick: () => load(true),
              },
              h(IconRefresh, { size: 13 }),
            ),
          ],
        },
        h(
          'div',
          { className: 'wb_sPick', ref: rootRef },
          h(
            'div',
            { className: 'wb_cfgSkillShelf', 'aria-label': fill(t('skills.selected'), { count: enabled.length }) },
            enabled.length === 0
              ? h('span', { className: 'wb_cfgSkillEmpty' }, t('skills.none'))
              : enabled.map((name) =>
                  h(
                    'button',
                    {
                      key: name,
                      type: 'button',
                      className: 'wb_cfgSkillChip',
                      title: fill(t('skills.remove'), { name }),
                      onClick: () => onToggle(name),
                    },
                    h('span', { className: 'wb_cfgSkillChipName' }, name),
                    h('span', { className: 'wb_cfgSkillX', 'aria-hidden': 'true' }, '×'),
                  ),
                ),
          ),
          h(
            'button',
            {
              ref: triggerRef,
              type: 'button',
              className: 'wb_cfgSkillTrigger wb_sBtn wb_sPickTrigger',
              'aria-haspopup': 'listbox',
              'aria-expanded': open ? 'true' : 'false',
              'aria-label': t('skills.choose'),
              onClick: () => setOpen((value) => !value),
            },
            h(IconPlus, { size: 12 }),
            h('span', null, t('skills.choose')),
          ),
          open && place !== null
            ? h(
                'div',
                {
                  className: 'wb_sPickMenu',
                  role: 'listbox',
                  'data-window-drag-exclude': 'true',
                  'aria-multiselectable': 'true',
                  style: { left: `${place.left}px`, top: `${place.top}px`, width: `${place.width}px` },
                },
                skills === null ? h('p', { className: 'wb_sHint' }, t('common.loading')) : null,
                skills !== null && list.length === 0 ? h('p', { className: 'wb_sHint' }, t('skills.empty')) : null,
                list.map((skill) =>
                  h(
                    'button',
                    {
                      key: skill.name,
                      type: 'button',
                      className: 'wb_sPickRow',
                      role: 'option',
                      'aria-selected': enabled.includes(skill.name) ? 'true' : 'false',
                      onClick: () => onToggle(skill.name),
                    },
                    h('span', { className: 'wb_sPickCheck', 'aria-hidden': 'true' }, enabled.includes(skill.name) ? h(IconCheck, { size: 10 }) : null),
                    h(
                      'span',
                      { className: 'wb_sPickText' },
                      h('span', { className: 'wb_sPickName' }, skill.name),
                      skill.description ? h('span', { className: 'wb_sPickDesc' }, skill.description) : null,
                    ),
                  ),
                ),
                missing.map((name) =>
                  h(
                    'button',
                    {
                      key: `missing:${name}`,
                      type: 'button',
                      className: 'wb_sPickRow',
                      role: 'option',
                      'aria-selected': 'true',
                      onClick: () => onToggle(name),
                    },
                    h('span', { className: 'wb_sPickCheck', 'aria-hidden': 'true' }, h(IconCheck, { size: 10 })),
                    h(
                      'span',
                      { className: 'wb_sPickText' },
                      h('span', { className: 'wb_sPickName' }, name),
                      h('span', { className: 'wb_sPickDesc' }, t('skills.missing')),
                    ),
                  ),
                ),
              )
            : null,
        ),
      );
    }

    /**
     * The workbench Settings section: the wire desk's back matter.
     *
     * Three blocks, in the order the product defines them: the working area the
     * boards run in, the boards themselves, then the prompt and the skills of the
     * selected board. Everything here writes the same document the ledger reads,
     * so a change is visible on that surface as soon as it is made.
     */
    function WorkbenchSettings() {
      useLocaleVersion();
      const t = translate();
      const document = useDocument();
      // A failed read leaves `store.document` null; only a real document makes
      // the editor safe to show, otherwise a failure flashes an empty board list.
      const [ready, setReady] = useState(store.document !== null);
      const [error, setError] = useState('');
      const [saved, setSaved] = useState(false);
      /** Latest write attempt, so an older failure cannot overwrite a newer result. */
      const runSeq = useRef(0);
      /** The board whose prompt and skills are being edited, as a board key. */
      const [target, setTarget] = useState('');
      /** Which imprint chapter is on the page; the others stay as contents lines. */
      const [chapter, setChapter] = useState('boards');
      /** The prompt whose inline editor is open. */
      const [editing, setEditing] = useState('');
      /** `{boardId, childId}` of the row being renamed; childId null for a board. */
      const [renaming, setRenaming] = useState(null);
      /** The open menu: `{at: {x, y}, items}`. */
      const [menu, setMenu] = useState(null);
      /** The pending confirmation: {title, body, run}. */
      const [confirming, setConfirming] = useState(null);
      /** A board creation is in flight; a double click must not append twice. */
      const creating = useRef(false);

      // Read the document when the page opens. It is a FORCED read: another
      // browser may have written since this module loaded, and a Settings page
      // that edited a stale copy would silently undo that write.
      useEffect(() => {
        let cancelled = false;
        store.load({ force: true }).then(() => {
          if (cancelled) return;
          setReady(true);
          // A failed read leaves `document` null; without this the section would
          // render an empty board list as if the user had none. A later
          // background load can fill the cache, so clear the stale local error.
          if (store.document === null) {
            setError(fill(t('error.generic'), { message: store.error || t('common.error') }));
          } else {
            setError('');
          }
        });
        return () => {
          cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      // "已保存" is a receipt, not a status line: it fades on its own, so the
      // column never keeps a permanent extra row under the intro.
      useEffect(() => {
        if (!saved) return undefined;
        const timer = setTimeout(() => setSaved(false), 1800);
        return () => clearTimeout(timer);
      }, [saved]);

      const boards = Array.isArray(document.boards) ? document.boards : [];

      // Keep the target pointed at a board that still exists: deleting the board
      // being edited must not leave the block below addressing a dead key.
      // The whole section re-renders for local editor state (saved receipt,
      // chapter, menu, confirmation); rebuilding the flattened board tree is
      // only needed when the document's boards change. A profile with many
      // sub-boards paid that allocation on every keystroke inside a field.
      const keys = useMemo(() => {
        const list = [];
        for (const board of boards) {
          list.push({ key: board.id, label: board.name, board, child: undefined });
          for (const child of Array.isArray(board.children) ? board.children : []) {
            list.push({ key: `${board.id}/${child.id}`, label: child.name, board, child });
          }
        }
        return list;
      }, [boards]);
      const active = keys.find((item) => item.key === target) ?? keys[0];
      const activeKey = active === undefined ? '' : active.key;

      /** Run one write and surface its failure in the section. */
      const run = (operation) => {
        const seq = (runSeq.current += 1);
        setSaved(false);
        setError('');
        return Promise.resolve()
          .then(() => operation())
          .then(() => {
            if (seq === runSeq.current) {
              setSaved(true);
              setError('');
            }
            return true;
          })
          .catch((problem) => {
            if (seq !== runSeq.current) return false;
            setError(fill(t('settings.saveFailed'), { message: problem instanceof Error ? problem.message : String(problem) }));
            return false;
          });
      };

      const patchBoard = (boardId, patch) => {
        run(() =>
          store.update((current) => ({
            boards: current.boards.map((board) => {
              if (board.id !== boardId) return board;
              // Structural edits (children add/remove/rename) read the LIVE
              // board inside the updater. Capturing `board.children` at menu
              // render time dropped the first of two quick sub-board creates.
              const values = typeof patch === 'function' ? patch(board) : patch;
              return { ...board, ...values };
            }),
          })),
        );
      };

      /**
       * Remove one board or child and every collection entry scoped to it.
       *
       * The Host prunes the same keys during normalization, but the optimistic
       * copy must be honest immediately: otherwise a deleted child's prompt,
       * skills and Session rows stay in the in-memory document until a reload,
       * and a later board or Session reusing the key can inherit them.
       * @param current - the live document.
       * @param boardId - the board being changed.
       * @param childId - the child to remove, or undefined to remove the board.
       * @returns the next document.
       */
      const pruneBoardScope = (current, boardId, childId) => {
        const key = childId === undefined ? boardId : `${boardId}/${childId}`;
        const boards = current.boards
          .filter((board) => childId !== undefined || board.id !== boardId)
          .map((board) => {
            if (childId === undefined || board.id !== boardId || !Array.isArray(board.children)) return board;
            return { ...board, children: board.children.filter((child) => child.id !== childId) };
          });
        const prune = (bag) => {
          const next = { ...(bag ?? {}) };
          for (const name of Object.keys(next)) {
            if (name === key || (childId === undefined && name.startsWith(`${key}/`))) delete next[name];
          }
          return next;
        };
        return {
          boards,
          settings: prune(current.settings),
          sessions: prune(current.sessions),
          todos: prune(current.todos),
          notes: prune(current.notes),
        };
      };

      /**
       * Drop client-side caches that still point at a removed board or child.
       *
       * The document is the authority on which boards exist; keeping a deleted
       * key in `boardSessions`/`sessionLabels` would retain the old Session id
       * (and its label) for the rest of the page and could make the next open
       * choose a Session that is no longer addressable.
       * @param boardId - removed board id.
       * @param childId - removed child id, or undefined for the whole board.
       */
      const dropBoardCache = (boardId, childId) => {
        for (const key of [...boardSessions.keys()]) {
          const matches = childId === undefined ? key === boardId || key.startsWith(`${boardId}/`) : key === `${boardId}/${childId}`;
          if (matches) boardSessions.delete(key);
        }
        // `boardSessions` only keeps the latest Session per board key; the
        // label cache holds every recorded conversation. Walk the labels too,
        // otherwise deleting a board leaves its older Session ids and labels in
        // memory until the next page load.
        for (const [sessionId, label] of [...sessionLabels.entries()]) {
          const matchesBoard = label !== null && typeof label === 'object' && label.boardId === boardId;
          if (!matchesBoard) continue;
          if (childId !== undefined && label.childId !== childId) continue;
          sessionLabels.delete(sessionId);
        }
        notifyLabels();
      };

      /**
       * Remove one board, and everything stored FOR that board.
       *
       * The Host prunes the same keys on write, but doing it here as well keeps
       * this page's own copy honest for the moment between the click and the
       * write.
       */
      const deleteBoard = (boardId) => {
        run(() => store.update((current) => pruneBoardScope(current, boardId))).then((saved) => {
          if (saved) dropBoardCache(boardId);
        });
        if (target === boardId || target.startsWith(`${boardId}/`)) setTarget('');
        if (renaming !== null && renaming.boardId === boardId) setRenaming(null);
      };

      /** Remove one child and its scoped collection entries. */
      const deleteChild = (boardId, childId) => {
        const key = `${boardId}/${childId}`;
        run(() => store.update((current) => pruneBoardScope(current, boardId, childId))).then((saved) => {
          if (saved) dropBoardCache(boardId, childId);
        });
        setTarget((current) => (current === key ? boardId : current));
        if (renaming !== null && renaming.boardId === boardId && renaming.childId === childId) setRenaming(null);
      };

      const createBoard = () => {
        if (creating.current) return;
        if (document.boards.length >= MAX_BOARDS) {
          setError(t('error.limitReached'));
          return;
        }
        creating.current = true;
        const board = {
          id: uid('board'),
          name: t('board.newName'),
          enName: '',
          kind: 'chat',
          mode: 'standard',
          children: [],
        };
        // `agentPreset` is omitted for the default standard preset; the Host
        // derives it from `mode` and keeps untouched documents compact.
        const task = run(() => store.update((current) => ({ boards: [...current.boards, board] })));
        // Select the new line and open its name field: a board that arrived called
        // 新板块 and then needed a second click to be named would read as an
        // unfinished action rather than a created one.
        setTarget(board.id);
        setRenaming({ boardId: board.id, childId: null });
        task.finally(() => {
          creating.current = false;
        });
      };

      const moveBoard = (fromId, toId) => {
        run(() =>
          store.update((current) => {
            const items = current.boards.slice();
            const from = items.findIndex((board) => board.id === fromId);
            const to = items.findIndex((board) => board.id === toId);
            if (from < 0 || to < 0 || from === to) return { boards: current.boards };
            const [moved] = items.splice(from, 1);
            items.splice(to, 0, moved);
            return { boards: items };
          }),
        );
      };

      const moveChild = (boardId, fromId, toId) => {
        run(() =>
          store.update((current) => {
            const boards = current.boards.map((board) => {
              if (board.id !== boardId || !Array.isArray(board.children)) return board;
              const children = board.children.slice();
              const from = children.findIndex((child) => child.id === fromId);
              const to = children.findIndex((child) => child.id === toId);
              if (from < 0 || to < 0 || from === to) return board;
              const [moved] = children.splice(from, 1);
              children.splice(to, 0, moved);
              return { ...board, children };
            });
            return { boards };
          }),
        );
      };

      const saveSettings = (key, patch) => run(() => store.saveSettings(key, patch));

      /**
       * The menu for one board or sub-board.
       *
       * Opening it also SELECTS the row, so the prompt and skill blocks below
       * always describe the board the menu was opened on rather than whichever
       * card happened to be selected before.
       */
      const openBoardMenu = (board, child, at) => {
        setTarget(child === undefined ? board.id : `${board.id}/${child.id}`);
        const items =
          child === undefined
            ? [
                {
                  key: 'child',
                  label: t('settings.boardNewChild'),
                  glyph: h(IconPlus, { size: 13 }),
                  onSelect: () => {
                    // A new sub-board starts on the standard preset unless it
                    // belongs to the locked chat branch.
                    if (Array.isArray(board.children) && board.children.length >= MAX_CHILDREN_PER_BOARD) {
                      setError(t('error.limitReached'));
                      return;
                    }
                    const childMode = board.mode === 'chat' ? 'chat' : 'standard';
                    const created = { id: uid('sub'), name: t('board.newChildName'), kind: board.kind, mode: childMode };
                    patchBoard(board.id, (current) => ({
                      children: [...(Array.isArray(current.children) ? current.children : []), created],
                    }));
                    setTarget(`${board.id}/${created.id}`);
                    setRenaming({ boardId: board.id, childId: created.id });
                  },
                },
                {
                  key: 'rename',
                  label: t('settings.boardRename'),
                  glyph: h(IconText, { size: 13 }),
                  onSelect: () => setRenaming({ boardId: board.id, childId: null }),
                },
                {
                  key: 'delete',
                  label: t('settings.boardDelete'),
                  glyph: h(IconTrash, { size: 13 }),
                  danger: true,
                  separated: true,
                  onSelect: () =>
                    setConfirming({
                      title: t('settings.boardDelete'),
                      body: fill(t('settings.confirmDeleteBoard'), { name: board.name }),
                      run: () => deleteBoard(board.id),
                    }),
                },
              ]
            : [
                {
                  key: 'rename',
                  label: t('settings.boardRename'),
                  glyph: h(IconText, { size: 13 }),
                  onSelect: () => setRenaming({ boardId: board.id, childId: child.id }),
                },
                {
                  key: 'delete',
                  label: t('settings.boardDeleteChild'),
                  glyph: h(IconTrash, { size: 13 }),
                  danger: true,
                  separated: true,
                  onSelect: () =>
                    setConfirming({
                      title: t('settings.boardDeleteChild'),
                      body: fill(t('settings.confirmDeleteChild'), { name: child.name }),
                      run: () => deleteChild(board.id, child.id),
                    }),
                },
              ];
        setMenu({ at, items });
      };

      if (!ready) {
        return h('div', { className: 'wb_sSection' }, h('p', { className: 'wb_sHint' }, t('settings.loading')));
      }

      const enabled = (() => {
        const bag = active === undefined ? undefined : document.settings?.[active.key];
        return bag !== null && typeof bag === 'object' && Array.isArray(bag.skills)
          ? [...new Set(bag.skills.filter((name) => typeof name === 'string' && name.length > 0))]
          : [];
      })();

      const targetLabel =
        active === undefined
          ? ''
          : active.child === undefined
            ? active.board.name
            : `${active.board.name} / ${active.child.name}`;

      return h(
        'div',
        { className: 'wb_sSection' },
        h(
          'div',
          { className: 'wb_sMasthead' },
          h(
            'div',
            { className: 'wb_sBand' },
            h(
              'div',
              { className: 'wb_sBrand' },
              h(
                'div',
                { className: 'wb_sBrandText' },
                h('b', null, t('settings.title')),
                h('span', null, t('settings.backMatter')),
              ),
            ),
            h(
              'div',
              { className: 'wb_sBandRight' },
              saved ? h('span', { className: 'wb_sNote' }, t('settings.saved')) : null,
            ),
          ),
          h('p', { className: 'wb_sIntro' }, t('settings.intro')),
          error.length > 0 ? h('p', { className: 'wb_sError' }, error) : null,
          h(SettingsIndex, { t, chapter, targetLabel, onPick: setChapter }),
        ),

        h(
          'div',
          { className: 'wb_sLedger' },
          chapter === 'boards'
            ? h(BoardsBlock, {
                t,
                boards,
                activeKey,
                renaming,
                onSelect: setTarget,
                onRename: setRenaming,
                onPatch: patchBoard,
                onCreate: createBoard,
                onMenu: openBoardMenu,
                onMove: moveBoard,
                onMoveChild: moveChild,
              })
            : null,
          chapter === 'config'
            ? h(
                SettingsChapter,
                {
                  no: '02',
                  title: t('settings.configuration'),
                  hint: active === undefined ? t('settings.needBoards') : null,
                },
                active === undefined
                  ? null
                  : h(
                      React.Fragment,
                      null,
                      h(
                        'p',
                        { className: 'wb_sScope' },
                        h('span', { className: 'wb_sScopeLabel' }, t('settings.scope')),
                        h('span', { className: 'wb_sScopeText' }, fill(t('settings.configHint'), { name: targetLabel })),
                      ),
                      active.child === undefined
                        ? h(BoardWorkspaceField, {
                            t,
                            document,
                            board: active.board,
                            onPatch: patchBoard,
                            onError: setError,
                          })
                        : null,
                      (active.child === undefined ? active.board : active.child).kind === 'chat'
                        ? h(ModeBlock, {
                            t,
                            board: active.board,
                            child: active.child,
                            onPatch: patchBoard,
                          })
                        : null,
                      h(PromptBlock, {
                        t,
                        document,
                        target: active,
                        onSaveSettings: saveSettings,
                        editing,
                        onEdit: setEditing,
                        onError: setError,
                        onMenu: (at, items) => setMenu({ at, items }),
                      }),
                      h(SkillBlock, {
                        t,
                        enabled,
                        onToggle: (name) => {
                          if (!enabled.includes(name) && enabled.length >= MAX_SKILLS) {
                            setError(t('error.limitReached'));
                            return;
                          }
                          saveSettings(active.key, (bag) => {
                            const current = Array.isArray(bag.skills) ? bag.skills : [];
                            const next = current.includes(name) ? current.filter((item) => item !== name) : [...current, name];
                            return { skills: next };
                          });
                        },
                        onError: setError,
                      }),
                    ),
              )
            : null,
        ),

        menu === null ? null : h(ContextMenu, { at: menu.at, items: menu.items, onClose: () => setMenu(null) }),

        confirming === null
          ? null
          : h(ConfirmDialog, {
              title: confirming.title,
              body: confirming.body,
              confirmLabel: t('common.delete'),
              cancelLabel: t('common.cancel'),
              danger: true,
              onConfirm: () => {
                const runConfirm = confirming.run;
                setConfirming(null);
                runConfirm();
              },
              onCancel: () => setConfirming(null),
            }),
      );
    }

    // ── plugin ────────────────────────────────────────────────────────────────

    /** Namespace-bound translate function, rebound when the locale changes. */
    let translateFn = (key, values) => fill(zh[key] ?? key, values);
    /** Bumped on every locale change so mounted pages re-render their copy. */
    let localeVersion = 0;
    const localeListeners = new Set();

    function translate() {
      return translateFn;
    }

    /** Re-render the caller whenever the active locale changes. */
    function useLocaleVersion() {
      const [version, setVersion] = useState(localeVersion);
      // Subscribe once; the listener reads the live module value, so a locale
      // switch does not tear down and recreate every subscriber.
      useEffect(() => {
        const listener = () => setVersion(localeVersion);
        localeListeners.add(listener);
        // Catch a locale switch that landed between render and subscription.
        if (localeVersion !== version) setVersion(localeVersion);
        return () => {
          localeListeners.delete(listener);
        };
        // `version` is intentionally read on mount only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return version;
    }

    /** The plugin context, published for components the slot system renders. */
    let pluginContext = null;

    /**
     * The workbench panel: the ledger, or one board's own page.
     *
     * The page is a VIEW of the shared document. Everything that changes it lives
     * in Settings (see {@link WorkbenchSettings}), except the two pages that are
     * about WORKING rather than configuring: 待办任务 and 灵感笔记 open their own
     * page here instead of a conversation, because a to-do list and a note board
     * are not things a chat transcript can hold. A conversation board is a folder
     * for its sub-boards: the board row itself is inert, a sub-board lists its
     * conversations on a click, and a right-click starts another one.
     */
    function WorkbenchPage() {
      useLocaleVersion();
      const t = translate();
      const document = useDocument();
      const sessionSummaries = useSessionSummaries();
      // A previous failed load also sets `loaded`; the presence of a document,
      // not the flag, is what makes the ledger safe to paint.
      const [status, setStatus] = useState(store.document !== null ? 'ready' : 'loading');
      const [failure, setFailure] = useState('');
      // A failed first read is recoverable: the saved-document effect (or the
      // reminder clock) may load a valid document a moment later. Do not leave
      // the panel on a terminal error screen when the cache has since filled.
      const pageStatus = store.document !== null && (status === 'loading' || status === 'error') ? 'ready' : status;
      /** Why the configure shortcut could not reach Settings, if it could not. */
      const [configureFailed, setConfigureFailed] = useState('');
      /** Null on the ledger; the open board (and sub-board) ids on its own page. */
      const [view, setView] = useState(null);
      /** Timer ids used by the configure shortcut's short DOM retries. */
      const retryTimers = useRef(new Set());

      useEffect(
        () => () => {
          for (const id of retryTimers.current) clearTimeout(id);
          retryTimers.current.clear();
        },
        [],
      );

      /** Retire pre-`cwd` blank board Sessions exactly once per page session. */
      const legacyBlankCleanup = useRef(false);

      useEffect(() => {
        if (legacyBlankCleanup.current || store.document === null) return;
        const ctx = pluginContext;
        if (ctx === null || ctx === undefined) return;
        const workspaces = ctx.get('workspaces');
        const workspaceSnapshot = workspaces?.list?.getSnapshot?.();
        if (!Array.isArray(workspaceSnapshot?.items) || workspaceSnapshot.items.length === 0) return;
        const sessions = ctx.get('sessions');
        if (sessions?.list?.getSnapshot?.()?.byId === undefined) return;
        legacyBlankCleanup.current = true;
        retireLegacyBlankBoardSessions(ctx, store.current()).catch(() => {
          /* a failed cleanup only leaves an old blank Session for the next open */
        });
        // The workspace snapshot becomes ready after the first paint; a later
        // document change is not needed to retry because the flag stays false
        // until both services have a usable snapshot.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [document, sessionSummaries]);

      useEffect(() => {
        let cancelled = false;
        // A forced read: the page is mounted fresh when the user opens the
        // workbench, which is exactly when another browser (or Settings) may have
        // written. A cached document is what paints first, but the answer that
        // replaces it is the Host's.
        store.load({ force: true }).then(async () => {
          if (cancelled) return;
          if (store.document === null) {
            setFailure(fill(t('error.generic'), { message: store.error }));
            setStatus('error');
            return;
          }
          // `store.adopt` already adopted the Session map before this resolves,
          // so the header ticket is ready before the first paint.
          // Legacy chat folders carry sub-boards that Settings stamped with the
          // generic standard default. Persist the parent's chat choice before the
          // first conversation can be started from one of them.
          const migrated = normalizeChatSubBoards(store.current());
          if (migrated !== null) {
            try {
              await store.save(migrated);
            } catch {
              /* the next open retries the repair */
            }
          }
          if (cancelled) return;
          setStatus('ready');
          // The panel is mounted by the shell's navigation, so this is the moment
          // the workbench became the surface: fold the sidebar once, here.
          foldSidebar();
        });
        return () => {
          cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      // A board or child deleted in another tab destroys the snapshot the
      // surface page was opened from. Return to the ledger instead of leaving
      // the page addressing a dead board key no save could ever write back to.
      useEffect(() => {
        if (view === null) return;
        const boards = Array.isArray(document.boards) ? document.boards : [];
        const board = boards.find((item) => item !== null && typeof item === 'object' && item.id === view.boardId);
        if (board === undefined) {
          setView(null);
          return;
        }
        if (view.childId === '') return;
        const child = (Array.isArray(board.children) ? board.children : []).find(
          (item) => item !== null && typeof item === 'object' && item.id === view.childId,
        );
        if (child === undefined) setView(null);
      }, [view, document]);

      /**
       * Open a line.
       *
       * A surface board (待办/笔记) opens its own page and creates nothing: a
       * to-do board should not leave an empty conversation behind every time it
       * is looked at. Every other board goes through the resilient Session
       * opener, so a recorded Session that no longer exists still heals.
       */
      const openCard = (board, child, intent) => {
        const kind = child === undefined ? board.kind : child.kind;
        if (kind === 'todo' || kind === 'note') {
          // Store ids, not the board objects from this render: a document
          // reload (or a rename in another tab) replaces those objects, and a
          // surface page must follow the live document rather than a snapshot.
          setView({ boardId: board.id, childId: child === undefined ? '' : child.id });
          return Promise.resolve();
        }
        // A conversation is read beside the Session list, so the sidebar comes
        // back before the Session opens: the ledger folded it, the chat needs it.
        unfoldSidebar();
        return openBoardResilient(pluginContext, board, child, intent === 'new' ? { fresh: true } : undefined);
      };

      /**
       * Open one recorded Session from a sub-board's session list.
       *
       * A recorded id can be archived or missing, and `uiWorkspace.openSession`
       * would silently fall through to the workspace chooser. The dead id is
       * removed from the board's record instead, and the caller hears why.
       */
      const openRecorded = async (board, child, sessionId) => {
        const key = boardKeyOf(board, child);
        if (sessionUnavailable(pluginContext, sessionId)) {
          if (boardSessions.get(key) === sessionId) boardSessions.delete(key);
          sessionLabels.delete(sessionId);
          notifyLabels();
          forgetSession(key, sessionId);
          throw new Error(t('session.gone'));
        }
        sessionLabels.set(sessionId, boardLabel(board, child));
        notifyLabels();
        const uiWorkspace = pluginContext === null ? undefined : pluginContext.get('uiWorkspace');
        if (uiWorkspace === undefined || uiWorkspace === null || typeof uiWorkspace.openSession !== 'function') {
          throw new Error(t('error.sessionsUnavailable'));
        }
        // Pre-workspace builds recorded `cwd`-only Sessions. Registering the
        // board's working area gives the shell a Workspace for that path; the
        // exact Session is then selected by id below. `insertSessionBefore`
        // cannot be used here: it only reorders Sessions already accounted by
        // a Workspace and rejects a `cwd`-only id as `workspace/move-invalid`.
        const workspacePath = await ensureDirectory(board);
        if (workspacePath !== undefined) await ensureWorkspace(pluginContext, workspacePath);
        uiWorkspace.openSession(sessionId);
        // Open the conversation first, then reveal the sidebar on the next
        // paint. Toggling the sidebar in front of `openSession` made the return
        // key wait for a shell layout change before the Chat painted.
        scheduleAfterPaint(unfoldSidebar);
        return sessionId;
      };

      /**
       * Whether the shell's sidebar is currently collapsed.
       *
       * 0.2.2 publishes `data-sidebar-collapsed` on the frame that owns the
       * columns, so the state comes from the shell rather than a hashed class
       * name. The geometry fallback keeps an older shell usable.
       * @returns true / false, or null when no shell can be read.
       */
      const sidebarCollapsed = () => {
        try {
          const dom = typeof globalThis !== 'undefined' && globalThis.document ? globalThis.document : null;
          if (dom === null || typeof dom.querySelector !== 'function') return null;
          // The frame's overlay layer is the one whose parent owns the shell
          // columns; a page may reuse the attribute for its own overlay.
          const overlays = dom.querySelectorAll('[data-shell-overlay]');
          for (let index = overlays.length - 1; index >= 0; index -= 1) {
            const frame = overlays[index].parentElement;
            if (frame === null) continue;
            let shellFrame = false;
            for (const child of frame.children) {
              if (typeof child.className === 'string' && child.className.includes('sidebarCol')) {
                shellFrame = true;
                break;
              }
            }
            if (shellFrame && typeof frame.hasAttribute === 'function') {
              return frame.hasAttribute('data-sidebar-collapsed');
            }
          }
          const sidebar = dom.querySelector('[class*="sidebarCol"], aside, nav');
          if (sidebar === null) return null;
          return (
            /[a-z0-9_]collapsed/i.test(String(sidebar.className)) ||
            sidebar.getBoundingClientRect().width < 120
          );
        } catch {
          // Shell chrome is an enhancement; a detached or replaced frame must
          // not turn opening a board into an uncaught exception.
          return null;
        }
      };

      /**
       * Fold the sidebar away when this panel is the surface being used.
       *
       * The workbench is a wide two-column page and the shell's sidebar costs it
       * 280px of a 1440px window; the shell already treats its own rail as the
       * resting state for a surface that fills the frame. `layout.toggleSidebar()`
       * only toggles, so the state is read first — opening the workbench on an
       * already-folded sidebar must leave it folded, never expand it.
       */
      const foldSidebar = () => {
        try {
          const layout = pluginContext === null ? undefined : pluginContext.get('layout');
          if (layout === undefined || layout === null || typeof layout.toggleSidebar !== 'function') return;
          const collapsed = sidebarCollapsed();
          if (collapsed === null || collapsed) return;
          layout.toggleSidebar();
        } catch {
          // A shell without a readable sidebar is still a usable workbench.
        }
      };

      /**
       * Bring the sidebar back.
       *
       * The mirror of {@link foldSidebar}, and the same rule inverted: only touch
       * it when it IS collapsed, because `toggleSidebar()` does not know which
       * state it is leaving.
       */
      const unfoldSidebar = () => {
        try {
          const layout = pluginContext === null ? undefined : pluginContext.get('layout');
          if (layout === undefined || layout === null || typeof layout.toggleSidebar !== 'function') return;
          if (sidebarCollapsed() !== true) return;
          layout.toggleSidebar();
        } catch {
          // Opening the conversation remains the primary action even if the
          // shell's sidebar service is temporarily unavailable.
        }
      };

      /** Run the shell-side reveal after the conversation has painted. */
      const scheduleAfterPaint = (callback) => {
        const schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 0);
        return schedule(callback);
      };

      /**
       * Open the Session chosen by the latest-return control.
       *
       * The exact previous Session has no board label: it may be an ordinary
       * Session opened outside the workbench. A recorded board Session goes
       * through `openRecorded`, so its label and dead-id cleanup stay intact.
       * @param target - the target returned by `latestReturnTarget`.
       * @returns the opened Session id.
       */
      const openLatestSession = (target) => {
        if (target === undefined) return Promise.reject(new Error(t('shelf.noRecent')));
        if (target.source === 'current') {
          const layout = pluginContext === null ? undefined : pluginContext.get('layout');
          if (layout !== undefined && layout !== null && typeof layout.selectPanel === 'function') {
            // The mainView reference already owns this Session: switching the
            // panel is enough, and it avoids redoing the open that
            // `uiWorkspace.openSession` performs. Unfold after the switch so
            // the conversation paints first.
            layout.selectPanel(null);
            scheduleAfterPaint(unfoldSidebar);
            return Promise.resolve(target.id);
          }
          unfoldSidebar();
          const uiWorkspace = pluginContext === null ? undefined : pluginContext.get('uiWorkspace');
          if (uiWorkspace === undefined || uiWorkspace === null || typeof uiWorkspace.openSession !== 'function') {
            throw new Error(t('error.sessionsUnavailable'));
          }
          uiWorkspace.openSession(target.id);
          return Promise.resolve(target.id);
        }
        return openRecorded(target.board, target.child, target.id);
      };

      /**
       * Open this plugin's own Settings section.
       *
       * The ledger's 配置 control is a real shortcut to configuration: the section
       * is a shipped settings page, so the truthful way to show it is the
       * product's own settings route rather than a second, invented panel. The
       * app opens Settings from the account menu, so that is the control pressed.
       *
       * The row is matched by its LEADING WORD ONLY, without a trailing word
       * boundary: after a CJK character there is no boundary to find, so
       * /^(设置|Settings)\b/ matched nothing and the control silently did nothing.
       * The menu is a portal that mounts a frame later, so the lookup retries.
       * When the shell offers no account menu at all, the control says so instead
       * of failing silently.
       */
      const openSettings = () => {
        setConfigureFailed('');
        // A second click while the portal is still mounting must not leave the
        // first retry chain running beside the new one: both would dispatch the
        // account-menu sequence and fight over the same dialog.
        for (const id of retryTimers.current) clearTimeout(id);
        retryTimers.current.clear();
        try {
          /**
           * Read the DOM through the global explicitly.
           *
           * `typeof document !== 'undefined'` followed by `document.querySelector`
           * was enough to be true and not enough to be usable: the check passed and
           * the next line reported no document. Every read below goes through one
           * object that was actually verified.
           */
          const dom = typeof globalThis !== 'undefined' && globalThis.document ? globalThis.document : null;
          if (dom === null || typeof dom.querySelector !== 'function') {
            setConfigureFailed(t('ledger.configureUnavailable'));
            return;
          }
          /** One short retry that is cancelled if the page unmounts first. */
          const later = (callback, delay) => {
            const id = setTimeout(() => {
              retryTimers.current.delete(id);
              callback();
            }, delay);
            retryTimers.current.add(id);
          };
          const trigger =
            dom.querySelector('[aria-label="账号菜单"]') ??
            dom.querySelector('[aria-label="Account menu"]') ??
            dom.querySelector('[aria-label="Account"]') ??
            dom.querySelector('[data-testid="account-menu"]');
          if (trigger === null || typeof trigger.dispatchEvent !== 'function') {
            setConfigureFailed(t('ledger.configureUnavailable'));
            return;
          }

          /**
           * Press the trigger the way a pointer does.
           *
           * `el.click()` calls the element's own click handler, but this button is
           * a POPPER: it opens its menu from the pointer sequence, and a synthetic
           * `click()` alone leaves it closed. Measured in the running app, not
           * assumed.
           */
          trigger.focus?.();
          for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
            const Ctor = type.startsWith('pointer') && typeof PointerEvent === 'function' ? PointerEvent : MouseEvent;
            trigger.dispatchEvent(
              new Ctor(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0,
                buttons: type.endsWith('down') ? 1 : 0,
                pointerType: 'mouse',
                isPrimary: true,
              }),
            );
          }

          /**
           * Find the settings row.
           *
           * The row's own text is 设置 followed by its shortcut hint, laid out as
           * separate lines, so:
           *   - `textContent` collapses the row to 设置Ctrl+Alt+, and splitting THAT
           *     on a newline never yields a bare 设置;
           *   - `innerText` keeps the lines, so its FIRST line is the label.
           * The menu is a portal that mounts after the trigger's press is
           * processed, so the lookup is a deadline-bounded poll: a slow first frame
           * must not end the attempt early.
           */
          const deadline = Date.now() + 2000;
          const attempt = () => {
            // A timer callback is outside the openSettings try/catch; a
            // detached portal or a selector refused by an old WebView must
            // report the shortcut as unavailable rather than become an
            // uncaught exception.
            try {
              const rows = [...dom.querySelectorAll('[role="menuitem"], [role="menu"] button, [role="menu"] a')];
              const row = rows.find((node) => {
                const rendered = ((node.innerText ?? '').split('\n')[0] ?? '').trim();
                if (/^(设置|Settings)$/i.test(rendered)) return true;
                const flat = (node.textContent ?? '').trim();
                return /^(设置|Settings)(Ctrl|⌘|Control|Alt|Shift|$)/i.test(flat);
              });
              if (row !== undefined && typeof row.click === 'function') {
                row.click();
                selectSection();
                return;
              }
              if (Date.now() < deadline) later(attempt, 60);
              else setConfigureFailed(t('ledger.configureUnavailable'));
            } catch {
              setConfigureFailed(t('ledger.configureUnavailable'));
            }
          };

          /**
           * Land on THIS plugin's section.
           *
           * Settings opens on whatever section it last showed, so a shortcut that
           * stopped there would send the user to the wrong page. The panel's own nav
           * row is pressed by its label; the row is read from the dialog, because
           * the sidebar carries the same label and is not the one to press.
           */
          const selectSection = () => {
            const until = Date.now() + 2500;
            const label = t('settings.nav');
            const step = () => {
              try {
                const dialog = dom.querySelector('[role="dialog"]');
                if (dialog !== null) {
                  const row = [...dialog.querySelectorAll('button, [role="tab"], a')].find(
                    (node) => (node.textContent ?? '').trim() === label,
                  );
                  if (row !== undefined && typeof row.click === 'function') {
                    row.click();
                    return;
                  }
                }
                if (Date.now() < until) later(step, 70);
                else setConfigureFailed(t('ledger.configureUnavailable'));
              } catch {
                setConfigureFailed(t('ledger.configureUnavailable'));
              }
            };
            // The panel mounts before its nav has a selected row; starting on the
            // next tick keeps the first attempt from reading an empty dialog.
            later(step, 0);
          };

          later(attempt, 0);
        } catch (problem) {
          // A shortcut may never cost the ledger: a refused step reports itself and
          // the page stays usable.
          setConfigureFailed(t('ledger.configureUnavailable'));
        }
      };

      if (pageStatus === 'loading') {
        return h('div', { className: 'wb_page' }, h('div', { className: 'wb_empty' }, t('common.loading')));
      }
      if (pageStatus === 'error') {
        return h('div', { className: 'wb_page' }, h('div', { className: 'wb_empty' }, failure || t('common.error')));
      }

      if (view !== null) {
        const boards = Array.isArray(document.boards) ? document.boards : [];
        const board = boards.find((item) => item !== null && typeof item === 'object' && item.id === view.boardId);
        if (board !== undefined) {
          const child =
            view.childId === ''
              ? undefined
              : (Array.isArray(board.children) ? board.children : []).find(
                  (item) => item !== null && typeof item === 'object' && item.id === view.childId,
                );
          if (view.childId === '' || child !== undefined) {
            const kind = child === undefined ? board.kind : child.kind;
            const title = child === undefined ? board.name : `${board.name} / ${child.name}`;
            const back = () => setView(null);
            const boardKey = boardKeyOf(board, child);
            if (kind === 'todo') {
              return h(TodoPage, { t, boardKey, title, onBack: back });
            }
            if (kind === 'note') {
              return h(NotePage, { t, boardKey, title, onBack: back });
            }
          }
        }
      }

      return h(LedgerPage, {
        t,
        document,
        // A click opens the board's own page (待办/笔记); the ledger never opens a
        // conversation from a main board. A sub-board's right-click starts one,
        // and a recorded session line opens that exact Session.
        onOpen: (board, child) => openCard(board, child),
        onOpenSession: openRecorded,
        onNewTalk: (board, child) => openCard(board, child, 'new'),
        onConfigure: openSettings,
        onReturnLatest: openLatestSession,
        notice: configureFailed,
      });
    }

    const inject = ['slots', 'locale'];

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'workbench: dictionaries');
      const bind = () => {
        translateFn = ctx.locale.bind(NS);
      };
      bind();
      ctx.effect(
        () =>
          ctx.locale.subscribe(() => {
            bind();
            localeVersion += 1;
            for (const listener of localeListeners) {
              try {
                listener();
              } catch {
                /* one mounted view must not stop the rest from relabelling */
              }
            }
          }),
        'workbench: locale binding',
      );

      // One stylesheet for the panel; removing the tag unloads every rule. The
      // Shelf palette is committed here; the shell's typography and focus ring
      // are inherited so the workbench still belongs to the Harness.
      ctx.effect(() => {
        const doc = typeof document === 'undefined' ? null : document;
        // The client module can be evaluated before the document head exists;
        // leave the page unstyled rather than failing every slot registration.
        const head = doc === null ? null : (doc.head ?? doc.documentElement ?? null);
        if (doc === null || head === null || typeof head.append !== 'function') return () => {};
        const tag = doc.createElement('style');
        tag.dataset.plugin = '@local/dsh-workbench';
        tag.textContent = CSS;
        head.append(tag);
        return () => {
          tag.remove();
        };
      }, 'workbench: stylesheet');

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: PANEL_ORDER,
            locale: NS,
            label: () => translate()('panel'),
          },
          WorkbenchIcon,
        ),
      );

      // The panel renders the ledger. The plugin context is handed over through a
      // module-level binding rather than a per-render wrapper, so the registered
      // component is a stable component identity (a fresh closure every render
      // would remount the subtree and lose the loaded document).
      pluginContext = ctx;
      ctx.effect(
        () => () => {
          if (pluginContext === ctx) pluginContext = null;
        },
        'workbench: plugin context',
      );
      ctx.slots.inject('main', () =>
        ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID,
            locale: NS,
          },
          WorkbenchPage,
        ),
      );

      // ── the board ticket ───────────────────────────────────────────────────
      //
      // A header ACTION, added beside the shipped entries rather than replacing
      // one. `order: 0` puts it after the agent-preset chip (which is `-10`) and
      // before the subagent catalog (`10`), which is exactly the "right of the
      // mode label" position. The chip, the title and every other shipped control
      // are untouched; this merely adds a ticket naming the sub-board, or the
      // main board when the Session sits on the board itself.
      ctx.slots.inject('conversation.session.header.actions', () =>
        ctx.slots.register(
          {
            name: 'conversation.session.header.actions',
            id: 'workbench-board-label',
            order: 0,
            locale: NS,
          },
          BoardLabelAction,
        ),
      );

      // ── the same-sub-board new-conversation key ─────────────────────────────
      //
      // The label tells the reader which sub-board the current Session belongs
      // to; this adjacent key starts another Session under that SAME key without
      // sending them back to the shelf. It is a separate registration so a
      // Session whose board was deleted keeps the label's own hiding rule while
      // the key simply does not render.
      ctx.slots.inject('conversation.session.header.actions', () =>
        ctx.slots.register(
          {
            name: 'conversation.session.header.actions',
            id: 'workbench-new-session',
            order: 1,
            locale: NS,
          },
          NewSessionAction,
        ),
      );

      // ── the settings section and its navigation glyph ──────────────────────
      //
      // 0.2.2 exposes `settings.section.icon` as a real registration seat: the
      // shell owns the row and its default gear, and an icon registered under
      // the same id replaces only the glyph. `order: 12` sits in the gap the
      // shipped sections leave: 模型 (`models`) is 10 and 内置插件 (`plugins`)
      // is 15.
      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          {
            name: 'settings.section',
            id: 'workbench',
            order: 12,
            locale: NS,
            label: () => translate()('settings.nav'),
          },
          WorkbenchSettings,
        ),
      );
      ctx.slots.inject('settings.section.icon', () =>
        ctx.slots.register(
          {
            name: 'settings.section.icon',
            id: 'workbench',
            order: 12,
          },
          WorkbenchIcon,
        ),
      );

      // ── the reminder toasts ────────────────────────────────────────────────
      //
      // `shell.overlay` is the frame-wide floating layer, above every column: a
      // reminder that lived inside the workbench panel would only exist while
      // that panel was the one on screen, which is exactly when it is least
      // needed. The entry draws nothing until a reminder comes due.
      ctx.slots.inject('shell.overlay', () =>
        ctx.slots.register(
          {
            name: 'shell.overlay',
            id: 'workbench-reminders',
            order: 0,
            locale: NS,
          },
          ReminderToasts,
        ),
      );

      // One clock, one comparison. Twenty seconds is fine-grained enough that a
      // 18:00 reminder is never more than a moment late and cheap enough that a
      // page left open all day costs nothing: the scan reads the cached document
      // and returns immediately when nothing is due.
      //
      // Every fifth beat ALSO re-reads the document from the Host. A reminder the
      // user set yesterday, or on another machine, lives only in the durable
      // document — a clock that only ever compared against this tab's local cache
      // would never see it, which is exactly "the reminder does not work".
      //
      // The interval comes from the harness timer when the deployment exposes
      // one, so it is disposed with this effect rather than outliving the plugin;
      // a bare interval is the fallback for a client without that service.
      ctx.effect(() => {
        const timers = ctx.get('timer');
        const schedule = (callback, delay) => {
          if (timers !== undefined && timers !== null && typeof timers.interval === 'function') {
            try {
              return timers.interval(callback, delay);
            } catch {
              /* an unusable timer service falls through to the platform clock */
            }
          }
          if (typeof setInterval !== 'function') return () => {};
          const id = setInterval(callback, delay);
          return () => clearInterval(id);
        };
        let beat = 0;
        const tick = () => {
          beat += 1;
          // A re-read is a Host round trip, so it happens on a slow beat; every
          // other beat is a pure local comparison.
          const fresh = beat % 5 === 1;
          scanReminders(Date.now(), { fresh }).catch(() => {});
        };
        const stop = schedule(tick, 20000);
        // The first scan runs as soon as the document exists, so a reload with a
        // reminder that came due while the page was closed still announces it —
        // once, because the acknowledgement writes back the stamp that fired.
        let primed = false;
        const onDocument = () => {
          if (primed) return;
          primed = true;
          scanReminders(Date.now()).catch(() => {});
        };
        store.listeners.add(onDocument);
        if (store.document !== null) onDocument();
        return () => {
          stop();
          store.listeners.delete(onDocument);
        };
      }, 'workbench: reminder clock');

      // ── cross-tab document sync ────────────────────────────────────────────
      //
      // Each WebGUI tab has its own Client module and its own `store` cache.
      // When one tab commits a whole-document POST, the others must re-read it
      // before their next edit; otherwise an older cache overwrites the newer
      // document. The channel is only a signal, so no state is trusted from it.
      ctx.effect(() => {
        const channel = openDocumentChannel();
        if (channel === null) return () => {};
        documentChannel = channel;
        const onMessage = (event) => {
          if (event?.data?.type !== 'saved' || event?.data?.tag === documentChannelTag) return;
          store.load({ force: true }).catch(() => {
            /* another tab's write is best-effort until the next load succeeds */
          });
        };
        channel.addEventListener('message', onMessage);
        return () => {
          channel.removeEventListener('message', onMessage);
          // The channel belongs to this effect, so a plugin unload or HMR
          // replacement must close exactly its own instance and leave the
          // module-level binding empty for the next apply().
          if (documentChannel === channel) documentChannel = null;
          try {
            channel.close();
          } catch {
            /* an already-closed channel is harmless */
          }
        };
      }, 'workbench: cross-tab document sync');

      // ── the saved document, adopted before the first header ────────────────
      //
      // A workbench Session opened straight from the sidebar never mounts the
      // panel above, so waiting for that panel to load the document left the
      // board ticket beside the mode chip empty. Adopt the saved document once
      // here instead; both pages re-adopt it when they open, which is idempotent.
      ctx.effect(() => {
        // `store.adopt` keeps the Session map in step with the document, so a
        // successful load needs no second adoption pass here.
        store.load().catch(() => {
          /* an unreadable document simply has no saved Sessions to adopt */
        });
        return () => {};
      }, 'workbench: saved document');
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
