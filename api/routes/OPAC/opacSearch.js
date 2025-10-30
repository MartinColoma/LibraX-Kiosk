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

    console.log(`[OPAC Search] type=${type}, query=${query}`); // Debug

    if (!query.trim()) {
      return res.status(200).json([]);
    }

    let data = [];

    if (type === "keyword") {
      // Search by title
      const { data: titleResults, error: titleError } = await supabase
        .from("books")
        .select(`
          *,
          categories:category_id(category_name),
          book_authors(
            authors(name)
          )
        `)
        .ilike("title", `%${query}%`);

      if (titleError) {
        console.error("Title search error:", titleError.message);
        return res.status(200).json([]);
      }

      // Search by category
      const { data: categoryResults, error: catError } = await supabase
        .from("books")
        .select(`
          *,
          categories:category_id(category_name),
          book_authors(
            authors(name)
          )
        `)
        .not("category_id", "is", null);

      if (catError) {
        console.error("Category search error:", catError.message);
      }

      // Search by author through book_authors junction table
      const { data: authorBookIds, error: authorError } = await supabase
        .from("book_authors")
        .select("book_id, authors(name)")
        .ilike("authors.name", `%${query}%`);

      if (authorError) {
        console.error("Author search error:", authorError.message);
      }

      let authorResults = [];
      if (authorBookIds && authorBookIds.length > 0) {
        const bookIds = authorBookIds.map(ab => ab.book_id);
        const { data: booksByAuthor, error: booksError } = await supabase
          .from("books")
          .select(`
            *,
            categories:category_id(category_name),
            book_authors(
              authors(name)
            )
          `)
          .in("book_id", bookIds);

        if (booksError) {
          console.error("Books by author error:", booksError.message);
        } else {
          authorResults = booksByAuthor || [];
        }
      }

      // Filter category results by category_name
      const filteredCategoryResults = (categoryResults || []).filter(book => 
        book.categories?.category_name?.toLowerCase().includes(query.toLowerCase())
      );

      // Combine and deduplicate results
      const allResults = [
        ...(titleResults || []),
        ...filteredCategoryResults,
        ...authorResults
      ];

      const uniqueResults = Array.from(
        new Map(allResults.map(book => [book.book_id, book])).values()
      );

      data = uniqueResults;

    } else if (type === "title") {
      const { data: results, error } = await supabase
        .from("books")
        .select(`
          *,
          categories:category_id(category_name),
          book_authors(
            authors(name)
          )
        `)
        .ilike("title", `%${query}%`);

      if (error) {
        console.error("Title search error:", error.message);
        return res.status(200).json([]);
      }

      data = results || [];

    } else if (type === "author") {
      // First get book IDs that match the author
      const { data: authorBookIds, error: authorError } = await supabase
        .from("book_authors")
        .select("book_id, authors(name)")
        .ilike("authors.name", `%${query}%`);

      if (authorError) {
        console.error("Author search error:", authorError.message);
        return res.status(200).json([]);
      }

      if (authorBookIds && authorBookIds.length > 0) {
        const bookIds = authorBookIds.map(ab => ab.book_id);
        const { data: results, error } = await supabase
          .from("books")
          .select(`
            *,
            categories:category_id(category_name),
            book_authors(
              authors(name)
            )
          `)
          .in("book_id", bookIds);

        if (error) {
          console.error("Books fetch error:", error.message);
          return res.status(200).json([]);
        }

        data = results || [];
      } else {
        data = [];
      }

    } else if (type === "subject") {
      const { data: allBooks, error } = await supabase
        .from("books")
        .select(`
          *,
          categories:category_id(category_name),
          book_authors(
            authors(name)
          )
        `)
        .not("category_id", "is", null);

      if (error) {
        console.error("Subject search error:", error.message);
        return res.status(200).json([]);
      }

      // Filter by category name
      data = (allBooks || []).filter(book =>
        book.categories?.category_name?.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Format the response to flatten author names
    const formattedData = (data || []).map(book => {
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

    console.log(`[OPAC Search] Found ${formattedData.length} results`); // Debug

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
