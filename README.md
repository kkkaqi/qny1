# AI 小说转剧本工具

将小说文本自动转换为结构化剧本（YAML 格式），降低改编门槛，提升创作效率。

## 功能概览

- 支持导入 **3 个以上章节** 的小说文本
- 使用 **LangChain4j + OpenAI** 进行 AI 驱动的剧本转换
- 输出标准 **YAML 格式剧本**，可编辑、可导出
- **结构化表单编辑器** — 按场景、对话、角色分模块编辑
- **规则引擎回退** — AI 不可用时自动降级为基础转换
- 支持多版本剧本管理和对比

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + React Router 6 + Axios + Vite |
| 后端 | Spring Boot 3.3 + JPA + LangChain4j |
| 数据库 | MySQL 8.0 |
| AI | OpenAI API（兼容 DeepSeek / 通义千问等） |
| 容器化 | Docker + Docker Compose |

## 快速开始

### 方式一：Docker Compose（推荐）

```bash
# 1. 设置 OpenAI API Key
export OPENAI_API_KEY=sk-your-key-here

# 2. 启动全部服务（MySQL + 后端 + 前端）
docker compose up -d

# 3. 访问
# 前端：http://localhost:3000
# 后端 API：http://localhost:8080/api
```

### 方式二：本地开发

**前提条件：** Java 17+、Node.js 20+、MySQL 8.0+

```bash
# 1. 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS novel_screenplay CHARACTER SET utf8mb4;"

# 2. 配置 application.yml
# 修改 backend/src/main/resources/application.yml 中的数据库密码

# 3. 启动后端
cd backend
./mvnw spring-boot:run

# 4. 启动前端（新终端）
cd frontend
npm install
npm run dev
```

### 使用国产 AI 模型

支持任何 OpenAI 兼容的 API 端点：

```bash
# DeepSeek
export OPENAI_BASE_URL=https://api.deepseek.com/v1
export OPENAI_API_KEY=sk-your-deepseek-key

# 通义千问
export OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
export OPENAI_API_KEY=sk-your-qwen-key
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/novels/import` | 导入小说（含章节） |
| GET | `/api/novels` | 小说列表 |
| GET | `/api/novels/{id}` | 小说详情 |
| POST | `/api/novels/{id}/chapters` | 追加章节 |
| POST | `/api/novels/{id}/convert` | AI 转换为剧本 |
| GET | `/api/novels/{id}/screenplays` | 剧本版本列表 |
| GET | `/api/screenplays/{id}` | 剧本详情 |
| PUT | `/api/screenplays/{id}/scenes/{sceneId}` | 更新场景 |
| GET | `/api/screenplays/{id}/export` | 导出 YAML 文件 |

## 项目结构

```
novel-to-screenplay/
├── backend/                        # Spring Boot 后端
│   ├── src/main/java/com/screenplay/
│   │   ├── config/                 # AI 配置、CORS 配置
│   │   ├── controller/             # REST API 控制器
│   │   ├── entity/                 # JPA 实体（Novel, Screenplay, Scene, etc.）
│   │   ├── repository/             # JPA 仓库
│   │   ├── service/                # 业务逻辑层
│   │   │   ├── ConversionService   # AI 转换引擎（核心）
│   │   │   ├── ScreenplayService   # 剧本管理
│   │   │   ├── NovelService        # 小说管理
│   │   │   └── YamlService         # YAML 序列化
│   │   ├── dto/                    # 数据传输对象
│   │   └── exception/              # 全局异常处理
│   └── src/main/resources/
│       ├── application.yml         # 应用配置
│       └── prompts/                # AI Prompt 模板
├── frontend/                       # React 前端
│   └── src/
│       ├── pages/
│       │   ├── HomePage.jsx        # 首页（小说列表）
│       │   ├── ImportNovelPage.jsx # 导入小说/章节
│       │   └── ScreenplayEditorPage.jsx  # 剧本编辑器
│       ├── api/client.js           # API 客户端
│       └── App.jsx                 # 主应用
├── screenplay-yaml-schema.md       # YAML Schema 设计文档
├── docker-compose.yml
└── README.md
```

## 数据库 ER 模型

```
novels 1───* chapters        （小说包含多个章节）
novels 1───* screenplays     （小说生成多个剧本版本）
screenplays 1───* scenes     （剧本包含多个场景）
screenplays 1───* characters （剧本包含多个角色）
scenes 1───* dialogues       （场景包含多句对白）
scenes 1───* actions         （场景包含多个动作描述）
```

## 许可证

MIT
