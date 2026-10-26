import { db } from "../config/firebase.js"

export async function getUser(email) {
    try {
        const user = await db.collection("users").where("email", "==", email).get()
        const data = user.docs[0].data()
        console.log(` This is the user data : ${data}`)
        return data
    } catch (error) {
        console.error("Error getting user:", error);
        return null
    }
}