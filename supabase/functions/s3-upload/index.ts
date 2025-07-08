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
      const awsSessionToken = Deno.env.get('AWS_SESSION_TOKEN');
      const awsRegion = Deno.env.get('AWS_REGION');
      const awsBucket = Deno.env.get('AWS_S3_BUCKET');

      if (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion || !awsBucket) {
        return new Response(JSON.stringify({ error: 'AWS credentials not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create AWS Signature Version 4
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
      
      const fileBuffer = await file.arrayBuffer();
      const fileUrl = `https://${awsBucket}.s3.${awsRegion}.amazonaws.com/${fileName}`;

      // Generate AWS4 signature
      const signature = await generateAWS4Signature({
        method: 'PUT',
        url: fileUrl,
        region: awsRegion,
        service: 's3',
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
        sessionToken: awsSessionToken,
        headers: {
          'Content-Type': file.type,
          'x-amz-date': timeStr,
        },
        body: fileBuffer,
        dateStr,
        timeStr
      });

      const headers: Record<string, string> = {
        'Content-Type': file.type,
        'x-amz-date': timeStr,
        'Authorization': signature,
      };

      // Add session token if available (for AWS Academy)
      if (awsSessionToken) {
        headers['x-amz-security-token'] = awsSessionToken;
      }

      const s3Response = await fetch(fileUrl, {
        method: 'PUT',
        headers,
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

interface AWS4SignatureParams {
  method: string;
  url: string;
  region: string;
  service: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  headers: Record<string, string>;
  body: ArrayBuffer;
  dateStr: string;
  timeStr: string;
}

async function generateAWS4Signature(params: AWS4SignatureParams): Promise<string> {
  const { method, url, region, service, accessKeyId, secretAccessKey, sessionToken, headers, body, dateStr, timeStr } = params;
  
  // Parse URL to get host and path
  const urlObj = new URL(url);
  const host = urlObj.hostname;
  const path = urlObj.pathname;
  
  // Create canonical headers
  const canonicalHeaders: Record<string, string> = {
    'host': host,
    'x-amz-date': timeStr,
    'content-type': headers['Content-Type'],
  };
  
  if (sessionToken) {
    canonicalHeaders['x-amz-security-token'] = sessionToken;
  }
  
  // Sort headers by name
  const sortedHeaderNames = Object.keys(canonicalHeaders).sort();
  const canonicalHeadersStr = sortedHeaderNames
    .map(name => `${name}:${canonicalHeaders[name]}\n`)
    .join('');
  
  const signedHeaders = sortedHeaderNames.join(';');
  
  // Create payload hash
  const payloadHash = await sha256Hex(new Uint8Array(body));
  
  // Create canonical request
  const canonicalRequest = [
    method,
    path,
    '', // query string (empty for S3 PUT)
    canonicalHeadersStr,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  console.log('Canonical Request:', canonicalRequest);
  
  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStr}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256Hex(new TextEncoder().encode(canonicalRequest));
  
  const stringToSign = [
    algorithm,
    timeStr,
    credentialScope,
    canonicalRequestHash
  ].join('\n');
  
  console.log('String to Sign:', stringToSign);
  
  // Calculate signature
  const dateKey = await hmacSha256(new TextEncoder().encode(`AWS4${secretAccessKey}`), dateStr);
  const dateRegionKey = await hmacSha256(dateKey, region);
  const dateRegionServiceKey = await hmacSha256(dateRegionKey, service);
  const signingKey = await hmacSha256(dateRegionServiceKey, 'aws4_request');
  const signature = await hmacSha256(signingKey, stringToSign);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Create authorization header
  const credential = `${accessKeyId}/${credentialScope}`;
  const authorizationHeader = `${algorithm} Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;
  
  console.log('Authorization Header:', authorizationHeader);
  
  return authorizationHeader;
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256(key: Uint8Array | ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}