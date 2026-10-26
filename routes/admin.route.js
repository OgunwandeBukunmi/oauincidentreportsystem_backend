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

        const email = decodedToken.email

        const user = await db.collection("users").where("email", "==", email).get()
        return res.status(200).json({
            authenticated: true,
            uid: decodedToken.uid,
            email: decodedToken.email ?? null,
            username: user.docs[0].data().username ?? null,
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
        // 1. Get limit from query params (default to 10 posts per batch)
        const limitCount = parseInt(req.query.limit) || 30;
        const lastPostId = req.query.cursor; // The ID of the last post from the previous batch

        // 2. Build the base query ordered by creation date
        let query = db.collection("posts")
            .orderBy("createdAt", "desc")
            .limit(limitCount);

        // 3. If a cursor was provided, start after that specific document
        if (lastPostId) {
            const lastDoc = await db.collection("posts").doc(lastPostId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }

        // 4. Execute the query
        const snapshot = await query.get();
        const posts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        console.log(`These are all the posts: ${posts}`)
        // 5. Determine the next cursor based on the last item in this batch
        const nextCursor = posts.length > 0 ? posts[posts.length - 1].id : null;

        res.status(200).json({
            posts,
            nextCursor,
            hasMore: posts.length === limitCount
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Failed to fetch posts", error: error.message });
    }
});
router.post("/post", authenticate, async (req, res) => {
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
            role: "admin",
            createdAt: new Date().toISOString(),
            location: location || "No location"
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
})
router.post("/parent-post", authenticate, async (req, res) => {
    try {
        const {
            images,
            incident_time_estimate,
            isParentPost,
            parentPostLinks,
            post_message,
            post_time,
            title,
            category,
            location,
        } = req.body;

        if (!incident_time_estimate || !post_message || !post_time || !title || !category) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const newPost = {
            images,
            incident_time_estimate,
            isParentPost,
            parentPostLinks,
            post_message,
            post_time,
            status: "approved",
            title,
            category,
            role: "admin",
            createdAt: new Date().toISOString(),
            location,
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
})

router.put("/posts/:id/approve", authenticate, async (req, res) => {
    try {
        const { id } = req.params
        await db.collection("posts").doc(id).update({ status: "approved" })
        res.status(200).json({ message: "Post approved" });
    } catch (error) {
        console.error("Error approving post:", error);
        res.status(500).json({ message: "Failed to approve post", error: error.message });
    }
})
router.put("/posts/:id/reject", authenticate, async (req, res) => {
    try {
        const { id } = req.params
        await db.collection("posts").doc(id).update({ status: "rejected" })
        res.status(200).json({ message: "Post rejected" });
    } catch (error) {
        console.error("Error rejecting post:", error);
        res.status(500).json({ message: "Failed to reject post", error: error.message });
    }
})

router.put("/posts/:id/pending", authenticate, async (req, res) => {
    try {
        await db.collection("posts").doc(req.params.id).update({ status: "pending" })
        res.status(200).json({ message: "Post set to pending" })
    } catch (error) {
        res.status(500).json({ message: "Failed to update post", error: error.message })
    }
})

router.delete("/posts/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params
        console.log(req.user)
        await db.collection("posts").doc(id).update({ deletedBy: req.user.username, deletedAt: new Date().toISOString(), status: "deleted" })
        res.status(200).json({ message: "Post deleted" });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Failed to delete post", error: error.message });
    }
})


export default router