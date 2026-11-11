/**
 * Workbench Host half.
 *
 * Owns everything the browser half cannot own by itself:
 *   - the durable workbench document (boards, prompts, todos, notes, each
 *     board's skill switches and remembered model selection),
 *   - the installed skill catalog read from the user's skill directories,
 *   - the working area a board's Session is scoped to,
 *   - the per-Session instruction a board contributes, folded from its fixed
 *     prompt and the bodies of its enabled skills.
 *
 * A board is a real DSH Session, so the transcript and composer belong to the
 * shipped conversation UI. This half stores the board's default model selection
 * (used only when a new conversation is created), answers the document, working
 * area and skill catalog, and contributes the pinned instruction. It never
 * writes the deployment-wide default model.
 *
 * The browser half talks to these routes over the same authenticated origin
 * the Web GUI itself uses; `connection.requestRejection` applies the host's
 * own trust fence to every request.
 *
 * No harness package is imported here on purpose: a profile-installed bundle
 * resolves its own bare imports from its own location, so the Host half stays
 * on node: builtins and reaches harness capabilities through Cordis services.
 * @module @local/dsh-workbench
 */

import { lstat, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { extname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** Services this plugin needs before it can serve anything. */
const inject = ["webServer", "connection"];

/** Route prefix owned by this plugin. */
const API_PREFIX = "/workbench/api";
/** Self-hosted type assets, served beside the API so no external CDN is needed. */
const FONT_PREFIX = "/workbench/fonts";
/** The bundled font directory, resolved from this module rather than cwd. */
const FONT_ROOT = fileURLToPath(new URL("./fonts/", import.meta.url));
/** Response types the font route may serve. */
const FONT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".woff2", "font/woff2"],
]);
/** Largest asset served from the font route; the bundled files are all < 120 KB. */
const MAX_FONT_BYTES = 4 * 1024 * 1024;
/** Largest JSON body accepted from the browser. */
const MAX_BODY_BYTES = 32 * 1024 * 1024;
/** Largest durable document read from disk; keeps a hand-inflated file from exhausting Host memory. */
const MAX_STATE_BYTES = MAX_BODY_BYTES;
/** Longest working-area path accepted anywhere. */
const MAX_WORKSPACE_PATH = 2048;
/** Characters of skill text folded into one request. */
const MAX_SKILL_CHARS = 120_000;
/** Characters of selected prompt text folded into one request. */
const MAX_PROMPT_CHARS = 120_000;
/** Characters of one skill body retained. */
const MAX_SKILL_BODY = 60_000;
/** Bytes of one SKILL.md read; a skill is instructions, not an attachment. */
const MAX_SKILL_FILE = 256_000;
/** Bounds on the structural collections a document may carry. */
const MAX_BOARDS = 200;
const MAX_CHILDREN_PER_BOARD = 100;
const MAX_PROMPTS = 200;
const MAX_SKILLS = 200;
/** Longest id/name/text a board, prompt or record may carry. */
const MAX_ID = 200;
const MAX_BOARD_NAME = 120;
const MAX_PROMPT_NAME = 120;
const MAX_PROMPT_TEXT = 60_000;
/** Records retained per board, and the largest text one may carry. */
const MAX_TODOS_PER_BOARD = 500;
const MAX_NOTES_PER_BOARD = 500;
const MAX_TODO_TITLE = 200;
const MAX_TODO_NOTE = 4000;
const MAX_NOTE_TITLE = 200;
const MAX_NOTE_BODY = 20_000;
const MAX_NOTE_TAGS = 8;
/** Priorities and blocks a record may carry; anything else is normalised. */
const PRIORITIES = new Set(["high", "normal", "low"]);
const NOTE_BLOCKS = new Set(["idea", "note"]);

/** Board modes this plugin understands. */
const MODES = new Set(["chat", "standard"]);
/**
 * Agent presets a board may record. `workbench-chat` belongs only to a chat
 * branch; the other four are the built-in presets a conversation board may
 * choose for its next Session.
 */
const AGENT_PRESETS = new Set(["workbench-chat", "standard", "ptc", "minimal", "cordis"]);
/**
 * Keys that would collide with JavaScript object internals when a board id is
 * used as an object key. The plugin generates its own ids, but a hand-edited
 * document must not be able to turn a settings/todo map into a prototype.
 */
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/**
 * The agent preset a plain-chat board runs under.
 *
 * Kept here as well as in the bundle patch because the Host half has to recognise
 * a chat Session by its preset — a Session is created and composed before its id
 * reaches the workbench document, so at `agent/created` time the preset is the
 * only signal available.
 */
const CHAT_PRESET = "workbench-chat";

/**
 * Document format written by this build.
 *
 * Version 5 lets one board select several prompts: `settings[key].promptIds`
 * is an ordered list instead of version 4's single `promptId`, which still reads
 * as a one-item list during normalization. Version 4 let one board own several
 * conversations: `sessions` maps a board key to a newest-first list of Session
 * ids. Version 3 moved board configuration out of the workbench surface and into
 * Settings. Older documents are still readable — normalization upgrades them in
 * place.
 */
const DOCUMENT_VERSION = 5;

/** Conversations retained per board, newest first. */
const MAX_SESSIONS_PER_BOARD = 40;

/**
 * Which mode a board gets when the stored document says nothing.
 *
 * The plain chat board is the only one that starts as `chat`; every other board
 * and every sub-board starts as `standard`, using DeepSeek Harness's native prompt.
 * @param id - stored board id.
 * @param name - stored board name.
 * @param isChild - whether this is a sub-board.
 * @returns the mode to persist.
 */
function defaultMode(id, name, isChild) {
  if (isChild) return "standard";
  return isChatBoardIdentity(id, name) ? "chat" : "standard";
}

/** Whether a board id/name identifies the locked plain-chat volume. */
function isChatBoardIdentity(id, name) {
  return id === "chat" || name === "聊天";
}

/** The mode to use for a stored value, falling back to the seeded default. */
function modeOf(value, id, name, isChild) {
  // The chat volume owns its whole branch: it cannot be turned into a PTC or
  // creative board by a hand-edited document, because its subtrees inherit
  // `chat` and the browser suppresses tools there.
  if (!isChild && isChatBoardIdentity(id, name)) return "chat";
  return typeof value === "string" && MODES.has(value) ? value : defaultMode(id, name, isChild);
}

/** The preset a board starts with when it has no explicit selection. */
function defaultAgentPreset(mode) {
  return mode === "chat" ? CHAT_PRESET : "standard";
}

/**
 * Resolve one stored agentPreset against the board mode.
 *
 * A chat board may only run `workbench-chat`; a standard board may choose one
 * of the four built-in presets. The default is omitted from the stored document
 * so an untouched workbench keeps byte-identical state.
 */
function agentPresetOf(value, mode) {
  if (mode === "chat") return CHAT_PRESET;
  return typeof value === "string" && AGENT_PRESETS.has(value) && value !== CHAT_PRESET ? value : "standard";
}

/**
 * The workbench document a fresh install starts from: the five named boards,
 * with sub-boards on the two boards that suggest a workflow, one seeded
 * prompt library, and no selected system prompt anywhere.
 *
 * Only the plain chat board starts in `chat` mode (no instruction at all);
 * every other board and sub-board starts in `standard` mode.
 * @returns a new document.
 */
function initialDocument() {
  const board = (id, name, kind, children = [], enName = "") => ({
    id,
    name,
    enName,
    kind,
    mode: defaultMode(id, name, false),
    children: children.map((child) => ({
      ...child,
      kind: child.kind ?? "chat",
      mode: defaultMode(child.id, child.name, true),
    })),
  });
  return {
    version: DOCUMENT_VERSION,
    // The shared default working area. A main board may override it in Settings;
    // empty means "use the product default".
    workspace: "",
    boards: [
      board("chat", "聊天", "chat", [], "CHAT / CONVERSATION"),
      board("docs", "文档处理", "chat", [
        { id: "docs-read", name: "文档精读" },
        { id: "docs-rewrite", name: "文档改写" },
      ], "DOCS / PROCESSING"),
      board("media", "媒体创作", "chat", [
        { id: "media-copy", name: "文案脚本" },
        { id: "media-visual", name: "配图分镜" },
      ], "MEDIA / CREATION"),
      board("todos", "待办任务", "todo", [], "TODO / TASKS"),
      board("notes", "灵感笔记", "note", [], "NOTES / IDEAS"),
    ],
    prompts: [
      {
        id: "prompt-concise",
        name: "简洁直接",
        text: "请用简洁、直接的中文回答。先给结论，再补充必要的理由；不要重复我的问题，不要罗列无关的注意事项。",
      },
      {
        id: "prompt-polish",
        name: "中文润色",
        text: "你是一位中文编辑。请在保持原意和事实的前提下改写我给出的文字，让它更通顺、更准确、更符合书面表达习惯。只输出改写后的文字，并用三行以内的要点说明主要改动。",
      },
    ],
    todos: {},
    notes: {},
    settings: {},
    sessions: {},
  };
}

/**
 * The default working area for every workbench board.
 *
 * DSH calls this a Workspace: a directory that sessions are scoped to, so the
 * agent can read and write real files there. The workbench is for ordinary
 * work rather than coding, so it gets its own directory instead of reusing a
 * code checkout. Settings can point it somewhere else; this is what an
 * untouched workbench uses, and the value the browser half falls back to.
 */
const DEFAULT_WORKSPACE = "E:\\DeepseekHarness\\工作台";

/** Resolve the harness home the same way every other DSH process does. */
function harnessHome() {
  const configured = process.env.DSH_HOME;
  if (typeof configured === "string" && configured.length > 0) return configured;
  return join(homedir(), ".dsh");
}

/** Directory holding this plugin's durable files. */
function workbenchDirectory() {
  return join(harnessHome(), "workbench");
}

/** Path of the durable workbench document. */
function documentPath() {
  return join(workbenchDirectory(), "state.json");
}

/** Whether a value is a plain non-array object. */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A trimmed string, or the fallback. */
function text(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

/**
 * A calendar day (`YYYY-MM-DD`), or "" when the value is not a real date.
 *
 * The editor only writes this shape, but the document is a plain JSON file a
 * user can edit. Keeping an impossible date would make every comparison,
 * including "overdue", depend on malformed text; the record keeps an empty
 * date instead.
 * @param value - a candidate day.
 * @returns the day, or "".
 */
function dayStampOf(value) {
  const candidate = text(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(candidate);
  if (match === null) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day ? candidate : "";
}

/**
 * A local minute stamp (`YYYY-MM-DDTHH:mm`, optionally seconds), or "".
 * @param value - a candidate reminder stamp.
 * @returns the normalized stamp, or "".
 */
function minuteStampOf(value) {
  const candidate = text(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(candidate);
  if (match === null) return "";
  if (dayStampOf(`${match[1]}-${match[2]}-${match[3]}`).length === 0) return "";
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] === undefined ? 0 : Number(match[6]);
  if (hour > 23 || minute > 59 || second > 59) return "";
  return candidate;
}

/**
 * Whether a local absolute path has a Windows path hazard.
 *
 * The drive/root is deliberately skipped before checking the reserved
 * characters, so `C:\...` / `C:/...` stay valid while a colon, wildcard or
 * quote in a later segment is refused. A trailing dot or space is refused
 * because Windows silently drops it: the stored value would then name a
 * different directory from the one `mkdir`/`resolve` actually creates.
 * @param value - an absolute local path.
 * @returns whether the path should be refused.
 */
function hasWindowsPathHazard(value) {
  // Only a drive prefix is skipped before checking reserved characters. Do not
  // blindly slice two characters: a rooted path such as `/work` would otherwise
  // lose its first two real characters from the forbidden-character check.
  const tail = /^[A-Za-z]:/.test(value) ? value.slice(2) : value;
  // Windows drops a trailing dot/space from ANY segment, not only the last
  // one, so `C:\foo.\bar` and `C:\foo \bar` would name different directories
  // from the string stored in the document. `.` and `..` are navigation
  // segments, not literal names, and stay legal — including at the end.
  const segments = tail.split(/[\\/]+/);
  if (segments.some((segment) => segment.length > 0 && segment !== "." && segment !== ".." && /[. ]$/.test(segment))) {
    return true;
  }
  return /[<>:"|?*\x00-\x1f\x7f]/.test(tail);
}

/**
 * A stored workspace value, or "" when it is not usable.
 *
 * A stored value is trusted only when it is an absolute local path: a relative one
 * would silently resolve against whatever directory the Host happens to run in,
 * which is exactly the kind of accidental location this setting exists to
 * prevent. A UNC path is rejected too: it names a directory on another machine,
 * and resolving it would open an outbound SMB connection from a plain document
 * read. Both checks sit here, in normalization, so the state route and a
 * hand-edited file cannot bypass the validation the Settings route performs.
 * @param value - the stored `workspace` field.
 * @returns the absolute local path, or "" when the value is not usable.
 */
function workspacePathOf(value) {
  const stored = text(value).trim();
  return stored.length > 0 &&
    stored.length <= MAX_WORKSPACE_PATH &&
    // A NUL truncates a native path; the other C0 controls and DEL are not
    // legal Windows path characters either, so a stored value carrying one is
    // rejected rather than handed to mkdir/resolve.
    !/[\x00-\x1f\x7f]/.test(stored) &&
    isAbsolute(stored) &&
    !/^[\\/]{2}/.test(stored) &&
    !hasWindowsPathHazard(stored)
    ? stored
    : "";
}

/**
 * The working area a document names, or the product default.
 * @param value - the stored `workspace` field.
 * @returns an absolute local path.
 */
function workspaceOf(value) {
  return workspacePathOf(value) || DEFAULT_WORKSPACE;
}

/**
 * Normalize one to-do record.
 *
 * The browser half is the only writer, but the document is a plain JSON file a
 * user can edit, so the shape every reader assumes is imposed here: a stable id,
 * a bounded title and note, a boolean done, a known priority, and the three date
 * fields as strings. An unknown field is dropped rather than stored.
 *
 * `remindedAt` is deliberately NOT validated against `remindAt`: it records which
 * reminder stamp has already been announced, and a mismatch is exactly how a
 * changed reminder becomes a new one.
 * @param raw - one stored record.
 * @returns the record, or undefined when it carries no identity.
 */
function todoRecordOf(raw) {
  if (!isRecord(raw)) return undefined;
  const id = text(raw.id).trim();
  if (id.length === 0 || id.length > MAX_ID) return undefined;
  const createdAt = Number(raw.createdAt);
  const doneAt = Number(raw.doneAt);
  return {
    id,
    title: text(raw.title).slice(0, MAX_TODO_TITLE),
    note: text(raw.note).slice(0, MAX_TODO_NOTE),
    done: raw.done === true,
    priority: PRIORITIES.has(raw.priority) ? raw.priority : "normal",
    dueAt: dayStampOf(raw.dueAt),
    remindAt: minuteStampOf(raw.remindAt),
    remindedAt: minuteStampOf(raw.remindedAt),
    createdAt: Number.isFinite(createdAt) ? createdAt : 0,
    doneAt: Number.isFinite(doneAt) ? doneAt : 0,
  };
}

/**
 * Normalize one note record.
 * @param raw - one stored record.
 * @returns the record, or undefined when it carries no identity.
 */
function noteRecordOf(raw) {
  if (!isRecord(raw)) return undefined;
  const id = text(raw.id).trim();
  if (id.length === 0 || id.length > MAX_ID) return undefined;
  const createdAt = Number(raw.createdAt);
  const updatedAt = Number(raw.updatedAt);
  const createdStamp = Number.isFinite(createdAt) ? createdAt : 0;
  // Older documents stored a note without an updated stamp. Falling back to
  // the creation stamp keeps its relative time and the "updated" sort honest;
  // leaving 0 made those notes look epoch-old and rendered no timestamp.
  const updatedStamp = Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : createdStamp;
  return {
    id,
    block: NOTE_BLOCKS.has(raw.block) ? raw.block : "idea",
    title: text(raw.title).slice(0, MAX_NOTE_TITLE),
    body: text(raw.body).slice(0, MAX_NOTE_BODY),
    tags: Array.isArray(raw.tags)
      ? [
          ...new Set(
            raw.tags
              .filter((tag) => typeof tag === "string")
              .map((tag) => tag.trim().slice(0, 40))
              .filter((tag) => tag.length > 0),
          ),
        ].slice(0, MAX_NOTE_TAGS)
      : [],
    pinned: raw.pinned === true,
    createdAt: createdStamp,
    updatedAt: updatedStamp,
  };
}

/**
 * Normalize one board's record list.
 *
 * Duplicate ids collapse to the first occurrence, which keeps a hand-edited copy
 * of a row from appearing twice and then being written back as a second record.
 * @param value - the stored list.
 * @param normalize - `todoRecordOf` or `noteRecordOf`.
 * @param limit - the largest list retained.
 * @returns the deduplicated records.
 */
function recordListOf(value, normalize, limit) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of value) {
    const record = normalize(raw);
    if (record === undefined || seen.has(record.id)) continue;
    seen.add(record.id);
    out.push(record);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Whether a stored skill name is a plain directory name.
 *
 * A skill name is a single path segment: it names the folder under a skill root
 * that holds `SKILL.md`. It arrives from the browser request and is persisted in
 * the document, and it is later joined onto a skill root to read that file — so a
 * name carrying a separator or a parent reference (`..\..\..\Users\me\.ssh`)
 * would walk out of the skills directory and read an unrelated file into the
 * model's instruction. Rejecting every separator is what keeps the join inside
 * the root; the length bound keeps a hostile document from smuggling a huge
 * segment through. Ordinary names (kebab-case, CJK, spaces) all still pass.
 * @param value - a candidate skill name.
 * @returns whether it is safe to use as one path segment.
 */
function isSafeSkillName(value) {
  if (typeof value !== "string") return false;
  const name = value.trim();
  if (name.length === 0 || name.length > 128) return false;
  if (name === "." || name === "..") return false;
  // Windows silently drops a trailing dot or space on a directory name, so a
  // stored name ending that way would name a different folder from the one the
  // path join visits. Refuse it rather than letting the switch point nowhere.
  if (/[. ]$/.test(name)) return false;
  // Either separator, the characters Windows refuses in a path segment, and
  // control characters (including the NUL that would truncate a path in a
  // native call). A newline or tab in a name is never a real skill directory
  // and must not travel into a path join or the model instruction.
  if (/[\\/:*?"<>|\x00-\x1f\x7f]/.test(name)) return false;
  // Windows device names are not ordinary directories even without a slash.
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) return false;
  return true;
}

/**
 * Normalize one stored model selection.
 *
 * The value is trusted only as a shape: the catalog is live and may be
 * unavailable during a read, so this function deliberately does not check
 * provider/model membership. `session/create` and the model selector validate
 * the ids against the live catalog when the selection is actually used.
 * @param value - a stored selection candidate.
 * @returns `{provider, model, reasoningEffort?}`, or undefined.
 */
function modelSelectionOf(value) {
  if (!isRecord(value)) return undefined;
  const provider = typeof value.provider === "string" ? value.provider.trim() : "";
  const model = typeof value.model === "string" ? value.model.trim() : "";
  if (
    provider.length === 0 ||
    model.length === 0 ||
    provider.length > MAX_ID ||
    model.length > MAX_ID
  ) {
    return undefined;
  }
  const reasoningEffort = typeof value.reasoningEffort === "string" ? value.reasoningEffort.trim() : "";
  if (reasoningEffort.length > MAX_ID) return undefined;
  return {
    provider,
    model,
    ...(reasoningEffort.length === 0 ? {} : { reasoningEffort }),
  };
}

/** Whether two model selections carry the same complete route. */
function sameModelSelection(left, right) {
  return (
    left === right ||
    (left !== undefined &&
      right !== undefined &&
      left.provider === right.provider &&
      left.model === right.model &&
      left.reasoningEffort === right.reasoningEffort)
  );
}

/**
 * Normalize one board's saved configuration bag.
 *
 * Settings owns these now, so the shape is fixed here rather than being whatever
 * an older browser half happened to write: `promptIds` is a deduplicated list of
 * prompt ids, `skills` is a list of names, and `modelSelection` is the complete
 * provider/model/reasoning choice this board remembers for new conversations.
 * Version 4 and earlier stored one `promptId`; it is read as a one-item list so
 * an existing document keeps working without a separate migration pass.
 *
 * Older documents also spelled the same intent with a `pinned` switch: a bag
 * with `pinned: false` meant "nothing is fixed for this board", and the choice
 * beside it was a per-visit selection that was never sent. That is exactly "no
 * configuration" in the new model, so it normalizes to an empty bag — which
 * keeps every existing board sending what it sent before the upgrade. A bag with
 * no `pinned` field at all is already in the new shape and is read as-is.
 * @param value - the stored bag.
 * @returns {promptIds?, skills?, modelSelection?}.
 */
function boardSettingsOf(value) {
  if (!isRecord(value)) return {};
  if (value.pinned === false) {
    // An old `pinned: false` bag meant "no fixed prompt or skill". A model
    // selection is a separate newer field though: if a board already carries
    // one (for example after the model picker wrote it back), dropping it here
    // would make the board forget its model on the next document read.
    const modelSelection = modelSelectionOf(value.modelSelection);
    return modelSelection === undefined ? {} : { modelSelection };
  }
  const bag = {};
  const source = Array.isArray(value.promptIds)
    ? value.promptIds
    : typeof value.promptId === "string"
      ? [value.promptId]
      : [];
  const promptIds = [];
  for (const item of source) {
    if (typeof item !== "string") continue;
    const promptId = item.trim();
    if (promptId.length === 0 || promptId.length > MAX_ID || promptIds.includes(promptId)) continue;
    promptIds.push(promptId);
    if (promptIds.length >= MAX_PROMPTS) break;
  }
  if (promptIds.length > 0) bag.promptIds = promptIds;
  if (Array.isArray(value.skills)) {
    // The stored copy is untrusted for the same reason the request is: it is a
    // plain JSON file a user (or anything that can reach the state route) can
    // edit, and it is replayed through the skill loader on every agent creation.
    // A duplicate name would fold the same skill body into the prompt twice.
    // Trim before checking: `isSafeSkillName` accepts a padded name because it
    // validates the trimmed value, and storing the padding would make the
    // later `<root>/<name>/SKILL.md` join miss the directory it names.
    const skills = [...new Set(value.skills.filter((name) => typeof name === "string").map((name) => name.trim()))]
      .filter(isSafeSkillName)
      .slice(0, MAX_SKILLS);
    if (skills.length > 0) bag.skills = skills;
  }
  const modelSelection = modelSelectionOf(value.modelSelection);
  if (modelSelection !== undefined) bag.modelSelection = modelSelection;
  return bag;
}

/**
 * Whether a stored settings key still names a live board (or sub-board).
 *
 * Deleting a board in Settings must not leave its prompt and skills behind for a
 * later board that happens to reuse the id, and the composer would otherwise
 * keep handing out an instruction for a board nobody can open.
 * @param boards - normalized boards.
 * @param key - a settings/session key, `boardId` or `boardId/childId`.
 * @returns whether the key resolves.
 */
function boardKeyExists(boards, key) {
  const parts = key.split("/");
  // Only `boardId` and `boardId/childId` are real keys. A hand-edited
  // `boardId/childId/extra` used to resolve here by ignoring the tail and then
  // survive normalization as a settings/session row nothing can address.
  if (parts.length > 2) return false;
  const [boardId, childId] = parts;
  if (boardId.length === 0) return false;
  const board = boards.find((item) => item.id === boardId);
  if (board === undefined) return false;
  if (childId === undefined) return true;
  if (childId.length === 0) return false;
  return Array.isArray(board.children) && board.children.some((item) => item.id === childId);
}

/**
 * Normalize one board's Session id list.
 *
 * A board can own several conversations, so the stored value is a newest-first
 * list. Version 3 and earlier stored a single id, which upgrades to a one-item
 * list — the same conversation, still recognisable after the upgrade.
 * @param value - a list, a single id string, or anything else.
 * @returns a deduplicated newest-first list of Session ids.
 */
function sessionListOf(value) {
  const list = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (typeof item !== "string" || item.length === 0 || item.length > MAX_ID || UNSAFE_KEYS.has(item) || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
    if (out.length >= MAX_SESSIONS_PER_BOARD) break;
  }
  return out;
}

/**
 * Normalize an untrusted document into the exact shape this plugin writes.
 * Unknown fields are dropped and every collection is rebuilt, so a hand-edited
 * or older file can never inject a foreign shape into the browser.
 * @param raw - parsed document candidate.
 * @returns a complete document.
 */
function normalizeDocument(raw) {
  const seed = initialDocument();
  if (!isRecord(raw)) return seed;
  const boardSeen = new Set();
  const boards = [];
  for (const board of Array.isArray(raw.boards) ? raw.boards : []) {
    if (boards.length >= MAX_BOARDS) break;
    if (!isRecord(board)) continue;
    const id = text(board.id).trim();
    // A duplicate id makes Settings and Sessions ambiguous, and gives React two
    // children with the same key. A slash would collide with the `board/child`
    // key format used by settings, sessions and the browser half.
    if (id.length === 0 || id.length > MAX_ID || id.includes("/") || UNSAFE_KEYS.has(id) || boardSeen.has(id)) continue;
    boardSeen.add(id);
    const enName = text(board.enName).trim().slice(0, MAX_BOARD_NAME);
    const workspace = workspacePathOf(board.workspace);
    // Read the name once and hand the normalized value to `defaultMode`;
    // otherwise a hand-edited `" 聊天 "` kept its whitespace and fell back to
    // `standard` even though the visible title was the seeded chat board.
    const name = text(board.name).trim().slice(0, MAX_BOARD_NAME) || "未命名";
    const mode = modeOf(board.mode, id, name, false);
    const preset = agentPresetOf(board.agentPreset, mode);
    const childSeen = new Set();
    const children = [];
    for (const child of Array.isArray(board.children) ? board.children : []) {
      if (children.length >= MAX_CHILDREN_PER_BOARD) break;
      if (!isRecord(child)) continue;
      const childId = text(child.id).trim();
      if (childId.length === 0 || childId.length > MAX_ID || childId.includes("/") || UNSAFE_KEYS.has(childId) || childSeen.has(childId)) continue;
      childSeen.add(childId);
      const childName = text(child.name).trim().slice(0, MAX_BOARD_NAME) || "未命名";
      const childKind = child.kind === "todo" || child.kind === "note" ? child.kind : "chat";
      // A chat volume owns its whole branch. A child under a standard parent
      // keeps its own mode, so standard and creative branches can coexist.
      const childMode = mode === "chat" ? "chat" : modeOf(child.mode, childId, childName, true);
      const childPreset = agentPresetOf(child.agentPreset, childMode);
      const normalizedChild = {
        id: childId,
        name: childName,
        kind: childKind,
        mode: childMode,
      };
      if (childPreset !== defaultAgentPreset(childMode)) normalizedChild.agentPreset = childPreset;
      children.push(normalizedChild);
    }
    const normalized = {
      id,
      name,
      kind: board.kind === "todo" || board.kind === "note" ? board.kind : "chat",
      mode,
      children,
    };
    if (preset !== defaultAgentPreset(mode)) normalized.agentPreset = preset;
    // The English cover line and per-board workspace are optional and additive:
    // old documents keep their exact shape, while a board that has been through
    // Settings keeps the values the user chose.
    if (enName.length > 0) normalized.enName = enName;
    if (workspace.length > 0) normalized.workspace = workspace;
    boards.push(normalized);
  }
  const promptSeen = new Set();
  const prompts = [];
  if (Array.isArray(raw.prompts)) {
    for (const prompt of raw.prompts) {
      if (prompts.length >= MAX_PROMPTS) break;
      if (!isRecord(prompt)) continue;
      const id = text(prompt.id).trim();
      if (id.length === 0 || id.length > MAX_ID || promptSeen.has(id)) continue;
      promptSeen.add(id);
      prompts.push({
        id,
        name: text(prompt.name).trim().slice(0, MAX_PROMPT_NAME) || "未命名提示词",
        text: text(prompt.text).slice(0, MAX_PROMPT_TEXT),
      });
    }
  }
  const livePrompts = Array.isArray(raw.prompts) ? prompts : seed.prompts;
  const livePromptIds = new Set(livePrompts.map((prompt) => prompt.id));
  const collection = (value) => (isRecord(value) ? value : {});
  // Settings and Sessions are keyed by board, so a deleted board's entries go
  // with it. Rebuilding from the live keys is also what makes an orphaned entry
  // from an older document harmless.
  const keyed = (value) =>
    Object.fromEntries(Object.entries(collection(value)).filter(([key]) => boardKeyExists(boards, key)));
  const settings = keyed(raw.settings);
  // A Session belongs to exactly one board key. A hand-edited document that
  // lists the same Session under two boards would otherwise give the same
  // conversation two owners: the later map wins for prompt/tool scope and for
  // model-memory writes, silently changing the wrong board. Keep the first
  // occurrence (document/board order is the authority) and drop the rest.
  const seenSessions = new Set();
  return {
    version: DOCUMENT_VERSION,
    workspace: workspaceOf(raw.workspace),
    boards,
    prompts: livePrompts,
    // To-dos and notes are rebuilt record by record, so a hand-edited file cannot
    // hand the browser a row with a missing id or a string where a boolean
    // belongs. A board whose list normalizes away loses its key entirely.
    todos: Object.fromEntries(
      Object.entries(keyed(raw.todos))
        .map(([key, value]) => [key, recordListOf(value, todoRecordOf, MAX_TODOS_PER_BOARD)])
        .filter(([, list]) => list.length > 0),
    ),
    notes: Object.fromEntries(
      Object.entries(keyed(raw.notes))
        .map(([key, value]) => [key, recordListOf(value, noteRecordOf, MAX_NOTES_PER_BOARD)])
        .filter(([, list]) => list.length > 0),
    ),
    settings: Object.fromEntries(
      Object.entries(settings)
        .map(([key, bag]) => {
          const normalizedBag = boardSettingsOf(bag);
          // A board pointing at prompts that are no longer in the library
          // silently behaves like "default"; keep the document honest instead
          // of carrying dead ids that a later prompt could accidentally reuse.
          if (Array.isArray(normalizedBag.promptIds)) {
            const livePromptSelection = normalizedBag.promptIds.filter((id) => livePromptIds.has(id));
            if (livePromptSelection.length > 0) normalizedBag.promptIds = livePromptSelection;
            else delete normalizedBag.promptIds;
          }
          return [key, normalizedBag];
        })
        .filter(([, bag]) => Object.keys(bag).length > 0),
    ),
    // board key → its Session ids, newest first. The browser half uses this to
    // recognise its own Sessions after a reload (and to keep its own header
    // readout out of every other Session), so it must survive normalization.
    // A key whose list empties out is dropped entirely.
    sessions: Object.fromEntries(
      Object.entries(keyed(raw.sessions))
        .map(([key, value]) => {
          const list = sessionListOf(value).filter((sessionId) => {
            if (seenSessions.has(sessionId)) return false;
            seenSessions.add(sessionId);
            return true;
          });
          return [key, list];
        })
        .filter(([, list]) => list.length > 0),
    ),
  };
}

/**
 * Read the durable document, seeding a fresh one only when it does not exist.
 *
 * A missing file is a fresh install. Any other failure — unreadable, truncated,
 * or invalid JSON — must not be mistaken for one: returning a seed would let the
 * next save overwrite a document whose contents are still recoverable. The
 * route reports the failure instead, and the file stays on disk for inspection.
 */
async function readDocument() {
  const file = documentPath();
  /** Whether `lstat` proved the document existed before the read. */
  let existed = false;
  try {
    // `lstat` deliberately does not follow a link: the document path is a
    // regular file we own, and a symlink there could point the read at an
    // unrelated user file. A device or pipe is refused for the same reason:
    // `readFile` could block.
    const info = await lstat(file);
    existed = true;
    if (info.isSymbolicLink()) throw new Error("workbench document is a symbolic link");
    if (!info.isFile()) throw new Error("workbench document is not a regular file");
    if (info.size > MAX_STATE_BYTES) throw new Error("workbench document is too large");
    const raw = await readFile(file, "utf8");
    // `lstat` and `readFile` are two syscalls; another writer can grow the file
    // between them. Re-check the bytes actually read so an oversized document
    // cannot slip past the size ceiling that protects the Host's memory.
    if (Buffer.byteLength(raw, "utf8") > MAX_STATE_BYTES) {
      throw new Error("workbench document is too large");
    }
    // A hand-edited Windows file may carry a UTF-8 BOM; JSON.parse does not
    // accept it, and treating that as a corrupt document would strand the file.
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
    // Valid JSON that is not a document (a truncated array, `null`, a bare
    // string, or an object without the required boards array) must not be
    // mistaken for a fresh install: returning the seed would let the next save
    // overwrite a file that may still be repairable.
    if (!isRecord(parsed) || !Array.isArray(parsed.boards)) {
      throw new Error("workbench document is not a document object");
    }
    return normalizeDocument(parsed);
  } catch (error) {
    // A missing document is a fresh install only when `lstat` itself said so.
    // A file that disappeared between `lstat` and `readFile` (or a directory
    // that vanished with it) is a race, not a blank profile; returning a seed
    // there would let the next save overwrite a document another writer is
    // replacing.
    if (error && error.code === "ENOENT" && !existed) {
      // The seed goes through normalization too, so a fresh install reports the
      // same resolved working area an existing one does.
      return normalizeDocument(initialDocument());
    }
    throw error;
  }
}

/**
 * Serialize every document write.
 *
 * Two writers can be in flight at once — a save from one tab and a save from
 * another, or a Settings save beside the working-area route, which reads the
 * document, rewrites one field and stores it again. A shared temporary name
 * made those collide: whichever `rename` ran second found the file already
 * moved and rejected with ENOENT, so a legitimate save failed for no reason the
 * user could see. Chaining the writes means one whole read-modify-write runs at
 * a time, and the rename can no longer race its own temporary file.
 */
let writeQueue = Promise.resolve();
/** Distinguishes the staging file of each write. */
let writeCounter = 0;
/**
 * Monotonic token for the last document that actually landed.
 *
 * A save's post-write work (rendering pins, attaching live Sessions) is async.
 * If two writes overlap, the older one must not apply its snapshot after the
 * newer one has already refreshed the in-memory maps. The token lets
 * `afterDocumentChange` drop a superseded pass without serialising the reads
 * that belong to the newer document.
 */
let documentEpoch = 0;

/**
 * Run `operation` once every previously queued write has settled.
 * @param operation - the write to perform.
 * @returns the operation's result.
 */
function serializeWrite(operation) {
  const result = writeQueue.then(operation, operation);
  // Keep the chain alive even when this link rejects, so one refused write does
  // not permanently wedge every later one.
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

/** Persist the document beside a temporary file so a torn write cannot win. */
async function writeDocument(document) {
  // Normalization can expand a minimal hand-edited record into a full one.
  // Serialize once, and refuse a document that would exceed the same ceiling
  // `readDocument` enforces; writing it would leave a file the plugin could
  // never read back, bricking the workbench until manual repair.
  const serialized = JSON.stringify(document);
  if (Buffer.byteLength(serialized, "utf8") > MAX_STATE_BYTES) {
    const error = new Error("workbench document is too large");
    error.code = "STATE_TOO_LARGE";
    throw error;
  }
  await mkdir(workbenchDirectory(), { recursive: true });
  const target = documentPath();
  // The temporary name is unique per write: even if a future caller bypasses the
  // queue, two writes can never share one staging file.
  const temporary = `${target}.${process.pid}.${(writeCounter += 1)}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  try {
    await writeFile(temporary, serialized, "utf8");
    await rename(temporary, target);
    documentEpoch += 1;
    return documentEpoch;
  } catch (error) {
    // A staging file that never landed would otherwise accumulate beside the
    // document; removing it is best-effort, because the original failure is the
    // one worth reporting.
    await rm(temporary, { force: true }).catch(() => {});
    throw error;
  }
}

/**
 * Read the document, let `change` produce the next one, and store it — all
 * inside the write queue, so no other write can land between the two halves.
 * @param change - receives the current document, returns the next one.
 * @returns `{document, epoch}` for the stored revision.
 */
function updateDocument(change) {
  return serializeWrite(async () => {
    const next = await change(await readDocument());
    const epoch = await writeDocument(next);
    return { document: next, epoch };
  });
}

/** Split YAML-ish frontmatter from a SKILL.md body. */
function splitFrontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (match === null) return { fields: {}, body: source };
  const fields = Object.create(null);
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (pair === null) continue;
    const value = pair[2].trim().replace(/^["']|["']$/g, "");
    fields[pair[1]] = value;
  }
  return { fields, body: source.slice(match[0].length) };
}

/**
 * Condense a skill description into the one line the switch list shows.
 *
 * Frontmatter descriptions run to several sentences; the panel wants one. The
 * first sentence is kept whole, and anything past the budget is cut at a word
 * boundary so a long clause does not end mid-character.
 * @param value - raw description.
 * @returns one short line, possibly empty.
 */
function oneLine(value) {
  const flat = text(value).replace(/\s+/g, " ").trim();
  if (flat.length === 0) return "";
  // CJK terminators end a sentence on their own; ASCII ones only do so before
  // whitespace or the end. A period after a common abbreviation or an initial
  // is not a sentence end: the live catalog includes descriptions such as
  // "Lemo-Opuscar library (e.g. ...", which must not be cut at "e.g.".
  const cjk = flat.search(/[。．！？]/);
  let ascii = -1;
  for (const match of flat.matchAll(/[.!?](?=\s|$)/g)) {
    // Only the punctuation and the few characters before it are needed to
    // recognise an abbreviation or an initial. Slicing from the start of the
    // description here made a hostile SKILL.md with thousands of periods
    // quadratic in the file size while the skills route was being served.
    const before = flat.slice(Math.max(0, match.index - 16), match.index + 1);
    if (/(?:e\.g|i\.e|etc|vs|Mr|Mrs|Ms|Dr|No|Fig|approx)\.$/i.test(before)) continue;
    if (/\b[A-Za-z]\.$/.test(before)) continue;
    ascii = match.index;
    break;
  }
  const stop = [cjk, ascii].filter((at) => at >= 0).sort((left, right) => left - right)[0];
  const first = stop === undefined || stop < 0 ? flat : flat.slice(0, stop + 1);
  if (first.length <= 140) return first;
  const cut = first.slice(0, 140);
  const at = cut.lastIndexOf(" ");
  return `${(at > 90 ? cut.slice(0, at) : cut).trimEnd()}…`;
}

/**
 * Whether a discovered skill belongs to the harness itself rather than to the
 * user.
 *
 * The switch list is for skills the user installed; the presets the harness
 * ships would otherwise appear beside them and cannot be turned off anyway.
 * Both signals are used because a registry-backed entry may report `bundled`
 * while a directory scan only proves it by where the file lives.
 * @param skill - one discovered summary.
 * @returns whether it should be hidden.
 */
function isBuiltinSkill(skill) {
  if (skill.source === "bundled") return true;
  const location = text(skill.path).toLowerCase();
  // Bundled skills resolve inside the installed application, which the
  // directory scan never reaches through a user skill root.
  return location.includes("app.asar") || location.includes("\\resources\\app\\") || location.includes("/resources/app/");
}

/**
 * Read one skill file, refusing anything that is not a small regular file.
 *
 * Skill discovery walks user-controlled directories. A directory entry named
 * `SKILL.md` can be a device, a pipe or a very large file; reading it would turn
 * one refresh into an unbounded Host read. The size ceiling keeps the catalog a
 * metadata operation.
 * @param file - absolute SKILL.md candidate.
 * @returns the file text, or undefined when it is unavailable or too large.
 */
async function readSkillSource(file) {
  try {
    // `lstat` rather than `stat`: a SKILL.md symlink could otherwise point at an
    // unrelated file outside every skill root and still look like a directory
    // scan result.
    const info = await lstat(file);
    if (info.isSymbolicLink() || !info.isFile() || info.size > MAX_SKILL_FILE) return undefined;
    // A Windows-authored SKILL.md may begin with a UTF-8 BOM; leaving it in
    // front of `---` makes the frontmatter look absent and drops the title.
    const source = (await readFile(file, "utf8")).replace(/^\uFEFF/, "");
    // The file can be replaced between `lstat` and `readFile`; enforce the same
    // ceiling on the bytes actually read, not only the metadata we saw first.
    if (Buffer.byteLength(source, "utf8") > MAX_SKILL_FILE) return undefined;
    return source;
  } catch {
    return undefined;
  }
}

/**
 * Whether a skill path is inside one of the roots discovery is allowed to read.
 *
 * A registry summary can name any path; only a path below a declared skill root
 * may be folded into a model instruction. A pathless summary still falls back to
 * the name-based lookup below, which applies its own segment guard.
 * @param file - absolute path claimed by a catalog entry.
 * @returns whether the real path stays inside a skill root.
 */
async function skillPathWithinRoots(file) {
  try {
    const candidate = text(file).trim();
    // Resolve the candidate lexically before touching the filesystem. A
    // registry entry can name a UNC/device path, and `realpath` on Windows may
    // open an outbound SMB connection before the containment check could
    // reject it. Only a local absolute path is ever a candidate skill file:
    // `resolve()` alone would turn a relative path into an absolute one, so
    // the check has to run on the caller's value first.
    if (candidate.length === 0 || !isAbsolute(candidate) || /^[\\/]{2}/.test(candidate) || /[\x00-\x1f\x7f]/.test(candidate)) {
      return false;
    }
    const local = resolve(candidate);
    // Windows paths are case-insensitive even though `realpath()` preserves the
    // spelling supplied by the caller. Comparing the canonical roots and target
    // without case keeps a user skill under a different drive-letter casing
    // discoverable, while realpath still resolves junctions and symlinks.
    const canonical = (value) => (process.platform === "win32" ? value.toLowerCase() : value);
    // `resolve()` is lexical. A junction or symlink directory inside a user
    // skill root can point anywhere while its written path still starts with
    // the root, so containment is compared on real paths. Resolve each root
    // too: the root itself may legitimately be a link to a user-owned folder.
    const target = canonical(await realpath(local));
    for (const root of skillRoots()) {
      const base = canonical(await realpath(root).catch(() => resolve(root)));
      if (target === base || target.startsWith(`${base}${sep}`)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Read one directory of installed skills: every immediate child directory that
 * holds a SKILL.md becomes one entry.
 * @param root - absolute skills directory.
 * @returns entries found there.
 */
async function skillsUnder(root) {
  let names;
  try {
    names = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  // Every directory entry is an independent read. Scan them together so a
  // catalog with many installed skills does not pay one serial round-trip per
  // SKILL.md; Promise.all preserves the directory order for a stable output.
  // Files are filtered out BEFORE the Promise map: a directory holding a large
  // tree of unrelated files must not create a task per file.
  const directories = names.filter((entry) => entry.isDirectory() && !entry.isSymbolicLink()).slice(0, MAX_SKILLS);
  const found = await Promise.all(
    directories.map(async (entry) => {
      const file = join(root, entry.name, "SKILL.md");
      // A directory entry can itself be a junction that points outside every
      // declared skill root on Windows. Check containment BEFORE reading: the
      // file contents must not be touched even if they would later be discarded.
      if (!(await skillPathWithinRoots(file))) return undefined;
      const source = await readSkillSource(file);
      if (source === undefined) return undefined;
      const { fields, body } = splitFrontmatter(source);
      const heading = /^#\s+(.+)$/m.exec(body);
      const declared = text(fields.name, entry.name).trim();
      // A frontmatter name is untrusted file content. Fall back to the directory
      // name when it is not a safe single segment, so a hostile SKILL.md cannot
      // put a traversal-shaped name into the switch list. The directory name must
      // pass the same check: a folder ending in a dot or space (or named like a
      // device) cannot be persisted by `boardSettingsOf`, so offering it would
      // only create a switch that silently disappears on the next save.
      const fallback = text(entry.name).trim();
      const name = isSafeSkillName(declared) ? declared.slice(0, 128) : isSafeSkillName(fallback) ? fallback.slice(0, 128) : "";
      if (name.length === 0) return undefined;
      return {
        name,
        // A SKILL.md heading is user-controlled text, not a metadata field with a
        // documented bound; a 250 KB single-line heading would otherwise travel
        // to the browser and into a React row unchanged.
        title: (heading === null ? name : heading[1].trim()).slice(0, MAX_BOARD_NAME),
        description: oneLine(fields.description),
        path: file,
        source: "user",
      };
    }),
  );
  return found.filter((entry) => entry !== undefined);
}

/**
 * Build the addition a board contributes to its Session.
 *
 * This runs on the Host, at request time, so it must be cheap and must never
 * throw: a broken prompt is worse than no prompt. The board's `mode` selects the
 * NATIVE prompt (the chat preset's custom chat prompt, or DeepSeek Harness's
 * standard prompt); this function only adds the selected library prompts on top
 * of that native prompt, plus its skills. Default contributes nothing extra.
 *
 * Since Settings owns this, there is no per-visit pin any more: whatever the
 * document says IS the board's configuration, and every board's session uses it
 * on every message.
 * @param document - the workbench document.
 * @param boardKey - the key the Session was recorded under.
 * @returns {text, skills}; `text` is "" when the board has no prompt.
 */
function pinnedInstruction(document, boardKey) {
  const settings = document.settings && typeof document.settings === "object" ? document.settings : {};
  const bag = boardSettingsOf(settings[boardKey]);
  const parts = [];
  // Apply in LIBRARY order, not selection order: the prompt library's own drag
  // ordering is the one place a user can see and change the sequence the model
  // receives. A hand-edited promptIds list therefore cannot reorder it.
  const selected = new Set(Array.isArray(bag.promptIds) ? bag.promptIds : []);
  let used = 0;
  for (const prompt of Array.isArray(document.prompts) ? document.prompts : []) {
    if (!isRecord(prompt) || !selected.has(prompt.id)) continue;
    if (typeof prompt.text !== "string") continue;
    const value = prompt.text.trim();
    if (value.length === 0) continue;
    // The library and each prompt are bounded, but a board can select enough
    // long prompts to build a multi-megabyte system instruction. Keep the
    // same whole-request ceiling the skill fold uses so one hand-edited
    // document cannot turn every message into an unbounded model request.
    const separator = parts.length === 0 ? 0 : 2;
    if (used + separator + value.length > MAX_PROMPT_CHARS) break;
    parts.push(value);
    used += separator + value.length;
  }
  const skills = Array.isArray(bag.skills) ? bag.skills : [];
  return { text: parts.join("\n\n"), skills };
}

/**
 * The user-level agent home the harness uses for agent skills.
 *
 * The shipped agent-skill provider reads `DSH_AGENTS_HOME` when it is set and
 * otherwise `~/.agents`; skills installed through that provider must be
 * discoverable here too, or a registry summary with a valid `user-agents`
 * path is rejected by the containment check and never appears as a switch.
 * @returns the agent home directory.
 */
function agentHome() {
  const configured = process.env.DSH_AGENTS_HOME;
  if (typeof configured === "string" && configured.length > 0) return configured;
  return join(homedir(), ".agents");
}

/**
 * The directories an installed skill can live in: the harness user directories
 * plus the project-local ones for the serving working directory.
 * @returns absolute skill roots in precedence order.
 */
function skillRoots() {
  return [
    join(harnessHome(), "skills"),
    join(agentHome(), "skills"),
    // Keep the older `$DSH_HOME/agents/skills` spelling as well: a profile that
    // installed skills there must keep finding them.
    join(harnessHome(), "agents", "skills"),
    join(process.cwd(), ".dsh", "skills"),
    join(process.cwd(), ".agents", "skills"),
  ];
}

/**
 * Discover the user's installed skills: the harness user skill directory plus
 * the project-local directories of the serving working directory. The registry
 * service is consulted first when it answers, so preset-scoped catalogs are
 * included when a composition exposes them.
 *
 * Every call re-reads the disk, so a skill installed while the page is open
 * appears on the next refresh without restarting anything.
 * @param ctx - host context.
 * @returns deduplicated skill summaries ordered by name.
 */
async function discoverSkills(ctx) {
  const collected = [];
  const registry = ctx.get("skills");
  if (registry !== undefined && registry !== null) {
    try {
      const listed = await registry.list({ cwd: process.cwd() });
      // A registry is a service answer; an unexpectedly large catalog must not
      // turn one skills read into thousands of concurrent realpath calls. The
      // final list is capped at the same limit anyway.
      const entries = (Array.isArray(listed) ? listed : Array.from(listed ?? [])).slice(0, MAX_SKILLS);
      // Every entry is an independent containment check. Check them together so
      // a registry with many skills does not add one realpath round-trip per
      // row; `Promise.all` preserves the registry order.
      const resolved = await Promise.all(
        entries.map(async (skill) => {
          // Every field is coerced: this list is a service's answer, not something
          // this plugin shaped, and a single entry with a non-string name would
          // otherwise throw out of the sort below and take the whole route with it.
          const name = text(skill?.name, "").trim();
          // The same segment rule the stored setting will be checked against: a
          // name that cannot be saved must not be offered as a working switch.
          if (!isSafeSkillName(name)) return undefined;
          const path = text(skill?.path, "");
          // A registry entry whose body lives outside the declared skill roots is
          // not offered as a switch: the loader would refuse it, so the row could
          // only ever do nothing.
          if (path.length > 0 && !(await skillPathWithinRoots(path))) return undefined;
          return {
            name,
            title: name,
            description: oneLine(skill?.description),
            path,
            source: text(skill?.source, "registry"),
          };
        }),
      );
      for (const entry of resolved) if (entry !== undefined) collected.push(entry);
    } catch {
      /* an unavailable registry is not an error: the directories still answer */
    }
  }
  // Scan the roots together: each one is an independent directory read, and
  // waiting for them serially made the route's latency grow with every root
  // that happens to exist. `Promise.all` preserves the root order, so the
  // deduplication below still prefers the earlier root on a tie.
  const rootEntries = await Promise.all(skillRoots().map((root) => skillsUnder(root)));
  for (const entries of rootEntries) collected.push(...entries);
  const byName = new Map();
  for (const skill of collected) {
    if (skill.name.length === 0) continue;
    const previous = byName.get(skill.name);
    // Prefer the entry that carries a usable path — the skill body is loaded
    // from it, so a pathless duplicate must not shadow a located one.
    const richer =
      previous === undefined ||
      (previous.path.length === 0 && skill.path.length > 0) ||
      (previous.path.length === skill.path.length && previous.description.length < skill.description.length);
    if (richer) byName.set(skill.name, skill);
  }
  return [...byName.values()]
    // The user's own skills only: the harness presets are neither installable
    // nor switchable, so listing them here would be noise.
    .filter((skill) => !isBuiltinSkill(skill))
    .map(({ name, title, description, source, path }) => ({ name, title, description, source, path }))
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, MAX_SKILLS);
}

/**
 * Load the bodies of the enabled skills, bounded in total size.
 *
 * A registry summary may carry no `path`; those skills are located by name in
 * the same directories discovery scans, so a skill mounted only through the
 * registry still contributes its instructions.
 * @param names - enabled skill names.
 * @param catalog - discovered catalog carrying each skill's path.
 * @returns the concatenated skill context, or an empty string.
 */
async function skillContext(names, catalog) {
  if (names.length === 0) return "";
  const byName = new Map();
  for (const skill of Array.isArray(catalog) ? catalog : []) {
    if (skill !== null && typeof skill === "object" && typeof skill.name === "string" && skill.name.length > 0) {
      byName.set(skill.name, skill);
    }
  }
  const parts = [];
  let used = 0;
  for (const name of names) {
    const entry = byName.get(name);
    let file = entry !== undefined && typeof entry.path === "string" && entry.path.length > 0 ? entry.path : "";
    // A registry summary can name any path. A path outside the user's skill
    // roots is ignored just like a pathless entry, so it cannot make this
    // plugin read an unrelated file into the model's instruction.
    if (file.length > 0 && !(await skillPathWithinRoots(file))) file = "";
    let source;
    if (file.length === 0) {
      // No recorded path: look the name up in every directory discovery reads.
      // The name is re-checked here rather than trusted from the caller: this is
      // the one place a skill name becomes a filesystem path, so the guard sits
      // on the join itself.
      if (!isSafeSkillName(name)) continue;
      for (const root of skillRoots()) {
        const candidate = join(root, name, "SKILL.md");
        // Belt and braces: the name is already one safe segment, and this proves
        // the real file is still inside a declared root even when a directory
        // component is a junction or symlink.
        if (!resolve(candidate).startsWith(resolve(root) + sep)) continue;
        if (!(await skillPathWithinRoots(candidate))) continue;
        const candidateSource = await readSkillSource(candidate);
        if (candidateSource !== undefined) {
          file = candidate;
          source = candidateSource;
          break;
        }
      }
    }
    if (file.length === 0) continue;
    if (source === undefined) source = await readSkillSource(file);
    if (source === undefined) continue;
    const body = splitFrontmatter(source).body.trim().slice(0, MAX_SKILL_BODY);
    if (body.length === 0) continue;
    const heading = entry !== undefined && typeof entry.title === "string" && entry.title.length > 0 ? entry.title : name;
    const section = `## ${heading}\n\n${body}`;
    if (used + section.length > MAX_SKILL_CHARS) break;
    used += section.length;
    parts.push(section);
  }
  return parts.join("\n\n");
}

/** Read a bounded request body as UTF-8 text; null past the ceiling. */
async function readBody(req, maxBytes = MAX_BODY_BYTES) {
  // A declared length lets an oversized upload be refused without reading its
  // bytes; a streaming request without one is still bounded by the loop below.
  const declared = Number(req.headers?.["content-length"]);
  if (Number.isFinite(declared) && declared > maxBytes) {
    req.resume?.();
    return null;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.byteLength;
    if (size > maxBytes) {
      req.resume();
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size).toString("utf8");
}

/** Send one JSON response. */
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  // `Buffer.byteLength` counts UTF-8 bytes, not JavaScript characters; the
  // Chinese copy in an error body would otherwise advertise a short length.
  res.setHeader("content-length", Buffer.byteLength(body, "utf8"));
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  // These routes never return HTML; the headers are defence in depth for a
  // direct navigation to the JSON endpoint and for any future response shape.
  res.setHeader("content-security-policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("referrer-policy", "no-referrer");
  res.setHeader("cross-origin-resource-policy", "same-origin");
  res.end(body);
}

/** Send one failure with a stable code. */
function sendFailure(res, status, code, message) {
  sendJson(res, status, { code, message });
}

/**
 * Answer a request the Host trust fence rejected.
 *
 * These responses are produced before any route header helper runs, so they
 * need the same defensive headers as a normal JSON answer. In particular
 * `no-store` keeps a rejected credential from being cached by an intermediary.
 * @param res - response owning the answer.
 * @param rejection - the 401/403 status returned by the trust service.
 */
function sendTrustFailure(res, rejection) {
  const message = rejection === 401 ? "unauthorized" : "forbidden";
  res.statusCode = rejection;
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.setHeader("content-length", Buffer.byteLength(message, "utf8"));
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("referrer-policy", "no-referrer");
  res.end(message);
}

/** Answer one font-route failure with the same defensive headers as a hit. */
function sendFontFailure(res, status, message) {
  res.statusCode = status;
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.setHeader("content-length", Buffer.byteLength(message, "utf8"));
  res.setHeader("cache-control", "no-store");
  res.setHeader("content-security-policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("referrer-policy", "no-referrer");
  res.setHeader("cross-origin-resource-policy", "same-origin");
  res.end(message);
}

/**
 * Serve one bundled type asset.
 *
 * The route is deliberately read-only and shallow: only `.css` and `.woff2`
 * below this package's own `fonts/` directory are reachable, and a path that
 * escapes that root is a 404 rather than a filesystem read. Fonts are immutable
 * for the life of a plugin version, so the response is cacheable forever.
 * @param req - incoming request.
 * @param res - response owning the answer.
 */
async function serveFont(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("allow", "GET, HEAD");
    sendFontFailure(res, 405, "method not allowed");
    return;
  }
  let path;
  try {
    path = decodeURIComponent(new URL(String(req.url ?? "/"), "http://font.invalid").pathname);
  } catch {
    sendFontFailure(res, 404, "not found");
    return;
  }
  if (!path.startsWith(`${FONT_PREFIX}/`)) {
    sendFontFailure(res, 404, "not found");
    return;
  }
  // `decodeURIComponent` can turn `%00` into a NUL; native path calls truncate
  // at it, so refuse the request before building a path.
  if (path.includes("\0")) {
    sendFontFailure(res, 404, "not found");
    return;
  }
  const relative = path.slice(FONT_PREFIX.length + 1);
  const target = resolve(join(FONT_ROOT, relative));
  const root = resolve(FONT_ROOT);
  if (target !== root && !target.startsWith(`${root}${sep}`)) {
    sendFontFailure(res, 404, "not found");
    return;
  }
  const type = FONT_TYPES.get(extname(target).toLowerCase());
  if (type === undefined) {
    sendFontFailure(res, 404, "not found");
    return;
  }
  const css = extname(target).toLowerCase() === ".css";
  // The font binaries are immutable for a plugin version, but fonts.css is
  // addressed by an unversioned path. It must revalidate after a plugin update,
  // and an ETag makes that revalidation a 304 instead of re-sending 105 KB.
  const cacheControl = css ? "no-cache" : "public, max-age=31536000, immutable";
  const assetHeaders = {
    "cache-control": cacheControl,
    // These are static assets, never a document; a restrictive policy costs
    // nothing and keeps a future navigation to a font path inert.
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "cross-origin-resource-policy": "same-origin",
  };
  let body;
  let etag;
  try {
    // The font directory is bundled with the plugin, but a replaced symlink or
    // an accidentally huge file must not turn a font request into an arbitrary
    // read or an unbounded allocation.
    const info = await lstat(target);
    if (info.isSymbolicLink() || !info.isFile() || info.size > MAX_FONT_BYTES) {
      sendFontFailure(res, 404, "not found");
      return;
    }
    etag = `"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`;
    const ifNoneMatch = req.headers?.["if-none-match"];
    if (
      typeof ifNoneMatch === "string" &&
      ifNoneMatch.split(",").some((tag) => {
        const value = tag.trim();
        return value === "*" || value === etag || value === `W/${etag}`;
      })
    ) {
      res.writeHead(304, { ...assetHeaders, etag });
      res.end();
      return;
    }
    if (req.method === "HEAD") {
      res.writeHead(200, {
        ...assetHeaders,
        "content-type": type,
        "content-length": info.size,
        etag,
      });
      res.end();
      return;
    }
    body = await readFile(target);
  } catch {
    sendFontFailure(res, 404, "not found");
    return;
  }
  // A symlink/file replacement between `lstat` and `readFile` must not turn a
  // font request into an unbounded allocation.
  if (body.byteLength > MAX_FONT_BYTES) {
    sendFontFailure(res, 404, "not found");
    return;
  }
  res.writeHead(200, {
    ...assetHeaders,
    "content-type": type,
    "content-length": body.byteLength,
    etag,
  });
  // HEAD requests returned above from the metadata path, so only GET reaches
  // this point and always carries the body.
  res.end(body);
}

/**
 * The pinned instruction of each workbench Session, keyed by Session id.
 *
 * This is what the Host hands to the prompt registry. It is rebuilt whenever the
 * document changes, so a pin takes effect on the board's next message rather
 * than only after the Session is recreated.
 */
const pinnedBySession = new Map();

/**
 * The titles an earlier version of this plugin may have pinned on a Session.
 *
 * Earlier versions renamed a board's Session to the board's own name or to the
 * hierarchy label `工作台/板块[/子板块]` (the first versions used the full label).
 * That rename is FINAL for the shipped title service — an explicit rename pins
 * the title, so the native derivation from the first prompt never runs again —
 * which is why those Sessions kept a board name where every other Session shows
 * a conversation title.
 *
 * The set is built from the document, so it names exactly the boards this
 * plugin created rather than guessing from a title. Titles are compared with
 * whitespace removed: the labels differed only in the spacing around `/`.
 */
const titleBySession = new Map();

/**
 * The mode of the board each workbench Session belongs to, keyed by Session id.
 *
 * A Session's MODE is a property of the board, exactly like its prompt and skills,
 * and it is read here rather than from the Session's own preset record because the
 * board is the only place a user can change it. Rebuilt whenever the document
 * changes, so a board switched to `chat` hides its tools from the next message on.
 */
const modeBySession = new Map();

/**
 * The board key each recorded Session belongs to, keyed by Session id.
 *
 * A board key is `boardId` or `boardId/childId`. The workbench document is the
 * authority: a Session belongs to exactly the key whose `sessions` list records
 * it. Rebuilt with the same pass that refreshes the pins, so model changes are
 * written back to the right sub-board after a rename or reorder.
 */
const boardKeyBySession = new Map();

/**
 * Normalize a title for comparison. The old labels differed only in the spaces
 * around their separators (`工作台 / 聊天` versus `工作台/聊天`).
 * @param value - a title, or a document name.
 * @returns the text without whitespace.
 */
function normalizeTitleText(value) {
  return String(value).replace(/\s+/g, "");
}

/**
 * The titles a board key may have been pinned with, normalized.
 * @param document - the workbench document.
 * @param boardKey - `boardId`, or `boardId/childId` for a sub-board.
 * @returns the candidate titles, or undefined when the key matches no board.
 */
function legacyTitlesOf(document, boardKey) {
  const boards = Array.isArray(document.boards) ? document.boards : [];
  const [boardId, childId] = String(boardKey).split("/");
  const board = boards.find((item) => item !== null && typeof item === "object" && item.id === boardId);
  if (board === undefined) return undefined;
  const children = Array.isArray(board.children) ? board.children : [];
  const child =
    childId === undefined
      ? undefined
      : children.find((item) => item !== null && typeof item === "object" && item.id === childId);
  const titles = new Set();
  const add = (value) => {
    if (typeof value === "string" && value.trim().length > 0) titles.add(normalizeTitleText(value));
  };
  add(board.name);
  if (child !== undefined) add(child.name);
  add(`工作台/${board.name}`);
  if (child !== undefined) add(`工作台/${board.name}/${child.name}`);
  return titles.size === 0 ? undefined : titles;
}

/**
 * Whether a normalized title is one of the plugin's old hierarchy labels.
 *
 * A rename since the Session was created leaves the title carrying the board's
 * FORMER name, which the document can no longer supply. The shape is still
 * recognisable: 工作台 followed by one or two non-empty segments. Only Sessions
 * the document records are checked against this, so no other conversation can
 * be affected.
 * @param normalized - the title with whitespace removed.
 * @returns true for `工作台/...` with one or two segments.
 */
function looksLikeBoardPath(normalized) {
  const segments = normalized.split("/");
  return (
    segments.length >= 2 &&
    segments.length <= 3 &&
    segments[0] === "工作台" &&
    segments.every((segment) => segment.length > 0)
  );
}

/**
 * Rebuild {@link pinnedBySession}, {@link modeBySession} and
 * {@link boardKeyBySession} from a document.
 *
 * A Session whose pin did not change keeps its rendered cache, so repeating this
 * on every agent creation does not discard the skill bodies already read from
 * disk.
 * @param document - the workbench document.
 */
function refreshPinned(document) {
  const previous = new Map(pinnedBySession);
  pinnedBySession.clear();
  titleBySession.clear();
  modeBySession.clear();
  boardKeyBySession.clear();
  const sessions = document.sessions && typeof document.sessions === "object" ? document.sessions : {};
  for (const [key, value] of Object.entries(sessions)) {
    // A board owns every conversation opened on it, and each one gets the same
    // instruction: the board's fixed prompts and skills are a property of the
    // BOARD, not of one conversation, so a conversation started later carries
    // exactly what the first one did.
    const list = sessionListOf(value);
    if (list.length === 0) continue;
    // Remember the titles these Sessions may still carry, so the title repair
    // below can tell an abandoned board name from a user's choice.
    const legacy = legacyTitlesOf(document, key);
    // The board's MODE travels with the same key, so a chat board can mask its
    // tools and a standard board beside it cannot.
    const mode = modeOfKey(document, key);
    const pinned = pinnedInstruction(document, key);
    const active = pinned.text.length > 0 || pinned.skills.length > 0;
    // One serialization per board, not one per Session. A board can own forty
    // conversations, and a prompt may be 120 KB; rebuilding the same key for
    // every Session made a save allocate the whole pin text over and over.
    const pinKey = active ? JSON.stringify([pinned.text, pinned.skills]) : "";
    for (const sessionId of list) {
      boardKeyBySession.set(sessionId, key);
      if (legacy !== undefined) titleBySession.set(sessionId, legacy);
      if (mode !== undefined) modeBySession.set(sessionId, mode);
      if (!active) continue;
      const before = previous.get(sessionId);
      const same =
        before !== undefined &&
        (before.key !== undefined
          ? before.key === pinKey
          : before.text === pinned.text && JSON.stringify(before.skills) === JSON.stringify(pinned.skills));
      pinnedBySession.set(sessionId, {
        text: pinned.text,
        skills: pinned.skills,
        cached: same ? before.cached : undefined,
        key: pinKey,
      });
    }
  }
}

/**
 * The mode of the board (or sub-board) a document key names.
 * @param document - the workbench document.
 * @param key - a board key, `boardId` or `boardId/childId`.
 * @returns the board's mode, or undefined when the key matches no board.
 */
function modeOfKey(document, key) {
  const boards = Array.isArray(document.boards) ? document.boards : [];
  const [boardId, childId] = String(key).split("/");
  const board = boards.find((item) => item !== null && typeof item === "object" && item.id === boardId);
  if (board === undefined) return undefined;
  if (childId === undefined) return modeOf(board.mode, text(board.id), text(board.name), false);
  const children = Array.isArray(board.children) ? board.children : [];
  const child = children.find((item) => item !== null && typeof item === "object" && item.id === childId);
  if (child === undefined) return undefined;
  // A sub-board belongs to its parent's branch: a chat folder makes every
  // conversation below it chat, even when an older build stamped the child as
  // `standard`. This mirrors the client's `sessionModeOf` so the Host's tool
  // mask and prompt context agree with the Session the browser creates.
  if (board.mode === "chat") return "chat";
  return modeOf(child.mode, text(child.id), text(child.name), true);
}

/**
 * Fold one pin into the instruction string it contributes.
 *
 * This is what runs on a save, which touches every pinned Session at once, so
 * the catalog is passed in rather than discovered here: one directory scan per
 * Session made a save a burst of identical scans whose count grew with the
 * document. A caller rendering many pins scans once and shares the answer.
 * @param ctx - host context.
 * @param entry - the pin, or undefined when nothing is pinned.
 * @param catalog - the discovered skill catalog, when the caller already has it.
 * @returns the text to contribute, or "" when nothing is pinned.
 */
async function renderPinned(ctx, entry, catalog) {
  if (entry === undefined) return "";
  const parts = [];
  if (entry.text.length > 0) parts.push(entry.text);
  if (entry.skills.length > 0) {
    let resolved = catalog;
    if (resolved === undefined) {
      try {
        resolved = await discoverSkills(ctx);
      } catch {
        resolved = [];
      }
    }
    const body = await skillContext(entry.skills, resolved);
    if (body.length > 0) {
      parts.push(`# 已启用的技能\n\n以下技能说明来自当前工作台板块开启的技能，请按需遵循。\n\n${body}`);
    }
  }
  return parts.join("\n\n");
}

/**
 * Sessions whose old board title has already been repaired in this Host run.
 *
 * The repair appends an event and may start one title-model call, so it must
 * happen once per Session: `agent/created` fires again every time a board is
 * reopened, and repeating the work would keep replacing the title.
 */
const repairedSessions = new Set();

/**
 * Sessions whose current title was already inspected and proved not to be one
 * of the labels this plugin used to write.
 *
 * `reconcileLiveSessions()` runs on every document save, and `titles.get()`
 * folds the Session's complete event log. Without this negative cache, a
 * renamed to-do or note on a busy profile would pay that cost once per live
 * workbench Session per save. A Session without any title yet is deliberately
 * not marked: its title can arrive later and must still be checked.
 */
const titleChecked = new Set();

/**
 * The text of the first human message in a Session.
 * @param session - the live Session.
 * @returns the text, or undefined when the Session has no human message yet.
 */
function firstHumanMessageText(session) {
  if (typeof session?.snapshotEvents !== "function") return undefined;
  for (const event of session.snapshotEvents()) {
    if (event?.type !== "user/message" || event.data?.source?.kind !== "user") continue;
    const blocks = Array.isArray(event.data.content) ? event.data.content : [];
    const text = blocks
      .filter((block) => block?.type === "text")
      .map((block) => block.text)
      .join(" ")
      .trim();
    if (text.length > 0) return text;
  }
  return undefined;
}

/**
 * The title the shipped fallback would derive from a first prompt.
 *
 * The first non-empty line, whitespace collapsed, cut to a readable length. It
 * is deliberately the deterministic part of the native derivation: the repair
 * must not depend on a title model being reachable.
 * @param text - the first human message.
 * @returns a short title, or undefined when the text carries nothing.
 */
function derivedSessionTitle(text) {
  const line = String(text)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.length > 0);
  if (line === undefined) return undefined;
  const collapsed = line.replace(/\s+/g, " ").trim();
  if (collapsed.length === 0) return undefined;
  return Array.from(collapsed).slice(0, 20).join("").trim();
}

/**
 * Give a mis-titled Session back its native title.
 *
 * The old rename is final: the title service marks a user rename as the latest
 * source and stops deriving anything further, so those Sessions would show a
 * board name forever. This repair runs only when the current title is one of
 * the labels this plugin wrote (the board name, or the
 * `工作台/板块[/子板块]` hierarchy) with a `user` source, so a title the user
 * chose themselves never changes.
 *
 * Two steps, in this order:
 *   1. Rename to the deterministic title the shipped fallback derives from the
 *      first prompt. This lands immediately and does not depend on any model.
 *   2. Ask the title service to refresh, which is its explicit un-pin: a
 *      reachable title model then replaces it with the same polished title a
 *      fresh Session gets. A failure here leaves step 1 in place.
 *
 * A title is cosmetic: every failure here is swallowed rather than propagated
 * into the Session.
 * @param ctx - host context.
 * @param agent - the live agent whose Session is open.
 * @param sessionId - its Session id.
 */
function repairTitle(ctx, agent, sessionId) {
  if (repairedSessions.has(sessionId) || titleChecked.has(sessionId)) return;
  const legacy = titleBySession.get(sessionId);
  if (legacy === undefined) return;
  const session = agent?.session;
  if (session === undefined) return;
  const titles = ctx.get("sessionTitle");
  if (titles === undefined || titles === null) return;
  try {
    const current = titles.get(session);
    const title = typeof current === "string" ? current : current?.title;
    if (typeof title !== "string" || title.length === 0) return;
    // Only an explicit rename is the pin this repair exists for. A derived
    // title that happens to contain a board name is the Session's own.
    const source = typeof current === "string" ? undefined : current?.source?.kind;
    if (source !== undefined && source !== "user") {
      titleChecked.add(sessionId);
      return;
    }
    const normalized = normalizeTitleText(title);
    if (!legacy.has(normalized) && !looksLikeBoardPath(normalized)) {
      // The user chose a title that is not one of the old board labels; no
      // later pass can turn it into one, so skip the expensive title fold.
      titleChecked.add(sessionId);
      return;
    }
    const derived = derivedSessionTitle(firstHumanMessageText(session) ?? "");
    // Mark the Session repaired only after there is a title to write. A Session
    // without a human message yet must stay eligible for a later
    // `agent/created` pass, otherwise the old board-name title would survive
    // even after its first prompt arrived.
    if (derived === undefined) return;
    // Mark the Session repaired only after the rename actually lands. If the
    // title service is temporarily unavailable, a later `agent/created` pass
    // must be allowed to try again instead of leaving the old board name
    // permanently. `rename` is synchronous in the shipped service, but a
    // future async implementation must not become an unhandled rejection here.
    try {
      // Refresh only after the deterministic rename has landed: a future async
      // title service must not let its asynchronous refresh race ahead of the
      // rename and be overwritten by it. A failed rename leaves the Session
      // retryable and skips the refresh for this pass.
      Promise.resolve(titles.rename(session, derived))
        .then(() => {
          repairedSessions.add(sessionId);
          return titles.refresh(session);
        })
        .catch(() => {});
    } catch {
      /* the Session stays retryable; the old title remains for now */
      return;
    }
  } catch {
    /* the Session keeps its title; nothing about the board depends on it */
  }
}

/**
 * Register the workbench routes.
 * @param ctx - host plugin context.
 */
function apply(ctx) {
  /**
   * Set by the plugin's teardown effect. An in-flight save/reconciliation can
   * outlive the fiber that started it; without this flag its async tail would
   * repopulate the maps and re-register prompt/tool effects on live agent
   * scopes after the cleanup pass has already run, leaking them into sessions
   * this plugin no longer owns.
   */
  let disposed = false;

  /**
   * Sessions seen before the document was loaded, retried after it arrives.
   *
   * This is a RETRY LIST, not a one-shot queue: a Session stays in it until the
   * plugin has actually attached its context. Draining it destructively was the
   * bug behind "a board configured after it was opened never picks the change
   * up": the browser half records a Session id in the document as soon as the
   * board opens (`rememberSession`), which is a document save, and that save
   * drained the list while the board still had no prompt — so the Session was
   * dropped, `agent/created` never fired for it again, and every later pin was
   * unreachable. {@link attachPending} therefore keeps what it could not attach.
   */
  const pendingAttach = new Set();

  // ── delivering the pinned instruction ──────────────────────────────────────
  //
  // What does NOT work, verified against the shipped source:
  //
  //   - `llm/stream`: `next()` takes no arguments and re-reads the original
  //     frozen `options`, so a listener cannot rewrite the request there. A
  //     listener must also return an AsyncIterable SYNCHRONOUSLY, so an `async`
  //     listener throws "yield* (intermediate value) is not async iterable".
  //   - `systemPrompt.section()` from a global context: the chat preset's persona
  //     row is `complete: true`, and the assembler restores that exact section
  //     after the `system-prompt/assemble` waterfall, discarding every addition.
  //   - `agent/request`: replaces the call configuration only; it explicitly
  //     cannot touch messages or the system prompt.
  //
  // What DOES work, for BOTH a standard and a chat-mode board: register on the
  // AGENT's own context (`agent.ctx`), which is what the shipped Team row does,
  // with a prompt CONTEXT marked `required: true`. Contexts are rendered into
  // the runtime-context message, and the assembler keeps every required context
  // even when a preset asks to suppress runtime context — which the chat preset
  // does (`includeRuntimeContext: false`). Registering on `agent.ctx` also keeps
  // the contribution inside that one Session: a registration made through the
  // global context would leak into every conversation on the machine.
  ctx.effect(
    () =>
      ctx.on("agent/created", (payload) => {
        if (disposed) return;
        const agent = payload?.agent;
        const sessionId = typeof agent?.id === "string" ? agent.id : undefined;
        if (sessionId === undefined || agent.ctx === undefined) return;
        // Undo a board label an earlier version pinned, if this Session still
        // carries one.
        repairTitle(ctx, agent, sessionId);
        // A chat-mode board promises "不调用任何工具". Mounting no tool row in the
        // preset is NOT enough: a few tools are mounted outside every preset — in
        // the shared base bundle and by the desktop host — so they sit in the
        // GLOBAL layer and every Session inherits them whatever preset it runs.
        // Masking them here, on this agent's own scope, is what makes the promise
        // true without touching any other Session on the machine.
        hideTools(ctx, agent, sessionId);
        // Only a Session the workbench records has anything to contribute, and
        // only such a Session belongs in the retry list. Adding every Session
        // on the machine (the event fires for all of them) made the set grow
        // with unrelated conversations until the next document write drained
        // it. A workbench Session that is not recorded yet is picked up by
        // `reconcileLiveSessions` after the browser records it.
        if (modeBySession.has(sessionId) || pinnedBySession.has(sessionId)) pendingAttach.add(sessionId);
        if (!pinnedBySession.has(sessionId)) return;
        attachPinned(agent, sessionId);
        if (attachedContexts.has(agent.ctx)) pendingAttach.delete(sessionId);
      }),
    "workbench: pinned instruction",
  );

  /**
   * Contexts that already carry this plugin's prompt contribution.
   *
   * `agent/created` is documented to fire again when a Session is resumed, and a
   * resumed board can hand back the same live agent. Registering the context
   * twice would add a second copy of the same instruction to one prompt, so the
   * registration is made idempotent per agent scope. A WeakSet is what keeps this
   * bookkeeping from holding a disposed agent's context alive.
   */
  const attachedContexts = new WeakSet();

  /**
   * Scoped registrations this plugin installed on agent contexts.
   *
   * `agent.ctx` outlives this plugin's own fiber: unloading the plugin does not
   * dispose an effect registered there. Keep every scoped disposer so plugin
   * teardown can remove the prompt context and tool mask, and so a board leaving
   * chat mode can release its mask instead of being hidden forever.
   */
  const scopedDisposers = new Set();
  /** Which agent scope each retained disposer belongs to. */
  const disposerOwners = new WeakMap();
  /** The disposers installed on one agent scope, for disposal-time cleanup. */
  const scopedDisposersByContext = new WeakMap();

  /** Remember a scoped effect's disposer; return the same value to the caller. */
  function ownScopedEffect(scope, factory, label) {
    const dispose = scope.effect(factory, label);
    if (typeof dispose === "function") {
      scopedDisposers.add(dispose);
      disposerOwners.set(dispose, scope);
      let owned = scopedDisposersByContext.get(scope);
      if (owned === undefined) {
        owned = new Set();
        scopedDisposersByContext.set(scope, owned);
      }
      owned.add(dispose);
    }
    return dispose;
  }

  /** Dispose one scoped effect and stop retaining its cleanup. */
  function releaseScopedEffect(dispose) {
    if (typeof dispose !== "function") return;
    scopedDisposers.delete(dispose);
    const owner = disposerOwners.get(dispose);
    if (owner !== undefined) {
      disposerOwners.delete(dispose);
      const owned = scopedDisposersByContext.get(owner);
      if (owned !== undefined) {
        owned.delete(dispose);
        if (owned.size === 0) scopedDisposersByContext.delete(owner);
      }
    }
    try {
      dispose();
    } catch {
      /* an already-disposed agent scope is harmless */
    }
  }

  /**
   * Release every scoped registration attached to one disposed agent.
   *
   * `scopedDisposers` is a strong Set, so keeping every Session's cleanup for
   * the life of the Host would also keep each scope (and its Session) reachable.
   * `agent/disposed` fires after the scope has already unwound, so this is the
   * earliest point at which the retained cleanup can be dropped safely.
   * @param agent - the agent that left the registry.
   */
  function releaseAgentScope(agent) {
    const scope = agent?.ctx;
    if (scope === undefined || scope === null || typeof scope !== "object") return;
    const owned = scopedDisposersByContext.get(scope);
    if (owned !== undefined) {
      for (const dispose of [...owned]) releaseScopedEffect(dispose);
      scopedDisposersByContext.delete(scope);
    }
    // A mask whose effect answered no disposer is still forgotten here; the
    // scope is already gone, so there is nothing left to restrict.
    maskedScopes.delete(scope);
    attachedContexts.delete(scope);
  }

  /**
   * The live tool mask installed on one agent scope, if any.
   *
   * A WeakMap keeps the scope collectible while still allowing a mode change to
   * find and remove the exact restriction it installed.
   */
  const maskedScopes = new WeakMap();

  ctx.effect(
    () =>
      ctx.on("agent/disposed", (payload) => {
        const agent = payload?.agent;
        const sessionId = typeof agent?.id === "string" ? agent.id : undefined;
        if (sessionId !== undefined) {
          // These are retry/receipt sets, not configuration: a reopened agent
          // gets fresh instances and must not inherit a stale retry entry.
          pendingAttach.delete(sessionId);
          repairedSessions.delete(sessionId);
          titleChecked.delete(sessionId);
        }
        releaseAgentScope(agent);
      }),
    "workbench: agent disposal",
  );

  /**
   * Mask the tools a chat-mode board must not offer.
   *
   * A Session counts as chat when EITHER signal says so, because the two cover
   * different moments:
   *
   *   - the PRESET the agent composed (`workbench-chat`) is settled before
   *     `agent/created` even fires, which is what covers a Session created a
   *     moment ago — the browser half only writes its id into the document after
   *     `sessions.create` returns;
   *   - the board's `mode` in the document covers a board switched to `chat`
   *     after its Session was opened.
   *
   * Only the agent's OWN scope is masked, so every other Session on the machine —
   * including a `standard` board beside it — keeps its full tool set. The mask is
   * installed in the Host rather than as a preset row because a preset row whose
   * module cannot be resolved fails the WHOLE preset, which would make the board
   * unopenable instead of merely chatty.
   * @param ctx - host plugin context.
   * @param agent - the live agent.
   * @param sessionId - its Session id.
   */
  function hideTools(ctx, agent, sessionId) {
    const scoped = agent.ctx;
    if (scoped === undefined || scoped === null || typeof scoped !== "object") return;
    const chat = isChatBoard(ctx, agent, sessionId);
    // A board can be switched from chat back to standard while its Session is
    // live. The restriction is an effect on the agent scope, so it has to be
    // released, not merely forgotten: otherwise the Session would keep every
    // tool hidden until it was recreated.
    if (!chat) {
      const previous = maskedScopes.get(scoped);
      if (previous !== undefined) {
        releaseScopedEffect(previous);
        maskedScopes.delete(scoped);
      }
      return;
    }
    if (maskedScopes.has(scoped)) return;
    const tools = scoped.get?.("tools") ?? ctx.get("tools");
    if (tools === undefined || tools === null || typeof tools.restrict !== "function") return;
    try {
      // `allow: []` keeps nothing: every tool this scope INHERITS is hidden. A
      // `deny` list would have to be maintained, and a tool added by a future
      // release would silently reappear in a preset that must offer none.
      const dispose = ownScopedEffect(
        scoped,
        () => tools.restrict({ allow: [] }),
        "workbench: chat mode offers no tools",
      );
      // Mark only after the restriction was accepted; a failed attempt must be
      // retried on the next reconciliation pass. The map value may be null when
      // a test doubles `effect()` without a disposer; `has()` still prevents a
      // duplicate registration.
      maskedScopes.set(scoped, typeof dispose === "function" ? dispose : null);
    } catch {
      /* a Host without a tool registry simply has no tools to hide */
    }
  }

  /**
   * Whether this Session is a chat-mode board.
   * @param ctx - host plugin context.
   * @param agent - the live agent.
   * @param sessionId - its Session id.
   * @returns whether the board promises plain conversation.
   */
  function isChatBoard(ctx, agent, sessionId) {
    if (modeBySession.get(sessionId) === "chat") return true;
    if (modeBySession.has(sessionId)) return false;
    // Not (yet) recorded under a board: fall back to the preset the agent runs,
    // which is the only signal available while a Session is still being opened.
    const presets = ctx.get("agentPresets");
    if (presets === undefined || presets === null || typeof presets.composedPreset !== "function") return false;
    try {
      return presets.composedPreset(agent.ctx) === CHAT_PRESET;
    } catch {
      return false;
    }
  }

  /**
   * Attach to any Session that arrived before the document was readable.
   * @param agent - the live agent.
   * @param sessionId - its Session id, equal to the agent id.
   */
  function attachPinned(agent, sessionId) {
    const scoped = agent.ctx;
    if (scoped === undefined || scoped === null || typeof scoped !== "object" || attachedContexts.has(scoped)) return;
    const systemPrompt = scoped.get?.("systemPrompt") ?? ctx.get("systemPrompt");
    if (systemPrompt === undefined || systemPrompt === null) return;
    try {
      // A function renders per assembly, so a pin changed while the board is
      // open is used on its very next message.
      ownScopedEffect(
        scoped,
        () =>
          systemPrompt.context({
            name: "workbench:pinned",
            order: 1000,
            required: true,
            text: () => pinnedBySession.get(sessionId)?.cached ?? pinnedBySession.get(sessionId)?.text ?? "",
          }),
        "workbench: pinned context",
      );
      // Only a context that accepted the contribution is marked; an effect that
      // threw leaves the Session retryable.
      attachedContexts.add(scoped);
    } catch {
      // `agent/created` is a serial creation listener: an exception here would
      // fail the Session itself. Leave the Session pending and try again after
      // the next document reconciliation.
    }
  }

  /**
   * Attach to every Session that is waiting for its board's configuration.
   *
   * A Session that could not be attached is KEPT in the set: `agent/created`
   * never fires again for that agent, so dropping it here would strand the
   * Session forever. It leaves the set only once its context really exists.
   * @param ctx - host context.
   */
  async function attachPending(ctx) {
    if (disposed || pendingAttach.size === 0) return;
    const agents = ctx.get("agents");
    if (agents === undefined || agents === null || typeof agents.get !== "function") return;
    for (const sessionId of [...pendingAttach]) {
      const agent = agents.get(sessionId);
      // A Session whose live agent is gone can never be attached again; keeping
      // its id would retain the set (and its string) for the life of the Host.
      if (agent === undefined || agent === null) {
        pendingAttach.delete(sessionId);
        continue;
      }
      // `agent/created` fires for every Session on the machine, not only this
      // plugin's. A Session is a workbench Session only when the document
      // records it; attaching an empty context to an ordinary conversation
      // would leak a plugin-owned prompt contribution into it. A session that
      // is merely late being recorded is caught by `reconcileLiveSessions`
      // after the next document write, so dropping it from this retry list is
      // safe.
      if (!modeBySession.has(sessionId)) {
        pendingAttach.delete(sessionId);
        continue;
      }
      // The document has settled now, so a pinned board-name title is detectable.
      repairTitle(ctx, agent, sessionId);
      // A board switched to `chat` after this Session opened must lose its tools
      // too, not just gain the prompt.
      hideTools(ctx, agent, sessionId);
      // Attach even when the board currently pins nothing: the CONTEXT is the
      // stable contributor, and its text is read per assembly. That is what makes
      // a prompt or a skill saved later reach this Session on its next message.
      attachPinned(agent, sessionId);
      // Keep a Session without a scoped context in the retry list: dropping it
      // here would strand it forever, because `agent/created` never fires again.
      if (agent.ctx !== undefined && attachedContexts.has(agent.ctx)) pendingAttach.delete(sessionId);
    }
  }

  /**
   * Reconcile every live Session the document records.
   *
   * `agent/created` is the normal path, but it does not cover a Session that was
   * ALREADY LIVE when this plugin loaded — a profile reload, an HMR replacement,
   * or a Host that started serving before the document was readable. Those agents
   * never fire that event again, so title repair, tool masking and the prompt
   * context are all applied here in one pass over the agent list.
   *
   * Only Sessions the document records receive the prompt context; title repair
   * and tool masking are themselves scoped by their own per-Session maps, so a
   * foreign conversation is never touched.
   * @param ctx - host context.
   */
  function reconcileLiveSessions(ctx) {
    if (disposed) return;
    const agents = ctx.get("agents");
    if (agents === undefined || agents === null || typeof agents.list !== "function") return;
    for (const agent of agents.list()) {
      const sessionId = typeof agent?.id === "string" ? agent.id : undefined;
      if (sessionId === undefined) continue;
      repairTitle(ctx, agent, sessionId);
      hideTools(ctx, agent, sessionId);
      // modeBySession carries one entry per recorded Session, so it is the exact
      // set of Sessions a board owns — foreign conversations get no context.
      if (modeBySession.has(sessionId)) attachPinned(agent, sessionId);
    }
  }

  /**
   * Warm the rendered text (prompt + skill bodies) for every pinned Session.
   *
   * One scan serves every pin: skill bodies are read per Session, but the
   * catalog they are looked up in does not change between Sessions, so
   * discovering it once keeps a save from issuing a directory scan per board.
   * The rendered text is shared too: every Session on one board carries the same
   * prompt and skills, so the skill files are read once per board, not once per
   * conversation.
   *
   * The short-lived caches below matter because every document save calls this
   * function, and most saves (a ticked to-do, a renamed board) leave the pin
   * configuration untouched. Without them each save re-walked every skill
   * directory and re-read every enabled SKILL.md while the user waited for the
   * save acknowledgement.
   */
  const WARM_TTL = 5000;
  /** Distinct prompt/skill combinations kept; old entries must not pile up. */
  const MAX_WARM_RENDERED = 256;
  let warmCatalog;
  let warmCatalogAt = 0;
  const warmRendered = new Map();
  /** Invalidates a slower render pass when a newer document/skill change starts. */
  let warmPass = 0;
  const warmPinned = async () => {
    if (disposed) return;
    const pass = (warmPass += 1);
    const current = () => !disposed && pass === warmPass;
    const now = Date.now();
    // Only scan when some pin actually enables a skill. Walk the map instead
    // of copying every entry into an array first: a save can touch many
    // Sessions and most boards have no skills at all.
    let needsCatalog = false;
    for (const entry of pinnedBySession.values()) {
      if (entry.skills.length > 0) {
        needsCatalog = true;
        break;
      }
    }
    let catalog;
    let catalogFailed = false;
    if (needsCatalog) {
      if (warmCatalog !== undefined && now - warmCatalogAt < WARM_TTL) {
        catalog = warmCatalog;
      } else {
        try {
          catalog = await discoverSkills(ctx);
        } catch {
          // An unavailable catalog service must not erase the bodies already
          // rendered for this request. Keep the last successful catalog and
          // retry after the TTL instead of caching an empty result.
          catalog = warmCatalog;
          catalogFailed = true;
        }
        // Discovery is async and a newer pass may have started (or the plugin
        // may have been unloaded) meanwhile; do not seed a dead pass's cache
        // with a fresh directory walk.
        if (!current()) return;
        if (!catalogFailed) {
          warmCatalog = catalog;
          warmCatalogAt = now;
        }
      }
    }
    for (const entry of pinnedBySession.values()) {
      if (!current()) return;
      // `refreshPinned` already serialized this board's pin once; the fallback
      // keeps a hand-built entry (a test or a future call site) correct.
      const key = entry.key ?? JSON.stringify([entry.text, entry.skills]);
      const cached = warmRendered.get(key);
      if (cached !== undefined && now - cached.at < WARM_TTL) {
        // `Map.set` on an existing key does not move it to the end, so a
        // refreshed hot entry would otherwise be evicted first despite just
        // being used. Delete before re-inserting to make the cap act as LRU.
        warmRendered.delete(key);
        warmRendered.set(key, cached);
        entry.cached = cached.text;
        continue;
      }
      // A failed catalog discovery has no new skill bodies to render. Keep
      // the previous text (including its skill bodies) rather than overwriting
      // it with a prompt-only fallback until the next successful scan.
      if (catalog === undefined && entry.skills.length > 0) continue;
      let text;
      try {
        text = await renderPinned(ctx, entry, catalog);
      } catch {
        // Keep the last successful render rather than silently dropping the
        // skill bodies from the next message because one file read failed.
        text = entry.cached ?? entry.text;
      }
      if (!current()) return;
      warmRendered.delete(key);
      warmRendered.set(key, { text, at: now });
      if (warmRendered.size > MAX_WARM_RENDERED) {
        const oldest = warmRendered.keys().next();
        if (!oldest.done) warmRendered.delete(oldest.value);
      }
      entry.cached = text;
    }
  };

  // A skill install/removal is the one event that invalidates both caches
  // immediately; the TTL is only for edits made outside the registry.
  ctx.effect(
    () =>
      ctx.on("skills/change", () => {
        if (disposed) return;
        warmCatalog = undefined;
        warmCatalogAt = 0;
        warmRendered.clear();
        // The rendered text is cached on each pin separately. Re-render now,
        // keeping the previous text visible until the new bodies are ready, so
        // a skill installed/updated/removed while a board is open reaches its
        // next message instead of waiting for the next document save.
        warmPinned().catch(() => {
          /* a failed scan leaves the previous pin text in place */
        });
      }),
    "workbench: warm skill cache",
  );

  // Load the durable pins at startup: a board opened before any save still gets
  // its instruction, and `agent/created` has a cache to read from.
  ctx.effect(() => {
    let live = true;
    const epochAtStart = documentEpoch;
    readDocument()
      .then(async (document) => {
        // A write that landed while the startup read was in flight is newer
        // than this snapshot; let that write's own post-pass apply instead.
        if (!live || epochAtStart !== documentEpoch) return undefined;
        refreshPinned(document);
        if (!live || epochAtStart !== documentEpoch) return undefined;
        await warmPinned();
        if (!live || epochAtStart !== documentEpoch) return undefined;
        // Sessions that were created before this read settled can now attach.
        await attachPending(ctx);
        if (!live || epochAtStart !== documentEpoch) return undefined;
        // A Session that was already live never fires agent/created again.
        reconcileLiveSessions(ctx);
        return undefined;
      })
      .catch(() => {
        /* an unreadable document simply pins nothing */
      });
    return () => {
      live = false;
      disposed = true;
      // Agent-scoped effects outlive this plugin's own fiber. Release both the
      // pinned prompt contexts and any tool masks before dropping the maps, or
      // unloading the plugin would leave hidden tools and stale instructions on
      // every live Session it had touched.
      for (const dispose of [...scopedDisposers]) releaseScopedEffect(dispose);
      scopedDisposers.clear();
      // A disposed plugin must not keep Session ids and rendered prompts alive
      // through module-level maps; a reload starts from the durable document.
      pendingAttach.clear();
      pinnedBySession.clear();
      titleBySession.clear();
      modeBySession.clear();
      boardKeyBySession.clear();
      repairedSessions.clear();
      titleChecked.clear();
      warmCatalog = undefined;
      warmCatalogAt = 0;
      warmRendered.clear();
    };
  }, "workbench: pinned instruction bootstrap");

  const fence = (req, res) => {
    const connection = ctx.get("connection");
    if (connection === undefined || connection === null) {
      // `inject` should make this unreachable, but a missing trust service must
      // fail closed: these routes can read and rewrite durable user data.
      res.statusCode = 503;
      res.end("workbench trust service unavailable");
      return true;
    }
    const rejection = connection.requestRejection(req);
    if (rejection === undefined || rejection === null) return false;
    sendTrustFailure(res, rejection);
    return true;
  };

  /**
   * Rebuild the pins and re-render them after the document changed.
   *
   * A board's newly saved prompt or skills take effect on its very next message
   * instead of waiting for a new Session, and a Session that arrived before the
   * document was readable attaches now.
   * @param next - the document that was just stored.
   * @param epoch - the revision `writeDocument` assigned to that document.
   */
  async function afterDocumentChange(next, epoch) {
    const current = () => !disposed && (epoch === undefined || epoch === documentEpoch);
    try {
      // A slow render for an older save must not publish its pins after a
      // newer save has already refreshed the live maps. A teardown in flight
      // invalidates the whole pass for the same reason.
      if (!current()) return;
      refreshPinned(next);
      if (!current()) return;
      await warmPinned();
      if (!current()) return;
      await attachPending(ctx);
      if (!current()) return;
      reconcileLiveSessions(ctx);
    } catch {
      // The document is already stored. A Session whose service is unavailable
      // must not turn a successful save into a failed request the user retries.
    }
  }

  /**
   * Validate one model selection against the live LLM catalog.
   *
   * The same normalization `session/selectModel` performs: provider/model must
   * resolve, the effort must be one the model advertises, and an omitted effort
   * is materialized to the adapter's default. The result is detached and safe
   * to persist in the workbench document or append to a Session.
   * @param ctx - host plugin context.
   * @param input - provider, model, and optional reasoning effort.
   * @returns the normalized complete selection.
   * @throws when the model or effort is unavailable.
   */
  async function resolveModelSelection(ctx, input) {
    const llm = ctx.get("llm");
    if (llm === undefined || llm === null || typeof llm.resolveCallConfig !== "function") {
      throw new Error("model catalog service unavailable");
    }
    const resolved = await llm.resolveCallConfig({
      provider: input.provider,
      model: input.model,
      ...(input.reasoningEffort === undefined ? {} : { reasoningEffort: input.reasoningEffort }),
    });
    return {
      provider: resolved.provider,
      model: resolved.model,
      ...(resolved.reasoningEffort === undefined ? {} : { reasoningEffort: String(resolved.reasoningEffort) }),
    };
  }

  /**
   * Apply one complete selection to an existing Session without touching the
   * deployment default.
   *
   * `sessionController.selectModel` is intentionally not used here: it also
   * calls `agentDefaultModel.saveSelection`, which is the global-default side
   * effect the workbench must avoid. Since 0.2.2 the Session-local step is
   * `agent.model.select()`: it appends the durable `model/selection` event the
   * next request folds, leaving every deployment-wide setting alone.
   * @param ctx - host plugin context.
   * @param sessionId - Session that should remember this selection.
   * @param selection - already validated provider/model/effort.
   */
  async function applySessionModelSelection(ctx, sessionId, selection) {
    const sessionController = ctx.get("sessionController");
    if (
      sessionController === undefined ||
      sessionController === null ||
      typeof sessionController.resolveAgent !== "function"
    ) {
      throw new Error("session controller unavailable");
    }
    const found = await sessionController.resolveAgent(sessionId);
    if (found === undefined || found === null || found.error !== undefined || found.agent === undefined) {
      const failure = found?.error;
      throw failure instanceof Error ? failure : new Error(failure?.message ?? "session agent unavailable");
    }
    const model = found.agent.model;
    if (model === undefined || model === null || typeof model.select !== "function") {
      throw new Error("session-local model selection unavailable");
    }
    // `select` is synchronous in the shipped service today, but awaiting it
    // keeps a future async implementation from becoming an unhandled rejection
    // after the route has already answered.
    await model.select(selection);
  }

  /**
   * Route one workbench request to its branch.
   *
   * Split out of the registered handler so the handler can wrap the whole thing
   * in one failure boundary: every branch here may await a body read or a write,
   * and a rejection there must still produce a response.
   * @param req - incoming request.
   * @param res - response owning the answer.
   */
  async function handleRequest(req, res) {
    let path;
    try {
      const url = new URL(String(req.url ?? "/"), "http://workbench.invalid");
      path = url.pathname.slice(API_PREFIX.length) || "/";
    } catch {
      // A malformed request target is not a workbench route.
      sendFailure(res, 400, "bad-request", "无法解析的请求地址。");
      return;
    }
    const method = req.method ?? "GET";

    if (path === "/state" && method === "GET") {
      sendJson(res, 200, await readDocument());
      return;
    }
    if (path === "/state" && method === "POST") {
      const body = await readBody(req);
      if (body === null) {
        sendFailure(res, 413, "payload-too-large", "工作台状态过大。");
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendFailure(res, 400, "bad-request", "状态必须是 JSON。");
        return;
      }
      // A null or array body is not a document. Treating it as a fresh install
      // and writing the seed would silently erase every board, prompt, to-do and
      // note; reject it before normalization can touch the stored file.
      if (!isRecord(parsed) || !Array.isArray(parsed.boards)) {
        sendFailure(res, 400, "bad-request", "状态必须是一个包含 boards 数组的 JSON 对象。");
        return;
      }
      const document = normalizeDocument(parsed);
      let epoch;
      try {
        epoch = await serializeWrite(() => writeDocument(document));
      } catch (error) {
        if (error && error.code === "STATE_TOO_LARGE") {
          sendFailure(res, 413, "payload-too-large", "工作台状态过大。");
          return;
        }
        throw error;
      }
      await afterDocumentChange(document, epoch);
      sendJson(res, 200, { saved: true });
      return;
    }
    if (path === "/workspace" && method === "GET") {
      // The workbench's own working area, as the document configures it. The
      // directory is created here so the first board opened in a fresh install
      // does not fail on a missing path; an existing one is left untouched.
      // Settings reads the same answer, so the path it edits and the path a board
      // opens are never two different values.
      const configured = workspaceOf((await readDocument()).workspace);
      let exists = true;
      try {
        await mkdir(configured, { recursive: true });
      } catch {
        exists = false;
      }
      sendJson(res, 200, { path: configured, exists, fallback: DEFAULT_WORKSPACE });
      return;
    }
    if ((path === "/workspace" || path === "/workspace/ensure") && method === "POST") {
      // Validate a path before Settings stores it: a relative path or one that
      // cannot be created would only fail later, when a board tried to open and
      // the cause would look like a broken session.
      const body = await readBody(req, 8192);
      if (body === null) {
        sendFailure(res, 413, "payload-too-large", "路径过长。");
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendFailure(res, 400, "bad-request", "请求体必须是 JSON。");
        return;
      }
      // `ensureOnly` lets the browser ensure a board's working directory
      // without registering it as a Workspace or changing the document's
      // shared default. The normal POST keeps its Settings-save behaviour.
      const ensureOnly = path === "/workspace/ensure" || parsed?.ensureOnly === true;
      const wanted = text(parsed?.path).trim();
      if (wanted.length === 0) {
        sendFailure(res, 400, "invalid-path", "请填写工作区目录。");
        return;
      }
      if (wanted.length > MAX_WORKSPACE_PATH) {
        sendFailure(res, 400, "invalid-path", "工作区路径过长。");
        return;
      }
      if (!isAbsolute(wanted) || hasWindowsPathHazard(wanted)) {
        sendFailure(res, 400, "invalid-path", "请填写完整的绝对路径。");
        return;
      }
      // A UNC path names a directory on another machine. `mkdir` would then open
      // an outbound SMB connection and create a folder there, which is never what
      // "the workbench's working area" means — and a working area on a network
      // share is not a supported deployment.
      if (/^[\\/]{2}/.test(wanted)) {
        sendFailure(res, 400, "invalid-path", "请填写本机目录，不要使用网络共享路径。");
        return;
      }
      const target = resolve(wanted);
      // `resolve()` can lengthen a rooted path by the current drive prefix.
      // Re-run the same stored-value guard on the value the route will persist;
      // otherwise `mkdir` could succeed for a path normalization later drops.
      if (workspacePathOf(target).length === 0) {
        sendFailure(res, 400, "invalid-path", "请填写完整的绝对路径。");
        return;
      }
      let creatable = true;
      try {
        await mkdir(target, { recursive: true });
      } catch {
        creatable = false;
      }
      if (!creatable) {
        // The caller's own string is echoed, not the resolved path: the
        // resolution is the Host's, and reflecting it would confirm which
        // absolute directories exist on this machine.
        sendFailure(res, 400, "invalid-path", `无法创建目录：${wanted}`);
        return;
      }
      if (ensureOnly) {
        sendJson(res, 200, { path: target, exists: true, fallback: DEFAULT_WORKSPACE });
        return;
      }
      // Persist it: this route is what Settings writes through, so the stored
      // document — not just this answer — must carry the new path. The read and
      // the write happen inside one queued turn, so a concurrent save cannot land
      // between them and lose the path.
      let stored;
      try {
        stored = await updateDocument((current) =>
          normalizeDocument({ ...current, workspace: target }),
        );
      } catch (error) {
        if (error && error.code === "STATE_TOO_LARGE") {
          sendFailure(res, 413, "payload-too-large", "工作台状态过大。");
          return;
        }
        throw error;
      }
      await afterDocumentChange(stored.document, stored.epoch);
      sendJson(res, 200, { path: target, exists: true, fallback: DEFAULT_WORKSPACE });
      return;
    }
    if (path === "/session/model" && method === "POST") {
      const body = await readBody(req, 8192);
      if (body === null) {
        sendFailure(res, 413, "payload-too-large", "模型选择请求过大。");
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendFailure(res, 400, "bad-request", "模型选择请求必须是 JSON。");
        return;
      }
      const sessionId = text(parsed?.sessionId).trim();
      const modelSelection = modelSelectionOf(parsed?.modelSelection);
      if (sessionId.length === 0 || sessionId.length > MAX_ID || modelSelection === undefined) {
        sendFailure(res, 400, "bad-request", "模型选择请求缺少有效的会话或模型。");
        return;
      }
      let resolved;
      try {
        resolved = await resolveModelSelection(ctx, modelSelection);
        await applySessionModelSelection(ctx, sessionId, resolved);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // The client treats this code as a recoverable stale board setting:
        // it opens the Session with the deployment default and keeps the saved
        // selection for a later retry.
        sendFailure(res, 409, "model-unavailable", message);
        return;
      }
      sendJson(res, 200, { selected: resolved });
      return;
    }
    if (path === "/skills" && method === "GET") {
      sendJson(res, 200, { skills: await discoverSkills(ctx) });
      return;
    }
    sendFailure(res, 404, "not-found", "未知的工作台接口。");
  }

  // Remember a user's explicit model choice per board key. The native model
  // picker writes `model/selection` to the Session; this listener turns that
  // Session-local fact into the board's default for the next new conversation.
  // It deliberately ignores `request/header`: a normal request only records the
  // route it used and must not silently pin a board to the deployment default.
  ctx.effect(
    () =>
      ctx.on("session/event", (session, event) => {
        if (disposed || event?.type !== "model/selection") return;
        const sessionId = typeof session?.id === "string" ? session.id : undefined;
        const key = sessionId === undefined ? undefined : boardKeyBySession.get(sessionId);
        if (key === undefined) return;
        const selection = modelSelectionOf(event.data);
        if (selection === undefined) return;
        updateDocument((document) => {
          const bag = document.settings?.[key] ?? {};
          const current = modelSelectionOf(bag.modelSelection);
          if (sameModelSelection(current, selection)) return document;
          return {
            ...document,
            settings: {
              ...(document.settings ?? {}),
              [key]: { ...bag, modelSelection: selection },
            },
          };
        })
          .then(({ document, epoch }) => afterDocumentChange(document, epoch))
          .catch((error) => {
            // A model change must never break the chat. The Session already has
            // its durable selection; only the next conversation's convenience
            // default is lost until the next successful selection.
            console.error(
              "[workbench] model selection memory failed:",
              error instanceof Error ? error.message : String(error),
            );
          });
      }),
    "workbench: model selection memory",
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "prefix",
        path: API_PREFIX,
        handler: async (req, res) => {
          // Every branch below awaits I/O: a body read can reject when the client
          // aborts mid-upload, and a write can reject on a full or read-only disk.
          // Without this guard the handler's promise would reject before any
          // branch answers, leaving the request with no response at all. The fence
          // is inside the same boundary for the same reason: a broken connection
          // service must not leave the request hanging.
          try {
            if (fence(req, res)) return;
            await handleRequest(req, res);
          } catch (error) {
            // Keep the operational failure visible without printing a full
            // filesystem path or stack into every Host log line.
            const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
            console.error("[workbench] request failed:", detail);
            if (res.writableEnded || res.destroyed) return;
            // A response that already started cannot change status or body;
            // close it instead of throwing a second error in the catch path.
            if (res.headersSent) {
              res.end();
              return;
            }
            sendFailure(res, 500, "internal-error", "工作台请求失败。");
          }
        },
      }),
    "workbench: HTTP routes",
  );

  // The type assets travel on their own prefix: they are immutable, cacheable
  // and much larger than any API answer, so they must not share the no-store
  // policy the document routes use.
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "prefix",
        path: FONT_PREFIX,
        handler: async (req, res) => {
          try {
            if (fence(req, res)) return;
            await serveFont(req, res);
          } catch {
            if (res.writableEnded || res.destroyed) return;
            if (res.headersSent) {
              res.end();
              return;
            }
            res.statusCode = 500;
            res.end("font read failed");
          }
        },
      }),
    "workbench: font routes",
  );
}

export { apply, inject, API_PREFIX };
