
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

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
    const { message, chatType, userId, conversationId } = await req.json();
    
    if (!message || !chatType || !userId) {
      throw new Error('Missing required parameters');
    }

    const openaiApiKey = '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';
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let response;
    let responseType = 'text';
    let apiUsed = '';

    if (chatType === 'image') {
      // Generate image with DALL-E 3
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: message,
          n: 1,
          size: '1024x1024',
          quality: 'standard'
        }),
      });

      const imageData = await imageResponse.json();
      
      if (!imageResponse.ok) {
        throw new Error(imageData.error?.message || 'Failed to generate image');
      }

      response = imageData.data[0].url;
      responseType = 'image';
      apiUsed = 'openai-dalle3';
    } else {
      // Use OpenAI GPT for text generation and search
      let systemPrompt = 'You are a helpful AI assistant.';
      
      if (chatType === 'search') {
        systemPrompt = 'You are a helpful AI assistant that searches for and provides current, accurate information. When answering questions, provide detailed and up-to-date information from reliable sources.';
      }

      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 1000,
          temperature: 0.7
        }),
      });

      const gptData = await gptResponse.json();
      
      if (!gptResponse.ok) {
        throw new Error(gptData.error?.message || 'Failed to get response from OpenAI');
      }

      response = gptData.choices[0].message.content;
      apiUsed = 'openai-gpt';
    }

    // Store the conversation in the database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('chat_messages').insert({
      user_id: userId,
      conversation_id: conversationId || null,
      message: message,
      response: response,
      response_type: responseType,
      api_used: apiUsed
    });

    return new Response(JSON.stringify({ 
      response, 
      responseType,
      apiUsed 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
