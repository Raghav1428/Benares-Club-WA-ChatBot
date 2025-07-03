import jwt from "jsonwebtoken";
import { supabase } from "../supabase/index.supabase.js";

export const authMiddleware = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.split(" ")[1] || req.cookies?.jwt;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No Token Provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        }

        // Query user from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, last_login, created_at')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Error in authMiddleware: ", error.message);
        res.status(401).json({ message: "Invalid JWT" });
    }
};