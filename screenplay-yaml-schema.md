# 剧本 YAML Schema 设计文档

## 版本：1.0.0 | 日期：2026-06-06

---

## 一、概述

本文档定义了「AI 小说转剧本工具」输出的剧本 YAML 数据格式规范。该 Schema 旨在为小说到剧本的自动转换提供一个结构化、可读、可编辑的中间表示，同时兼顾影视行业剧本写作的实际需求。

### 设计目标

1. **可读性优先** — YAML 格式天然适合人类阅读和编辑，编剧无需专业工具即可修改
2. **结构化完整** — 覆盖剧本所需的所有核心元素：元数据、角色、场景、对话、动作
3. **AI 友好** — Schema 结构清晰、约束明确，便于大语言模型输出符合格式的结果
4. **版本可追溯** — 支持多版本剧本管理，方便对比迭代
5. **工具链兼容** — 可轻易转换为 Final Draft、Fountain 等行业格式

---

## 二、完整 Schema 定义

```yaml
# ============================================================
# 剧本 YAML Schema v1.0
# ============================================================

# ---- 剧本元数据 ----
screenplay:
  title: string            # 必填，剧本标题
  subtitle: string         # 可选，副标题或版本说明
  version: integer         # 必填，版本号，从 1 开始递增
  status: enum             # 必填，DRAFT | REVIEW | POLISHED | FINAL
  source_chapters: string  # 可选，来源章节范围描述

# ---- 角色列表 ----
characters:
  - name: string           # 必填，角色名称
    description: string    # 可选，角色简述
    traits: string         # 可选，特征标签（逗号分隔）
    type: enum             # 必填，PROTAGONIST | ANTAGONIST | SUPPORTING | MINOR

# ---- 场景列表 ----
scenes:
  - scene_number: integer  # 必填，场景序号
    heading:               # 必填，场景标题（场标）
      setting: enum        # 必填，INT | EXT | INT/EXT
      location: string     # 必填，地点描述
      time_of_day: enum    # 必填，DAY | NIGHT | DAWN | DUSK
      title: string        # 可选，场景名称
    summary: string        # 可选，场景概要
    characters_present:    # 可选，本场景出场角色
      - string
    dialogues:             # 可选，对话序列
      - character: string  # 必填，说话角色名
        text: string       # 必填，对白内容
        direction: string  # 可选，表演指导（括号提示）
    actions:               # 可选，动作/舞台描述
      - string
```

---

## 三、字段详细说明与设计原因

### 3.1 `screenplay` — 剧本元数据

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 剧本标题，默认继承自小说标题 |
| `subtitle` | string | 否 | 副标题，用于版本说明或改编备注 |
| `version` | integer | 是 | 版本号，每次重新转换递增 |
| `status` | enum | 是 | 创作状态：DRAFT/REVIEW/POLISHED/FINAL |
| `source_chapters` | string | 否 | 来源章节范围，如「第1-5章」 |

**设计原因：**

- `version` 字段支持迭代式创作。作者可能对同一部小说多次运行 AI 转换（调整 prompt、修改章节范围），每次生成一个新版本，方便对比选择。
- `status` 枚举定义了从草稿到定稿的四个阶段，与影视行业剧本创作流程对应，支持工作流管理。
- `source_chapters` 记录了剧本对应的原文章节范围，保证可追溯性。当作者修改了原文某些章节后，可以精确知道哪些剧本版本需要重新生成。

### 3.2 `characters` — 角色列表

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 角色名称 |
| `description` | string | 否 | 角色简述（AI 生成的小传摘要） |
| `traits` | string | 否 | 特征标签，逗号分隔，如「侦探,固执,幽默」 |
| `type` | enum | 是 | 角色类型 |

**`type` 枚举值：**

- `PROTAGONIST` — 主角/核心人物
- `ANTAGONIST` — 反派/对立面
- `SUPPORTING` — 重要配角
- `MINOR` — 次要角色/龙套

**设计原因：**

- 角色列表独立于场景存在，而非嵌套在场景内部。这是因为一个角色通常出现在多个场景中，独立定义避免了重复，也方便统一修改角色设定。
- `traits` 使用逗号分隔的标签字符串而非数组，是考虑到 AI 模型生成标签列表时，简单字符串比嵌套数组更不容易出错（减少 YAML 缩进错误）。
- `type` 分类借用影视编剧领域的标准角色分类，AI 模型对此有较好的理解能力，也能帮助编剧快速梳理角色关系网。

### 3.3 `scenes` — 场景列表

每个场景是剧本的最小叙事单元，包含以下结构：

#### 3.3.1 `heading` — 场景标题（场标）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `setting` | enum | 是 | INT（内景）/ EXT（外景）/ INT/EXT（内外景） |
| `location` | string | 是 | 地点描述 |
| `time_of_day` | enum | 是 | DAY / NIGHT / DAWN / DUSK |
| `title` | string | 否 | 场景名称，如「咖啡馆初遇」 |

**设计原因：**

- `heading` 作为独立子结构而非扁平字段，是为了匹配影视行业标准场标格式「INT. 地点 — 时间」。例如 `INT. COFFEE SHOP — DAY` 可以直接从 `setting + location + time_of_day` 拼接生成。
- `setting` 三选一（INT/EXT/INT+EXT）覆盖了所有场景类型。将 INT/EXT 合并为一个值而非两个布尔字段，避免了「两个都为 false」的非法状态。
- `title` 为中文编剧习惯保留。英文剧本通常不设场景名，但中文剧本常给场景命名以便记忆和讨论，如「第一场：桃园结义」。

#### 3.3.2 `dialogues` — 对话序列

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `character` | string | 是 | 说话角色名 |
| `text` | string | 是 | 对白内容 |
| `direction` | string | 否 | 表演指导（括号提示），如「低声」「激动地」 |

**设计原因：**

- 对话和动作（actions）分离存储。这是因为剧本格式中，对话和动作描述有截然不同的排版规范（对话居中、动作左对齐），分开存储便于渲染。
- `direction` 对应剧本中的「括号提示」（parenthetical），用于指导演员的表演方式。虽然 AI 不一定总能准确生成，但保留此字段为作者提供了后期添加的空间。
- 对话不设 ID 字段，而是依赖数组顺序（`sequence`）。YAML 本质是序列化的，顺序即身份，减少冗余字段。

#### 3.3.3 `actions` — 动作/舞台描述

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| （数组项） | string | 是 | 动作描述文本 |

**设计原因：**

- `actions` 使用简单字符串数组而非对象数组。动作描述不需要角色归属或类型标记，纯文本已足够表达。简洁的数组结构降低了 AI 输出的复杂度，减少了格式错误。
- 每个数组项对应一句或一段动作描述，按叙事顺序排列。

---

## 四、Schema 设计原则总结

### 4.1 扁平化 vs 嵌套化

在以下位置选择了扁平化结构：
- 角色列表为顶层数组，不嵌套在场景中
- 对话和动作为场景内的独立子数组，而非混合在同一个序列中

这种「适度扁平」的设计平衡了可读性和结构化程度。过深嵌套会导致 YAML 缩进层级过多，AI 输出容易出错；过于扁平则会丢失剧本的结构语义。

### 4.2 枚举约束的使用

以下字段使用枚举值：

- `screenplay.status`: DRAFT / REVIEW / POLISHED / FINAL
- `character.type`: PROTAGONIST / ANTAGONIST / SUPPORTING / MINOR
- `heading.setting`: INT / EXT / INT/EXT
- `heading.time_of_day`: DAY / NIGHT / DAWN / DUSK

枚举保证了关键字段的一致性。在结构化表单编辑器中，枚举字段渲染为下拉选择框，降低用户输入错误。

### 4.3 AI 输出容错

Schema 设计充分考虑了大语言模型输出 YAML 时的常见问题：

1. **避免过深嵌套** — 最大嵌套深度为 4 层，降低缩进错误概率
2. **字符串数组优先** — `actions` 和 `traits` 使用简单类型，减少结构复杂度
3. **可选字段宽容** — 除核心标识字段外，大部分字段为可选，AI 输出不完整时仍可解析
4. **YAML 友好** — 不使用特殊字符作为键名，所有键名使用 snake_case

### 4.4 可扩展性

Schema 预留了扩展空间：

- 可在 `screenplay` 下添加 `notes`、`target_audience` 等字段
- `characters` 可扩展 `aliases`（别名）、`age_range`（年龄范围）等字段
- `scenes` 可扩展 `props`（道具）、`camera_notes`（摄影备注）等字段

---

## 五、完整示例

以下是一个基于《红楼梦》片段生成的剧本 YAML 示例：

```yaml
screenplay:
  title: "红楼梦（剧本改编）"
  subtitle: "第一幕：黛玉进贾府"
  version: 1
  status: DRAFT
  source_chapters: "第1-3章"

characters:
  - name: "林黛玉"
    description: "贾母外孙女，聪慧敏感，才情出众"
    traits: "主角, 才女, 敏感, 多愁善感"
    type: PROTAGONIST
  - name: "贾母"
    description: "荣国府太夫人，黛玉的外祖母"
    traits: "慈祥, 威严, 疼爱晚辈"
    type: SUPPORTING
  - name: "王熙凤"
    description: "荣国府当家少奶奶，精明泼辣"
    traits: "精明, 泼辣, 八面玲珑"
    type: SUPPORTING

scenes:
  - scene_number: 1
    heading:
      setting: EXT
      location: "荣国府大门外"
      time_of_day: DAY
      title: "黛玉抵府"
    summary: "林黛玉乘轿抵达荣国府，初见贾府气派。"
    characters_present:
      - "林黛玉"
      - "轿夫"
    actions:
      - "一顶青布小轿缓缓停在荣国府大门前。"
      - "黛玉掀开轿帘，抬头望向门楣上「敕造荣国府」的金匾。"
    dialogues:
      - character: "林黛玉"
        text: "这就是外祖母家了..."
        direction: "低声自语"

  - scene_number: 2
    heading:
      setting: INT
      location: "贾母房中"
      time_of_day: DAY
      title: "祖孙相见"
    summary: "黛玉入内拜见贾母，祖孙相见，百感交集。"
    characters_present:
      - "林黛玉"
      - "贾母"
      - "王熙凤"
    actions:
      - "黛玉进得房来，只见一位鬓发如银的老太太倚在榻上。"
      - "贾母见黛玉，浑身一颤，张开双臂。"
    dialogues:
      - character: "贾母"
        text: "我的儿！可算见着你了！"
        direction: "哽咽"
      - character: "林黛玉"
        text: "外祖母..."
        direction: "跪下叩首，泪如雨下"
```

---

## 六、与其他格式的关系

| 格式 | 用途 | 与本 Schema 的关系 |
|------|------|-------------------|
| Final Draft (.fdx) | 好莱坞行业标准 | 可从本 YAML 转换生成 |
| Fountain (.fountain) | 纯文本剧本格式 | 可从本 YAML 转换生成 |
| 中文剧本格式 | 国内影视行业习惯 | 渲染层支持，核心数据不变 |
| JSON Schema | 程序校验 | 可自动生成用于 API 验证 |

本 YAML Schema 定位为**中间表示层**，即 AI 转换的标准化输出，以及后续编辑和格式转换的数据源。

---

## 七、版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| 1.0.0 | 2026-06-06 | 初始版本，定义核心 Schema 结构 |
