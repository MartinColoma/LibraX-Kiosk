const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /opac/search?type=keyword&query=harry
router.get("/search", async (req, res) => {
  try {
    const { type = "keyword", query = "" } = req.query;

    console.log(`[OPAC Search] type=${type}, query=${query}`);

    if (!query.trim()) {
      return res.status(200).json([]);
    }

    let bookIds = new Set();

    // STEP 1: Find matching book IDs (without joins to avoid duplicates)
    if (type === "keyword") {
      // Search title
      const { data: titleResults } = await supabase
        .from("books")
        .select("book_id");
        // .ilike("title", `%${query}%`);

      // Using rpc or manual filtering since ilike might not work as expected
      const { data: allBooks } = await supabase
        .from("books")
        .select("book_id, title");

      if (allBooks) {
        allBooks.forEach(book => {
          if (book.title.toLowerCase().includes(query.toLowerCase())) {
            bookIds.add(book.book_id);
          }
        });
      }

      // Search category
      const { data: allBooksWithCategory } = await supabase
        .from("books")
        .select("book_id, categories(category_name)");

      if (allBooksWithCategory) {
        allBooksWithCategory.forEach(book => {
          if (book.categories?.category_name?.toLowerCase().includes(query.toLowerCase())) {
            bookIds.add(book.book_id);
          }
        });
      }

      // Search authors
      const { data: allAuthors } = await supabase
        .from("book_authors")
        .select("book_id, authors(name)");

      if (allAuthors) {
        allAuthors.forEach(item => {
          if (item.authors?.name?.toLowerCase().includes(query.toLowerCase())) {
            bookIds.add(item.book_id);
          }
        });
      }

    } else if (type === "title") {
      const { data: allBooks } = await supabase
        .from("books")
        .select("book_id, title");

      if (allBooks) {
        allBooks.forEach(book => {
          if (book.title.toLowerCase().includes(query.toLowerCase())) {
            bookIds.add(book.book_id);
          }
        });
      }

    } else if (type === "author") {
      const { data: allAuthors } = await supabase
        .from("book_authors")
        .select("book_id, authors(name)");

      if (allAuthors) {
        allAuthors.forEach(item => {
          if (item.authors?.name?.toLowerCase().includes(query.toLowerCase())) {
            bookIds.add(item.book_id);
          }
        });
      }

    } else if (type === "subject") {
      const { data: allBooksWithCategory } = await supabase
        .from("books")
        .select("book_id, categories(category_name)");

      if (allBooksWithCategory) {
        allBooksWithCategory.forEach(book => {
          if (book.categories?.category_name?.toLowerCase().includes(query.toLowerCase())) {
            bookIds.add(book.book_id);
          }
        });
      }
    }

    if (bookIds.size === 0) {
      console.log("[OPAC Search] No matching books found");
      return res.status(200).json([]);
    }

    // STEP 2: Fetch full book data with authors for matched books
    const { data: booksData } = await supabase
      .from("books")
      .select(`
        book_id,
        isbn,
        title,
        subtitle,
        description,
        publisher,
        publication_year,
        edition,
        language,
        date_added,
        categories:category_id(category_name),
        book_authors(
          authors(name)
        )
      `)
      .in("book_id", Array.from(bookIds));

    // STEP 3: Format and return data
    const formattedData = (booksData || []).map(book => {
      const authorNames = book.book_authors
        ?.map(ba => ba.authors?.name)
        .filter(Boolean)
        .join(", ") || "N/A";

      return {
        book_id: book.book_id,
        isbn: book.isbn,
        title: book.title,
        subtitle: book.subtitle,
        description: book.description,
        publisher: book.publisher || "N/A",
        publication_year: book.publication_year || "N/A",
        edition: book.edition || "N/A",
        author: authorNames,
        genre: book.categories?.category_name || "N/A",
        language: book.language || "English",
        date_added: book.date_added,
        available: 0, // Placeholder - add actual column if available
        total: 0 // Placeholder - add actual column if available
      };
    });

    console.log(`[OPAC Search] Found ${formattedData.length} results`);

    return res.status(200).json(formattedData);

  } catch (err) {
    console.error("OPAC search exception:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Search failed",
      error: err.message 
    });
  }
});

module.exports = router;