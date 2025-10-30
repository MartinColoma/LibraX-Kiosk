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

    if (!query.trim()) return res.json([]);

    let data = [];
    let error = null;

    if (type === "keyword") {
      // For keyword search, we need to search across title, authors, and categories
      // Since Supabase doesn't support OR across joined tables easily, we'll do multiple queries
      
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

      // Search by author through book_authors junction table
      const { data: authorBookIds, error: authorError } = await supabase
        .from("book_authors")
        .select("book_id, authors(name)")
        .ilike("authors.name", `%${query}%`);

      let authorResults = [];
      if (authorBookIds && authorBookIds.length > 0) {
        const bookIds = authorBookIds.map(ab => ab.book_id);
        const { data: booksByAuthor } = await supabase
          .from("books")
          .select(`
            *,
            categories:category_id(category_name),
            book_authors(
              authors(name)
            )
          `)
          .in("book_id", bookIds);
        authorResults = booksByAuthor || [];
      }

      // Filter category results by category_name
      const filteredCategoryResults = categoryResults?.filter(book => 
        book.categories?.category_name?.toLowerCase().includes(query.toLowerCase())
      ) || [];

      // Combine and deduplicate results
      const allResults = [...(titleResults || []), ...filteredCategoryResults, ...authorResults];
      const uniqueResults = Array.from(
        new Map(allResults.map(book => [book.book_id, book])).values()
      );

      data = uniqueResults;

    } else if (type === "title") {
      const result = await supabase
        .from("books")
        .select(`
          *,
          categories:category_id(category_name),
          book_authors(
            authors(name)
          )
        `)
        .ilike("title", `%${query}%`);
      
      data = result.data;
      error = result.error;

    } else if (type === "author") {
      // First get book IDs that match the author
      const { data: authorBookIds } = await supabase
        .from("book_authors")
        .select("book_id, authors(name)")
        .ilike("authors.name", `%${query}%`);

      if (authorBookIds && authorBookIds.length > 0) {
        const bookIds = authorBookIds.map(ab => ab.book_id);
        const result = await supabase
          .from("books")
          .select(`
            *,
            categories:category_id(category_name),
            book_authors(
              authors(name)
            )
          `)
          .in("book_id", bookIds);
        
        data = result.data;
        error = result.error;
      } else {
        data = [];
      }

    } else if (type === "subject") {
      const { data: allBooks } = await supabase
        .from("books")
        .select(`
          *,
          categories:category_id(category_name),
          book_authors(
            authors(name)
          )
        `)
        .not("category_id", "is", null);

      // Filter by category name
      data = allBooks?.filter(book => 
        book.categories?.category_name?.toLowerCase().includes(query.toLowerCase())
      ) || [];
    }

    if (error) {
      console.error("OPAC search error:", error.message);
      return res.json([]);
    }

    // Format the response to flatten author names
    const formattedData = (data || []).map(book => {
      const authorNames = book.book_authors
        ?.map(ba => ba.authors?.name)
        .filter(Boolean)
        .join(", ") || "N/A";

      return {
        ...book,
        author: authorNames,
        genre: book.categories?.category_name || "N/A",
        // Add available/total if you have a copies table
        available: book.available_copies || 0,
        total: book.total_copies || 0
      };
    });

    res.json(formattedData);
  } catch (err) {
    console.error("OPAC search exception:", err);
    res.json([]);
  }
});

module.exports = router;
