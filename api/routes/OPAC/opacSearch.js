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

    // Select with relationships
    let supabaseQuery = supabase
      .from("books")
      .select(`
        *,
        categories:category_id(category_name),
        book_authors(
          author_id,
          authors(name)
        )
      `);

    if (type === "keyword") {
      supabaseQuery = supabaseQuery.or(
        `
        title.ilike.%${query}%,
        categories.category_name.ilike.%${query}%,
        book_authors.authors.name.ilike.%${query}%
        `
      );
    } else if (type === "title") {
      supabaseQuery = supabaseQuery.ilike("title", `%${query}%`);
    } else if (type === "author") {
      supabaseQuery = supabaseQuery.ilike("book_authors.authors.name", `%${query}%`);
    } else if (type === "subject") {
      supabaseQuery = supabaseQuery.ilike("categories.category_name", `%${query}%`);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error("OPAC search error:", error.message);
      return res.json([]);
    }

    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("OPAC search error:", err.message);
    res.json([]);
  }
});

module.exports = router;
