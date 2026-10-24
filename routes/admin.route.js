import express from 'express';
import { authenticate } from '../src/middlewears/authenticate.middlewear.js';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../src/config/firebase.js';

const router = express.Router()

router.post("/verify-token", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                authenticated: false,
                message: "Authentication token required",
            });
        }

        const token = authHeader.split(" ")[1];
        // Verify the Firebase ID token
        const decodedToken = await getAuth().verifyIdToken(token);
        return res.status(200).json({
            authenticated: true,
            uid: decodedToken.uid,
            email: decodedToken.email ?? null,
            message: "Token verified successfully",
        });
    } catch (error) {
        return res.status(401).json({
            authenticated: false,
            message: "Invalid or expired token",
        });
    }
});


router.get("/posts", authenticate, async (req, res) => {
    try {
        const snapshot = await db.collection("posts").get();
        const posts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Failed to fetch posts", error: error.message });
    }
})
router.post("/parent-post", authenticate, (req, res) => {
    res.json({ message: "Parent post created" });
})

router.put("/posts/:id/approve", authenticate, (req, res) => {
    res.json({ message: "Post approved" });
})
router.put("/posts/:id/reject", authenticate, (req, res) => {
    res.json({ message: "Post rejected" });
})

router.delete("/posts/:id", authenticate, (req, res) => {
    res.json({ message: "Post deleted" });
})

export default router