import app from "./app.js";
import pool from "./config/db.js";

const PORT = process.env.PORT || 3000;

try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully!");
    connection.release();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
} catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
}
