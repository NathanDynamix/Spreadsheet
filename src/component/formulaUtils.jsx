// src/utils/formulaUtils.js

export const applySUM = (cellValues) => {
  return cellValues.reduce((sum, value) => sum + parseFloat(value || 0), 0);
};

export const applyAVERAGE = (cellValues) => {
  const validValues = cellValues.filter((val) => !isNaN(val));
  const sum = validValues.reduce((acc, val) => acc + parseFloat(val || 0), 0);
  return validValues.length ? sum / validValues.length : 0;
};

export const applyCONCATENATE = (cellValues) => {
  return cellValues.join('');
};

// Optional: General handler if you want a single function
export const applyFormula = (functionName, cellValues) => {
  switch (functionName) {
    case 'SUM':
      return applySUM(cellValues);
    case 'AVERAGE':
      return applyAVERAGE(cellValues);
    case 'CONCATENATE':
      return applyCONCATENATE(cellValues);
    default:
      return '';
  }
};
