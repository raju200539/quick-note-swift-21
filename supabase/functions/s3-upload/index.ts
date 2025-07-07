import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from request
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Upload file to S3
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
      
      // AWS S3 upload
      const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
      const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
      const awsRegion = Deno.env.get('AWS_REGION');
      const awsBucket = Deno.env.get('AWS_S3_BUCKET');

      if (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion || !awsBucket) {
        return new Response(JSON.stringify({ error: 'AWS credentials not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create AWS signature
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
      
      const fileBuffer = await file.arrayBuffer();
      const fileUrl = `https://${awsBucket}.s3.${awsRegion}.amazonaws.com/${fileName}`;

      // Simple S3 PUT request
      const s3Response = await fetch(fileUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Authorization': `AWS ${awsAccessKeyId}:${await generateS3Signature(awsSecretAccessKey, 'PUT', fileName, file.type, awsBucket)}`,
          'x-amz-date': timeStr,
        },
        body: fileBuffer,
      });

      if (!s3Response.ok) {
        console.error('S3 upload failed:', await s3Response.text());
        return new Response(JSON.stringify({ error: 'Failed to upload to S3' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Save file metadata to database
      const { data: fileRecord, error: dbError } = await supabaseClient
        .from('files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: fileUrl,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        return new Response(JSON.stringify({ error: 'Failed to save file metadata' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        file: fileRecord 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      // Get user's files
      const { data: files, error: filesError } = await supabaseClient
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filesError) {
        console.error('Database error:', filesError);
        return new Response(JSON.stringify({ error: 'Failed to fetch files' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ files }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in s3-upload function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateS3Signature(secretKey: string, method: string, resource: string, contentType: string, bucket: string): Promise<string> {
  const stringToSign = `${method}\n\n${contentType}\n\n/${bucket}/${resource}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}