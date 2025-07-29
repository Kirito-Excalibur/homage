import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the flooring.json file
const flooringPath = path.join(__dirname, '../assets/flooring.json');
const flooringData = JSON.parse(fs.readFileSync(flooringPath, 'utf8'));

// Function to format data array as grid
function formatDataAsGrid(data, width) {
    const rows = [];
    for (let i = 0; i < data.length; i += width) {
        const row = data.slice(i, i + width);
        rows.push('            ' + row.join(', '));
    }
    return rows.join(',\n');
}

// Format each layer's data array
flooringData.layers.forEach(layer => {
    if (layer.data && Array.isArray(layer.data)) {
        // Convert to grid format (50 tiles per row)
        const formattedData = formatDataAsGrid(layer.data, 50);
        layer.data = `[\n${formattedData}\n         ]`;
    }
});

// Write the formatted JSON back
const formattedJson = JSON.stringify(flooringData, null, 3)
    .replace(/"data": "\[/g, '"data": [')
    .replace(/\]"/g, ']')
    .replace(/\\n/g, '\n');

fs.writeFileSync(flooringPath, formattedJson, 'utf8');

console.log('Flooring.json has been reformatted with proper grid structure!');