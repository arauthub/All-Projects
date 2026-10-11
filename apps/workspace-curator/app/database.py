"""SQLite Storage Engine for WorkspaceCurator Pro."""

import sqlite3
import json
from typing import List, Optional, Dict, Any
from pathlib import Path
from app.config import DATABASE_PATH
from app.models import CuratedItem, WorkspaceProduct, UrgencyLevel, SentimentType, ActionItem, Entity


class Database:
    def __init__(self, db_path: str = DATABASE_PATH):
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS curated_items (
                    id TEXT PRIMARY KEY,
                    product TEXT NOT NULL,
                    source_title TEXT NOT NULL,
                    source_sender TEXT,
                    source_url TEXT,
                    resource_id TEXT,
                    raw_content TEXT,
                    received_at TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    key_takeaways TEXT,
                    action_items TEXT,
                    entities TEXT,
                    tags TEXT,
                    metrics TEXT,
                    sentiment TEXT,
                    urgency TEXT,
                    urgency_score INTEGER,
                    formats TEXT,
                    metadata TEXT
                );
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_received_at ON curated_items (received_at DESC);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_product ON curated_items (product);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_urgency ON curated_items (urgency);")

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            """)
            conn.commit()

    def save_item(self, item: CuratedItem) -> CuratedItem:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO curated_items (
                    id, product, source_title, source_sender, source_url, resource_id,
                    raw_content, received_at, summary, key_takeaways, action_items,
                    entities, tags, metrics, sentiment, urgency, urgency_score, formats, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item.id,
                item.product.value,
                item.source_title,
                item.source_sender,
                item.source_url,
                item.resource_id,
                item.raw_content,
                item.received_at,
                item.summary,
                json.dumps(item.key_takeaways),
                json.dumps([a.model_dump() if hasattr(a, "model_dump") else a.dict() for a in item.action_items]),
                json.dumps([e.model_dump() if hasattr(e, "model_dump") else e.dict() for e in item.entities]),
                json.dumps(item.tags),
                json.dumps(item.metrics),
                item.sentiment.value,
                item.urgency.value,
                item.urgency_score,
                json.dumps(item.formats),
                json.dumps(item.metadata),
            ))
            conn.commit()
        return item

    def get_item(self, item_id: str) -> Optional[CuratedItem]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM curated_items WHERE id = ?", (item_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_item(row)

    def list_items(
        self,
        product: Optional[WorkspaceProduct] = None,
        urgency: Optional[UrgencyLevel] = None,
        tag: Optional[str] = None,
        query: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[CuratedItem]:
        clauses = []
        params = []

        if product:
            clauses.append("product = ?")
            params.append(product.value)
        if urgency:
            clauses.append("urgency = ?")
            params.append(urgency.value)
        if tag:
            clauses.append("tags LIKE ?")
            params.append(f'%"{tag}"%')
        if query:
            clauses.append("(source_title LIKE ? OR summary LIKE ? OR raw_content LIKE ?)")
            wild = f"%{query}%"
            params.extend([wild, wild, wild])

        where_stmt = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        query_sql = f"""
            SELECT * FROM curated_items
            {where_stmt}
            ORDER BY received_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query_sql, params)
            rows = cursor.fetchall()
            return [self._row_to_item(r) for r in rows]

    def update_action_item_status(self, item_id: str, action_id: str, completed: bool) -> Optional[CuratedItem]:
        item = self.get_item(item_id)
        if not item:
            return None
        updated = False
        for action in item.action_items:
            if action.id == action_id:
                action.completed = completed
                updated = True
                break
        if updated:
            self.save_item(item)
        return item

    def delete_item(self, item_id: str) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM curated_items WHERE id = ?", (item_id,))
            deleted = cursor.rowcount > 0
            conn.commit()
            return deleted

    def get_stats(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM curated_items")
            total = cursor.fetchone()[0]

            cursor.execute("SELECT product, COUNT(*) FROM curated_items GROUP BY product")
            by_product = dict(cursor.fetchall())

            cursor.execute("SELECT urgency, COUNT(*) FROM curated_items GROUP BY urgency")
            by_urgency = dict(cursor.fetchall())

            cursor.execute("SELECT COUNT(*) FROM curated_items WHERE urgency IN ('high', 'critical')")
            high_urgency = cursor.fetchone()[0]

            return {
                "total_curated": total,
                "high_urgency_count": high_urgency,
                "by_product": by_product,
                "by_urgency": by_urgency
            }

    def set_setting(self, key: str, value: str):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
            conn.commit()

    def get_setting(self, key: str, default: Optional[str] = None) -> Optional[str]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
            row = cursor.fetchone()
            return row[0] if row else default

    def _row_to_item(self, row: sqlite3.Row) -> CuratedItem:
        raw_actions = json.loads(row["action_items"] or "[]")
        action_objects = [ActionItem(**a) for a in raw_actions]

        raw_entities = json.loads(row["entities"] or "[]")
        entity_objects = [Entity(**e) for e in raw_entities]

        return CuratedItem(
            id=row["id"],
            product=WorkspaceProduct(row["product"]),
            source_title=row["source_title"],
            source_sender=row["source_sender"],
            source_url=row["source_url"],
            resource_id=row["resource_id"],
            raw_content=row["raw_content"] or "",
            received_at=row["received_at"],
            summary=row["summary"],
            key_takeaways=json.loads(row["key_takeaways"] or "[]"),
            action_items=action_objects,
            entities=entity_objects,
            tags=json.loads(row["tags"] or "[]"),
            metrics=json.loads(row["metrics"] or "[]"),
            sentiment=SentimentType(row["sentiment"] or "neutral"),
            urgency=UrgencyLevel(row["urgency"] or "medium"),
            urgency_score=row["urgency_score"] or 50,
            formats=json.loads(row["formats"] or "{}"),
            metadata=json.loads(row["metadata"] or "{}"),
        )


# Global Database Instance
db = Database()
