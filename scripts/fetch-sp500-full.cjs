#!/usr/bin/env node

/**
 * 标普500历史数据生成器 (1986-2026)
 * 生成完整的40年历史数据 - 一次性下载，静态使用
 * 用法: node scripts/fetch-sp500-full.cjs [output-path]
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

/**
 * 从Yahoo Finance获取真实历史数据
 */
function fetchFromYahoo() {
  return new Promise((resolve) => {
    const symbol = "^GSPC";
    const period1 = 536457600; // 1986-01-01 的 Unix 时间戳
    const period2 = Math.floor(Date.now() / 1000);

    const url = `https://query1.finance.yahoo.com/v7/finance/download/${symbol}?period1=${period1}&period2=${period2}&interval=1d&events=history&includeAdjustedClose=true`;

    console.log("🔗 正在从 Yahoo Finance 获取真实数据 (1986-现在)...");

    https
      .get(url, { timeout: 15000 }, (response) => {
        if (response.statusCode !== 200) {
          console.log(`⚠️  Yahoo Finance 返回: ${response.statusCode}`);
          resolve(null);
          response.resume();
          return;
        }

        let csvData = "";
        response.on("data", (chunk) => {
          csvData += chunk;
        });

        response.on("end", () => {
          try {
            const lines = csvData.trim().split("\n");
            if (lines.length < 2) {
              resolve(null);
              return;
            }

            const data = [];
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(",");
              if (values.length >= 6 && values[0] && values[4]) {
                try {
                  const stockData = {
                    date: values[0],
                    open: parseFloat(values[1]),
                    high: parseFloat(values[2]),
                    low: parseFloat(values[3]),
                    close: parseFloat(values[4]),
                    volume: parseInt(values[5], 10),
                    adjustedClose: values[6]
                      ? parseFloat(values[6])
                      : parseFloat(values[4]),
                  };

                  if (!isNaN(stockData.close) && stockData.close > 0) {
                    data.push(stockData);
                  }
                } catch (e) {
                  // 跳过有问题的行
                }
              }
            }

            if (data.length > 0) {
              data.reverse();
              console.log(
                `✓ 成功获取 ${data.length} 条真实数据 (${data[0].date} ~ ${data[data.length - 1].date})`,
              );
              resolve(data);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.log(`⚠️  解析失败: ${error.message}`);
            resolve(null);
          }
        });
      })
      .on("error", (error) => {
        console.log(`⚠️  获取失败: ${error.message}`);
        resolve(null);
      });
  });
}

/**
 * 生成1986年至2026年的模拟历史数据
 */
function generateHistoricalData() {
  console.log("📊 生成模拟历史数据 (1986-2026)...");

  const data = [];

  // 1986年1月2日的标普500约为211点
  const startDate = new Date("1986-01-02");
  let close = 211.0;
  const endDate = new Date("2026-04-25");

  // 历史事件 - 大幅波动
  const events = {
    1987: { name: "黑色星期一", impact: -0.35 },
    2000: { name: "互联网泡沫", impact: -0.5 },
    2008: { name: "金融危机", impact: -0.57 },
    2020: { name: "COVID-19", impact: -0.34 },
  };

  // 关键时间点 - 大幅上涨
  const booms = {
    1995: { impact: 0.35 }, // 90年代牛市
    2013: { impact: 0.3 }, // QE3恢复
    2021: { impact: 0.25 }, // 后疫情复苏
  };

  for (let d = new Date(startDate); d <= endDate; ) {
    // 跳过周末和股市休市日
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      d.setDate(d.getDate() + 1);
      continue;
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // 1. 基础长期趋势：约7% annualized return
    const baseTrend = 0.00027;

    // 2. 事件冲击（分散在事件年份）
    let eventImpact = 0;
    if (events[year]) {
      eventImpact = (events[year].impact * 0.02) / 252; // 分散到全年交易日
    }

    // 3. 复苏期推动
    let recoveryBoost = 0;
    if (booms[year]) {
      recoveryBoost = (booms[year].impact * 0.02) / 252;
    }

    // 4. 随机波动
    const dailyVolatility = 0.012 / Math.sqrt(252); // 年化波动率12%
    const randomWalk = (Math.random() - 0.5) * 2 * dailyVolatility;

    // 合并所有因素
    const dailyReturn = baseTrend + eventImpact + recoveryBoost + randomWalk;
    const priceChange = close * dailyReturn;

    const open = close;
    const intraday = Math.abs(randomWalk) * 0.5;
    const high = Math.max(open, close + priceChange) + intraday;
    const low = Math.min(open, close + priceChange) - intraday;

    close = close + priceChange;
    close = Math.max(close, 0.01);

    // 成交量
    const baseVolume = 2000000000;
    const volumeNoise = Math.random() * 0.5;
    const volume = Math.floor(baseVolume * (0.75 + volumeNoise));

    data.push({
      date: dateStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.max(volume, 100000),
      adjustedClose: parseFloat(close.toFixed(2)),
    });

    d.setDate(d.getDate() + 1);
  }

  return data;
}

async function main() {
  const outputPath = process.argv[2] || "./public/data/sp500.json";

  console.log(`\n╔════════════════════════════════════════════════════════╗`);
  console.log(`║   标普500完整历史数据生成器 (1986-2026)              ║`);
  console.log(`╚════════════════════════════════════════════════════════╝\n`);

  let data = null;
  let source = "Generated";

  // 尝试从Yahoo Finance获取真实数据
  try {
    data = await fetchFromYahoo();
    if (data && data.length > 0) {
      source = "Yahoo Finance";
    }
  } catch (error) {
    console.log(`⚠️  网络获取失败: ${error.message}`);
  }

  // 如果获取失败，使用生成数据
  if (!data || data.length === 0) {
    data = generateHistoricalData();
  }

  if (data.length === 0) {
    console.error("❌ 无法生成数据");
    process.exit(1);
  }

  // 准备输出
  const result = {
    symbol: "^GSPC",
    name: "S&P 500 Index",
    currency: "USD",
    source: source,
    dataPoints: data.length,
    dateRange: {
      from: data[0].date,
      to: data[data.length - 1].date,
    },
    lastUpdated: new Date().toISOString(),
    data: data,
  };

  // 创建输出目录
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 已创建目录: ${outputDir}`);
  }

  // 保存JSON
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");

  // 统计信息
  const fileStats = fs.statSync(outputPath);
  const fileSizeM = (fileStats.size / 1024 / 1024).toFixed(2);

  const prices = data.map((d) => d.close);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const avgPrice = prices.reduce((a, b) => a + b) / prices.length;

  const startPrice = data[0].open;
  const endPrice = data[data.length - 1].close;
  const totalReturn = (((endPrice - startPrice) / startPrice) * 100).toFixed(2);
  const years = data.length / 252;
  const annualizedReturn =
    (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;

  console.log(`\n✅ 数据生成成功！\n`);
  console.log(`📊 数据统计:`);
  console.log(`   数据源: ${source}`);
  console.log(`   文件大小: ${fileSizeM} MB`);
  console.log(`   数据点数: ${data.length.toLocaleString()}`);
  console.log(`   时间范围: ${data[0].date} ~ ${data[data.length - 1].date}`);
  console.log(`\n💹 价格统计:`);
  console.log(`   开盘价 (${data[0].date}): $${data[0].open}`);
  console.log(
    `   收盘价 (${data[data.length - 1].date}): $${endPrice.toFixed(2)}`,
  );
  console.log(`   最高价: $${maxPrice.toFixed(2)}`);
  console.log(`   最低价: $${minPrice.toFixed(2)}`);
  console.log(`   平均价: $${avgPrice.toFixed(2)}`);
  console.log(`\n📈 收益率:`);
  console.log(`   总收益率: ${totalReturn}%`);
  console.log(`   年化收益率: ${annualizedReturn.toFixed(2)}%`);
  console.log(`\n📁 输出路径:`);
  console.log(`   ${outputPath}\n`);

  process.exit(0);
}

main().catch((error) => {
  console.error(`❌ 错误: ${error.message}`);
  process.exit(1);
});
