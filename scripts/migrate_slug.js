const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function migrate() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306,
    };

    console.log('Connecting to database:', config.host);
    const connection = await mysql.createConnection(config);

    try {
        console.log('Adding slug column to posts table...');
        await connection.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug VARCHAR(255) AFTER title');

        // Update existing posts to have a slug derived from title if slug is empty
        console.log('Backfilling slugs for existing posts...');
        const [posts] = await connection.query('SELECT id, title, slug FROM posts');

        for (const post of posts) {
            if (!post.slug) {
                const generatedSlug = post.title
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/[\s_-]+/g, '-')
                    .replace(/^-+|-+$/g, '');

                await connection.query('UPDATE posts SET slug = ? WHERE id = ?', [generatedSlug, post.id]);
                console.log(`Updated post ${post.id} with slug: ${generatedSlug}`);
            }
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
