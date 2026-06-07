# 墨影 — AI 小说转剧本工具

将 3 章以上小说自动转换为结构化剧本 YAML，降低改编门槛，提升创作效率。

## 功能

- **AI 转换** — 基于千问大模型，自动拆分场景、提取角色和对话
- **结构化编辑** — 场景增删、对白/动作增删改、角色编辑，所见即所得
- **多版本管理** — 追加新章后可重新转换，生成新版本，旧版不变
- **查看原文** — 编剧可随时回溯原始小说文本
- **规则引擎回退** — AI 不可用时自动降级为基础转换，不中断工作流
- **YAML 导出** — 一键下载标准格式剧本文件

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + React Router 6 + Axios + Vite |
| 后端 | Spring Boot 3.3 + JPA + LangChain4j 0.31 |
| 数据库 | MySQL 8.0 |
| AI | 通义千问（OpenAI 兼容协议） |
| 容器化 | Docker + Docker Compose |

## 快速开始

### Docker Compose（推荐）

```bash
# 1. 复制 .env 并填入千问 API Key
cp .env.example .env

# 2. 启动全部服务
docker compose up -d
```

访问 `http://localhost:3000`。

### 本地开发

Java 17+、Node.js 20+、MySQL 8.0 就绪后：

```bash
# 1. 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS moying CHARACTER SET utf8mb4;"

# 2. 修改 moying/src/main/resources/application.yml 中的数据库密码

# 3. 启动后端
cd moying
./mvnw spring-boot:run

# 4. 启动前端
cd moying-web
npm install && npm run dev
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/novels/import` | 导入小说 |
| GET | `/api/novels` | 小说列表 |
| GET | `/api/novels/{id}` | 小说详情（含章节） |
| POST | `/api/novels/{id}/chapters` | 追加章节 |
| POST | `/api/novels/{id}/convert` | AI 转换剧本 |
| GET | `/api/novels/{id}/screenplays` | 剧本版本列表 |
| GET | `/api/screenplays/{id}` | 剧本详情 |
| PUT | `/api/screenplays/{id}` | 更新剧本元数据 |
| POST | `/api/screenplays/{id}/scenes` | 添加场景 |
| PUT | `/api/screenplays/{id}/scenes/{sceneId}` | 更新场景 |
| DELETE | `/api/screenplays/{id}/scenes/{sceneId}` | 删除场景 |
| POST | `/api/screenplays/{id}/scenes/{sceneId}/dialogues` | 添加对白 |
| DELETE | `/api/screenplays/{id}/dialogues/{id}` | 删除对白 |
| POST | `/api/screenplays/{id}/scenes/{sceneId}/actions` | 添加动作 |
| DELETE | `/api/screenplays/{id}/actions/{id}` | 删除动作 |
| PUT | `/api/screenplays/{id}/characters/{id}` | 更新角色 |
| GET | `/api/screenplays/{id}/export` | 导出 YAML |

## 项目结构

```
├── moying/                   # Spring Boot 后端 (com.moying)
│   ├── entity/               # 实体：Novel, Screenplay, Scene, Dialogue, Action, Character
│   ├── dto/                  # 请求/响应 DTO
│   ├── repository/           # JPA 仓库
│   ├── service/
│   │   ├── ConversionService # AI 转换引擎
│   │   ├── ScreenplayService # 剧本编辑 CRUD
│   │   ├── NovelService      # 小说管理
│   │   └── YamlService       # YAML 序列化/反序列化
│   ├── controller/           # REST 控制器
│   ├── config/               # AI / CORS 配置
│   └── exception/            # 全局异常处理
├── moying-web/               # React 前端
│   └── src/
│       ├── pages/            # HomePage, ImportNovelPage, ScreenplayEditorPage
│       └── api/              # API 客户端
├── screenplay-yaml-schema.md # YAML Schema 设计文档
├── docker-compose.yml
└── .env.example
```

## 数据库模型

```
novels 1───* chapters
novels 1───* screenplays
screenplays 1───* scenes
screenplays 1───* characters
scenes 1───* dialogues
scenes 1───* actions
```

## 许可证

MIT
