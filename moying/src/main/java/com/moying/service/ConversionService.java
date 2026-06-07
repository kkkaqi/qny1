package com.moying.service;

import com.moying.dto.ScreenplayDTO;
import com.moying.entity.*;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.input.Prompt;
import dev.langchain4j.model.input.PromptTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j @Service @RequiredArgsConstructor
public class ConversionService {

    private final ChatLanguageModel chatLanguageModel;
    private final YamlService yamlService;

    static final String SYSTEM_PROMPT = """
            你是一位资深的影视编剧，擅长将小说文本改编为专业格式的剧本。

            ## 任务
            将下面提供的小说章节转换为标准剧本格式的 YAML 输出。

            ## 转换规则
            1. **场景拆分**：根据地点和时间的转换，将叙事拆分为独立的场景
            2. **角色提取**：识别所有出场的角色，生成角色列表
            3. **对话转换**：将原文中的对话改为剧本格式（角色名 + 对白 + 表演指导）
            4. **动作描写**：将叙事中的动作和场景描述转换为剧本动作行
            5. **场景标题**：为每个场景生成 INT./EXT. + 地点 + 时间的标准场标

            ## 输出格式
            严格按照以下 YAML 结构输出（不要添加任何 YAML 之外的内容）：

            screenplay:
              title: "剧本标题"
              source: "来源小说"
              scenes:
                - scene_number: 1
                  heading:
                    setting: INT
                    location: "地点描述"
                    time_of_day: DAY
                  summary: "场景概要"
                  characters_present:
                    - "角色1"
                    - "角色2"
                  actions:
                    - "动作描述1"
                  dialogues:
                    - character: "角色名"
                      text: "对白内容"
                      direction: "表演指导（可选）"
            characters:
              - name: "角色名"
                description: "角色简述"
                traits: "特征标签"
                type: PROTAGONIST

            请确保输出是有效的 YAML 格式，不要包含任何额外的解释文字。
            """;

    public ScreenplayDTO convertNovelToScreenplay(Novel novel, List<Integer> chapterNumbers, String customInstruction) {
        List<Chapter> allChapters = novel.getChapters().stream()
                .sorted(Comparator.comparing(Chapter::getChapterNumber))
                .collect(Collectors.toList());
        List<Integer> effectiveNums = (chapterNumbers == null || chapterNumbers.isEmpty())
                ? allChapters.stream().map(Chapter::getChapterNumber).collect(Collectors.toList())
                : chapterNumbers;
        List<Chapter> targetChapters = allChapters.stream()
                .filter(c -> effectiveNums.contains(c.getChapterNumber()))
                .collect(Collectors.toList());
        if (targetChapters.size() < 3) throw new IllegalArgumentException("至少需要 3 个章节，当前仅 " + targetChapters.size() + " 个");
        String novelText = buildNovelText(targetChapters);
        try {
            String yamlOutput = callAiModel(novelText, novel.getTitle(), customInstruction);
            log.info("AI 转换完成，YAML {} 字符", yamlOutput.length());
            ScreenplayDTO dto = yamlService.parseYamlToScreenplayDTO(yamlOutput, novel.getId());
            dto.setSourceChapters(formatChapterRange(effectiveNums));
            return dto;
        } catch (Exception e) {
            log.error("AI 转换失败，回退规则引擎", e);
            ScreenplayDTO fdto = fallbackRuleBasedConversion(targetChapters, novel);
            fdto.setSourceChapters(formatChapterRange(effectiveNums));
            return fdto;
        }
    }

    private String callAiModel(String novelText, String title, String customInstruction) {
        String fi = SYSTEM_PROMPT;
        if (customInstruction != null && !customInstruction.isBlank()) fi += "\n\n## 额外要求\n" + customInstruction;
        PromptTemplate t = PromptTemplate.from(fi + "\n\n## 小说内容\n小说标题：{{title}}\n\n{{novelText}}");
        Map<String, Object> v = new HashMap<>(); v.put("title", title); v.put("novelText", novelText);
        return chatLanguageModel.generate(t.apply(v).text());
    }

    private String buildNovelText(List<Chapter> chapters) {
        StringBuilder sb = new StringBuilder();
        for (Chapter ch : chapters) sb.append("=== 第").append(ch.getChapterNumber()).append("章 ").append(ch.getTitle()).append(" ===\n\n").append(ch.getContent()).append("\n\n");
        return sb.toString();
    }

    private ScreenplayDTO fallbackRuleBasedConversion(List<Chapter> chapters, Novel novel) {
        log.warn("使用规则引擎进行基础转换");
        ScreenplayDTO dto = ScreenplayDTO.builder().novelId(novel.getId()).title(novel.getTitle() + "（剧本初稿）").status("DRAFT").build();
        List<ScreenplayDTO.SceneDTO> sceneDTOs = new ArrayList<>();
        List<ScreenplayDTO.CharacterDTO> charDTOs = new ArrayList<>();
        Set<String> known = new HashSet<>();
        int sc = 0;
        for (Chapter ch : chapters) {
            for (String p : ch.getContent().split("\n\n")) {
                if (p.trim().length() < 50) continue;
                List<ScreenplayDTO.DialogueDTO> ds = extractDialogues(p, known, charDTOs);
                List<ScreenplayDTO.ActionDTO> as = extractActions(p);
                if (ds.isEmpty() && as.isEmpty()) continue;
                sc++;
                sceneDTOs.add(ScreenplayDTO.SceneDTO.builder().sceneNumber(sc).title("第" + ch.getChapterNumber() + "章 场景" + sc).setting("INT").location("待确认").timeOfDay("DAY").summary(truncate(p, 200)).dialogues(ds).actions(as).characterList(String.join(",", known)).build());
            }
        }
        dto.setScenes(sceneDTOs); dto.setCharacters(charDTOs);
        dto.setSourceChapters(formatChapterRange(chapters.stream().map(Chapter::getChapterNumber).collect(Collectors.toList()))); return dto;
    }

    private List<ScreenplayDTO.DialogueDTO> extractDialogues(String p, Set<String> kc, List<ScreenplayDTO.CharacterDTO> cds) {
        List<ScreenplayDTO.DialogueDTO> ds = new ArrayList<>(); int s = 0;
        String[] patterns = {"([^，。；：\"]+)[说说道道问问问问]{1,2}[：:]\\s*[\"'「](.+?)[\"'」]", "[\"'「](.+?)[\"'」]\\s*([^，。；：]+)[说说道道]{1,2}"};
        for (int pi = 0; pi < patterns.length; pi++) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(patterns[pi]).matcher(p);
            while (m.find()) {
                String spk, txt;
                if (pi == 0) {
                    spk = m.group(1);
                    txt = m.group(2);
                } else {
                    spk = m.group(2);
                    txt = m.group(1);
                }
                if (kc.add(spk)) {
                    cds.add(ScreenplayDTO.CharacterDTO.builder().name(spk).characterType("SUPPORTING").build());
                }
                ds.add(ScreenplayDTO.DialogueDTO.builder().characterName(spk.trim()).text(txt.trim()).sequence(s++).build());
            }
        }
        return ds;
    }

    private List<ScreenplayDTO.ActionDTO> extractActions(String p) {
        List<ScreenplayDTO.ActionDTO> as = new ArrayList<>();
        String cl = p.replaceAll("[\"'「].+?[\"'」]", "").replaceAll("[^，。；：\"]+[说说道道问问问问]{1,2}[：:].+", "");
        if (!cl.isBlank()) { int s = 0; for (String t : cl.split("[。！]")) { String tr = t.trim(); if (tr.length() > 5) as.add(ScreenplayDTO.ActionDTO.builder().description(tr).sequence(s++).build()); } }
        return as;
    }

    private String truncate(String t, int m) { return t.length() > m ? t.substring(0, m) + "..." : t; }

    private String formatChapterRange(List<Integer> nums) {
        if (nums == null || nums.isEmpty()) return "全章";
        int min = nums.stream().min(Integer::compareTo).orElse(0);
        int max = nums.stream().max(Integer::compareTo).orElse(0);
        return min == max ? "第" + min + "章" : "第" + min + "-" + max + "章";
    }
}
