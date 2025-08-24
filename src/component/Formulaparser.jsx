import { FormulaParser } from 'hot-formula-parser';

const parser = new FormulaParser();

const recalculateFormulas = (cellKey) => {
  const cell = cells[cellKey];
  if (!cell?.formula) return;

  parser.on('callCellValue', (cellCoord, done) => {
    const col = cellCoord.column.index;
    const row = cellCoord.row.index;
    const key = `${row},${col}`;
    const value = cells[key]?.value ?? '';
    done(value);
  });

  parser.on('callRangeValue', (startCellCoord, endCellCoord, done) => {
    const values = [];
    for (let row = startCellCoord.row.index; row <= endCellCoord.row.index; row++) {
      const rowValues = [];
      for (let col = startCellCoord.column.index; col <= endCellCoord.column.index; col++) {
        const key = `${row},${col}`;
        rowValues.push(cells[key]?.value ?? '');
      }
      values.push(rowValues);
    }
    done(values);
  });

  const result = parser.parse(cell.formula);
  if (result.error != null) {
    console.error('Formula error:', result.error);
    return;
  }

  setCells(prev => ({
    ...prev,
    [cellKey]: {
      ...prev[cellKey],
      value: result.result,
      display: result.result.toString(),
    }
  }));
};
