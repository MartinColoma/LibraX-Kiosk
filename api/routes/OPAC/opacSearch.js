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

    let data = [];

    // Build base select
    const baseSelect = `
      *,
      categories:category_id(category_name),
      book_authors(
        authors(name)
      )
    `;

    if (type === "keyword") {
      // Search across title - first query
      const { data: titleResults, error: titleError } = await supabase
        .from("books")
        .select(baseSelect)
        .ilike("title", `%${query}%`);

      if (titleError) {
        console.error("Title search error:", titleError.message);
      } else {
        data = data.concat(titleResults || []);
      }

      // Search across category - second query
      const { data: categoryResults, error: categoryError } = await supabase
        .from("books")
        .select(baseSelect)
        .ilike("categories.category_name", `%${query}%`);

      if (categoryError) {
        console.error("Category search error:", categoryError.message);
      } else {
        data = data.concat(categoryResults || []);
      }

      // Search across author - third query
      const { data: authorResults, error: authorError } = await supabase
        .from("books")
        .select(baseSelect)
        .ilike("book_authors.authors.name", `%${query}%`);

      if (authorError) {
        console.error("Author search error:", authorError.message);
      } else {
        data = data.concat(authorResults || []);
      }

    } else if (type === "title") {
      const { data: results, error } = await supabase
        .from("books")
        .select(baseSelect)
        .ilike("title", `%${query}%`);

      if (error) {
        console.error("Title search error:", error.message);
        return res.status(200).json([]);
      }

      data = results || [];

    } else if (type === "author") {
      const { data: results, error } = await supabase
        .from("books")
        .select(baseSelect)
        .ilike("book_authors.authors.name", `%${query}%`);

      if (error) {
        console.error("Author search error:", error.message);
        return res.status(200).json([]);
      }

      data = results || [];

    } else if (type === "subject") {
      const { data: results, error } = await supabase
        .from("books")
        .select(baseSelect)
        .ilike("categories.category_name", `%${query}%`);

      if (error) {
        console.error("Subject search error:", error.message);
        return res.status(200).json([]);
      }

      data = results || [];
    }

    // Deduplicate books by book_id using a Map
    const uniqueBooks = new Map();
    
    data.forEach(book => {
      if (!uniqueBooks.has(book.book_id)) {
        uniqueBooks.set(book.book_id, book);
      }
    });

    // Flatten authors and format data
    const formattedData = Array.from(uniqueBooks.values()).map(book => {
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

    console.log(`[OPAC Search] Found ${formattedData.length} results (after deduplication)`);

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