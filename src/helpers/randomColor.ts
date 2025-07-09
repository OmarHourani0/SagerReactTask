const DEFAULT_COLORS = [
  "#2196F3", // Soft blue
  "#FFC107", // Warm amber
  "#9C27B0", // Deep purple
  "#FF7043", // Soft orange
  "#607D8B", // Blue grey
  "#795548", // Earthy brown
  "#3F51B5", // Indigo
  "#8BC34A", // Olive green
  "#00ACC1", // Cool teal
  "#F06292", // Desaturated pink
  "#A1887F", // Taupe
  "#4CAF50", // Muted green
  "#81C784", // Soft light green
  "#388E3C", // Forest green
  "#00ACC1", // Muted cyan
  "#26A69A", // Soft teal
  "#009688", // Teal
];


export const getRandomColor = () =>
  DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]; 