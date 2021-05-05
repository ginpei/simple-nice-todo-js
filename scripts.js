// @ts-check

// -------------------------------------------------------------
// 型

/**
 * アプリの情報。
 * @typedef {{
 *   hideComplete: boolean;
 *   sortType: SortType;
 *   tasks: TaskRecord[];
 * }} Store
 */

/**
 * 一覧項目ひとつ分。
 * @typedef {{
 *   createdAt: number;
 *   complete: boolean;
 *   id: string;
 *   title: string;
 * }} TaskRecord
 */

/**
 * 並び替え戦略の識別子。
 * @typedef {
    | "createdAt-down"
    | "createdAt-up"
    | "name-down"
    | "name-up"
 * } SortType
 */

// -------------------------------------------------------------
// 全体で利用する変数

/**
 * 保存時の名前。
 * DevTools > Application > Local Storage > file://
 */
const storeKey = "simple-nice-todo-js";

/**
 * 画面で使う情報。
 * @type {Store}
 */
let store = createInitialStore();

/** @type {HTMLFormElement} */
const elForm = ($("#inputForm"));
/** @type {HTMLSelectElement} */
const elSortType = ($("#sortType"));
/** @type {HTMLInputElement} */
const elHideComplete = ($("#hideComplete"));
/** @type {HTMLDivElement} */
const elTaskList = ($("#taskList"));

// -------------------------------------------------------------
// 開始！

main();

// -------------------------------------------------------------
// ある時点で実行されるもの

/**
 * エントリーポイント。
 */
function main() {
  load();

  elForm.addEventListener("submit", onNewTaskSubmit);
  elSortType.addEventListener("change", onSortTypeChange);
  elHideComplete.addEventListener("change", onHideCompleteChange);

  render();
}

/**
 * 新規フォーム送信時の処理。
 * @param {Event} event
 */
function onNewTaskSubmit(event) {
  event.preventDefault();

  const newTask = getNewTaskInput();

  // 情報更新
  addTask(newTask);
  save();

  // 画面更新
  resetNewTaskForm();
  render();
}

/**
 * 並び替え変更時の処理。
 */
function onSortTypeChange() {
  // 情報更新
  /** @type {SortType} */
  const sortType = (elSortType.value);
  setSortType(sortType);
  save();

  // 画面更新
  render();
}

/**
 * 完了を隠す設定変更時の処理。
 */
function onHideCompleteChange() {
  // 情報更新
  const hideComplete = elHideComplete.checked;
  setHideComplete(hideComplete);
  save();

  // 画面更新
  render();
}

/**
 * 一覧項目の完了チェックボックス変更時の処理。
 * @param {string} id
 * @param {boolean} checked
 */
function onTaskCompleteChange(id, checked) {
  // 情報更新
  updateTask(id, { complete: checked });
  save();

  // 画面更新
  render();
}

/**
 * 一覧項目の編集ボタンクリック時の処理。
 * @param {string} id
 */
function onTaskEditClick(id) {
  const task = findTaskById(id);
  if (!task) {
    throw new Error();
  }

  const title = window.prompt("内容", task.title);
  if (!title) {
    return;
  }

  // 情報更新
  updateTask(id, { title });
  save();

  // 画面更新
  render();
}

/**
 * 一覧項目の削除ボタンクリック時の処理。
 * @param {string} id
 */
function onTaskDeleteClick(id) {
  const ok = window.confirm("削除しますか？");
  if (!ok) {
    return;
  }

  // 情報更新
  removeTask(id);
  save();

  // 画面更新
  render();
}

// -------------------------------------------------------------
// 画面系

/**
 * 現在の情報に合わせて画面を描画する。
 */
function render() {
  renderSortType(store.sortType);

  renderHideComplete(store.hideComplete);

  const filtered = filteredTasks(store.tasks, store.hideComplete);
  const sorted = getSortedTasks(store.sortType, filtered);
  renderList(sorted);
}

/**
 * 順序設定を描画する。
 * @param {SortType} sortType
 */
function renderSortType(sortType) {
  elSortType.value = sortType;
}

/**
 * 隠す設定を描画する。
 * @param {boolean} hideComplete
 */
function renderHideComplete(hideComplete) {
  elHideComplete.checked = hideComplete;
}

/**
 * 一覧を描画する。
 * @param {TaskRecord[]} tasks
 */
function renderList(tasks) {
  elTaskList.innerHTML = "";

  tasks.forEach((task) => {
    const el = createElTask(task);
    elTaskList.append(el);
  });
}

/**
 * 入力フォームを空にする。
 */
function resetNewTaskForm() {
  elForm.reset();
}

/**
 * フォームの入力値を返す。
 * @returns {TaskRecord}
 */
function getNewTaskInput() {
  /** @type {HTMLInputElement} */
  const elTitle = ($("[name='title']", elForm));
  const title = elTitle.value;

  return {
    createdAt: 0,
    complete: false,
    id: "",
    title,
  };
}

/**
 * タスク 1 行分の要素を生成して返す。
 * @param {TaskRecord} task
 * @return {HTMLDivElement}
 */
function createElTask(task) {
  // こうやって DOM API を使って構築するの面倒なので、
  // 本来なら React なり Lit なりライブラリーを使いたい

  const el = document.createElement("div");
  el.classList.add("TaskItem");
  el.classList.add("u-boxListItem");

  const elLabel = document.createElement("label");
  elLabel.classList.add("TaskItem-label");
  el.append(elLabel);

  const elCheckboxWrapper = document.createElement("span");
  elCheckboxWrapper.classList.add("TaskItem-checkboxCell");
  elLabel.append(elCheckboxWrapper);

  const elCheckbox = document.createElement("input");
  elCheckbox.type = "checkbox";
  elCheckbox.checked = task.complete;
  elCheckbox.onclick = () => onTaskCompleteChange(task.id, elCheckbox.checked);
  elCheckboxWrapper.append(elCheckbox);

  const elTitle = document.createElement("span");
  elTitle.classList.add("TaskItem-titleCell");
  elTitle.textContent = task.title;
  elLabel.append(elTitle);

  const elEdit = document.createElement("button");
  elEdit.classList.add("u-button-ghost");
  elEdit.textContent = "✏️️";
  elEdit.title = "Edit";
  elEdit.onclick = () => onTaskEditClick(task.id);
  el.append(elEdit);

  const elDelete = document.createElement("button");
  elDelete.classList.add("u-button-ghost");
  elDelete.textContent = "🗑️";
  elDelete.title = "Delete";
  elDelete.onclick = () => onTaskDeleteClick(task.id);
  el.append(elDelete);

  return el;
}

/**
 * `querySelector()` の短縮版。
 * @param {string} selector
 * @param {Element | Document} from
 */
function $(selector, from = document) {
  const el = from.querySelector(selector);
  if (!el) {
    throw new Error(`"${selector}" not found`);
  }

  if (!(el instanceof HTMLElement)) {
    throw new Error(`"${selector}" is not an HTML element`);
  }

  return el;
}

// -------------------------------------------------------------
// 情報系

function save() {
  try {
    const json = JSON.stringify(store);
    window.localStorage.setItem(storeKey, json);
  } catch (error) {
    printError(error);
  }
}

function load() {
  try {
    const json = window.localStorage.getItem(storeKey);
    if (json) {
      store = JSON.parse(json);
    } else {
      store = createInitialStore();
    }
  } catch (error) {
    printError(error);
  }
}

/**
 * アプリが持つ情報の初期値を生成して返す。
 * @returns {Store}
 */
function createInitialStore() {
  return {
    hideComplete: false,

    sortType: "createdAt-down",

    tasks: [
      {
        createdAt: Date.now(),
        complete: false,
        id: generateId(),
        title: "なんかおもしろいこという",
      },
      {
        createdAt: Date.now() - 2,
        complete: true,
        id: generateId(),
        title: "Say hello to the world!",
      },
      {
        createdAt: Date.now() - 1,
        complete: true,
        id: generateId(),
        title: "おいしいお寿司をたべる",
      },
    ],
  };
}

/**
 * ID で一覧項目から 1 件取得して返す。
 * @param {string} id
 * @returns {TaskRecord | undefined}
 */
function findTaskById(id) {
  return store.tasks.find((v) => v.id === id);
}

/**
 * 1 件追加する。
 * @param {TaskRecord} task
 */
function addTask(task) {
  const createdAt = Date.now();
  const id = generateId();
  store.tasks.push({ ...task, createdAt, id });
}

/**
 * タスクの情報を更新する。
 * @param {string} id
 * @param {Partial<TaskRecord>} updates
 */
function updateTask(id, updates) {
  const task = findTaskById(id);
  if (!task) {
    throw new Error(`Task "${id}" not found`);
  }

  if ("complete" in updates) {
    task.complete = updates.complete;
  }

  if ("title" in updates) {
    task.title = updates.title;
  }
}

/**
 * 1 件削除する。
 * @param {string} id
 */
function removeTask(id) {
  const updatedList = store.tasks.filter((v) => v.id !== id);
  store.tasks = updatedList;
}

/**
 * 並び替え戦略を更新する。
 * @param {SortType} sortType
 */
function setSortType(sortType) {
  store.sortType = sortType;
}

/**
 * 完了を隠す設定を更新する。
 * @param {boolean} hideComplete
 */
function setHideComplete(hideComplete) {
  store.hideComplete = hideComplete;
}

/**
 * 一覧をフィルターして返す。
 * @param {readonly TaskRecord[]} tasks
 * @param {boolean} hideComplete
 */
function filteredTasks(tasks, hideComplete) {
  if (!hideComplete) {
    return tasks;
  }

  const filtered = tasks.filter((v) => !v.complete);
  return filtered;
}

/**
 * 指定の戦略で並び替えた一覧を返す。
 * @param {SortType} sortType
 * @param {readonly TaskRecord[]} tasks
 */
function getSortedTasks(sortType, tasks) {
  const comparator = getSortComparator(sortType);
  return [...tasks].sort(comparator);
}

/**
 * 並び替え戦略ごとの比較関数を返す。
 * `getSortedTasks()` で利用する。
 * @param {SortType} sortType
 * @returns {(v: TaskRecord, u: TaskRecord) => number}
 */
function getSortComparator(sortType) {
  if (sortType === "createdAt-down") {
    return (v, u) => u.createdAt - v.createdAt;
  }
  if (sortType === "createdAt-up") {
    return (v, u) => v.createdAt - u.createdAt;
  }

  if (sortType === "name-down") {
    return (v, u) => u.title.localeCompare(v.title);
  }
  if (sortType === "name-up") {
    return (v, u) => v.title.localeCompare(u.title);
  }

  throw new Error(`Unknown sort type "${sortType}"`);
}

/**
 * ランダムな ID を生成して返す。
 */
function generateId() {
  return Math.random().toFixed(32).slice(2);
}

// -------------------------------------------------------------
// その他

/**
 * @param {Error} error
 */
function printError(error) {
  console.error(error);
}
