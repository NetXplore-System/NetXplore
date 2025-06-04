export const graphMetrics = [
  "Degree Centrality",
  "Betweenness Centrality",
  "Closeness Centrality",
  "Eigenvector Centrality",
  "PageRank Centrality"
];

export const centralityExplanations = {
  "Degree Centrality": {
    short: "Measures how many direct connections a node has.",
    latex: "C_D(v) = \\frac{\\deg(v)}{n - 1}",
  },
  "Betweenness Centrality": {
    short: "Measures how often a node lies on shortest paths.",
    latex: "C_B(v) = \\sum_{s \\neq v \\neq t} \\frac{\\sigma_{st}(v)}{\\sigma_{st}}",
  },
  "Closeness Centrality": {
    short: "Measures how close a node is to all other nodes.",
    latex: "C_C(v) = \\frac{n - 1}{\\sum_{t \\neq v} d(v, t)}",
  },
  "Eigenvector Centrality": {
    short: "Measures influence of a node via its neighbors.",
    latex: "A \\cdot x = \\lambda x",
  },
  "PageRank Centrality": {
    short: "Ranks nodes using link quantity and quality.",
    latex: "PR(v) = \\frac{1 - d}{N} + d \\sum_{u \\in M(v)} \\frac{PR(u)}{L(u)}",
  },
};
