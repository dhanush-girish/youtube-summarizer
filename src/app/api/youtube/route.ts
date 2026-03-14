import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Basic helper to extract video ID from various YT URL formats
function extractVideoId(url: string): string | false {
  const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?)(?:\??v?=?)([^#&?]{11}).*/;
  const match = url.match(regExp);
  return match ? match[1] : false;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      return NextResponse.json({ error: 'RapidAPI Key is missing. Add RAPIDAPI_KEY to your .env.local file.' }, { status: 500 });
    }

    // 1. Fetch transcript using RapidAPI YouTube Transcript
    let fullTranscript = "";
    try {
      const transcriptRes = await fetch(
        `https://youtube-transcript3.p.rapidapi.com/api/transcript-with-url?url=https://www.youtube.com/watch?v=${videoId}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': rapidApiKey,
            'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com',
          },
        }
      );

      if (!transcriptRes.ok) {
        const errText = await transcriptRes.text();
        console.error('RapidAPI Error:', transcriptRes.status, errText);
        throw new Error(`Transcript API returned status ${transcriptRes.status}`);
      }

      const transcriptData = await transcriptRes.json();

      // youtube-transcript3 returns: { success: true, transcript: [{ text, duration, offset, lang }] }
      if (transcriptData?.success && Array.isArray(transcriptData.transcript)) {
        fullTranscript = transcriptData.transcript
          .map((entry: { text?: string }) => entry.text || '')
          .filter(Boolean)
          .join(' ');
      } else {
        const stringified = JSON.stringify(transcriptData);
        console.error('Unexpected RapidAPI response shape:', stringified.substring(0, 500));
        throw new Error(transcriptData?.error || 'Unexpected transcript response format');
      }
    } catch (error: unknown) {
      console.error('Transcript Fetch Error:', error);
      return NextResponse.json({ 
        error: 'Could not fetch video transcript. The video may not have captions enabled.',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 404 });
    }

    if (!fullTranscript || fullTranscript.trim().length === 0) {
       return NextResponse.json({ 
        error: "Video contains no transcript or spoken text." 
      }, { status: 400 });
    }

    // Attempt to fetch title via oEmbed
    let title = `YouTube Study Material (${videoId})`;
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        title = oembedData.title || title;
      }
    } catch {
      // Ignore oembed failure
    }

    // 2. Invoke Groq AI for Summarization
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Groq API Key is missing. Add GROQ_API_KEY to your .env.local file.' }, { status: 500 });
    }

    let aiSummary = "";
    try {
      const groq = new Groq({ apiKey: groqApiKey });

      // Truncate transcript if too long
      const maxTranscriptLength = 25000;
      const truncatedTranscript = fullTranscript.length > maxTranscriptLength 
        ? fullTranscript.substring(0, maxTranscriptLength) + '... [transcript truncated]'
        : fullTranscript;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational summarizer. Convert YouTube transcripts into highly structured markdown study material with clear headings, bulleted lists, and clean formatting.'
          },
          {
            role: 'user',
            content: `I am giving you a raw transcript from a YouTube video titled "${title}".

Convert this into structured markdown study material.

Do NOT include an overarching title or introduction line (since I will embed the video iframe above it).
Output MUST begin immediately with Section Headers like "## Overview" or "## Abstract".
Include these sections if relevant content exists:
- ## Overview
- ## Key Concepts & Definitions
- ## Important Takeaways or Steps
- ## Conclusion

Here is the transcript data:
---
${truncatedTranscript}
---`
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_completion_tokens: 4096,
      });

      aiSummary = chatCompletion.choices?.[0]?.message?.content || "Failed to generate AI response.";
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("Groq Error:", errMsg);
      return NextResponse.json({ error: 'Failed to generate summarization: ' + errMsg.substring(0, 200) }, { status: 500 });
    }

    // Format the final markdown string
    const studyMaterialMD = `# ${title}

<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

${aiSummary}

---
*Analyzed via NexusNote LLM Engine*
`;

    return NextResponse.json({ 
      title,
      videoId,
      studyMaterial: studyMaterialMD
    });

  } catch (error) {
    console.error('YouTube API Error:', error);
    return NextResponse.json({ error: 'Internal server error while processing video.' }, { status: 500 });
  }
}
