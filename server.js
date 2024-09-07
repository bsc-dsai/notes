const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const db = new sqlite3.Database('notes.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            subject TEXT,
            content TEXT
        )`);
    }
});

// Get notes filtered by subject
app.get('/notes', (req, res) => {
    const subject = req.query.subject || 'General';
    db.all('SELECT * FROM notes WHERE subject = ?', [subject], (err, rows) => {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

// Add a new note
app.post('/notes', (req, res) => {
    const { title, subject, content } = req.body;
    db.run('INSERT INTO notes (title, subject, content) VALUES (?, ?, ?)', [title, subject, content], function (err) {
        if (err) {
            return console.log(err.message);
        }
        res.json({ id: this.lastID });
    });
});

// Update a note
app.put('/notes/:id', (req, res) => {
    const { id } = req.params;
    const { title, subject, content } = req.body;
    db.run('UPDATE notes SET title = ?, subject = ?, content = ? WHERE id = ?', [title, subject, content, id], function (err) {
        if (err) {
            return console.log(err.message);
        }
        res.json({ changes: this.changes });
    });
});

// Delete a note
app.delete('/notes/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM notes WHERE id = ?', id, function (err) {
        if (err) {
            return console.log(err.message);
        }
        res.json({ changes: this.changes });
    });
});

// Serve subject-specific HTML pages
app.get('/subjects/:subject/:page', (req, res) => {
    const subject = req.params.subject;
    const page = req.params.page;
    res.sendFile(path.join(__dirname, `public/subjects/${subject}/${page}`));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
