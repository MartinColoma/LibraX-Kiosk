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
    if (!query.trim()) return res.json([]); // Always return an array if empty

    // Map dropdown types to actual DB columns
    const columnMap = {
      keyword: "title", // For "keyword", you may want to hit multiple columns
      title: "title",
      author: "author",
      subject: "category_id" // or 'genre'
    };

    const field = columnMap[type] || "title";

    let supabaseQuery = supabase.from("books").select("*");

    if (type === "keyword") {
      // Search multiple fields for partial matches, even single letters
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query}%,author.ilike.%${query}%,category_id.ilike.%${query}%`
      );
    } else {
      supabaseQuery = supabaseQuery.ilike(field, `%${query}%`);
    }

    const { data, error } = await supabaseQuery;

    // Always send array, even if error or null
    if (error || !Array.isArray(data)) {
      console.error("OPAC search error:", error?.message || "No array response");
      res.json([]);
    } else {
      res.json(data); // Always array
    }
  } catch (err) {
    console.error("OPAC search error:", err.message);
    res.json([]);
  }
});

module.exports = router;
