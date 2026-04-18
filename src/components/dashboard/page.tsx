"use client";

import React from "react";
import WordCloudPage from "./worldCloud/WorldClouddata";
import ArticleCounter from "./articleCounter/ArticleCounter";
import AuthorCounter from "./authorCounter/AuthorCounter";
import SentimentCounter from "./sentimentCounter/SentimentCounter";
import ReportNewsList from "./ReportNewsList/ReportNewsList";
import MarqueeNewsHeader from "./marqueeNewsHeader/MarqueeNewsHeader";
import SourceTopList from "./sourcetoplist/SourceTopList";
import SourceKeywordStack from "./sourceBasedNews/SourceKeywordStack";

const DashboardData = () => {
  return (
    <>

      <MarqueeNewsHeader />


      {/* ARTICLE COUNTER */}



      {/* 🔥 ROW 1 (WORD CLOUD + TABLE) */}
      <div className="flex items-center justify-center p-4">
        <div className="grid grid-cols-2 gap-4 w-full max-w-7xl h-[70vh]">

          {/* WORD CLOUD */}
          <div className="bg-white rounded-xl shadow-md h-full flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <WordCloudPage />
            </div>
          </div>

          {/* ARTICLE COUNTER */}
          <div className="bg-white rounded-xl shadow-md h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <ArticleCounter />
            </div>
          </div>

        </div>
      </div>

      {/* 🔥 ROW 2 (20% | 20% | 60%) */}
      <div className="flex items-center justify-center p-4">

        <div className="flex gap-4 w-full max-w-7xl h-[70vh]">

          {/* 🔥 LEFT (20%) */}
          <div className="w-[25%] bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center">
              <AuthorCounter />
            </div>
          </div>

          {/* 🔥 MIDDLE (20%) */}
          <div className="w-[35%] bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center">
              <SentimentCounter />
            </div>
          </div>

          {/* 🔥 RIGHT (60%) */}
          <div className="w-[40%] bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center">
              <ReportNewsList />
            </div>
          </div>

        </div>

      </div>


      <div className="flex items-center justify-center p-4">
        <div className="grid grid-cols-2 gap-4 w-full max-w-7xl h-[70vh]">

          {/* WORD CLOUD */}
          <div className="bg-white rounded-xl shadow-md h-full flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <SourceTopList />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md h-full flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <SourceKeywordStack />
            </div>
          </div>


        </div>
      </div>
    </>
  );
};

export default DashboardData;