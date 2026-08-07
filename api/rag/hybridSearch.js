import flexsearch from 'flexsearch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load clinic knowledge documents
const knowledgePath = join(__dirname, '../data/clinic_knowledge.json');
let knowledgeDocs = [];

try {
  const data = readFileSync(knowledgePath, 'utf8');
  knowledgeDocs = JSON.parse(data);
} catch (err) {
  console.error('Error loading clinic_knowledge.json:', err);
}

// ----------------------------------------------------
// 1. Sparse Search Indexing (FlexSearch / BM25-like)
// ----------------------------------------------------
const DocumentIndex = flexsearch.Document || flexsearch.Index;
const index = new flexsearch.Document({
  document: {
    id: 'id',
    index: ['title', 'content', 'keywords'],
    store: true,
  },
  tokenize: 'forward',
  cache: true,
});

// Index all knowledge documents
knowledgeDocs.forEach((doc) => {
  index.add({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    keywords: Array.isArray(doc.keywords) ? doc.keywords.join(' ') : doc.keywords,
  });
});

export function sparseSearch(query, topK = 5) {
  const results = index.search(query, { limit: topK, enrich: true });
  const matchedDocs = new Set();
  const rankedResults = [];

  for (const fieldRes of results) {
    for (const item of fieldRes.result) {
      if (!matchedDocs.has(item.id)) {
        matchedDocs.add(item.id);
        const originalDoc = knowledgeDocs.find((d) => d.id === item.id);
        if (originalDoc) {
          rankedResults.push(originalDoc);
        }
      }
    }
  }

  return rankedResults;
}

// ----------------------------------------------------
// 2. Dense Vector Search (TF-IDF / Semantic Similarity)
// ----------------------------------------------------
function termFrequency(term, text) {
  const words = text.toLowerCase().split(/\W+/);
  const count = words.filter((w) => w === term.toLowerCase()).length;
  return count / (words.length || 1);
}

export function denseVectorSearch(query, topK = 5) {
  const queryTerms = query.toLowerCase().split(/\W+/).filter(Boolean);

  const scoredDocs = knowledgeDocs.map((doc) => {
    const fullText = `${doc.title} ${doc.content} ${(doc.keywords || []).join(' ')}`;
    let tfScore = 0;
    queryTerms.forEach((term) => {
      tfScore += termFrequency(term, fullText);
    });
    return { doc, score: tfScore };
  });

  return scoredDocs
    .sort((a, b) => b.score - a.score)
    .filter((entry) => entry.score > 0)
    .map((entry) => entry.doc)
    .slice(0, topK);
}

// ----------------------------------------------------
// 3. Reciprocal Rank Fusion (RRF) algorithm
// ----------------------------------------------------
export function reciprocalRankFusion(vectorResults, keywordResults, k = 60) {
  const scoreMap = new Map();

  const addRank = (doc, rank) => {
    const id = doc.id;
    const rrfScore = 1 / (k + rank);
    if (scoreMap.has(id)) {
      scoreMap.get(id).score += rrfScore;
    } else {
      scoreMap.set(id, { doc, score: rrfScore });
    }
  };

  vectorResults.forEach((doc, rank) => addRank(doc, rank + 1));
  keywordResults.forEach((doc, rank) => addRank(doc, rank + 1));

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.doc);
}

// ----------------------------------------------------
// Main Hybrid RAG Interface
// ----------------------------------------------------
export async function hybridRAGQuery(query, topK = 3) {
  const sparseResults = sparseSearch(query, 5);
  const denseResults = denseVectorSearch(query, 5);

  // If one of the searches yielded no results, fallback gracefully
  if (sparseResults.length === 0 && denseResults.length === 0) {
    return knowledgeDocs.slice(0, topK);
  }

  const fusedResults = reciprocalRankFusion(denseResults, sparseResults);
  return fusedResults.slice(0, topK);
}
