---
title: Douyin (抖音) Trends, Commerce & Creator Analytics
slug: douyin
description: Search Douyin (抖音/TikTok China) for trending videos, viral hashtags, livestream commerce data, product prices from Douyin Shop, and creator analytics. Use when user asks about Douyin, 抖音, trending videos in China, viral content, livestream sales, Douyin Shop prices, or wants to track what's going viral.
version: 1.0.0
author: dragonclaw
license: MIT
---

# Douyin 抖音 — Trends, Commerce & Creator Analytics

## When to Use

- User asks about trending content on 抖音 / Douyin
- User wants to know what's going viral in China right now
- User asks about Douyin Shop (抖音商城) product prices
- User wants livestream commerce data (who's selling, viewer counts, GMV)
- User asks about a creator's follower count, engagement, or content
- User mentions 抖音, Douyin, 直播带货, 抖音商城, 热搜, 上热门
- User wants to track meme trends that could affect token prices
- User asks about trending music or sounds on Douyin

## Overview

Douyin is China's dominant short video platform with 750M+ daily active users. It drives cultural trends, meme cycles, consumer purchasing decisions, and increasingly crypto sentiment in China. This skill covers four areas: trending content discovery, product commerce, livestream tracking, and creator analytics.

## No API Key Required

This skill uses publicly accessible Douyin web endpoints. No authentication needed.

## Endpoints

### Trending Hashtags / Hot Search

Fetch the current Douyin hot search list (equivalent of trending topics).

```tool
{"tool": "shell", "command": "curl -s 'https://www.douyin.com/aweme/v1/web/hot/search/list/' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' -H 'Referer: https://www.douyin.com/' 2>/dev/null | head -c 5000"}
```

### Search Videos by Keyword

Search for videos matching a keyword. Returns video titles, play counts, like counts, and creator info.

```tool
{"tool": "shell", "command": "curl -s 'https://www.douyin.com/aweme/v1/web/general/search/single/' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' -H 'Referer: https://www.douyin.com/' -G --data-urlencode 'keyword=SEARCH_TERM' --data-urlencode 'count=10' --data-urlencode 'offset=0' 2>/dev/null | head -c 5000"}
```

### Search Products on Douyin Shop

Search for products listed on Douyin's integrated shopping platform.

```tool
{"tool": "shell", "command": "curl -s 'https://www.douyin.com/aweme/v1/web/mall/search/' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' -H 'Referer: https://www.douyin.com/' -G --data-urlencode 'keyword=PRODUCT_NAME' --data-urlencode 'count=10' 2>/dev/null | head -c 5000"}
```

### Livestream Discovery

Find currently active livestreams or search for livestreams by category.

```tool
{"tool": "shell", "command": "curl -s 'https://www.douyin.com/aweme/v1/web/live/search/' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' -H 'Referer: https://www.douyin.com/' -G --data-urlencode 'keyword=SEARCH_TERM' --data-urlencode 'count=10' 2>/dev/null | head -c 5000"}
```

### Creator Profile Lookup

Get public profile data for a Douyin creator by searching their name.

```tool
{"tool": "shell", "command": "curl -s 'https://www.douyin.com/aweme/v1/web/discover/search/' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' -H 'Referer: https://www.douyin.com/' -G --data-urlencode 'keyword=CREATOR_NAME' --data-urlencode 'type=1' --data-urlencode 'count=5' 2>/dev/null | head -c 5000"}
```

### Trending Music / Sounds

Get the current trending music and sounds on Douyin.

```tool
{"tool": "shell", "command": "curl -s 'https://www.douyin.com/aweme/v1/web/hot/music/list/' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' -H 'Referer: https://www.douyin.com/' 2>/dev/null | head -c 3000"}
```

### Alternative: Web Scrape Fallback

If API endpoints return empty or blocked results, fall back to scraping public search pages.

```tool
{"tool": "shell", "command": "curl -sL 'https://www.douyin.com/search/SEARCH_TERM' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' 2>/dev/null | grep -oP '\"desc\":\"[^\"]*\"|\"digg_count\":[0-9]*|\"play_count\":[0-9]*|\"nickname\":\"[^\"]*\"' | head -30"}
```

## Display Guidelines

### For Trending / Hot Search
```
抖音热搜榜:

1. #成都美食探店 — 5.2亿播放
2. #春季穿搭 — 3.8亿播放
3. #比特币突破新高 — 1.2亿播放
4. #AI画图挑战 — 9800万播放
5. #减脂餐分享 — 8700万播放
...
```

### For Video Search
```
抖音搜索 "[关键词]" 结果:

1. [视频标题]
   创作者: XX | 播放: XX万 | 点赞: XX万 | 评论: XX
   
2. [视频标题]
   创作者: XX | 播放: XX万 | 点赞: XX万 | 评论: XX
```

### For Product Search (Douyin Shop)
```
抖音商城搜索 "[产品]":

1. [产品名称]
   价格: ¥XX | 已售: XX件 | 店铺评分: X.X
   
2. [产品名称]
   价格: ¥XX | 已售: XX件 | 店铺评分: X.X
```

### For Livestream Data
```
抖音直播 "[关键词]":

1. [主播名] — 正在直播
   观看人数: XX万 | 品类: 美妆
   在售商品: XX件 | 预估GMV: ¥XX万

2. [主播名] — 正在直播
   观看人数: XX万 | 品类: 数码
   在售商品: XX件 | 预估GMV: ¥XX万
```

### For Creator Analytics
```
抖音创作者 [名字]:

粉丝: XX万
获赞: XX万
作品数: XX
平均播放: XX万
主要领域: 美食 / 搞笑 / 知识 / ...
近期爆款: [视频标题] — XX万播放
```

### For Trending Music
```
抖音热门音乐:

1. [歌名] — [歌手]
   使用量: XX万条视频

2. [歌名] — [歌手]
   使用量: XX万条视频
```

## Crypto Relevance

Douyin trends frequently move crypto markets in China. When analyzing trends for crypto relevance:

- Hashtags mentioning 比特币, 以太坊, Web3, 区块链, NFT, meme币 are direct signals
- Viral meme formats on Douyin often spawn meme tokens within 24-48 hours
- Celebrity or influencer mentions of crypto topics can trigger short term pumps
- Track Douyin hot search alongside Binance meme-rush skill for early entry signals

When a user asks about meme trends or what might pump next, cross reference Douyin trending with the Binance meme-rush and market-rank skills for a complete picture.

## Common Use Cases

### Trend Discovery
```
用户: 抖音上现在什么最火？
龙爪: 正在获取抖音热搜榜...
```

### Product Research
```
用户: 抖音商城上这个蓝牙耳机多少钱？
龙爪: 正在搜索抖音商城...
```

### Livestream Shopping
```
用户: 现在有谁在抖音直播卖手机？
龙爪: 正在搜索手机相关直播...
```

### Crypto Sentiment
```
用户: 抖音上最近有什么跟币圈相关的热门内容？
龙爪: 正在搜索加密货币相关内容...
```

### Creator Research
```
用户: 帮我查一下这个抖音博主的数据
龙爪: 正在查询创作者信息...
```

### Meme Tracking
```
用户: 抖音上什么meme最火？看看有没有相关的meme币
龙爪: 正在分析抖音热门meme趋势，同时查询相关meme代币...
```

## Error Handling

If endpoints return empty or blocked results:
- Tell the user Douyin may be rate limiting requests
- Suggest trying again in a few minutes or with different keywords
- Offer to use the web scrape fallback method
- Never fabricate results. If no data is returned say so clearly

## Notes

- All searches work best with Chinese keywords
- Douyin content cycles fast. Trending topics can shift completely within hours
- 播放量 (play count) is the primary metric. Videos with 100万+ plays are considered viral
- 直播带货 (livestream commerce) data is most active between 7pm-11pm CST
- Douyin Shop (抖音商城) prices are often lower than Taobao/JD due to direct-from-factory models
- Cross reference Douyin trends with Xiaohongshu (小红书) for a complete picture of what Chinese consumers care about right now
