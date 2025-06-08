import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const postData = await request.json();
    
    console.log('💾 Saving viral template post:', {
      userId: postData.user_id,
      templateId: postData.template_id,
      hasContent: !!postData.content
    });

    // Save to a new table for viral template posts
    const { data: savedPost, error } = await supabase
      .from('viral_template_posts')
      .insert({
        user_id: postData.user_id,
        template_id: postData.template_id,
        hook: postData.hook,
        content: postData.content,
        format: postData.format,
        hashtags: postData.hashtags,
        predicted_engagement: postData.predicted_engagement,
        status: 'draft',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving viral post:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      post_id: savedPost.id,
      message: 'Viral template post saved successfully'
    });

  } catch (error) {
    console.error('💥 Save post API error:', error);
    return NextResponse.json(
      { error: 'Failed to save post' },
      { status: 500 }
    );
  }
}