const axios = require('axios');

const OPEN_LIBRARY_API = 'https://openlibrary.org';

/**
 * Search books by title or author
 * @param {string} query - Search query (title or author)
 * @returns {Promise<Array>} - Array of book results
 */
exports.searchBooks = async (query) => {
    try {
        const response = await axios.get(`${OPEN_LIBRARY_API}/search.json`, {
            params: {
                title: query,
                limit: 10,
            },
            timeout: 5000,
        });

        if (!response.data.docs || response.data.docs.length === 0) {
            return [];
        }

        return response.data.docs.map((doc) => ({
            title: doc.title || 'Unknown',
            author: doc.author_name ? doc.author_name[0] : 'Unknown',
            isbn: doc.isbn ? doc.isbn[0] : null,
            publishYear: doc.first_publish_year || null,
            openLibraryId: doc.key || null,
            coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
        }));
    } catch (error) {
        console.error('Open Library API Error:', error.message);
        throw new Error(`Failed to fetch books from Open Library: ${error.message}`);
    }
};

/**
 * Get book details by ISBN
 * @param {string} isbn - ISBN number
 * @returns {Promise<Object>} - Book details
 */
exports.getBookByISBN = async (isbn) => {
    try {
        const response = await axios.get(`${OPEN_LIBRARY_API}/api/books`, {
            params: {
                bibkeys: `ISBN:${isbn}`,
                jio: 'json',
            },
            timeout: 5000,
        });

        const bookData = Object.values(response.data)[0];

        if (!bookData) {
            return null;
        }

        return {
            title: bookData.title || 'Unknown',
            author: bookData.authors ? bookData.authors[0].name : 'Unknown',
            isbn: isbn,
            publishedDate: bookData.publish_date || null,
            pages: bookData.number_of_pages || null,
            openLibraryId: bookData.url ? bookData.url.split('/')[4] : null,
            description: bookData.description || '',
        };
    } catch (error) {
        console.error('Open Library ISBN lookup error:', error.message);
        return null;
    }
};

/**
 * Search books by author
 * @param {string} authorName - Author name
 * @returns {Promise<Array>} - Array of books by author
 */
exports.searchByAuthor = async (authorName) => {
    try {
        const response = await axios.get(`${OPEN_LIBRARY_API}/search.json`, {
            params: {
                author: authorName,
                limit: 10,
            },
            timeout: 5000,
        });

        if (!response.data.docs || response.data.docs.length === 0) {
            return [];
        }

        return response.data.docs.map((doc) => ({
            title: doc.title || 'Unknown',
            author: doc.author_name ? doc.author_name[0] : 'Unknown',
            isbn: doc.isbn ? doc.isbn[0] : null,
            publishYear: doc.first_publish_year || null,
            openLibraryId: doc.key || null,
        }));
    } catch (error) {
        console.error('Open Library API Error:', error.message);
        throw new Error(`Failed to fetch books by author: ${error.message}`);
    }
};
