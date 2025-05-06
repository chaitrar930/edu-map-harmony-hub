import sqlite3
conn = sqlite3.connect('instance/copomapping.db')
print("Tables:", conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall())
print("\nBatch table structure:", conn.execute("PRAGMA table_info(batch)").fetchall())
conn.close()