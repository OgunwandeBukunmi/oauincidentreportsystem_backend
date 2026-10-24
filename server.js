import express from 'express';
import { db } from "./src/config/firebase.js";
import 'dotenv/config';
import cors from 'cors';
import morgan from 'morgan';;
import { authenticate } from './src/middlewears/authenticate.middlewear.js';
import adminRoutes from './routes/admin.route.js';
import postRoutes from './routes/post.route.js';

const app = express();
app.use(express.json());

app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(morgan("dev"))

app.use("/api/admin", adminRoutes)
app.use("/api/posts", postRoutes)



const port = process.env.PORT || 5000;
app.listen(port, async () => {
    const snapshot = await db.collection("posts").get();

    console.log(snapshot.size);
    console.log(`Server is running on port ${port}`);
});