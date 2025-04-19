const express = require('express');
const { Pool } = require('pg');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // for Render
  }
});



// 🟢 GET all todos
app.get('/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todo_app ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 🟢 GET one todo by ID
app.get('/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM todo_app WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).send('Todo not found');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 🟡 POST create new todo
app.post('/todos', async (req, res) => {
  const { name, completed } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO todo_app (name, completed) VALUES ($1, $2) RETURNING *',
      [name, completed ?? false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 🟠 PUT update todo (replace whole item)
app.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { name, completed } = req.body;
  try {
    const result = await pool.query(
      'UPDATE todo_app SET name = $1, completed = $2 WHERE id = $3 RETURNING *',
      [name, completed, id]
    );
    if (result.rows.length === 0) return res.status(404).send('Todo not found');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 🟣 PATCH update todo (partial)
app.patch('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { name, completed } = req.body;

  try {
    // Get current values
    const current = await pool.query('SELECT * FROM todo_app WHERE id = $1', [id]);
    if (current.rows.length === 0) return res.status(404).send('Todo not found');

    const newName = name ?? current.rows[0].name;
    const newCompleted = completed ?? current.rows[0].completed;

    const result = await pool.query(
      'UPDATE todo_app SET name = $1, completed = $2 WHERE id = $3 RETURNING *',
      [newName, newCompleted, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 🔴 DELETE a todo
app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM todo_app WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).send('Todo not found');
    res.send('Todo deleted');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 🚀 Start server
app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
