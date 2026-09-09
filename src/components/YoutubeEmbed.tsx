import React from 'react';

interface YoutubeEmbedProps {
  url: string;
}

export function YoutubeEmbed({ url }: YoutubeEmbedProps) {
  // Extract video ID from different YouTube URL formats
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(url);

  if (!videoId) return null;

  return (
    <div className="w-full mt-10">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
        <span className="w-2 h-6 rounded-full bg-red-500"></span> Product Review & Guide
      </h3>
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-xl shadow-slate-900/5 bg-slate-900">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full border-0"
          title="Product Review"
        ></iframe>
      </div>
    </div>
  );
}
