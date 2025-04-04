const express = require('express');
const router = express.Router();
const dbConn = require('./db');
const authenticateToken = require('../middleWare/authMiddleware');

const dbConnect = dbConn.dbConnect;
const getDb = dbConn.getDb;

let db;

dbConnect((err) => {
    if (!err) {
        console.log("Successful Connection");
    }
    db = getDb();
});


function createSlug(title) {
    return title.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');
}

router.use(express.urlencoded({ extended: false }));
router.use(express.json()); 

router.get("/user-blog/:username",authenticateToken,async (req,res)=>{
    try{
        const limit = parseInt(req.query.limit) || 12;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const totalItems = await db.collection('blog').countDocuments({author: req.params.username});
        const totalPages = Math.ceil(totalItems / limit);
        
        const blogs = await db.collection('blog')
            .find({author: req.params.username})
            .sort({ date: -1 }) 
            .skip(offset)
            .limit(limit)
            .toArray();
            
        res.status(200).json({
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            },
            data: blogs
        });
    }catch(err){
        console.error("Error fetching user blogs:", err);
        res.status(500).json({"error":"Internal server error"});
    }
});

// GET / - Retrieves a paginated list of all blog posts
// Query parameters:
// - limit: Number of posts per page (default: 6)
// - page: Current page number (default: 1)
router.get("/", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 12;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;


        const totalItems = await db.collection('blog').countDocuments();
        const totalPages = Math.ceil(totalItems / limit);

        
        const blogs = await db.collection('blog')
            .find({}, { projection: { name: 1, author: 1, slug: 1 } })
            .sort({ author: 1 })
            .skip(offset)
            .limit(limit)
            .toArray();

        res.status(200).json({
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            },
            data: blogs
        });
    } catch (err) {
        console.error("Database query failed:", err);
        res.status(500).json({"error":"Internal server error"});
    }
});


// GET /blog/:slug - Retrieves a specific blog post by its slug
// Parameters:
// - slug: URL-friendly identifier of the blog post
router.get("/blog/:slug", async (req, res) => {
    try {
        const slug = req.params.slug;
        
        const doc = await db.collection('blog').findOne({ slug });
        if (!doc) {
            console.log("Blog not found with slug:", slug);
            return res.status(404).json({"error":"Blog not found"});
        }
        
        res.status(200).json({
            id: doc._id,
            title: doc.name,
            author: doc.author,
            content: doc.content,
            date: doc.date,
            slug: doc.slug
        });
    } catch (err) {
        console.error("Error retrieving blog:", err);
        res.status(500).json({"error":"Internal server error"});
    }
});

// POST /blog - Creates a new blog post
// Request body:
// - title: Title of the blog post
// - content: Content of the blog post
// - author: Author of the blog post (optional, defaults to authenticated user's username)
router.post("/blog",authenticateToken, async (req, res) => {
    try {
        console.log("POST /blog request body:", req.body);
        
        if (!req.body || !req.body.title || !req.body.content) {
            return res.status(400).json({"error":"Title or content is missing in the request body"});
        }
        
        const { title, content, author } = req.body;
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Use author from request or fall back to authenticated user's username
        const blogAuthor = author || req.user.username;
        
        if (!blogAuthor) {
            return res.status(400).json({"error":"Author is required. Either provide it in the request body or ensure you're authenticated."});
        }
        
        const slug = createSlug(title);
        console.log("Generated slug:", slug);
        
        const existingBlog = await db.collection('blog').findOne({ slug });
        if (existingBlog) {
            return res.status(400).json({"error":"A blog with a similar title already exists."});
        }

        const blogData = {
            name: title,
            author: blogAuthor,
            date: currentDate,
            content,
            slug
        };
        
        // Include image if provided
        if (req.body.image) {
            blogData.image = req.body.image;
        }
        
        console.log("Inserting blog:", blogData);
        
        const result = await db.collection('blog').insertOne(blogData);

        if (result.acknowledged) {
            console.log("Successful Insertion:", result);
            res.status(201).json({ 
                message: "Blog created successfully", 
                slug,
                blogId: result.insertedId
            });
        } else {
            console.error("Failed to insert blog:", result);
            res.status(500).json({"error":"Failed to create blog"});
        }
    } catch (err) {
        console.error("Error in insertion:", err);
        res.status(500).json({"error":"Internal server error"});
    }
});

// PUT /blog/:slug - Updates a specific blog post
// Requires Authorization and ownership
// Request body can contain updated `title` and/or `content`
router.put("/blog/:slug", authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title && !content) {
            return res.status(400).json({"error":"At least one field (title or content) is required to update."});
        }

        const blog = await db.collection('blog').findOne({ slug: req.params.slug });
        if (!blog) {
            return res.status(404).json({"error":"Blog not found"});
        }

        if (blog.author !== req.user.username) {
            return res.status(403).json({"error":"You are not authorized to update this blog"});
        }

        const updatedFields = {};
        if (title) {
            updatedFields.name = title;
            updatedFields.slug = createSlug(title); 
        }
        if (content) {
            updatedFields.content = content;
        }

        const result = await db.collection('blog').updateOne(
            { slug: req.params.slug },
            { $set: updatedFields }
        );

        res.status(200).json({ message: "Blog updated successfully" });

    } catch (err) {
        console.error("Error updating blog:", err);
        res.status(500).json({"error":"Internal server error"});
    }
});



// DELETE /blog/:slug - Deletes a specific blog post by its slug
// Parameters:
// - slug: URL-friendly identifier of the blog post to delete
router.delete("/blog/:slug", authenticateToken,async (req, res) => {
    try {
        const result = await db.collection('blog').deleteOne({ slug: req.params.slug });
        if (result.deletedCount === 1) {
            res.status(200).json({ message: "Blog deleted successfully" });
        } else {
            res.status(404).json({ message: "Blog not found" });
        }
    } catch (err) {
        console.error("Error deleting blog:", err);
        res.status(500).json({"error":"Internal server error"});
    }
});

module.exports = router;
