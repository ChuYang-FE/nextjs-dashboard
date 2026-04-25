import StockChart from "@/app/ui/dashboard/stock-chart";

export default function Page() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">股票策略</h1>
      <p className="mt-2 text-sm text-gray-600">标普500 近几十年表现</p>
      <div className="mt-4">
        <StockChart />
      </div>
    </div>
  );
}
