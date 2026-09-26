"""
tests/test_vector_store.py
Unit tests for In-Memory Vector Store and Semantic Cosine Retrieval.
"""

import unittest
from core.vector_store import VectorStore

class TestVectorStore(unittest.TestCase):
    def setUp(self):
        self.vs = VectorStore()

    def test_default_knowledge_base_loaded(self):
        stats = self.vs.get_stats()
        self.assertGreaterEqual(stats["total_documents"], 10)
        self.assertGreater(stats["vocabulary_size"], 100)

    def test_search_accuracy(self):
        results = self.vs.search("Google Cloud Run serverless container", top_k=3)
        self.assertTrue(len(results) > 0)
        top_match = results[0]
        self.assertIn("Cloud Run", top_match["title"])
        self.assertGreater(top_match["similarity_score"], 0.2)

    def test_add_custom_document(self):
        self.vs.add_document(
            doc_id="custom-microservice-doc",
            title="Custom Resilient Microservice Design",
            content="Microservices should be stateless and horizontally scalable with gRPC communication.",
            category="Testing"
        )
        results = self.vs.search("gRPC horizontally scalable", top_k=1)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], "custom-microservice-doc")

if __name__ == "__main__":
    unittest.main()
