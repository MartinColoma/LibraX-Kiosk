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

    // Mapping dropdown types to Supabase fields/columns
    const columnMap = {
      keyword: "title", // keyword can optionally mean 'title, author, subject'
      title: "title",
      author: "author",
      subject: "category_id" // or 'genre', adapt as needed
    };

    const field = columnMap[type] || "title";
    // For keyword, search multiple fields if you want (see notes below)

    let supabaseQuery = supabase.from("books").select("*");

    if (type === "keyword") {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query}%,author.ilike.%${query}%,category_id.ilike.%${query}%`
      );
    } else {
      supabaseQuery = supabaseQuery.ilike(field, `%${query}%`);
    }

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("OPAC search error:", err.message);
    res.status(500).json({ error: "Error searching books" });
  }
});

module.exports = router;
