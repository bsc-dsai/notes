const apiBaseUrl = 'https://western-cream-plant.glitch.me/';
const fileInput = document.getElementById('file-input');
const notesContainer = document.getElementById('notes-container');
const editModal = document.getElementById('edit-modal');
const editSubjectInput = document.getElementById('edit-subject');
const editTitleInput = document.getElementById('edit-title');
const editNoteContent = document.getElementById('edit-note-content');
const closeModal = document.querySelector('.close-modal');
const saveBtn = document.getElementById('save-btn');
const addNoteBtn = document.getElementById('add-note-btn');

const subject = document.body.dataset.subject || 'General';
let notes = [];
let currentEditIndex = null;

// Fetch notes from the server based on the current subject
async function fetchNotes() {
    try {
        const response = await fetch(`${apiBaseUrl}/notes?subject=${subject}`);
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        notes = await response.json();
        renderNotes();
    } catch (error) {
        console.error('Failed to fetch notes from server:', error);
        renderNotes();
    }
}

// Save notes to the server
async function addNoteToServer(content, title = 'Untitled') {
    const newNote = { title, subject, content };

    // Try to save to the server
    try {
        const response = await fetch(`${apiBaseUrl}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newNote)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        const data = await response.json();
        newNote.id = data.id; // Assign the new ID from the server
        notes.push(newNote);
        renderNotes();
    } catch (error) {
        console.error('Failed to add note to server:', error);
        newNote.id = Date.now(); // Temporary ID for local notes
        notes.push(newNote);
        renderNotes();
    }
}

// Update a note on the server
async function updateNoteOnServer(id, content, title, newSubject) {
    const updatedNote = { title, subject: newSubject, content };

    // Try to update on the server
    try {
        const response = await fetch(`${apiBaseUrl}/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedNote)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
    } catch (error) {
        console.error('Failed to update note on server:', error);
    }
    
    // Update note locally and change its subject
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex > -1) {
        // If the subject changes, move the note to the new subject category
        const oldSubject = notes[noteIndex].subject;
        if (oldSubject !== newSubject) {
            notes = notes.filter(note => note.id !== id);
            // Create new note in the new subject category
            const newNotes = notes.filter(note => note.subject === newSubject) || [];
            newNotes.push({ id, title, subject: newSubject, content });
            notes = [...notes, ...newNotes];
            window.location.href = `/subjects/${newSubject.toLowerCase()}.html`; // Redirect to new subject page
        } else {
            notes[noteIndex] = { ...notes[noteIndex], ...updatedNote };
            renderNotes();
        }
    }
}

// Delete a note from the server
async function deleteNoteFromServer(id) {
    try {
        const response = await fetch(`${apiBaseUrl}/notes/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
    } catch (error) {
        console.error('Failed to delete note from server:', error);
    }

    // Delete note locally
    notes = notes.filter(note => note.id !== id);
    renderNotes();
}

// Add a new note (either from file upload or prompt)
function addNote(content, title = 'Untitled') {
    addNoteToServer(content, title);
}

// Render notes to the DOM
function renderNotes() {
    notesContainer.innerHTML = ''; // Clear the current content
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        noteElement.innerHTML = `
            <div class="note-header">
                <div class="note-header-content">
                    <div class="note-subject">${note.subject}</div>
                    <div class="note-title">${note.title}</div>
                </div>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editNote(${note.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteNote(${note.id})">Delete</button>
                </div>
            </div>
            <div class="note-content">${escapeHtml(note.content)}</div>
        `;
        notesContainer.appendChild(noteElement);
    });
}

// Edit a note
function editNote(id) {
    currentEditIndex = id;
    const note = notes.find(n => n.id === id);
    editSubjectInput.value = note.subject;
    editTitleInput.value = note.title;
    editNoteContent.value = note.content;
    editModal.style.display = 'block';
}

// Save the edited note
saveBtn.addEventListener('click', async () => {
    if (currentEditIndex !== null) {
        const note = notes.find(n => n.id === currentEditIndex);
        const newSubject = editSubjectInput.value;
        const newTitle = editTitleInput.value;
        const newContent = editNoteContent.value;

        await updateNoteOnServer(note.id, newContent, newTitle, newSubject);
        fetchNotes();  // Refresh notes list
        closeEditModal();
    }
});

// Delete a note
async function deleteNote(id) {
    await deleteNoteFromServer(id);
    notes = notes.filter(note => note.id !== id); // Remove note from the local list
    renderNotes();
}

// Close the modal
closeModal.addEventListener('click', closeEditModal);

function closeEditModal() {
    editModal.style.display = 'none';
}

// Close modal if clicking outside of content
window.onclick = function(event) {
    if (event.target === editModal) {
        closeEditModal();
    }
}

// Function to escape HTML special characters
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Handle file upload
fileInput.addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            addNote(content, file.name); // Include the file name as title
        };
        reader.readAsText(file);
    } else {
        alert('Please upload a valid .txt file.');
    }
}

// Add More Notes Button
addNoteBtn.addEventListener('click', () => {
    const newNoteContent = prompt('Enter your note:');
    if (newNoteContent) {
        addNote(newNoteContent, 'New Note');
    }
});

// Initial fetch of notes
fetchNotes();
