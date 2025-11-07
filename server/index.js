const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const cors = require('cors');
const path = require('path');


const app = express();
app.use(cors());


const upload = multer({ dest: 'uploads/' });


// Upload endpoint — accepts single file field 'file'
app.post('/upload', upload.single('file'), (req, res) => {
try {
if (!req.file) return res.status(400).json({ error: 'No file uploaded' });


const workbook = XLSX.readFile(req.file.path);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];


// Convert sheet to JSON (array of objects)
const json = XLSX.utils.sheet_to_json(sheet, { defval: null });


// Optionally: delete uploaded file here if you want (fs.unlink)


res.json({ data: json });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Failed to parse Excel' });
}
});


// Optional health route
app.get('/', (req, res) => res.send('Excel upload API running'));


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));