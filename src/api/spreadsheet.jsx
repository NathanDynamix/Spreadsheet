export async function getSpreadsheets() {
  const res = await fetch('/api/spreadsheet');
  if (!res.ok) throw new Error('Failed to fetch spreadsheets');
  const data = await res.json();
  return data.data;
}

// Get a spreadsheet by ID
export async function getSpreadsheetById(id) {
  const res = await fetch(`/api/spreadsheet/${id}`);
  if (!res.ok) throw new Error('Failed to fetch spreadsheet');
  const data = await res.json();
  return data.data;
}

// Create a new spreadsheet
export async function createSpreadsheet({ name, data }) {
  const res = await fetch('/api/spreadsheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data }),
  });
  if (!res.ok) throw new Error('Failed to create spreadsheet');
  const result = await res.json();
  return result.data;
}

// Update a spreadsheet
export async function updateSpreadsheet(id, { name, data }) {
  const res = await fetch(`/api/spreadsheet/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data }),
  });
  if (!res.ok) throw new Error('Failed to update spreadsheet');
  const result = await res.json();
  return result.data;
}

// Delete a spreadsheet
export async function deleteSpreadsheet(id) {
  const res = await fetch(`/api/spreadsheet/${id}`, {
    method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete spreadsheet');
  return true;
} 