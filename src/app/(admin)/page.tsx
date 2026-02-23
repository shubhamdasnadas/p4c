// import type { Metadata } from "next";
// // import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
// import React from "react";
// // import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
// import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
// import StatisticsChart from "@/components/ecommerce/StatisticsChart";
// import RecentOrders from "@/components/ecommerce/RecentOrders";
// import DemographicCard from "@/components/ecommerce/DemographicCard";
// import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
// import Demo from "@/components/ecommerce/Demo";

// export const metadata: Metadata = {
//   title:
//     "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
//   description: "This is Next.js Home for TailAdmin Dashboard Template",
// };

// export default function Ecommerce() {
//   return (
//     <div className="grid grid-cols-12 gap-4 md:gap-6">
//       <div className="col-span-12 space-y-6 xl:col-span-7">
//         {/* <EcommerceMetrics /> */}
//         <div className="col-span-12 space-y-6">
//           <MonthlySalesChart />
//         </div>
//       </div>

//       {/* <div className="col-span-12 xl:col-span-5">
//         <Demo />
//       </div> */}

//       {/* <div className="col-span-12">
//         <StatisticsChart />
//       </div> */}


//       {/* <div className="col-span-12 xl:col-span-5">
//         <DemographicCard />
//       </div>

//       <div className="col-span-12 xl:col-span-7">
//         <RecentOrders />
//       </div> */}
//     </div>
//   );
// }

import type { Metadata } from "next";
import React from "react";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
// import Demo from "@/components/ecommerce/Demo";

export const metadata: Metadata = {
  title: "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      
      {/* 1. Removed the outer 'xl:col-span-7' to allow full width.
          2. MonthlySalesChart now occupies all 12 columns (100% width).
      */}
      <div className="col-span-12">
        <MonthlySalesChart />
      </div>

      {/* Example: If you want 'Demo' to appear below it at full width, 
          keep it as col-span-12. If you want it side-by-side, use col-span-x.
      */}
      <div className="col-span-12">
        <Demo />
      </div>

    </div>
  );
}
