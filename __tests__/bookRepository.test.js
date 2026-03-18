jest.mock('../db/knex');

const knex = require('../db/knex');
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../src/repository/bookRepository');

describe('Book Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all books from database', async () => {
    const mockBooks = [
      {
        id: 1,
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0-7432-7356-5',
        quantity: 5,
        shelf_location: 'A1',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      },
      {
        id: 2,
        title: '1984',
        author: 'George Orwell',
        isbn: '978-0-451-52494-2',
        quantity: 3,
        shelf_location: 'B2',
        created_at: '2024-01-02T10:00:00Z',
        updated_at: '2024-01-02T10:00:00Z',
      },
    ];

    knex.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockBooks),
    });

    const books = await getAllBooks();

    expect(books).toHaveLength(2);
    expect(books[0]).toEqual({
      id: 1,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5',
      quantity: 5,
      shelfLocation: 'A1',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    });
    expect(books[1].title).toBe('1984');
  });

  it('should retrieve a specific book by id', async () => {
    const mockBook = {
      id: 5,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      quantity: 2,
      shelf_location: 'C3',
      created_at: '2024-01-03T10:00:00Z',
      updated_at: '2024-01-03T10:00:00Z',
    };

    knex.mockReturnValue({
      where: jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue(mockBook),
      }),
    });

    const book = await getBookById(5);

    expect(book).toEqual({
      id: 5,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      quantity: 2,
      shelfLocation: 'C3',
      createdAt: '2024-01-03T10:00:00Z',
      updatedAt: '2024-01-03T10:00:00Z',
    });
    expect(knex).toHaveBeenCalledWith('books');
  });

  it('should create a new book and return it with generated id', async () => {
    const newBookPayload = {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '978-0-14-143951-8',
      quantity: 4,
      shelfLocation: 'D4',
    };

    const createdBook = {
      id: 10,
      title: newBookPayload.title,
      author: newBookPayload.author,
      isbn: newBookPayload.isbn,
      quantity: newBookPayload.quantity,
      shelf_location: newBookPayload.shelfLocation,
      created_at: '2024-01-04T10:00:00Z',
      updated_at: '2024-01-04T10:00:00Z',
    };

    knex.mockReturnValue({
      insert: jest.fn().mockResolvedValue([10]),
    });

    // Mock the subsequent getBookById call
    knex.mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue([10]),
    }).mockReturnValue({
      where: jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue(createdBook),
      }),
    });

    const book = await createBook(newBookPayload);

    expect(book.title).toBe('Pride and Prejudice');
    expect(book.author).toBe('Jane Austen');
    expect(book.isbn).toBe('978-0-14-143951-8');
    expect(book.id).toBe(10);
  });

  it('should update a book with new values', async () => {
    const updatedBook = {
      id: 3,
      title: 'Updated Title',
      author: 'Original Author',
      isbn: '978-0-123-45678-9',
      quantity: 7,
      shelf_location: 'E5',
      created_at: '2024-01-05T10:00:00Z',
      updated_at: '2024-01-05T11:00:00Z',
    };

    knex.mockReturnValue({
      where: jest.fn().mockReturnValue({
        update: jest.fn().mockResolvedValue(1),
        first: jest.fn().mockResolvedValue(updatedBook),
      }),
    });

    const result = await updateBook(3, { title: 'Updated Title', quantity: 7 });

    expect(result.title).toBe('Updated Title');
    expect(result.quantity).toBe(7);
    expect(result.id).toBe(3);
  });

  it('should delete a book and return deleted book data', async () => {
    const deletedBook = {
      id: 7,
      title: 'Deleted Book',
      author: 'Author Name',
      isbn: '978-0-987-65432-1',
      quantity: 1,
      shelf_location: 'F6',
      created_at: '2024-01-06T10:00:00Z',
      updated_at: '2024-01-06T10:00:00Z',
    };

    knex.mockReturnValue({
      where: jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue(deletedBook),
        del: jest.fn().mockResolvedValue(1),
      }),
    });

    const result = await deleteBook(7);

    expect(result.title).toBe('Deleted Book');
    expect(result.id).toBe(7);
    expect(knex).toHaveBeenCalledWith('books');
  });

  it('should return null when book does not exist', async () => {
    knex.mockReturnValue({
      where: jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      }),
    });

    const book = await getBookById(999);

    expect(book).toBeNull();
  });
});
