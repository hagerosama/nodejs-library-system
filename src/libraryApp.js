const express = require('express');
const booksRouter = require('./routes/books');
const borrowersRouter = require('./routes/borrowers');
const errorHandler = require('./facade/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send(
    'Library system API is running. Use /api/books and /api/borrowers to manage resources.',
  );
});

app.use('/api/books', booksRouter);
app.use('/api/borrowers', borrowersRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Library API running on http://localhost:${PORT}`);
});
