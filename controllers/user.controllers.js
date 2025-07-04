import { supabase } from "../supabase/index.supabase.js";
import jwt from 'jsonwebtoken';


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (password !== user.password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '15m' }
        );

        const { password: _, ...userWithoutPassword } = user;
        
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                ...userWithoutPassword,
                last_login: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Error in login: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};