# S&P 500 数据使用说明

## 📊 数据文件

- **位置**: `public/data/sp500.json`
- **范围**: 1986-01-02 至 2026-04-24
- **记录数**: 10,517 条交易日
- **大小**: 1.89 MB
- **格式**: JSON（可直接导入）

## 🚀 快速使用

### 导入数据
```typescript
import sp500Data from '@/public/data/sp500.json';

// 访问数据
const latestPrice = sp500Data.data[sp500Data.data.length - 1].close;
const dataPoints = sp500Data.dataPoints; // 10517
```

### 数据结构
```json
{
  "symbol": "^GSPC",
  "name": "S&P 500 Index",
  "currency": "USD",
  "dataPoints": 10517,
  "dateRange": { "from": "1986-01-02", "to": "2026-04-24" },
  "lastUpdated": "2026-04-25T14:57:54.871Z",
  "data": [
    {
      "date": "1986-01-02",
      "open": 211,
      "high": 211,
      "low": 211,
      "close": 211,
      "volume": 1655532027,
      "adjustedClose": 211
    },
    // ... 更多记录
  ]
}
```

## 📝 常见用法

### 获取特定时间段
```typescript
// 2020年数据
const year2020 = sp500Data.data.filter(d => d.date.startsWith('2020'));

// 日期范围
const filtered = sp500Data.data.filter(d => 
  d.date >= '2020-01-01' && d.date <= '2020-12-31'
);
```

### 计算统计
```typescript
const prices = sp500Data.data.map(d => d.close);
const max = Math.max(...prices);
const min = Math.min(...prices);
const avg = prices.reduce((a, b) => a + b) / prices.length;
```

## 🔄 更新数据

如需更新数据到最新日期：
```bash
node scripts/fetch-sp500-full.cjs ./public/data/sp500.json
```

---
一次性下载，无需API调用，零依赖。
