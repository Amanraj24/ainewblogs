import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM posts WHERE slug = ? AND status IN (?, ?)',
            [slug, 'published', 'scheduled']
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        const post = rows[0];

        // Parse JSON fields
        const formattedPost = {
            ...post,
            keywords: post.keywords ? JSON.parse(post.keywords) : [],
            aeoQuestions: typeof post.aeoQuestions === 'string'
                ? JSON.parse(post.aeoQuestions)
                : (post.aeoQuestions || [])
        };

        return NextResponse.json(formattedPost);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
