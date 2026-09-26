"""
core/vector_store.py
In-memory Vector Store with TF-IDF Vectorization and Cosine Similarity Matching.
Enables Semantic Retrieval-Augmented Generation (RAG) without external API dependencies.
"""

import math
import re
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

class VectorStore:
    def __init__(self, kb_dir: Optional[Path] = None):
        self.documents: List[Dict[str, Any]] = []
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.doc_vectors: List[Dict[str, float]] = []
        self.kb_dir = kb_dir or (Path(__file__).parent.parent / "knowledge_base")
        self.load_default_knowledge_base()

    def _tokenize(self, text: str) -> List[str]:
        """Normalize, lowercase, and tokenize text into words."""
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        tokens = cleaned.split()
        # Common English stop words
        stopwords = {
            "a", "about", "above", "after", "again", "against", "all", "am", "an",
            "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before",
            "being", "below", "between", "both", "but", "by", "can", "cannot", "could",
            "did", "do", "does", "doing", "don't", "down", "during", "each", "few", "for",
            "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers",
            "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it",
            "its", "itself", "me", "more", "most", "my", "myself", "no", "nor", "not", "of",
            "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves",
            "out", "over", "own", "same", "she", "should", "so", "some", "such", "than",
            "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these",
            "they", "this", "those", "through", "to", "too", "under", "until", "up", "very",
            "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom",
            "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
        }
        return [t for t in tokens if len(t) > 2 and t not in stopwords]

    def _compute_tf(self, tokens: List[str]) -> Dict[str, float]:
        """Compute Term Frequency (TF) for a token list."""
        if not tokens:
            return {}
        counts: Dict[str, int] = {}
        for token in tokens:
            counts[token] = counts.get(token, 0) + 1
        total = len(tokens)
        return {term: count / total for term, count in counts.items()}

    def _rebuild_index(self):
        """Rebuild IDF and document vectors for all indexed documents."""
        N = len(self.documents)
        if N == 0:
            self.vocabulary = {}
            self.idf = {}
            self.doc_vectors = []
            return

        doc_tfs = []
        doc_freq: Dict[str, int] = {}

        for doc in self.documents:
            full_text = f"{doc.get('title', '')} {doc.get('category', '')} {doc.get('content', '')}"
            tokens = self._tokenize(full_text)
            tf = self._compute_tf(tokens)
            doc_tfs.append(tf)
            for term in set(tokens):
                doc_freq[term] = doc_freq.get(term, 0) + 1

        self.vocabulary = {term: idx for idx, term in enumerate(doc_freq.keys())}
        self.idf = {
            term: math.log((1 + N) / (1 + df)) + 1.0
            for term, df in doc_freq.items()
        }

        self.doc_vectors = []
        for tf in doc_tfs:
            vec: Dict[str, float] = {}
            norm_sq = 0.0
            for term, tf_val in tf.items():
                tfidf = tf_val * self.idf.get(term, 1.0)
                vec[term] = tfidf
                norm_sq += tfidf * tfidf
            norm = math.sqrt(norm_sq) or 1.0
            # Unit normalized vector
            unit_vec = {t: v / norm for t, v in vec.items()}
            self.doc_vectors.append(unit_vec)

    def add_document(self, doc_id: str, title: str, content: str, category: str = "General", metadata: Optional[Dict[str, Any]] = None):
        """Add or update a document in the vector store."""
        for i, existing in enumerate(self.documents):
            if existing["id"] == doc_id:
                self.documents[i] = {
                    "id": doc_id,
                    "title": title,
                    "content": content,
                    "category": category,
                    "metadata": metadata or {},
                }
                self._rebuild_index()
                return

        self.documents.append({
            "id": doc_id,
            "title": title,
            "content": content,
            "category": category,
            "metadata": metadata or {},
        })
        self._rebuild_index()

    def search(self, query: str, top_k: int = 3, min_score: float = 0.05) -> List[Dict[str, Any]]:
        """Perform semantic cosine similarity search for a query string."""
        if not self.documents:
            return []

        q_tokens = self._tokenize(query)
        if not q_tokens:
            return []

        q_tf = self._compute_tf(q_tokens)
        q_vec: Dict[str, float] = {}
        norm_sq = 0.0
        for term, tf_val in q_tf.items():
            if term in self.idf:
                tfidf = tf_val * self.idf[term]
                q_vec[term] = tfidf
                norm_sq += tfidf * tfidf

        q_norm = math.sqrt(norm_sq) or 1.0
        q_unit = {t: v / q_norm for t, v in q_vec.items()}

        scores = []
        for i, doc_vec in enumerate(self.doc_vectors):
            dot_product = 0.0
            for term, q_val in q_unit.items():
                if term in doc_vec:
                    dot_product += q_val * doc_vec[term]

            # Boost if query tokens match in document title
            doc = self.documents[i]
            title_tokens = set(self._tokenize(doc["title"]))
            matches = set(q_tokens).intersection(title_tokens)
            if matches:
                dot_product += 0.15 * len(matches)

            if dot_product >= min_score:
                scores.append((dot_product, doc))

        # Sort descending by score
        scores.sort(key=lambda x: x[0], reverse=True)
        results = []
        for score, doc in scores[:top_k]:
            results.append({
                "id": doc["id"],
                "title": doc["title"],
                "category": doc["category"],
                "content": doc["content"],
                "similarity_score": round(min(1.0, score), 4),
                "metadata": doc["metadata"],
            })
        return results

    def load_default_knowledge_base(self):
        """Load built-in knowledge base JSON files."""
        if not self.kb_dir.exists():
            return
        for json_path in self.kb_dir.glob("*.json"):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    if isinstance(items, list):
                        for item in items:
                            self.documents.append({
                                "id": item.get("id", f"doc_{len(self.documents)}"),
                                "title": item.get("title", "Untitled Document"),
                                "category": item.get("category", "General"),
                                "content": item.get("content", ""),
                                "metadata": item.get("metadata", {}),
                            })
            except Exception as e:
                print(f"Error loading {json_path}: {e}")
        self._rebuild_index()

    def get_stats(self) -> Dict[str, Any]:
        """Return vector store statistics."""
        return {
            "total_documents": len(self.documents),
            "vocabulary_size": len(self.vocabulary),
            "categories": list(set(d.get("category", "General") for d in self.documents)),
        }
