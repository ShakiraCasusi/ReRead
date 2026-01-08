require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const User = require('../models/User');
const connectDB = require('../config/database');

// Default seller ID - will be created if doesn't exist
let defaultSellerId = null;

// Books data from shop.js
const booksData = [
  // ROMANCE (8 books)
  {
    title: "The Fault in Our Stars",
    author: "John Green",
    genre: "Romance",
    quality: "Like New",
    price: 250,
    originalPrice: 450,
    rating: 4.8,
    image: "https://m.media-amazon.com/images/I/817v3tItOJL._SY342_.jpg",
    featured: true,
  },
  {
    title: "Me Before You",
    author: "Jojo Moyes",
    genre: "Romance",
    quality: "Very Good",
    price: 320,
    originalPrice: 550,
    rating: 4.6,
    image: "https://tse4.mm.bing.net/th/id/OIP.J6d7qlj0JA7Q-tUiWfJwDwHaLW?pid=Api&P=0&h=180",
    isNewBook: true,
  },
  {
    title: "The Notebook",
    author: "Nicholas Sparks",
    genre: "Romance",
    quality: "Good",
    price: 180,
    originalPrice: 350,
    rating: 4.5,
    image: "https://i.pinimg.com/736x/82/c4/9a/82c49a3063475b9b259782451116a55c--the-notebook-nicholas-sparks-library-cards.jpg",
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Romance",
    quality: "New",
    price: 280,
    originalPrice: 480,
    rating: 4.9,
    image: "https://tse2.mm.bing.net/th/id/OIP.7bJprntwV1Fxtv72bdzmkAHaLc?pid=Api&P=0&h=180",
  },
  {
    title: "The Time Traveler's Wife",
    author: "Audrey Niffenegger",
    genre: "Romance",
    quality: "Fair",
    price: 150,
    originalPrice: 300,
    rating: 4.3,
    image: "https://m.media-amazon.com/images/I/51NiGlapXlL._SX331_BO1,204,203,200_.jpg",
  },
  {
    title: "Ang Mutya ng Section E",
    author: "Lara Krizzel Flores",
    genre: "Romance",
    quality: "Very Good",
    price: 150,
    originalPrice: 500,
    rating: 4.7,
    image: "https://via.placeholder.com/300x450/f3f4f6/6b7280?text=Book+Cover",
    isNewBook: true,
  },
  {
    title: "Eleanor & Park",
    author: "Rainbow Rowell",
    genre: "Romance",
    quality: "Like New",
    price: 240,
    originalPrice: 420,
    rating: 4.8,
    image: "https://tse2.mm.bing.net/th/id/OIP.t-u1Q-W77-oF0OVjTpHQHwHaLW?pid=Api&P=0&h=180",
  },
  {
    title: "The Rosie Project",
    author: "Graeme Simsion",
    genre: "Romance",
    quality: "Good",
    price: 200,
    originalPrice: 380,
    rating: 4.4,
    image: "https://cdn.penguin.co.uk/dam-assets/books/9781405912792/9781405912792-jacket-large.jpg",
  },

  // ADVENTURE (8 books)
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Adventure",
    quality: "Very Good",
    price: 280,
    originalPrice: 450,
    rating: 4.7,
    image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg",
    featured: true,
  },
  {
    title: "Life of Pi",
    author: "Yann Martel",
    genre: "Adventure",
    quality: "Like New",
    price: 320,
    originalPrice: 520,
    rating: 4.8,
    image: "https://diwanegypt.com/wp-content/uploads/2023/01/9781786894243.jpg",
  },
  {
    title: "Into the Wild",
    author: "Jon Krakauer",
    genre: "Adventure",
    quality: "Good",
    price: 190,
    originalPrice: 380,
    rating: 4.5,
    image: "https://m.media-amazon.com/images/I/713SeNQjEAL._SL1428_.jpg",
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Adventure",
    quality: "New",
    price: 380,
    originalPrice: 550,
    rating: 4.9,
    image: "https://i.pinimg.com/originals/27/cf/91/27cf91f605923223613909c7b9d2219f.jpg",
  },
  {
    title: "Treasure Island",
    author: "Robert Louis Stevenson",
    genre: "Adventure",
    quality: "Fair",
    price: 140,
    originalPrice: 300,
    rating: 4.2,
    image: "http://images.macmillan.com/folio-assets/macmillan_us_frontbookcovers_1000H/9780812505085.jpg",
  },
  {
    title: "The Call of the Wild",
    author: "Jack London",
    genre: "Adventure",
    quality: "Very Good",
    price: 160,
    originalPrice: 320,
    rating: 4.6,
    image: "https://m.media-amazon.com/images/I/81gC9oXiMHL.jpg",
  },
  {
    title: "Around the World in 80 Days",
    author: "Jules Verne",
    genre: "Adventure",
    quality: "Like New",
    price: 200,
    originalPrice: 380,
    rating: 4.8,
    image: "https://images.thenile.io/r1000/9781509827855.jpg",
  },
  {
    title: "Robinson Crusoe",
    author: "Daniel Defoe",
    genre: "Adventure",
    quality: "Good",
    price: 150,
    originalPrice: 290,
    rating: 4.4,
    image: "https://tse4.mm.bing.net/th/id/OIP.1eNhPIbp9zGlKFRQo7omywHaLc?pid=Api&P=0&h=180",
  },

  // BUSINESS (7 books)
  {
    title: "The 48 Laws of Power",
    author: "Robert Greene",
    genre: "Business",
    quality: "New",
    price: 620,
    originalPrice: 950,
    rating: 4.9,
    image: "https://img.swifdoo.com/image/the-48-laws-of-power-book-cover.png",
    featured: true,
    isNewBook: true,
  },
  {
    title: "Rich Dad Poor Dad",
    author: "Robert Kiyosaki",
    genre: "Business",
    quality: "Like New",
    price: 380,
    originalPrice: 580,
    rating: 4.8,
    image: "https://cdn.kobo.com/book-images/c81ea4de-cfb7-415d-8634-314aad041fdb/353/569/90/False/rich-dad-poor-dad-9.jpg",
  },
  {
    title: "Good to Great",
    author: "James C. Collins",
    genre: "Business",
    quality: "Very Good",
    price: 420,
    originalPrice: 600,
    rating: 4.7,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRUAV3qje59Dy_cs2xEJbdqTwFyrGgvUk5Qg&s",
  },
  {
    title: "The Lean Startup",
    author: "Eric Ries",
    genre: "Business",
    quality: "Good",
    price: 380,
    originalPrice: 550,
    rating: 4.6,
    image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1629999184i/10127019.jpg",
  },
  {
    title: "Zero to One",
    author: "Peter Thiel",
    genre: "Business",
    quality: "Fair",
    price: 320,
    originalPrice: 480,
    rating: 4.3,
    image: "https://cdn2.penguin.com.au/covers/original/9780753555200.jpg",
  },
  {
    title: "The E-Myth Revisited",
    author: "Michael E. Gerber",
    genre: "Business",
    quality: "Very Good",
    price: 350,
    originalPrice: 520,
    rating: 4.7,
    image: "https://cdn.gramedia.com/uploads/products/its5d8tcy9.jpg",
  },
  {
    title: "Think and Grow Rich",
    author: "Napoleon Hill",
    genre: "Business",
    quality: "Like New",
    price: 280,
    originalPrice: 450,
    rating: 4.8,
    image: "https://m.media-amazon.com/images/I/61IxJuRI39L._UF1000,1000_QL80_.jpg",
  },

  // EDUCATION (6 books)
  {
    title: "Noli Me Tangere",
    author: "Jose Rizal",
    genre: "Education",
    quality: "New",
    price: 280,
    originalPrice: 450,
    rating: 4.9,
    image: "https://images.penguinrandomhouse.com/cover/9780143039693",
  },
  {
    title: "El Filibusterismo",
    author: "Jose Rizal",
    genre: "Education",
    quality: "Like New",
    price: 280,
    originalPrice: 450,
    rating: 4.8,
    image: "https://i.pinimg.com/originals/ed/c3/62/edc3622b98ad0fd81999757a690fa70a.jpg",
  },
  {
    title: "How to Win Friends",
    author: "Dale Carnegie",
    genre: "Education",
    quality: "Very Good",
    price: 320,
    originalPrice: 480,
    rating: 4.6,
    image: "https://miro.medium.com/v2/resize:fit:562/1*L-wIluP6f-DkLm_gSrFp6Q.png",
  },
  {
    title: "The 7 Habits",
    author: "Stephen Covey",
    genre: "Education",
    quality: "Good",
    price: 380,
    originalPrice: 550,
    rating: 4.5,
    image: "https://tse2.mm.bing.net/th/id/OIP.BjaMNuDJxolKJrbi9R6kIwHaLR?pid=Api&P=0&h=180",
  },
  {
    title: "Outliers",
    author: "Malcolm Gladwell",
    genre: "Education",
    quality: "Fair",
    price: 280,
    originalPrice: 420,
    rating: 4.3,
    image: "https://www.hachettebookgroup.com/wp-content/uploads/2017/06/HBGAuthors_Malcolm-Gladwell_Outliers_Paperback.jpg?resize=133",
  },
  {
    title: "Mindset",
    author: "Carol S. Dweck",
    genre: "Education",
    quality: "Very Good",
    price: 360,
    originalPrice: 520,
    rating: 4.7,
    image: "http://www.bibdsl.co.uk/imagegallery2/publisher/batch547/9781846046384-1.jpg",
  },

  // FINANCIAL LITERACY (7 books)
  {
    title: "The Total Money Makeover",
    author: "Dave Ramsey",
    genre: "Financial",
    quality: "New",
    price: 420,
    originalPrice: 650,
    rating: 4.9,
    image: "https://m.media-amazon.com/images/I/81eCiKyn8IL._SL1500_.jpg",
  },
  {
    title: "The Millionaire Next Door",
    author: "Thomas J. Stanley",
    genre: "Financial",
    quality: "Like New",
    price: 350,
    originalPrice: 520,
    rating: 4.8,
    image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1348313018i/998.jpg",
  },
  {
    title: "The Richest Man in Babylon",
    author: "George S. Clason",
    genre: "Financial",
    quality: "Very Good",
    price: 220,
    originalPrice: 380,
    rating: 4.7,
    image: "https://covers.storytel.com/jpg-640/9789354864186.96ef61b4-122c-488f-8f06-4b2850a6a8d5?optimize=high",
  },
  {
    title: "Your Money or Your Life",
    author: "Vicki Robin",
    genre: "Financial",
    quality: "Good",
    price: 320,
    originalPrice: 480,
    rating: 4.6,
    image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1699646424i/5634236.jpg",
  },
  {
    title: "I Will Teach You to Be Rich",
    author: "Ramit Sethi",
    genre: "Financial",
    quality: "Fair",
    price: 380,
    originalPrice: 550,
    rating: 4.2,
    image: "https://cdn.kobo.com/book-images/4a9a927c-1454-49d2-91f8-93e11cebdcc0/1200/1200/False/i-will-teach-you-to-be-rich-second-edition-2.jpg",
  },
  {
    title: "The Intelligent Investor",
    author: "Benjamin Graham",
    genre: "Financial",
    quality: "Very Good",
    price: 480,
    originalPrice: 680,
    rating: 4.7,
    image: "https://i.harperapps.com/hcanz/covers/9780061745171/y648.jpg",
  },
  {
    title: "The Barefoot Investor",
    author: "Scott Pape",
    genre: "Financial",
    quality: "Like New",
    price: 380,
    originalPrice: 550,
    rating: 4.8,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcmpkjobHl2kKzAuMAiAdI6-8sXsQmOs2M3w&s",
  },

  // MEMOIR (6 books)
  {
    title: "Educated",
    author: "Tara Westover",
    genre: "Memoir",
    quality: "Like New",
    price: 420,
    originalPrice: 600,
    rating: 4.8,
    image: "https://cdn2.penguin.com.au/covers/original/9780099511021.jpg",
  },
  {
    title: "Becoming",
    author: "Michelle Obama",
    genre: "Memoir",
    quality: "Very Good",
    price: 480,
    originalPrice: 680,
    rating: 4.7,
    image: "https://cdn2.penguin.com.au/covers/original/9780241334140.jpg",
  },
  {
    title: "The Glass Castle",
    author: "Jeannette Walls",
    genre: "Memoir",
    quality: "Good",
    price: 280,
    originalPrice: 420,
    rating: 4.5,
    image: "https://2.bp.blogspot.com/-WK7o1K62DjE/UQQP8d_afBI/AAAAAAAACh8/4xGQDpYpB3Q/s400/the-glass-castle-book.jpg",
  },
  {
    title: "When Breath Becomes Air",
    author: "Paul Kalanithi",
    genre: "Memoir",
    quality: "New",
    price: 380,
    originalPrice: 550,
    rating: 4.9,
    image: "https://tse4.mm.bing.net/th/id/OIP._i3k60tiBT9OFDYwv-TuXQHaLT?pid=Api&P=0&h=180",
  },
  {
    title: "Born a Crime",
    author: "Trevor Noah",
    genre: "Memoir",
    quality: "Fair",
    price: 320,
    originalPrice: 480,
    rating: 4.3,
    image: "https://tse4.mm.bing.net/th/id/OIP.WbFkM0dqN_YUxTud_FkurAHaLX?pid=Api&P=0&h=180",
  },
  {
    title: "The Diary of a Young Girl",
    author: "Anne Frank",
    genre: "Memoir",
    quality: "Very Good",
    price: 250,
    originalPrice: 400,
    rating: 4.6,
    image: "https://tse4.mm.bing.net/th/id/OIP.L6Mj-G6PyXe-mcFZLM4J5QHaML?pid=Api&P=0&h=180",
  },

  // SELF-HELP (8 books)
  {
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Help",
    quality: "New",
    price: 550,
    originalPrice: 850,
    rating: 4.9,
    image: "https://m.media-amazon.com/images/I/81YkqyaFVEL.jpg",
    featured: true,
    isNewBook: true,
  },
  {
    title: "The Subtle Art of Not Giving a F*ck",
    author: "Mark Manson",
    genre: "Self-Help",
    quality: "Like New",
    price: 380,
    originalPrice: 550,
    rating: 4.8,
    image: "https://m.media-amazon.com/images/I/71QKQ9mwV7L.jpg",
  },
  {
    title: "You Are a Badass",
    author: "Jen Sincero",
    genre: "Self-Help",
    quality: "Very Good",
    price: 320,
    originalPrice: 480,
    rating: 4.7,
    image: "https://tse2.mm.bing.net/th/id/OIP.1Z44lTp1g1CagcnIYq46YQAAAA?pid=Api&P=0&h=180",
  },
  {
    title: "The Power of Now",
    author: "Eckhart Tolle",
    genre: "Self-Help",
    quality: "Good",
    price: 280,
    originalPrice: 420,
    rating: 4.6,
    image: "https://cdn.kobo.com/book-images/59e80730-aaad-4b30-ac1d-fd5952880c01/1200/1200/False/the-power-of-now-1.jpg",
  },
  {
    title: "Daring Greatly",
    author: "Brené Brown",
    genre: "Self-Help",
    quality: "Fair",
    price: 280,
    originalPrice: 420,
    rating: 4.4,
    image: "https://upload.wikimedia.org/wikipedia/en/8/8e/Daring_Greatly_Book_Cover.png",
  },
  {
    title: "The Four Agreements",
    author: "Don Miguel Ruiz",
    genre: "Self-Help",
    quality: "Very Good",
    price: 250,
    originalPrice: 380,
    rating: 4.7,
    image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1630664059i/6596.jpg",
  },
  {
    title: "I Decided to Live as Me",
    author: "Kim Soo-hyun",
    genre: "Self-Help",
    quality: "Like New",
    price: 480,
    originalPrice: 700,
    rating: 4.8,
    image: "https://m.media-amazon.com/images/I/71BZLnEp3IL._SL1500_.jpg",
    isNewBook: true,
  },
  {
    title: "12 Rules for Life",
    author: "Jordan B. Peterson",
    genre: "Self-Help",
    quality: "Good",
    price: 420,
    originalPrice: 600,
    rating: 4.5,
    image: "https://tse4.mm.bing.net/th/id/OIP.ybYaaT3ebWRZtAp__fgqOwHaLX?pid=Api&P=0&h=180",
  },

  // SPIRITUAL (5 books)
  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    genre: "Spiritual",
    quality: "Like New",
    price: 250,
    originalPrice: 400,
    rating: 4.8,
    image: "https://m.media-amazon.com/images/I/81yLt8OG7zL._SL1500_.jpg",
    featured: true,
    isNewBook: true,
  },
  {
    title: "Siddhartha",
    author: "Hermann Hesse",
    genre: "Spiritual",
    quality: "Very Good",
    price: 200,
    originalPrice: 350,
    rating: 4.7,
    image: "https://m.media-amazon.com/images/I/81nzjWW5FFL._SL1500_.jpg",
  },
  {
    title: "The Prophet",
    author: "Kahlil Gibran",
    genre: "Spiritual",
    quality: "Good",
    price: 180,
    originalPrice: 320,
    rating: 4.6,
    image: "https://m.media-amazon.com/images/I/715NgyTt9FL._SL1500_.jpg",
  },
  {
    title: "Man's Search for Meaning",
    author: "Viktor E. Frankl",
    genre: "Spiritual",
    quality: "New",
    price: 320,
    originalPrice: 480,
    rating: 4.9,
    image: "https://www.justologist.com/content/images/2023/06/9781846046384-1.jpg",
  },
  {
    title: "The Celestine Prophecy",
    author: "James Redfield",
    genre: "Spiritual",
    quality: "Fair",
    price: 180,
    originalPrice: 320,
    rating: 4.3,
    image: "https://www.hachettebookgroup.com/wp-content/uploads/2018/09/9781538730263.jpg?fit=443%2C675",
  },

  // WOMEN (5 books)
  {
    title: "Lean In",
    author: "Sheryl Sandberg",
    genre: "Women",
    quality: "New",
    price: 380,
    originalPrice: 550,
    rating: 4.9,
    image: "https://cdn2.penguin.com.au/covers/original/9780753541647.jpg",
  },
  {
    title: "Bad Feminist",
    author: "Roxane Gay",
    genre: "Women",
    quality: "Like New",
    price: 320,
    originalPrice: 480,
    rating: 4.8,
    image: "https://m.media-amazon.com/images/I/91onBEiNeYL.jpg",
  },
  {
    title: "We Should All Be Feminists",
    author: "Chimamanda Ngozi Adichie",
    genre: "Women",
    quality: "Very Good",
    price: 180,
    originalPrice: 300,
    rating: 4.7,
    image: "https://africanbookaddict.files.wordpress.com/2015/01/adichie-feminist.jpg?w=324",
  },
  {
    title: "I Am Malala",
    author: "Malala Yousafzai",
    genre: "Women",
    quality: "Good",
    price: 280,
    originalPrice: 420,
    rating: 4.6,
    image: "https://tse4.mm.bing.net/th/id/OIP.V_IUiWQ2KIk61q6PqafvkgHaLe?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    title: "The Moment of Lift",
    author: "Melinda Gates",
    genre: "Women",
    quality: "Fair",
    price: 320,
    originalPrice: 480,
    rating: 4.4,
    image: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1540299907i/40776644.jpg",
  },
];

async function seedBooks() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    // Create or get default seller
    console.log('👤 Setting up default seller...');
    let defaultSeller = await User.findOne({ email: 'seller@reread.com' });
    if (!defaultSeller) {
      defaultSeller = await User.create({
        username: 'default_seller',
        email: 'seller@reread.com',
        password: 'Seller@123456',
        firstName: 'ReRead',
        lastName: 'Store',
        isSeller: true,
        role: ['buyer', 'seller'],
        sellerInfo: {
          storeName: 'ReRead Official Store',
          bankAccount: '0000000000',
          bankName: 'Main Bank',
          accountHolder: 'ReRead Store'
        }
      });
      console.log('✓ Default seller created');
    } else {
      console.log('✓ Default seller exists');
    }

    defaultSellerId = defaultSeller._id;

    // Add sellerId to all books
    const booksWithSeller = booksData.map(book => ({
      ...book,
      sellerId: defaultSellerId,
      sellerName: 'ReRead Official Store'
    }));

    console.log('🗑️  Clearing existing books...');
    await Book.deleteMany({});

    console.log('📚 Seeding books...');
    const books = await Book.insertMany(booksWithSeller);

    console.log(`✅ Successfully seeded ${books.length} books!`);
    console.log('\n📊 Summary:');

    // Count by genre
    const genreCounts = {};
    books.forEach(book => {
      genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
    });

    Object.entries(genreCounts).forEach(([genre, count]) => {
      console.log(`   ${genre}: ${count} books`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding books:', error);
    process.exit(1);
  }
}

seedBooks();
