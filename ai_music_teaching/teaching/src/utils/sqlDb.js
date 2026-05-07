import initSqlJs from 'sql.js';

const LOCAL_KEY = 'my_sqlite_db';
let dbInstance = null;

/**
 * 初始化数据库，恢复或新建
 */
export async function getDatabase() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`,
  });

  const saved = localStorage.getItem(LOCAL_KEY);
  if (saved) {
    try {
      const bytes = new Uint8Array(JSON.parse(saved));
      dbInstance = new SQL.Database(bytes);
    } catch (e) {
      console.warn('⚠️ 恢复数据库失败，将创建新数据库', e);
    }
  }

  if (!dbInstance) {
    dbInstance = new SQL.Database();
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS hello (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id TEXT,
        book_name TEXT,
        title TEXT,
        summary TEXT,
        time TEXT
      );
    `);
  }

  return dbInstance;
}

/**
 * 持久化数据库至 localStorage
 */
export function persistDatabase() {
  if (!dbInstance) return;
  const bytes = dbInstance.export();
  localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.from(bytes)));
}

/**
 * 插入一条记录（包含时间和标题）
 * @param {{ bookId: string, bookName: string, title: string, summary: string }}
 */
export function insertMessage({ bookId, bookName, title, summary }) {
  if (!dbInstance || !summary?.trim()) return;

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  dbInstance.run(
    `INSERT INTO hello (book_id, book_name, title, summary, time) VALUES (?, ?, ?, ?, ?);`,
    [bookId, bookName, title, summary, now]
  );
  persistDatabase();
}

/**
 * 查询全部记录（按 ID 倒序）
 * @returns {Array<{id, book_id, book_name, title, summary, time}>}
 */
export function queryAllMessages() {
  if (!dbInstance) return [];
  const result = dbInstance.exec(`SELECT * FROM hello ORDER BY id DESC;`);
  if (!result.length) return [];

  const { columns, values } = result[0];
  return values.map(row =>
    row.reduce((acc, val, idx) => {
      acc[columns[idx]] = val;
      return acc;
    }, {})
  );
}

/**
 * 查询某课本所有记录（按 ID 倒序）
 * @param {string} bookId
 * @returns {Array<{id, book_id, book_name, title, summary, time}>}
 */
export function queryMessagesByBookId(bookId) {
  if (!dbInstance || !bookId) return [];
  const result = dbInstance.exec(
    `SELECT * FROM hello WHERE book_id = ? ORDER BY id DESC;`,
    [bookId]
  );
  if (!result.length) return [];

  const { columns, values } = result[0];
  return values.map(row =>
    row.reduce((acc, val, idx) => {
      acc[columns[idx]] = val;
      return acc;
    }, {})
  );
}

/**
 * 查询所有书本（去重），只保留 book_id、book_name、time（最新时间）
 * @returns {Array<{book_id: string, book_name: string, time: string}>}
 */
export function queryAllBooks() {
  if (!dbInstance) return [];

  const result = dbInstance.exec(`
    SELECT book_id, book_name, MAX(time) AS time
    FROM hello
    GROUP BY book_id, book_name
    ORDER BY time DESC;
  `);

  if (!result.length) return [];

  const { columns, values } = result[0];
  return values.map(row =>
    row.reduce((acc, val, idx) => {
      acc[columns[idx]] = val;
      return acc;
    }, {})
  );
}

/**
 * 删除指定 ID 的记录
 * @param {number} id
 */
export function deleteMessageById(id) {
  if (!dbInstance || typeof id !== 'number') return;
  dbInstance.run(`DELETE FROM hello WHERE id = ?;`, [id]);
  persistDatabase();
}
