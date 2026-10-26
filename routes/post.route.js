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
            images,
            incident_time_estimate,
            post_message,
            post_time,
            title,
            location,
            category,
        } = req.body;

        if (!incident_time_estimate || !post_message || !post_time || !title || !category) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const newPost = {
            images,
            incident_time_estimate,
            isParentPost: false,
            parentPostLinks: [],
            post_message,
            post_time,
            status: "pending",
            title,
            category,
            role: "user",
            createdAt: new Date().toISOString(),
            location
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