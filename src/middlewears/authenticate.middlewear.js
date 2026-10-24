import { getAuth } from "firebase-admin/auth";

export async function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization;

        if (!header?.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const token = header.split(" ")[1];

        const decodedToken = await getAuth().verifyIdToken(token);

        req.user = decodedToken;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}