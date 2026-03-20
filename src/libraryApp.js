const express = require('express');
const booksRouter = require('./routes/booksRouter');
const borrowersRouter = require('./routes/borrowersRouter');
const errorHandler = require('./errorhandler/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send(
    'Library system API is running ..',
  );
});

app.use('/library/books', booksRouter);
app.use('/library/borrowers', borrowersRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Library API running on http://localhost:${PORT}`);
});
