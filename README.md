# 墨影 — AI 小说转剧本工具

将小说自动转换为结构化剧本（YAML），降低改编门槛，提升创作效率。

视频演示链接: [七牛云第三期项目: 墨影 — AI 小说转剧本工具_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1oBEt6REwx/?vd_source=47a8be2eb71971cd929b57e55c08dee0)

## 核心功能

- **AI 智能转换** — 基于通义千问大模型，自动拆分场景、提取角色、转换对话，输出标准剧本 YAML
- **结构化编辑** — 场景增删改、对白/动作增删改、角色信息编辑，完全可视化操作
- **版本管理** — 追加章节后可重新转换生成新版，旧版不受影响，支持多版本对比
- **原文回溯** — 查看原文 Tab 按版本精确显示对应章节，编剧可随时对照
- **txt 导入** — 拖入 txt 文件自动按「第 X 章」拆分并填充表单
- **规则引擎回退** — AI 不可用时自动降级为本地规则转换，不中断工作流
- **YAML 导出** — 一键下载标准剧本文件

## 技术栈

| 层 | 技术 |
|------|------|
| 前端 | React 18 + React Router 6 + Axios + Vite |
| 后端 | Spring Boot 3.3 + JPA + LangChain4j 0.31 |
| 数据库 | MySQL 8.0 |
| AI | 通义千问（OpenAI 兼容协议，可切换任意国产模型） |
| 容器化 | Docker + Docker Compose |

## 快速开始

### Docker Compose

```bash
cp .env.example .env          # 编辑 .env 填入千问 API Key
docker compose up -d           # MySQL + 后端 + 前端一键启动
```

访问 `http://localhost:3000`

### 本地开发

**前提：** Java 17+、Node.js 20+、MySQL 8.0+

```bash
# 1. 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS moying CHARACTER SET utf8mb4;"

# 2. 修改 moying/src/main/resources/application.yml 中的数据库密码和 API Key

# 3. 启动后端
cd moying
./mvnw spring-boot:run

# 4. 启动前端
cd moying-web
npm install && npm run dev
```

### 切换 AI 模型

在 `application.yml` 中修改：

```yaml
langchain4j:
  open-ai:
    chat-model:
      base-url: https://dashscope.aliyuncs.com/compatible-mode/v1  # 或其他 OpenAI 兼容端点
      api-key: sk-your-key
      model-name: qwen-plus   # qwen-turbo / qwen-max / gpt-4o 等
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/novels/import` | 导入小说 |
| GET | `/api/novels` | 小说列表 |
| GET | `/api/novels/{id}` | 小说详情 |
| POST | `/api/novels/{id}/chapters` | 追加章节 |
| POST | `/api/novels/{id}/convert` | AI 转换 |
| GET | `/api/novels/{id}/screenplays` | 剧本版本列表 |
| GET | `/api/screenplays/{id}` | 剧本详情 |
| PUT | `/api/screenplays/{id}` | 更新剧本信息 |
| POST | `/api/screenplays/{id}/scenes` | 添加场景 |
| PUT | `/api/screenplays/{id}/scenes/{id}` | 更新场景 |
| DELETE | `/api/screenplays/{id}/scenes/{id}` | 删除场景 |
| POST | `/api/screenplays/{id}/scenes/{id}/dialogues` | 添加对白 |
| DELETE | `/api/screenplays/{id}/dialogues/{id}` | 删除对白 |
| POST | `/api/screenplays/{id}/scenes/{id}/actions` | 添加动作 |
| DELETE | `/api/screenplays/{id}/actions/{id}` | 删除动作 |
| PUT | `/api/screenplays/{id}/characters/{id}` | 更新角色 |
| GET | `/api/screenplays/{id}/export` | 导出 YAML |

## 项目结构

```
├── moying/                     # Spring Boot 后端
│   └── src/main/java/com/moying/
│       ├── entity/             # Novel, Chapter, Screenplay, Scene, Dialogue, Action, Character
│       ├── dto/                # 请求/响应对象
│       ├── repository/         # JPA 接口
│       ├── service/            # 核心逻辑（ConversionService, ScreenplayService 等）
│       ├── controller/         # REST 接口
│       ├── config/             # AI 配置 / CORS
│       └── exception/          # 全局异常处理
├── moying-web/                 # React 前端
│   └── src/
│       ├── pages/              # HomePage, ImportNovelPage, ScreenplayEditorPage
│       └── api/                # API 客户端
├── screenplay-yaml-schema.md   # YAML Schema 设计文档
├── docker-compose.yml
├── .env.example
└── README.md
```

## 相关文档

- [剧本 YAML Schema 设计文档](screenplay-yaml-schema.md) — YAML 格式定义及设计原因

## License

MIT
