import React, { useState, useCallback, useMemo } from 'react';
import { Calculator, Code, FileSpreadsheet, Play,MoreVertical } from 'lucide-react';

// Main Google Sheets Formula Library Class
class GoogleSheetsFormulas {
  constructor(data, setData) {
    this.data = data;
    this.setData = setData;
  }

  // Helper method to parse range strings like "A1:A10" or arrays
  parseRange(range) {
    if (Array.isArray(range)) return range;
    if (typeof range === 'string' && range.includes(',')) {
      return range.split(',').map(v => v.trim());
    }
    if (typeof range === 'string' && range.includes(':')) {
      // Simple range parsing - in real implementation would handle cell references
      return range.split(':').map(v => v.trim());
    }
    return [range];
  }

  // Helper method to parse cell references
  parseCellRef(ref) {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    
    const colStr = match[1];
    const rowNum = parseInt(match[2]) - 1;
    
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    col -= 1;
    
    return { row: rowNum, col };
  }

  getCellValue(ref) {
    const pos = this.parseCellRef(ref);
    if (!pos || !this.data[pos.row] || !this.data[pos.row][pos.col]) return 0;
    
    const cell = this.data[pos.row][pos.col];
    return cell.calculatedValue !== undefined ? cell.calculatedValue : (cell.value || 0);
  }

  getCellRef(row, col) {
    let colStr = '';
    let c = col + 1;
    while (c > 0) {
      colStr = String.fromCharCode(((c - 1) % 26) + 65) + colStr;
      c = Math.floor((c - 1) / 26);
    }
    return colStr + (row + 1);
  }

  // Helper method to parse function arguments
  parseArguments(argString) {
    if (!argString) return [];
    const args = [];
    let current = '';
    let parentheses = 0;
    let inQuotes = false;
    
    for (let i = 0; i < argString.length; i++) {
      const char = argString[i];
      
      if (char === '"' && argString[i-1] !== '\\') {
        inQuotes = !inQuotes;
      } else if (!inQuotes && char === '(') {
        parentheses++;
      } else if (!inQuotes && char === ')') {
        parentheses--;
      } else if (!inQuotes && char === ',' && parentheses === 0) {
        args.push(current.trim());
        current = '';
        continue;
      }
      
      current += char;
    }
    
    if (current.trim()) {
      args.push(current.trim());
    }
    
    return args;
  }

  evaluateCriteria(value, criteria) {
    const criteriaStr = criteria.toString();
    
    if (criteriaStr.startsWith('>=')) {
      return parseFloat(value) >= parseFloat(criteriaStr.substring(2));
    } else if (criteriaStr.startsWith('<=')) {
      return parseFloat(value) <= parseFloat(criteriaStr.substring(2));
    } else if (criteriaStr.startsWith('>')) {
      return parseFloat(value) > parseFloat(criteriaStr.substring(1));
    } else if (criteriaStr.startsWith('<')) {
      return parseFloat(value) < parseFloat(criteriaStr.substring(1));
    } else if (criteriaStr.startsWith('<>')) {
      return value.toString() !== criteriaStr.substring(2);
    } else if (criteriaStr.includes('*') || criteriaStr.includes('?')) {
      const regex = new RegExp(
        criteriaStr.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i'
      );
      return regex.test(value.toString());
    } else {
      return value.toString() === criteriaStr;
    }
  }

  toBool(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === '1';
    }
    return Boolean(value);
  }

  // MATHEMATICAL FUNCTIONS
  ABS(number) {
    return Math.abs(parseFloat(number) || 0);
  }
  
  ACOS(number) {
    const val = parseFloat(number);
    return Math.acos(val);
  }
  
  ASIN(number) {
    const val = parseFloat(number);
    return Math.asin(val);
  }
  
  ATAN(number) {
    const val = parseFloat(number);
    return Math.atan(val);
  }
  
 ATAN2(y, x) {
  return Math.atan2(parseFloat(y), parseFloat(x)) * (180 / Math.PI);
}

  
  CEILING(number, significance = 1) {
    const num = parseFloat(number);
    const sig = parseFloat(significance);
    return Math.ceil(num / sig) * sig;
  }
  
  COS(number) {
    return Math.cos(parseFloat(number));
  }
  
  DEGREES(radians) {
    return parseFloat(radians) * (180 / Math.PI);
  }
  
  EXP(number) {
    return Math.exp(parseFloat(number));
  }
  
  FACT(number) {
    const n = parseInt(number);
    if (n < 0) return 0;
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }
  
  FLOOR(number, significance = 1) {
    const num = parseFloat(number);
    const sig = parseFloat(significance);
    return Math.floor(num / sig) * sig;
  }
  
  GCD(...numbers) {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const nums = numbers.map(n => Math.abs(parseInt(n) || 0));
    return nums.reduce(gcd);
  }
  
  LCM(...numbers) {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
    const nums = numbers.map(n => Math.abs(parseInt(n) || 0));
    return nums.reduce(lcm);
  }
  
  LN(number) {
    return Math.log(parseFloat(number));
  }
  
  LOG(number, base = 10) {
    return Math.log(parseFloat(number)) / Math.log(parseFloat(base));
  }
  
 LOG10(number) {
  return Math.log(parseFloat(number)) / Math.LN10;
}
  
  MAX(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    return values.length > 0 ? Math.max(...values) : 0;
  }
  
  MIN(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    return values.length > 0 ? Math.min(...values) : 0;
  }
  
  MOD(dividend, divisor) {
    return parseFloat(dividend) % parseFloat(divisor);
  }
  
  PI() {
    return Math.PI;
  }
  
  POWER(base, exponent) {
    return Math.pow(parseFloat(base), parseFloat(exponent));
  }
  
  PRODUCT(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    return values.reduce((product, val) => product * val, 1);
  }
  
  RADIANS(degrees) {
    return parseFloat(degrees) * (Math.PI / 180);
  }
  
  RAND() {
    return Math.random();
  }
  
  RANDBETWEEN(bottom, top) {
    const min = parseInt(bottom);
    const max = parseInt(top);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  ROUND(number, digits = 0) {
    const multiplier = Math.pow(10, parseInt(digits));
    return Math.round(parseFloat(number) * multiplier) / multiplier;
  }
  
  ROUNDDOWN(number, digits = 0) {
    const multiplier = Math.pow(10, parseInt(digits));
    return Math.floor(parseFloat(number) * multiplier) / multiplier;
  }
  
  ROUNDUP(number, digits = 0) {
    const multiplier = Math.pow(10, parseInt(digits));
    return Math.ceil(parseFloat(number) * multiplier) / multiplier;
  }
  
  SIGN(number) {
    const val = parseFloat(number);
    return val > 0 ? 1 : val < 0 ? -1 : 0;
  }
  
  SIN(number) {
    return Math.sin(parseFloat(number));
  }
  
  SQRT(number) {
    return Math.sqrt(parseFloat(number));
  }
  
  SUM(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    return values.reduce((sum, val) => sum + val, 0);
  }
  
  SUMPRODUCT(...arrays) {
    if (arrays.length === 0) return 0;
    const parsedArrays = arrays.map(arr => this.parseRange(arr).map(v => parseFloat(v) || 0));
    const minLength = Math.min(...parsedArrays.map(arr => arr.length));
    
    let sum = 0;
    for (let i = 0; i < minLength; i++) {
      let product = 1;
      for (let j = 0; j < parsedArrays.length; j++) {
        product *= parsedArrays[j][i];
      }
      sum += product;
    }
    return sum;
  }
  
  TAN(number) {
    return Math.tan(parseFloat(number));
  }
  TANRADIAN(number) {
  return Math.tan(parseFloat(number));
}
  TRUNC(number, digits = 0) {
    const multiplier = Math.pow(10, parseInt(digits));
    return Math.trunc(parseFloat(number) * multiplier) / multiplier;
  }

  // STATISTICAL FUNCTIONS
  AVERAGE(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }
  
  COUNT(...ranges) {
    const values = ranges.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    return values.length;
  }
  
  COUNTA(...ranges) {
    const values = ranges.flat().filter(v => v !== null && v !== undefined && v !== '');
    return values.length;
  }
  
  COUNTBLANK(...ranges) {
    const values = ranges.flat();
    return values.filter(v => v === null || v === undefined || v === '').length;
  }
  
  COUNTIF(range, criteria) {
    const values = this.parseRange(range);
    let count = 0;
    
    for (const value of values) {
      if (this.evaluateCriteria(value, criteria)) {
        count++;
      }
    }
    
    return count;
  }
  
  MEDIAN(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const len = values.length;
    if (len === 0) return 0;
    
    if (len % 2 === 0) {
      return (values[len / 2 - 1] + values[len / 2]) / 2;
    } else {
      return values[Math.floor(len / 2)];
    }
  }
  
  MODE(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    const frequency = {};
    let maxCount = 0;
    let mode = null;
    
    for (const value of values) {
      frequency[value] = (frequency[value] || 0) + 1;
      if (frequency[value] > maxCount) {
        maxCount = frequency[value];
        mode = value;
      }
    }
    
    return maxCount > 1 ? mode : 0;
  }

  // Additional Statistical Functions
  STDEV(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }
  
  STDEVP(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  VAR(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  }
  
  VARP(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
  
  STDEVA(...values) {
    const nums = values.flat().map(v => {
      if (typeof v === 'number') return v;
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (typeof v === 'string' && !isNaN(parseFloat(v))) return parseFloat(v);
      return 0;
    });
    if (nums.length < 2) return 0;
    const mean = nums.reduce((sum, val) => sum + val, 0) / nums.length;
    const variance = nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (nums.length - 1);
    return Math.sqrt(variance);
  }
  
  STDEVPA(...values) {
    const nums = values.flat().map(v => {
      if (typeof v === 'number') return v;
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (typeof v === 'string' && !isNaN(parseFloat(v))) return parseFloat(v);
      return 0;
    });
    if (nums.length === 0) return 0;
    const mean = nums.reduce((sum, val) => sum + val, 0) / nums.length;
    const variance = nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / nums.length;
    return Math.sqrt(variance);
  }
  
  VARA(...values) {
    const nums = values.flat().map(v => {
      if (typeof v === 'number') return v;
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (typeof v === 'string' && !isNaN(parseFloat(v))) return parseFloat(v);
      return 0;
    });
    if (nums.length < 2) return 0;
    const mean = nums.reduce((sum, val) => sum + val, 0) / nums.length;
    return nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (nums.length - 1);
  }
  
  VARPA(...values) {
    const nums = values.flat().map(v => {
      if (typeof v === 'number') return v;
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (typeof v === 'string' && !isNaN(parseFloat(v))) return parseFloat(v);
      return 0;
    });
    if (nums.length === 0) return 0;
    const mean = nums.reduce((sum, val) => sum + val, 0) / nums.length;
    return nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / nums.length;
  }
  
  CORREL(array1, array2) {
    const arr1 = this.parseRange(array1).map(n => parseFloat(n)).filter(n => !isNaN(n));
    const arr2 = this.parseRange(array2).map(n => parseFloat(n)).filter(n => !isNaN(n));
    const n = Math.min(arr1.length, arr2.length);
    
    if (n === 0) return 0;
    
    const mean1 = arr1.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const mean2 = arr2.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = arr1[i] - mean1;
      const diff2 = arr2[i] - mean2;
      numerator += diff1 * diff2;
      sum1 += diff1 * diff1;
      sum2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  COVAR(array1, array2) {
    const arr1 = this.parseRange(array1).map(n => parseFloat(n)).filter(n => !isNaN(n));
    const arr2 = this.parseRange(array2).map(n => parseFloat(n)).filter(n => !isNaN(n));
    const n = Math.min(arr1.length, arr2.length);
    
    if (n === 0) return 0;
    
    const mean1 = arr1.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const mean2 = arr2.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    
    let covariance = 0;
    for (let i = 0; i < n; i++) {
      covariance += (arr1[i] - mean1) * (arr2[i] - mean2);
    }
    
    return covariance / n;
  }
  
  GEOMEAN(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n) && n > 0);
    if (values.length === 0) return 0;
    const product = values.reduce((prod, val) => prod * val, 1);
    return Math.pow(product, 1 / values.length);
  }
  
  HARMEAN(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n) && n > 0);
    if (values.length === 0) return 0;
    const reciprocalSum = values.reduce((sum, val) => sum + (1 / val), 0);
    return values.length / reciprocalSum;
  }
  
  KURT(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    if (values.length < 4) return 0;
    
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    const fourthMoment = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / n;
    return fourthMoment - 3;
  }
  
  SKEW(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    if (values.length < 3) return 0;
    
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * skewness;
  }
  
  SLOPE(knownYs, knownXs) {
    const ys = this.parseRange(knownYs).map(n => parseFloat(n)).filter(n => !isNaN(n));
    const xs = this.parseRange(knownXs).map(n => parseFloat(n)).filter(n => !isNaN(n));
    const n = Math.min(ys.length, xs.length);
    
    if (n < 2) return 0;
    
    const meanX = xs.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const meanY = ys.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (xs[i] - meanX) * (ys[i] - meanY);
      denominator += Math.pow(xs[i] - meanX, 2);
    }
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  INTERCEPT(knownYs, knownXs) {
    const ys = this.parseRange(knownYs).map(n => parseFloat(n)).filter(n => !isNaN(n));
    const xs = this.parseRange(knownXs).map(n => parseFloat(n)).filter(n => !isNaN(n));
    const n = Math.min(ys.length, xs.length);
    
    if (n < 2) return 0;
    
    const meanX = xs.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const meanY = ys.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const slope = this.SLOPE(knownYs, knownXs);
    
    return meanY - slope * meanX;
  }
  
  RSQ(knownYs, knownXs) {
    const correlation = this.CORREL(knownYs, knownXs);
    return correlation * correlation;
  }
  
  FORECAST(x, knownYs, knownXs) {
    const slope = this.SLOPE(knownYs, knownXs);
    const intercept = this.INTERCEPT(knownYs, knownXs);
    return slope * parseFloat(x) + intercept;
  }
  
  TREND(knownYs, knownXs, newXs) {
    const slope = this.SLOPE(knownYs, knownXs);
    const intercept = this.INTERCEPT(knownYs, knownXs);
    const xs = newXs ? this.parseRange(newXs) : this.parseRange(knownXs);
    
    return xs.map(x => slope * parseFloat(x) + intercept);
  }
  
  PERCENTILE(array, k) {
    const values = this.parseRange(array).map(n => parseFloat(n)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const percentile = parseFloat(k);
    
    if (values.length === 0 || percentile < 0 || percentile > 1) return 0;
    
    const index = percentile * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    return values[lower] * (1 - weight) + values[upper] * weight;
  }
  
  PERCENTRANK(array, x, significance = 3) {
    const values = this.parseRange(array).map(n => parseFloat(n)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const target = parseFloat(x);
    
    if (values.length === 0) return 0;
    
    let rank = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i] < target) rank++;
      else if (values[i] === target) break;
    }
    
    const percentRank = rank / (values.length - 1);
    return Math.round(percentRank * Math.pow(10, parseInt(significance))) / Math.pow(10, parseInt(significance));
  }
  
  QUARTILE(array, quart) {
    const quartile = parseInt(quart);
    switch (quartile) {
      case 0: return this.MIN(array);
      case 1: return this.PERCENTILE(array, 0.25);
      case 2: return this.MEDIAN(array);
      case 3: return this.PERCENTILE(array, 0.75);
      case 4: return this.MAX(array);
      default: return 0;
    }
  }
  
  RANK(number, ref, order = 0) {
    const values = this.parseRange(ref).map(n => parseFloat(n)).filter(n => !isNaN(n));
    const target = parseFloat(number);
    const descending = parseInt(order) === 0;
    
    const sorted = [...values].sort((a, b) => descending ? b - a : a - b);
    const index = sorted.indexOf(target);
    return index === -1 ? 0 : index + 1;
  }
  
  LARGE(array, k) {
    const values = this.parseRange(array).map(n => parseFloat(n)).filter(n => !isNaN(n)).sort((a, b) => b - a);
    const index = parseInt(k) - 1;
    return index >= 0 && index < values.length ? values[index] : 0;
  }
  
  SMALL(array, k) {
    const values = this.parseRange(array).map(n => parseFloat(n)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const index = parseInt(k) - 1;
    return index >= 0 && index < values.length ? values[index] : 0;
  }
  
  DEVSQ(...numbers) {
    const values = numbers.flat().map(n => parseFloat(n)).filter(n => !isNaN(n));
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  }
  
  TRIMMEAN(array, percent) {
    const values = this.parseRange(array).map(n => parseFloat(n)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const trimPercent = parseFloat(percent);
    
    if (values.length === 0 || trimPercent < 0 || trimPercent >= 1) return 0;
    
    const trimCount = Math.floor(values.length * trimPercent / 2);
    const trimmedValues = values.slice(trimCount, values.length - trimCount);
    
    return trimmedValues.length > 0 ? trimmedValues.reduce((sum, val) => sum + val, 0) / trimmedValues.length : 0;
  }

  // DISTRIBUTION FUNCTIONS
  NORMDIST(x, mean, standardDev, cumulative) {
    const z = (parseFloat(x) - parseFloat(mean)) / parseFloat(standardDev);
    
    if (this.toBool(cumulative)) {
      return this.NORMSDIST(z);
    } else {
      return (1 / (parseFloat(standardDev) * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
    }
  }
  
  NORMSDIST(z) {
    const x = parseFloat(z);
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    
    return 0.5 * (1.0 + sign * y);
  }
  
  NORMINV(probability, mean, standardDev) {
    const p = parseFloat(probability);
    const mu = parseFloat(mean);
    const sigma = parseFloat(standardDev);
    
    if (p <= 0 || p >= 1 || sigma <= 0) return 0;
    
    return mu + sigma * this.NORMSINV(p);
  }
  
  NORMSINV(probability) {
    const p = parseFloat(probability);
    
    if (p <= 0 || p >= 1) return 0;
    
    // Beasley-Springer-Moro algorithm approximation
    const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    
    const pLow = 0.02425;
    const pHigh = 1 - pLow;
    let q, r;
    
    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) /
             ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) * q /
             (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) /
              ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
    }
  }
  
  POISSON(x, mean, cumulative) {
    const k = parseInt(x);
    const lambda = parseFloat(mean);
    
    if (k < 0 || lambda <= 0) return 0;
    
    if (this.toBool(cumulative)) {
      let sum = 0;
      for (let i = 0; i <= k; i++) {
        sum += (Math.pow(lambda, i) * Math.exp(-lambda)) / this.FACT(i);
      }
      return sum;
    } else {
      return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.FACT(k);
    }
  }
  
  WEIBULL(x, alpha, beta, cumulative) {
    const xVal = parseFloat(x);
    const shape = parseFloat(alpha);
    const scale = parseFloat(beta);
    
    if (xVal < 0 || shape <= 0 || scale <= 0) return 0;
    
    if (this.toBool(cumulative)) {
      return 1 - Math.exp(-Math.pow(xVal / scale, shape));
    } else {
      return (shape / scale) * Math.pow(xVal / scale, shape - 1) * Math.exp(-Math.pow(xVal / scale, shape));
    }
  }

  // COMBINATORIAL FUNCTIONS
  COMBIN(n, k) {
    const nVal = parseInt(n);
    const kVal = parseInt(k);
    
    if (nVal < 0 || kVal < 0 || kVal > nVal) return 0;
    
    return this.FACT(nVal) / (this.FACT(kVal) * this.FACT(nVal - kVal));
  }
  
  PERMUT(n, k) {
    const nVal = parseInt(n);
    const kVal = parseInt(k);
    
    if (nVal < 0 || kVal < 0 || kVal > nVal) return 0;
    
    return this.FACT(nVal) / this.FACT(nVal - kVal);
  }

  // FINANCIAL FUNCTIONS
  FV(rate, nper, pmt, pv = 0, type = 0) {
    const r = parseFloat(rate);
    const n = parseFloat(nper);
    const p = parseFloat(pmt);
    const v = parseFloat(pv);
    const t = parseInt(type);
    
    if (r === 0) {
      return -(v + p * n);
    }
    
    const factor = Math.pow(1 + r, n);
    const annuity = p * ((factor - 1) / r) * (1 + r * t);
    
    return -(v * factor + annuity);
  }
  
  PV(rate, nper, pmt, fv = 0, type = 0) {
    const r = parseFloat(rate);
    const n = parseFloat(nper);
    const p = parseFloat(pmt);
    const f = parseFloat(fv);
    const t = parseInt(type);
    
    if (r === 0) {
      return -(f + p * n);
    }
    
    const factor = Math.pow(1 + r, n);
    const annuity = p * ((1 - 1 / factor) / r) * (1 + r * t);
    
    return -(f / factor + annuity);
  }
    NPV(rate, ...values) {
    const r = parseFloat(rate);
    const cashFlows = values.flat().map(v => parseFloat(v)).filter(v => !isNaN(v));
    
    let npv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + r, i + 1);
    }
    return npv;
  }
  
  PMT(rate, nper, pv, fv = 0, type = 0) {
    const r = parseFloat(rate);
    const n = parseFloat(nper);
    const p = parseFloat(pv);
    const f = parseFloat(fv);
    const t = parseInt(type);
    
    if (r === 0) {
      return -(p + f) / n;
    }
    
    const factor = Math.pow(1 + r, n);
    return -(p * factor + f) * r / ((factor - 1) * (1 + r * t));
  }
  
  IPMT(rate, per, nper, pv, fv = 0, type = 0) {
    const r = parseFloat(rate);
    const period = parseInt(per);
    const n = parseFloat(nper);
    const p = parseFloat(pv);
    const f = parseFloat(fv);
    const t = parseInt(type);
    
    if (period < 1 || period > n) return 0;
    
    const pmt = this.PMT(rate, nper, pv, fv, type);
    let principal = p;
    
    for (let i = 1; i < period; i++) {
      const interest = principal * r * (1 + r * t);
      principal += interest + pmt;
    }
    
    return principal * r;
  }
  
  PPMT(rate, per, nper, pv, fv = 0, type = 0) {
    const pmt = this.PMT(rate, nper, pv, fv, type);
    const ipmt = this.IPMT(rate, per, nper, pv, fv, type);
    return pmt - ipmt;
  }
  
  NPER(rate, pmt, pv, fv = 0, type = 0) {
    const r = parseFloat(rate);
    const p = parseFloat(pmt);
    const v = parseFloat(pv);
    const f = parseFloat(fv);
    const t = parseInt(type);
    
    if (r === 0) {
      return -(v + f) / p;
    }
    
    const numerator = p * (1 + r * t) - f * r;
    const denominator = p * (1 + r * t) + v * r;
    
    return Math.log(numerator / denominator) / Math.log(1 + r);
  }
  
  RATE(nper, pmt, pv, fv = 0, type = 0, guess = 0.1) {
  const n = parseFloat(nper);
  const p = parseFloat(pmt);
  const v = parseFloat(pv);
  const f = parseFloat(fv);
  const t = parseInt(type);
  let rate = guess;

  if (n <= 0) return 0;

  const maxIterations = 100;
  const tolerance = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    const factor = Math.pow(1 + rate, n);
    const numerator =
      v * factor +
      p * (1 + rate * t) * (factor - 1) / rate +
      f;
    const denominator =
      n * v * Math.pow(1 + rate, n - 1) -
      p * (1 + rate * t) * (factor - 1) / (rate * rate) +
      n * p * (1 + rate * t) * factor / rate;

    const newRate = rate - numerator / denominator;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }

    rate = newRate;
  }

  return NaN; // Didn't converge
}

  
  IRR(cashFlows, guess = 0.1, maxIterations = 1000, tolerance = 1e-7) {
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      derivative -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
    }

    const newRate = rate - npv / derivative;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }

    rate = newRate;
  }

  return NaN; // Did not converge
}
  
 MIRR(values, financeRate, reinvestRate) {
  const cashFlows = Array.from(values).map(Number).filter(v => !isNaN(v));
  if (cashFlows.length === 0) return 0;

  const fr = parseFloat(financeRate);
  const rr = parseFloat(reinvestRate);

  let pvNegative = 0;
  let fvPositive = 0;
  const n = cashFlows.length;

  for (let i = 0; i < n; i++) {
    const val = cashFlows[i];
    if (val < 0) {
      pvNegative += val / Math.pow(1 + fr, i);
    } else if (val > 0) {
      fvPositive += val * Math.pow(1 + rr, n - i - 1);
    }
  }

  if (pvNegative === 0) return NaN;

  const result = Math.pow(fvPositive / -pvNegative, 1 / (n - 1)) - 1;
  return result;
}





  
  SLN(cost, salvage, life) {
    return (parseFloat(cost) - parseFloat(salvage)) / parseFloat(life);
  }
  
  SYD(cost, salvage, life, period) {
    const c = parseFloat(cost);
    const s = parseFloat(salvage);
    const l = parseFloat(life);
    const p = parseFloat(period);
    
    return (c - s) * (l - p + 1) * 2 / (l * (l + 1));
  }
  
  DB(cost, salvage, life, period, month = 12) {
    const c = parseFloat(cost);
    const s = parseFloat(salvage);
    const l = parseFloat(life);
    const p = parseFloat(period);
    const m = parseFloat(month);
    
    if (p === 1) {
      return (c * (1 - Math.pow(s / c, 1 / l))) * m / 12;
    } else {
      const rate = 1 - Math.pow(s / c, 1 / l);
      let total = 0;
      let depreciation = 0;
      
      for (let i = 1; i <= p; i++) {
        if (i === 1) {
          depreciation = c * rate * m / 12;
        } else if (i === l + 1) {
          depreciation = (c - total) * rate * (12 - m) / 12;
        } else {
          depreciation = (c - total) * rate;
        }
        
        total += depreciation;
      }
      
      return depreciation;
    }
  }
  
  DDB(cost, salvage, life, period, factor = 2) {
    const c = parseFloat(cost);
    const s = parseFloat(salvage);
    const l = parseFloat(life);
    const p = parseFloat(period);
    const f = parseFloat(factor);
    
    let total = 0;
    let depreciation = 0;
    
    for (let i = 1; i <= p; i++) {
      depreciation = Math.min((c - total) * f / l, c - s - total);
      total += depreciation;
    }
    
    return depreciation;
  }
  
  VDB(cost, salvage, life, startPeriod, endPeriod, factor = 2, noSwitch = false) {
    const c = parseFloat(cost);
    const s = parseFloat(salvage);
    const l = parseFloat(life);
    const start = parseFloat(startPeriod);
    const end = parseFloat(endPeriod);
    const f = parseFloat(factor);
    const switchToSL = !this.toBool(noSwitch);
    
    let total = 0;
    let depreciation = 0;
    
    for (let i = 1; i <= end; i++) {
      const bookValue = c - total;
      const remainingLife = l - i + 1;
      
      let ddbDep = (bookValue) * f / l;
      let slDep = (bookValue - s) / remainingLife;
      
      if (switchToSL && slDep > ddbDep && i >= start) {
        depreciation = slDep;
      } else if (i >= start) {
        depreciation = Math.min(ddbDep, bookValue - s);
      }
      
      if (i >= start) {
        total += depreciation;
      }
    }
    
    return depreciation * (end - start + 1);
  }

  // DATE & TIME FUNCTIONS
  NOW() {
    return new Date();
  }
  
  TODAY() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  
  DATE(year, month, day) {
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  DATEVALUE(dateString) {
    return new Date(dateString);
  }
  
  DAY(date) {
    return new Date(date).getDate();
  }
  
  DAYS(endDate, startDate) {
    const end = new Date(endDate);
    const start = new Date(startDate);
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
  }
  
  DAYS360(startDate, endDate, method = false) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const useEuros = Boolean(method);

  let startDay = start.getDate();
  let startMonth = start.getMonth();
  let startYear = start.getFullYear();

  let endDay = end.getDate();
  let endMonth = end.getMonth();
  let endYear = end.getFullYear();

  if (useEuros) {
    if (startDay === 31) startDay = 30;
    if (endDay === 31) endDay = 30;
  } else {
    if (startDay === 31) startDay = 30;
    if (endDay === 31 && (startDay === 30 || startDay === 31)) endDay = 30;
  }

  return (endYear - startYear) * 360 + (endMonth - startMonth) * 30 + (endDay - startDay);
}

  
  EDATE(startDate, months) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(months));
    return date;
  }
  
  EOMONTH(startDate, months) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(months) + 1);
    date.setDate(0);
    return date;
  }
  
  HOUR(time) {
    return new Date(time).getHours();
  }
  
  MINUTE(time) {
    return new Date(time).getMinutes();
  }
  
  MONTH(date) {
    return new Date(date).getMonth() + 1;
  }
  
  NETWORKDAYS(startDate, endDate, holidays = []) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const holidayDates = this.parseRange(holidays).map(d => new Date(d).toDateString());
    
    let count = 0;
    const current = new Date(start);
    
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6 && !holidayDates.includes(current.toDateString())) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }
  
  SECOND(time) {
    return new Date(time).getSeconds();
  }
  
  TIME(hour, minute, second) {
    return new Date(0, 0, 0, parseInt(hour), parseInt(minute), parseInt(second));
  }
  
  TIMEVALUE(timeString) {
    return new Date(`1970-01-01T${timeString}Z`);
  }
  
  WEEKDAY(date, returnType = 1) {
    const day = new Date(date).getDay();
    const type = parseInt(returnType);
    
    switch (type) {
      case 1: return day === 0 ? 7 : day;
      case 2: return day + 1;
      case 3: return day;
      default: return day === 0 ? 7 : day;
    }
  }
  
  WEEKNUM(date, returnType = 1) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }
  
  WORKDAY(startDate, days, holidays = []) {
    const start = new Date(startDate);
    const holidayDates = this.parseRange(holidays).map(d => new Date(d).toDateString());
    let remaining = parseInt(days);
    const current = new Date(start);
    
    while (remaining > 0) {
      current.setDate(current.getDate() + 1);
      const day = current.getDay();
      if (day !== 0 && day !== 6 && !holidayDates.includes(current.toDateString())) {
        remaining--;
      }
    }
    
    return current;
  }
  
  YEAR(date) {
    return new Date(date).getFullYear();
  }
  
  YEARFRAC(startDate, endDate, basis = 0) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const b = parseInt(basis);
    
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    const startDay = start.getDate();
    const endDay = end.getDate();
    
    switch (b) {
      case 0: // US (NASD) 30/360
        const d1 = Math.min(startDay, 30);
        const d2 = endDay === 31 && d1 >= 30 ? 30 : endDay;
        return (endYear - startYear) + (endMonth - startMonth) / 12 + (d2 - d1) / 360;
      case 1: // Actual/actual
        const feb29Between = (date) => {
          const year = date.getFullYear();
          const feb29 = new Date(year, 1, 29);
          return date <= feb29 && feb29.getDate() === 29;
        };
        
        const startIsLeap = feb29Between(start);
        const endIsLeap = feb29Between(end);
        const startYearDays = startIsLeap ? 366 : 365;
        const endYearDays = endIsLeap ? 366 : 365;
        
        if (startYear === endYear) {
          return (end - start) / (1000 * 60 * 60 * 24 * startYearDays);
        } else {
          const startYearFraction = (new Date(startYear + 1, 0, 1) - start) / (1000 * 60 * 60 * 24 * startYearDays);
          const endYearFraction = (end - new Date(endYear, 0, 1)) / (1000 * 60 * 60 * 24 * endYearDays);
          return startYearFraction + (endYear - startYear - 1) + endYearFraction;
        }
      case 2: // Actual/360
        return (end - start) / (1000 * 60 * 60 * 24 * 360);
      case 3: // Actual/365
        return (end - start) / (1000 * 60 * 60 * 24 * 365);
      case 4: // European 30/360
        const d1e = startDay === 31 ? 30 : startDay;
        const d2e = endDay === 31 ? 30 : endDay;
        return (endYear - startYear) + (endMonth - startMonth) / 12 + (d2e - d1e) / 360;
      default:
        return (end - start) / (1000 * 60 * 60 * 24 * 365);
    }
  }

  // TEXT FUNCTIONS
  CHAR(number) {
    return String.fromCharCode(parseInt(number));
  }
  
CLEAN(input) {
  return input.replace(/[\x00-\x1F\x7F]/g, '');
}
  
  CODE(text) {
    return text.toString().charCodeAt(0);
  }
  
  CONCATENATE(...texts) {
    return texts.flat().join('');
  }
  
  EXACT(text1, text2) {
    return text1.toString() === text2.toString();
  }
  
  FIND(findText, withinText, startNum = 1) {
    const start = parseInt(startNum) - 1;
    return withinText.toString().indexOf(findText.toString(), start) + 1;
  }
  
  LEFT(text, numChars = 1) {
    return text.toString().substring(0, parseInt(numChars));
  }
  
  LEN(text) {
    return text.toString().length;
  }
  
  LOWER(text) {
    return text.toString().toLowerCase();
  }
  
  MID(text, startNum, numChars) {
    const start = parseInt(startNum) - 1;
    return text.toString().substring(start, start + parseInt(numChars));
  }
  
  PROPER(text) {
    return text.toString().replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
  
  REPLACE(oldText, startNum, numChars, newText) {
    const start = parseInt(startNum) - 1;
    const end = start + parseInt(numChars);
    return oldText.toString().substring(0, start) + newText.toString() + oldText.toString().substring(end);
  }
  
  REPT(text, numberTimes) {
    return text.toString().repeat(parseInt(numberTimes));
  }
  
  RIGHT(text, numChars = 1) {
    return text.toString().slice(-parseInt(numChars));
  }
  
  SEARCH(findText, withinText, startNum = 1) {
    const start = parseInt(startNum) - 1;
    return withinText.toString().toLowerCase().indexOf(findText.toString().toLowerCase(), start) + 1;
  }
  
  SUBSTITUTE(text, oldText, newText, instanceNum) {
    const str = text.toString();
    const oldStr = oldText.toString();
    const newStr = newText.toString();
    
    if (instanceNum) {
      const instance = parseInt(instanceNum);
      let pos = 0;
      let count = 0;
      
      while (count < instance && (pos = str.indexOf(oldStr, pos)) !== -1) {
        pos += oldStr.length;
        count++;
      }
      
      if (count === instance) {
        return str.substring(0, pos - oldStr.length) + newStr + str.substring(pos);
      }
    }
    
    return str.split(oldStr).join(newStr);
  }
  
  T(value) {
    return typeof value === 'string' ? value : '';
  }
  
  TEXT(value, format) {
    // Simplified version - in real implementation would handle various formats
    return value.toString();
  }
  TextNow() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

  
  TRIM(text) {
    return text.toString().trim();
  }
  
  UPPER(text) {
    return text.toString().toUpperCase();
  }
  
  VALUE(text) {
    return parseFloat(text.toString().replace(/[^\d.-]/g, ''));
  }

  // LOGICAL FUNCTIONS
  AND(...conditions) {
    return conditions.flat().every(cond => this.toBool(cond));
  }
  
  FALSE() {
    return false;
  }
  
  IF(condition, valueIfTrue, valueIfFalse) {
    return this.toBool(condition) ? valueIfTrue : valueIfFalse;
  }
  
  IFERROR(value, valueIfError) {
    try {
      const val = typeof value === 'function' ? value() : value;
      return isNaN(val) || val === null || val === undefined ? valueIfError : val;
    } catch (e) {
      return valueIfError;
    }
  }
  
  IFS(...conditions) {
    for (let i = 0; i < conditions.length; i += 2) {
      if (i + 1 >= conditions.length) return conditions[i];
      if (this.toBool(conditions[i])) return conditions[i + 1];
    }
    return null;
  }
  
  NOT(condition) {
    return !this.toBool(condition);
  }
  
  OR(...conditions) {
    return conditions.flat().some(cond => this.toBool(cond));
  }
  
  SWITCH(expression, ...cases) {
    const expr = expression;
    for (let i = 0; i < cases.length - 1; i += 2) {
      if (expr === cases[i]) return cases[i + 1];
    }
    return cases.length % 2 === 0 ? null : cases[cases.length - 1];
  }
  
  TRUE() {
    return true;
  }
  
  XOR(...conditions) {
    let count = 0;
    conditions.flat().forEach(cond => {
      if (this.toBool(cond)) count++;
    });
    return count % 2 === 1;
  }

  // LOOKUP FUNCTIONS
  CHOOSE(index, ...values) {
    const idx = parseInt(index) - 1;
    return idx >= 0 && idx < values.length ? values[idx] : null;
  }
  
  HLOOKUP(searchKey, range, index, isSorted = true) {
    const key = searchKey.toString();
    const table = this.parseRange(range);
    const rowIndex = parseInt(index) - 1;
    const sorted = this.toBool(isSorted);
    
    if (rowIndex < 0 || rowIndex >= table.length) return null;
    
    if (sorted) {
      // Binary search for sorted data
      let low = 0;
      let high = table[0].length - 1;
      let result = null;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const comparison = table[0][mid].toString().localeCompare(key);
        
        if (comparison === 0) {
          result = table[rowIndex][mid];
          break;
        } else if (comparison < 0) {
          low = mid + 1;
          result = table[rowIndex][mid]; // Last value less than or equal to key
        } else {
          high = mid - 1;
        }
      }
      
      return result;
    } else {
      // Linear search for unsorted data
      for (let i = 0; i < table[0].length; i++) {
        if (table[0][i].toString() === key) {
          return table[rowIndex][i];
        }
      }
      return null;
    }
  }
  
  INDEX(range, rowNum, colNum = 1) {
    const table = this.parseRange(range);
    const row = parseInt(rowNum) - 1;
    const col = parseInt(colNum) - 1;
    
    if (row < 0 || row >= table.length) return null;
    if (col < 0 || col >= table[row].length) return null;
    
    return table[row][col];
  }
  
  MATCH(searchKey, range, matchType = 1) {
    const key = searchKey.toString();
    const array = this.parseRange(range).flat();
    const type = parseInt(matchType);
    
    if (type === 0) {
      // Exact match
      for (let i = 0; i < array.length; i++) {
        if (array[i].toString() === key) return i + 1;
      }
      return null;
    } else if (type === 1) {
      // Less than or equal (sorted ascending)
      let result = null;
      for (let i = 0; i < array.length; i++) {
        if (array[i].toString() <= key) {
          result = i + 1;
        } else {
          break;
        }
      }
      return result;
    } else if (type === -1) {
      // Greater than or equal (sorted descending)
      let result = null;
      for (let i = 0; i < array.length; i++) {
        if (array[i].toString() >= key) {
          result = i + 1;
        } else {
          break;
        }
      }
      return result;
    }
    
    return null;
  }
  
  VLOOKUP(searchKey, range, index, isSorted = true) {
    const key = searchKey.toString();
    const table = this.parseRange(range);
    const colIndex = parseInt(index) - 1;
    const sorted = this.toBool(isSorted);
    
    if (colIndex < 0 || colIndex >= table[0].length) return null;
    
    if (sorted) {
      // Binary search for sorted data
      let low = 0;
      let high = table.length - 1;
      let result = null;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const comparison = table[mid][0].toString().localeCompare(key);
        
        if (comparison === 0) {
          result = table[mid][colIndex];
          break;
        } else if (comparison < 0) {
          low = mid + 1;
          result = table[mid][colIndex]; // Last value less than or equal to key
        } else {
          high = mid - 1;
        }
      }
      
      return result;
    } else {
      // Linear search for unsorted data
      for (let i = 0; i < table.length; i++) {
        if (table[i][0].toString() === key) {
          return table[i][colIndex];
        }
      }
      return null;
    }
  }

  // INFORMATION FUNCTIONS
  CELL(infoType, reference) {
    // Simplified version - in real implementation would handle various info types
    return reference ? reference.toString() : '';
  }
  
  ERROR_TYPE(error) {
    const errors = {
      '#NULL!': 1,
      '#DIV/0!': 2,
      '#VALUE!': 3,
      '#REF!': 4,
      '#NAME?': 5,
      '#NUM!': 6,
      '#N/A': 7
    };
    return errors[error] || '#N/A';
  }
  
  INFO(type) {
    // Simplified version - in real implementation would return system info
    return '';
  }
  
  ISBLANK(value) {
    return value === null || value === undefined || value === '';
  }
  
  ISERR(value) {
    return typeof value === 'string' && value.startsWith('#') && value !== '#N/A';
  }
  
  ISERROR(value) {
    return typeof value === 'string' && value.startsWith('#');
  }
  
  ISEVEN(number) {
    return parseInt(number) % 2 === 0;
  }
  
  ISFORMULA(reference) {
    // In real implementation would check if cell contains formula
    return false;
  }
  
  ISLOGICAL(value) {
    return typeof value === 'boolean';
  }
  
  ISNA(value) {
    return value === '#N/A';
  }
  
  ISNONTEXT(value) {
    return typeof value !== 'string';
  }
  
  ISNUMBER(value) {
    return typeof value === 'number' && !isNaN(value);
  }
  
  ISODD(number) {
    return parseInt(number) % 2 === 1;
  }
  
  ISREF(value) {
    // Simplified version - in real implementation would check if valid reference
    return typeof value === 'string' && /^[A-Z]+\d+$/.test(value);
  }
  
  ISTEXT(value) {
    return typeof value === 'string';
  }
  
  N(value) {
    return typeof value === 'number' ? value : 0;
  }
  
  NA() {
    return '#N/A';
  }
  
  SHEET(value) {
    return 1; // Simplified - would return sheet number in multi-sheet implementation
  }
  
  SHEETS(value) {
    return 1; // Simplified - would return sheet count in multi-sheet implementation
  }
  
  TYPE(value) {
    if (typeof value === 'number') return 1;
    if (typeof value === 'string') return 2;
    if (typeof value === 'boolean') return 4;
    if (value === null || value === undefined) return 16;
    if (Array.isArray(value)) return 64;
    return 16;
  }

  // ARRAY FUNCTIONS
  ARRAYFORMULA(formula) {
    // In real implementation would apply formula to array
    return formula;
  }
  
  FILTER(range, condition1, condition2) {
    const array = this.parseRange(range);
    const conditions = [condition1, condition2].filter(c => c !== undefined);
    
    return array.filter(item => {
      return conditions.every(cond => {
        if (typeof cond === 'function') {
          return cond(item);
        } else if (Array.isArray(cond)) {
          return cond.includes(item);
        } else {
          return item === cond;
        }
      });
    });
  }
  
  FLATTEN(range) {
    return this.parseRange(range).flat();
  }
  
  SORT(range, sortColumn = 1, isAscending = true) {
    const array = this.parseRange(range);
    const col = parseInt(sortColumn) - 1;
    const asc = this.toBool(isAscending);
    
    return [...array].sort((a, b) => {
      const valA = a[col] !== undefined ? a[col] : '';
      const valB = b[col] !== undefined ? b[col] : '';
      
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
  }
  
  SORTN(range, n, sortColumn = 1, isAscending = true) {
    const sorted = this.SORT(range, sortColumn, isAscending);
    return sorted.slice(0, parseInt(n));
  }
  
  UNIQUE(range) {
    const array = this.parseRange(range);
    const seen = new Set();
    const result = [];
    
    for (const item of array) {
      const key = JSON.stringify(item);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    
    return result;
  }
}
const functionCategories = [
  {
    name: 'Math',
    functions: [
      'ABS', 'ACOS', 'ASIN', 'ATAN', 'ATAN2', 'CEILING', 'COS', 'DEGREES',
      'EXP', 'FACT', 'FLOOR', 'GCD', 'LCM', 'LN', 'LOG', 'LOG10', 'MAX',
      'MIN', 'MOD', 'PI', 'POWER', 'PRODUCT', 'RADIANS', 'RAND', 'RANDBETWEEN',
      'ROUND', 'ROUNDDOWN', 'ROUNDUP', 'SIGN', 'SIN', 'SQRT', 'SUM',
      'SUMPRODUCT', 'TAN','TANradian', 'TRUNC'
    ]
  },
  {
    name: 'Financial',
    functions: ['FV', 'PV', 'NPV', 'PMT', 'IPMT', 'PPMT', 'NPER', 'RATE',
      'IRR', 'MIRR', 'SLN', 'SYD', 'DB', 'DDB', 'VDB']
  },
  {
    name: 'Date',
    functions: [
      'NOW', 'TODAY', 'DATE', 'DATEVALUE', 'DAY', 'DAYS', 'DAYS360',
      'EDATE', 'EOMONTH', 'HOUR', 'MINUTE', 'MONTH', 'NETWORKDAYS',
      'SECOND', 'TIME', 'TIMEVALUE', 'WEEKDAY', 'WEEKNUM',
      'WORKDAY', 'YEAR', 'YEARFRAC'
    ]
  },
  {
    name: 'Text',
    functions: [
      'CHAR', 'CLEAN', 'CODE', 'CONCATENATE', 'EXACT', 'FIND', 'LEFT',
      'LEN', 'LOWER', 'MID', 'PROPER', 'REPLACE', 'REPT', 'RIGHT',
      'SEARCH', 'SUBSTITUTE', 'T', 'TEXT','TEXTNOW','CLEAN', 'TRIM', 'UPPER', 'VALUE'
    ]
  },
  {
    name: 'Combinatorial',
    functions: ['COMBIN', 'PERMUT']
  },
  {
    name: 'Distribution',
    functions: [
      'NORMDIST', 'NORMSDIST', 'NORMINV', 'NORMSINV', 'POISSON', 'WEIBULL'
    ]
  },
  {
    name: 'Logical',
    functions: [
      'AND', 'FALSE', 'IF', 'IFERROR', 'IFS', 'NOT',
      'OR', 'SWITCH', 'TRUE', 'XOR'
    ]
  },
  {
    name: 'Statistical',
    functions: [
      'AVERAGE', 'COUNT', 'COUNTA', 'COUNTBLANK', 'COUNTIF', 'MEDIAN', 'MODE',
      'STDEV', 'STDEVP', 'VAR', 'VARP', 'STDEVA', 'STDEVPA', 'VARA', 'VARPA',
      'CORREL', 'COVAR', 'GEOMEAN', 'HARMEAN', 'KURT', 'SKEW', 'SLOPE',
      'INTERCEPT', 'RSQ', 'FORECAST', 'TREND', 'PERCENTILE', 'PERCENTRANK',
      'QUARTILE', 'RANK', 'LARGE', 'SMALL', 'DEVSQ', 'TRIMMEAN'
    ]
  },
  {
    name: 'Array',
    functions: [
      'ARRAYFORMULA', 'FILTER', 'FLATTEN',
      'SORT', 'SORTN', 'UNIQUE'
    ]
  },
   {
    name: 'Lookup',
    functions: ['CHOOSE', 'HLOOKUP', 'INDEX', 'MATCH', 'VLOOKUP']
  },
  {
    name: 'Information',
    functions: [
      'CELL', 'ERROR_TYPE', 'INFO', 'ISBLANK', 'ISERR', 'ISERROR', 'ISEVEN',
      'ISFORMULA', 'ISLOGICAL', 'ISNA', 'ISNONTEXT', 'ISNUMBER', 'ISODD',
      'ISREF', 'ISTEXT', 'N', 'NA', 'SHEET', 'SHEETS', 'TYPE'
    ]
  }
];

// Formula Parser Component
const FormulaParser = ({ data, setData, onEvaluate }) => {
     const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [formula, setFormula] = useState('');
  const [result, setResult] = useState('');
  const [isValid, setIsValid] = useState(true);

  const [activeTab, setActiveTab] = useState('formulas');
  const [activeCategory, setActiveCategory] = useState(null);
  
  

  const categories = functionCategories.map(c => c.name);

  const formulas = useMemo(() => new GoogleSheetsFormulas(data, setData), [data, setData]);

  const evaluateFormula = useCallback(() => {
    try {
      if (!formula.startsWith('=')) {
        setResult('Formula must start with =');
        setIsValid(false);
        return;
      }

      const formulaBody = formula.substring(1);
      
      // Handle simple cell references
      if (/^[A-Z]+\d+$/.test(formulaBody)) {
        const value = formulas.getCellValue(formulaBody);
        setResult(value);
        setIsValid(true);
        return;
      }

      // Handle functions
      const funcMatch = formulaBody.match(/^([A-Z]+)\(([^)]*)\)$/i);
      if (funcMatch) {
        const funcName = funcMatch[1].toUpperCase();
        const argsStr = funcMatch[2];
        
        if (formulas[funcName]) {
          const args = formulas.parseArguments(argsStr);
          const result = formulas[funcName](...args);
          setResult(result);
          setIsValid(true);
        } else {
          setResult(`#NAME? - Unknown function: ${funcName}`);
          setIsValid(false);
        }
        return;
      }

      // Handle basic expressions
      try {
        const evaluated = new Function(`
          const { ${Object.keys(formulas).join(', ')} } = this;
          return ${formulaBody};
        `).call(formulas);
        
        setResult(evaluated);
        setIsValid(true);
      } catch (e) {
        setResult(`#ERROR! - ${e.message}`);
        setIsValid(false);
      }

    } catch (error) {
      setResult(`#ERROR! - ${error.message}`);
      setIsValid(false);
    }
  }, [formula, formulas]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      evaluateFormula();
    }
  };
//
  const insertFunction = (funcName) => {
    setFormula(`=${funcName}()`);
    // Focus on the input after insertion
    setTimeout(() => {
      const input = document.querySelector('.formula-parser input');
      input?.focus();
    }, 0);
  };
  



const formulaExamples = [
  {
    name: 'Basic Sum',
    formula: '=SUM(A1:A10)',
    description: 'Adds all numbers in range A1 to A10'
  },
  {
    name: 'Average',
    formula: '=AVERAGE(B1:B20)',
    description: 'Calculates average of values in B1 to B20'
  },
  {
    name: 'Date Difference',
    formula: '=DAYS(TODAY(), A1)',
    description: 'Days between today and date in A1'
  },
  // Math
  { name: 'Minimum Value', formula: '=MIN(5, 2, 8)', description: 'Returns the smallest number' },
  { name: 'Maximum Value', formula: '=MAX(5, 2, 8)', description: 'Returns the largest number' },
  { name: 'Rounded Value', formula: '=ROUND(3.14159, 2)', description: 'Rounds 3.14159 to 2 decimal places' },
  { name: 'Absolute Value', formula: '=ABS(-42)', description: 'Returns the absolute value of -42' },
  { name: 'Count Values', formula: '=COUNT(1, "a", TRUE, 5)', description: 'Counts numeric values' },
  { name: 'Square Root', formula: '=SQRT(16)', description: 'Returns square root of 16' },
  { name: 'Power Function', formula: '=POWER(2, 3)', description: 'Calculates 2 raised to the power of 3' },

  // Financial
  { name: 'Loan Payment', formula: '=PMT(0.05/12, 60, -20000)', description: 'Monthly payment for a loan' },
  { name: 'Future Value', formula: '=FV(0.04, 5, -2000, 0)', description: 'Future value of an investment' },
  { name: 'Present Value', formula: '=PV(0.04, 5, -2000)', description: 'Present value of future payments' },
  { name: 'Interest Rate', formula: '=RATE(60, -200, 10000)', description: 'Calculates interest rate per period' },
  { name: 'Number of Periods', formula: '=NPER(0.05/12, -100, 5000)', description: 'Periods to pay off loan' },

  // Date
  { name: 'Today\'s Date', formula: '=TODAY()', description: 'Returns current date' },
  { name: 'Current DateTime', formula: '=NOW()', description: 'Returns current date and time' },
  { name: 'Create Date', formula: '=DATE(2025, 6, 10)', description: 'Creates date from year, month, day' },
  { name: 'Days Between Dates', formula: '=DAYS("2025-12-31", "2025-06-10")', description: 'Days between two dates' },
  { name: 'Extract Year', formula: '=YEAR(DATE(2025, 6, 10))', description: 'Returns year part of date' },
  { name: 'Extract Month', formula: '=MONTH(DATE(2025, 6, 10))', description: 'Returns month part of date' },

  // Text
  { name: 'Concatenate Text', formula: '=CONCATENATE("Hello ", "World")', description: 'Joins two text strings' },
  { name: 'Left Characters', formula: '=LEFT("OpenAI", 4)', description: 'Gets first 4 characters' },
  { name: 'Right Characters', formula: '=RIGHT("OpenAI", 2)', description: 'Gets last 2 characters' },
  { name: 'Text Length', formula: '=LEN("Test")', description: 'Returns number of characters' },
  { name: 'To Uppercase', formula: '=UPPER("hello")', description: 'Converts text to uppercase' },
  { name: 'To Lowercase', formula: '=LOWER("HELLO")', description: 'Converts text to lowercase' },
  { name: 'Trim Spaces', formula: '=TRIM("   spaced text   ")', description: 'Removes leading/trailing spaces' },

  // Logical
  { name: 'IF Condition', formula: '=IF(10 > 5, "Yes", "No")', description: 'Returns Yes if 10 is greater than 5' },
  { name: 'Logical AND', formula: '=AND(TRUE, 5 > 3)', description: 'Returns TRUE if all conditions are true' },
  { name: 'Logical OR', formula: '=OR(FALSE, 5 > 3)', description: 'Returns TRUE if any condition is true' },
  { name: 'Logical NOT', formula: '=NOT(TRUE)', description: 'Returns opposite of logical value' }
];

  return (
    <div className="formula-parser p-4 border rounded-lg shadow-sm bg-white relative">
      {/* --- Dropdown Menu --- */}
      <div className="relative inline-block text-left mb-4">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
        >
          <span className="text-xl">⋮</span>
        </button>

       {showDropdown && (
  <div className="absolute z-20 mt-2 flex bg-white border rounded shadow-lg">
    {/* Main Categories List */}
    <div className="w-48">
      {functionCategories.map((cat, idx) => (
        <div
          key={idx}
          onMouseEnter={() => setHoveredCategory(cat)}
          className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
        >
          {cat.name}
          <span className="ml-2 text-gray-400">›</span>
        </div>
      ))}
    </div>

    {/* Submenu: Formulas */}
    {hoveredCategory && (
  <div
    className="w-56 bg-white border-l overflow-y-auto"
    style={{ maxHeight: '400px' }} // or adjust as needed
    onMouseLeave={() => setHoveredCategory(null)}
    onMouseEnter={() => setHoveredCategory(hoveredCategory)}
  >
    {hoveredCategory.functions.map((func, idx) => (
      <div
        key={idx}
        onClick={() => {
          insertFunction(func);
          setShowDropdown(false);
          setHoveredCategory(null);
        }}
        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
      >
        {func}
      </div>
    ))}
  </div>
)}

  </div>
)}

      </div>

      {/* --- Formula Input --- */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Enter Formula:</label>
        <div className="flex">
          <input
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="e.g. =SUM(1,2)"
            className="flex-1 p-2 border rounded-l focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={evaluateFormula}
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 flex items-center"
          >
            <Play className="mr-1" size={16} />
            Evaluate
          </button>
        </div>
      </div>

      {/* --- Result Display --- */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Result:</label>
        <div className={`p-3 border rounded ${isValid ? 'bg-gray-50' : 'bg-red-50 border-red-200'}`}>
          <code className={isValid ? 'text-gray-800' : 'text-red-600'}>
            {typeof result === 'object' ? JSON.stringify(result) : String(result)}
          </code>
        </div>
      </div>
    </div>
  );
}

export default FormulaParser;