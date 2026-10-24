import express from 'express';
import { db } from '../src/config/firebase.js';

const router = express.Router()

router.get("/", async (req, res) => {
    try {
        const snapshot = await db.collection("posts").where("status", "==", "approved").get();
        const posts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Failed to fetch posts", error: error.message });
    }
});
router.post("/", async (req, res) => {
    try {
        const {
            ParentPostLinks,
            images,
            incident_time_estimate,
            isParentPost,
            post_message,
            post_time,
            status,
            title,
            category,
            role
        } = req.body;

        if (!isParentPost) {
            if (!images || !incident_time_estimate || !post_message || !post_time || !status || !title || !category || !role) {
                return res.status(400).json({ message: "All fields are required" });
            }
        } else {
            if (!ParentPostLinks || !images || !incident_time_estimate || !post_message || !post_time || !status || !title || !category || !role) {
                return res.status(400).json({ message: "All fields are required" });
            }
        }
        const newPost = {
            ParentPostLinks,
            images,
            incident_time_estimate,
            isParentPost,
            post_message,
            post_time,
            status,
            title,
            category,
            role,
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection("posts").add(newPost);

        res.status(201).json({
            message: "Post created successfully",
            post: { id: docRef.id, ...newPost },
        });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: "Failed to create post", error: error.message });
    }
});


router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection("posts").doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Post not found" });
        }

        res.status(200).json({
            id: doc.id,
            ...doc.data(),
        });
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({ message: "Failed to fetch post", error: error.message });
    }
});


export default router