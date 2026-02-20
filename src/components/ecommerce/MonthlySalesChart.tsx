"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

type Article = {
  title?: string;            // From dynamic_results.jsonl
  full_content?: string;     // From dynamic_results.jsonl
  image_path?: string;       // From dynamic_results.jsonl
  headline?: string;         
  text_preview?: string;     
  publication?: string;
  collected_at?: string;
  url?: string;
};

export default function MonthlySalesChart() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedPublication, setSelectedPublication] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openNewsIdx, setOpenNewsIdx] = useState<number | null>(null);

  const createRecord = async () => {
    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      return data;
    } catch (error) {
      console.error('Failed to create record:', error);
      throw error;
    }
  };

  useEffect(() => {
    createRecord();
  }, []);

  /* ========= READ DYNAMIC RESULTS ========= */
  useEffect(() => {
    fetch("/dynamic_results.jsonl")
      .then((res) => {
        if (!res.ok) throw new Error("File not found in /public");
        return res.text();
      })
      .then((text) => {
        const rows = text
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter(Boolean) as Article[];

        setArticles(rows);
      })
      .catch(console.error);
  }, []);

  /* ========= PUBLICATIONS FILTER ========= */
  const publications = useMemo(() => {
    const uniquePubs = new Set(articles.map(a => a.publication || "Unknown"));
    return ["All", ...Array.from(uniquePubs)];
  }, [articles]);

  /* ========= FILTERED ARTICLES ========= */
  const filteredArticles = useMemo(() => {
    return articles.filter(a => 
      selectedPublication === "All" || a.publication === selectedPublication
    );
  }, [articles, selectedPublication]);

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-6">

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Latest Intelligence</h3>
          <p className="text-sm text-gray-500">Real-time news from indexed sources</p>
        </div>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreDotIcon />
          </button>
          <Dropdown isOpen={dropdownOpen} onClose={() => setDropdownOpen(false)} className="w-48 p-2">
            {publications.map((pub) => (
              <DropdownItem
                key={pub}
                onItemClick={() => {
                  setSelectedPublication(pub);
                  setDropdownOpen(false);
                }}
              >
                {pub}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>

      {/* ===== ACCORDION SET UP (Layout matched to image_2a4386.png) ===== */}
      <div id="accordian" className="space-y-4">
        {filteredArticles.map((item, idx) => (
          <div key={idx} className="border rounded-xl overflow-hidden shadow-sm bg-white hover:border-blue-200 transition-all">
            
            {/* Accordion Trigger (Title & Metadata) */}
            <button
              onClick={() => setOpenNewsIdx(openNewsIdx === idx ? null : idx)}
              className="w-full flex justify-between items-start px-6 py-5 text-left hover:bg-gray-50/50 transition-all"
            >
              <div className="flex-1 pr-4">
                <span className="block text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                  {item.publication || "General News"}
                </span>
                <h4 className="text-lg font-bold text-gray-900 leading-tight">
                  {item.title || item.headline || "Untitled Article"}
                </h4>
                <p className="text-xs text-gray-400 mt-2">
                   {item.collected_at ? new Date(item.collected_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "Recently Collected"}
                </p>
              </div>
              <span className={`mt-1 text-gray-400 transition-transform duration-300 ${openNewsIdx === idx ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Accordion Content (Large Image & Centered Text) */}
            {openNewsIdx === idx && (
              <div className="px-6 pb-8 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="max-w-4xl mx-auto space-y-6">
                  
                  {/* Large Centered Image (Matches your Screenshot) */}
                  {item.image_path && (
                    <div className="w-full flex justify-center">
                      <img 
                        src={item.image_path} 
                        alt="News Visual" 
                        className="w-full max-h-[450px] object-contain rounded-lg bg-gray-50"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}

                  {/* Article Text Content */}
                  <div className="space-y-4">
                    <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {item.full_content || item.text_preview || "No further content available for this report."}
                    </p>
                    
                    {/* Source Link */}
                    <div className="pt-6 flex justify-center border-t border-gray-100">
                      {item.url && (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2 text-sm text-blue-600 font-bold hover:text-blue-800 transition-colors"
                        >
                          READ ORIGINAL ARTICLE
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        ))}
        
        {filteredArticles.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-2xl">
            <p className="text-gray-400 font-medium">No articles found for "{selectedPublication}"</p>
          </div>
        )}
      </div>
    </div>
  );
}