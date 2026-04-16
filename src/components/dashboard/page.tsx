"use client";

import { useEffect, useState } from "react";

type Word = {
  text: string;
  value: number;
  rotate: number; // ✅ store rotation
};

export default function WordCloudPage() {
  const [data, setData] = useState<Word[]>([]);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(0);

  const normalize = (str: string) =>
    str.toLowerCase().trim();

  // 🎲 ROTATION GENERATOR (only once)
  const getRotate = () => {
    const angles = [0, 0, 0, 0, 90];
    return angles[Math.floor(Math.random() * angles.length)];
  };

  useEffect(() => {
    fetch("/api/opointNews")
      .then((res) => res.json())
      .then((res) => {
        const bag = res?.bag_of_words || {};

        const map: Record<string, number> = {};

        Object.entries(bag).forEach(([_, words]: any) => {
          Object.entries(words || {}).forEach(([word, count]) => {
            const key = normalize(word);
            if (!key) return;

            map[key] = (map[key] || 0) + Number(count);
          });
        });

        const words: Word[] = Object.entries(map)
          .map(([text, value]) => ({
            text,
            value,
            rotate: getRotate(), // ✅ assign once
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 120);

        setData(words);

        const values = words.map((w) => w.value);
        setMin(Math.min(...values));
        setMax(Math.max(...values));
      });
  }, []);

  // ✅ FONT SCALE
  const getFontSize = (value: number) => {
    if (max === min) return 20;
    const scale = (value - min) / (max - min);
    return 12 + scale * 70;
  };

  // 🎨 COLOR
  const getColor = (value: number) => {
    if (value > max * 0.8) return "#7f1d1d";
    if (value > max * 0.6) return "#b91c1c";
    if (value > max * 0.4) return "#ea580c";
    if (value > max * 0.2) return "#f59e0b";
    return "#1f2937";
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 flex justify-center items-center p-10">

      <div className="w-full max-w-6xl flex flex-wrap justify-center items-center gap-3 leading-tight">

        {data.length ? (
          data.map((w, i) => (
            <div key={i} className="relative group">

              {/* WORD */}
              <span
                style={{
                  fontSize: `${getFontSize(w.value)}px`,
                  color: getColor(w.value),
                  transform: `rotate(${w.rotate}deg)`, // ✅ stable
                }}
                className="uppercase font-extrabold tracking-tight transition-all duration-300 hover:scale-110 cursor-pointer"
              >
                {w.text}
              </span>

              {/* TOOLTIP */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 
                              bg-black text-white text-xs px-2 py-1 rounded 
                              opacity-0 group-hover:opacity-100 
                              transition duration-200 whitespace-nowrap z-10">
                Count: {w.value}
              </div>

            </div>
          ))
        ) : (
          <div className="text-gray-400 text-lg">
            No data available
          </div>
        )}

      </div>
    </div>
  );
}