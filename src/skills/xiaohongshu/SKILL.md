---
title: Xiaohongshu (RedNote) Content & Product Discovery
slug: xiaohongshu
description: Search Xiaohongshu (小红书) for trending content, product reviews, creator analytics, and lifestyle recommendations. Use when user asks about RedNote, 小红书, product reviews, Chinese social commerce, trending topics on RedNote, or wants to find popular posts and creators.
version: 1.0.0
author: dragonclaw
license: MIT
---

# Xiaohongshu 小红书 — Content & Product Discovery

## When to Use

- User asks about trending topics on 小红书 / RedNote
- User wants product reviews or recommendations from RedNote
- User asks about popular creators or influencers on the platform
- User mentions 小红书, RedNote, 种草, 拔草, or 好物推荐
- User wants to research a product before buying (skincare, fashion, tech, food)
- User asks what's viral or trending in China right now

## Overview

Xiaohongshu (小红书, also known as RedNote internationally) is China's largest lifestyle and social commerce platform with 300M+ monthly active users. It combines Instagram-style content with product reviews and direct purchasing. This skill searches and analyzes RedNote content through public web endpoints.

## No API Key Required

This skill uses publicly accessible Xiaohongshu web endpoints and search. No authentication needed.

## Endpoints

### Search Notes (Posts)

Search for notes by keyword. Returns titles, engagement metrics, and creator info.

```tool
{"tool": "shell", "command": "curl -s 'https://edith.xiaohongshu.com/api/sns/web/v1/search/notes' -H 'User-Agent: Mozilla/5.0' -H 'Content-Type: application/json' -d '{\"keyword\": \"SEARCH_TERM\", \"page\": 1, \"page_size\": 10, \"sort\": \"general\"}' 2>/dev/null | head -c 5000"}
```

Sort options: `general` (default), `time_descending` (newest), `popularity_descending` (most popular)

### Search by Topic/Hashtag

Find notes under a specific topic tag.

```tool
{"tool": "shell", "command": "curl -s 'https://edith.xiaohongshu.com/api/sns/web/v1/search/notes' -H 'User-Agent: Mozilla/5.0' -H 'Content-Type: application/json' -d '{\"keyword\": \"#TOPIC_TAG\", \"page\": 1, \"page_size\": 10, \"sort\": \"popularity_descending\"}' 2>/dev/null | head -c 5000"}
```

### Get Trending Topics

Fetch currently trending topics and hashtags.

```tool
{"tool": "shell", "command": "curl -s 'https://edith.xiaohongshu.com/api/sns/web/v1/search/hot_list' -H 'User-Agent: Mozilla/5.0' 2>/dev/null | head -c 3000"}
```

### Search Products

Search for products listed on Xiaohongshu's commerce platform.

```tool
{"tool": "shell", "command": "curl -s 'https://edith.xiaohongshu.com/api/sns/web/v1/search/goods' -H 'User-Agent: Mozilla/5.0' -H 'Content-Type: application/json' -d '{\"keyword\": \"PRODUCT_NAME\", \"page\": 1, \"page_size\": 10}' 2>/dev/null | head -c 5000"}
```

### Alternative: Web Scrape Search Results

If the API endpoints are restricted, fall back to scraping the public web search.

```tool
{"tool": "shell", "command": "curl -sL 'https://www.xiaohongshu.com/search_result?keyword=SEARCH_TERM&type=51' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' 2>/dev/null | grep -oP '\"title\":\"[^\"]*\"|\"likes_count\":[0-9]*|\"nickname\":\"[^\"]*\"' | head -30"}
```

## Display Guidelines

### For Trending Topics
Present as a numbered list:
```
小红书热门话题:

1. #早春穿搭 — 2.3亿浏览
2. #平价护肤 — 1.8亿浏览
3. #一人食 — 9500万浏览
...
```

### For Product Reviews
Summarize the consensus across multiple notes:
```
小红书上关于 [产品名] 的评价:

整体评分: 4.2/5 (基于 50+ 篇笔记)
优点: 用户普遍反馈...
缺点: 部分用户提到...
价格区间: ¥XX - ¥XX
推荐指数: 值得买 / 观望 / 不推荐

热门笔记:
1. [标题] — 作者 — XX赞 XX收藏
2. [标题] — 作者 — XX赞 XX收藏
```

### For Creator Search
```
小红书创作者 [名字]:

粉丝: XX万
笔记数: XX
互动率: XX%
主要领域: 美妆 / 穿搭 / 美食 / ...
近期热门内容: ...
```

### For Content Search
```
小红书搜索 "[关键词]" 结果:

1. [标题]
   作者: XX | 赞: XX | 收藏: XX
   摘要: ...

2. [标题]
   作者: XX | 赞: XX | 收藏: XX
   摘要: ...
```

## Common Use Cases

### Product Research
```
用户: 想买一个机械键盘，小红书上大家推荐什么？
龙爪: 正在搜索小红书上的机械键盘推荐...
```

### Trend Discovery
```
用户: 小红书上最近什么最火？
龙爪: 正在获取小红书热门话题...
```

### Travel Planning
```
用户: 下周去成都，小红书上有什么美食推荐？
龙爪: 正在搜索成都美食攻略...
```

### Skincare/Beauty
```
用户: 油皮适合什么防晒？帮我查查小红书
龙爪: 正在搜索油皮防晒推荐...
```

### Price Comparison
```
用户: 这个包在小红书上卖多少钱？
龙爪: 正在查询商品价格...
```

## Error Handling

If the API returns empty or blocked results:
- Tell the user Xiaohongshu may be rate limiting requests
- Suggest trying again in a few minutes
- Offer to search with different keywords
- Never fabricate results. If no data is returned say so clearly

## Notes

- Xiaohongshu content is primarily in Chinese. Search keywords in Chinese yield much better results than English
- Engagement metrics (likes, favorites, comments) are the best signal for content quality
- 收藏 (favorites/saves) is a stronger signal than 赞 (likes) on this platform because users save things they actually plan to use
- Product notes tagged 好物推荐 or 真实测评 tend to be more trustworthy than sponsored content (广告/合作)
