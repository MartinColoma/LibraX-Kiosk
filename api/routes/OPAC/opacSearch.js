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

    // Search for matching books - WITHOUT joining book_authors
    const baseSelect = `
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
      available_copies,
      total_copies,
      categories:category_id(category_name)
    `;

    if (type === "keyword") {
      // Search across title - first query
      const { data: titleResults, error: titleError } = await supabase
        .from("books")
        .select(baseSelect)
        .ilike("title", `%${query}%`);

      if (!titleError && titleResults) {
        titleResults.forEach(book => bookIds.add(book.book_id));
      } else if (titleError) {
        console.error("Title search error:", titleError.message);
      }

      // Search across category - second query
      const { data: categoryResults, error: categoryError } = await supabase
        .from("books")
        .select(baseSelect)
        .ilike("categories.category_name", `%${query}%`);

      if (!categoryError && categoryResults) {
        categoryResults.forEach(book => bookIds.add(book.book_id));
      } else if (categoryError) {
        console.error("Category search error:", categoryError.message);
      }

      // Search across author - third query
      const { data: authorIds, error: authorError } = await supabase
        .from("book_authors")
        .select("book_id")
        .ilike("authors.name", `%${query}%`);

      if (!authorError && authorIds) {
        authorIds.forEach(item => bookIds.add(item.book_id));
      } else if (authorError) {
        console.error("Author search error:", authorError.message);
      }

    } else if (type === "title") {
      const { data: results, error } = await supabase
        .from("books")
        .select(baseSelect)
        .ilike("title", `%${query}%`);

      if (!error && results) {
        results.forEach(book => bookIds.add(book.book_id));
      } else if (error) {
        console.error("Title search error:", error.message);
      }

    } else if (type === "author") {
      const { data: results, error } = await supabase
        .from("book_authors")
        .select("book_id")
        .ilike("authors.name", `%${query}%`);

      if (!error && results) {
        results.forEach(item => bookIds.add(item.book_id));
      } else if (error) {
        console.error("Author search error:", error.message);
      }

    } else if (type === "subject") {
      const { data: results, error } = await supabase
        .from("books")
        .select(baseSelect)
        .ilike("categories.category_name", `%${query}%`);

      if (!error && results) {
        results.forEach(book => bookIds.add(book.book_id));
      } else if (error) {
        console.error("Subject search error:", error.message);
      }
    }

    // Convert Set to Array
    const bookIdsArray = Array.from(bookIds);

    if (bookIdsArray.length === 0) {
      console.log("[OPAC Search] No matching books found");
      return res.status(200).json([]);
    }

    // Now fetch all matching books with their authors in one query
    const { data: booksData, error: booksError } = await supabase
      .from("books")
      .select(`
        ${baseSelect},
        book_authors(
          authors(name)
        )
      `)
      .in("book_id", bookIdsArray);

    if (booksError) {
      console.error("Books fetch error:", booksError.message);
      return res.status(200).json([]);
    }

    // Format the response
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
        edition: book.edition,
        author: authorNames,
        genre: book.categories?.category_name || "N/A",
        language: book.language,
        date_added: book.date_added,
        available: book.available_copies || 0,
        total: book.total_copies || 0
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