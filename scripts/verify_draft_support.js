const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function verifyDraftSupport() {
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
        // Check if posts table exists
        console.log('Checking posts table structure...');
        const [columns] = await connection.query(
            "SHOW COLUMNS FROM posts WHERE Field = 'status'"
        );

        if (columns.length === 0) {
            console.log('Status column does not exist. Creating it...');
            await connection.query(
                "ALTER TABLE posts ADD COLUMN status ENUM('draft', 'published', 'scheduled') DEFAULT 'published'"
            );
            console.log('Status column created successfully.');
        } else {
            console.log('Status column exists:', columns[0]);

            // Check if the enum includes 'draft'
            const columnType = columns[0].Type;
            if (!columnType.includes('draft')) {
                console.log('Updating status column to include draft...');
                await connection.query(
                    "ALTER TABLE posts MODIFY COLUMN status ENUM('draft', 'published', 'scheduled') DEFAULT 'published'"
                );
                console.log('Status column updated successfully.');
            } else {
                console.log('Status column already supports draft status.');
            }
        }

        // Test inserting a draft
        console.log('\nTesting draft insertion...');
        const testPost = {
            id: 'test-draft-' + Date.now(),
            slug: 'test-draft',
            title: 'Test Draft Post',
            excerpt: 'This is a test draft',
            content: 'Test content',
            keywords: JSON.stringify(['test']),
            category: 'Test',
            dateCreated: new Date(),
            status: 'draft',
            readTime: '1 min read',
            coverImage: null,
            geoTargeting: 'Global',
            seoScore: 85,
            aeoQuestions: JSON.stringify([])
        };

        await connection.query(
            'INSERT INTO posts (id, slug, title, excerpt, content, keywords, category, dateCreated, status, readTime, coverImage, geoTargeting, seoScore, aeoQuestions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                testPost.id, testPost.slug, testPost.title, testPost.excerpt,
                testPost.content, testPost.keywords, testPost.category,
                testPost.dateCreated, testPost.status, testPost.readTime,
                testPost.coverImage, testPost.geoTargeting, testPost.seoScore,
                testPost.aeoQuestions
            ]
        );

        console.log('Test draft inserted successfully with ID:', testPost.id);

        // Verify it was saved
        const [savedDrafts] = await connection.query(
            "SELECT id, title, status FROM posts WHERE id = ?",
            [testPost.id]
        );

        if (savedDrafts.length > 0) {
            console.log('Draft verified in database:', savedDrafts[0]);

            // Clean up test draft
            await connection.query('DELETE FROM posts WHERE id = ?', [testPost.id]);
            console.log('Test draft cleaned up.');
        }

        console.log('\n✅ Database is ready to support draft posts!');
    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await connection.end();
    }
}

verifyDraftSupport();
