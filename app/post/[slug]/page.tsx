'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BlogPost } from '@/types';
import PostReader from '@/components/PostReader';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PublicPostPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/posts/slug/${slug}`);

                if (!response.ok) {
                    throw new Error('Post not found');
                }

                const data = await response.json();
                setPost(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load post');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchPost();
        }
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading post...</p>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || 'The post you are looking for does not exist.'}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <ArrowLeft size={18} className="mr-2" />
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <PostReader
                post={post}
                onBack={() => window.history.back()}
                onEdit={() => { }} // Public view - no edit
            />
        </div>
    );
}
