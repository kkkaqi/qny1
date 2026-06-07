package com.moying.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.fasterxml.jackson.dataformat.yaml.YAMLGenerator;
import com.moying.dto.ScreenplayDTO;
import com.moying.entity.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;

@Slf4j @Service @RequiredArgsConstructor
public class YamlService {

    private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory().disable(YAMLGenerator.Feature.WRITE_DOC_START_MARKER).enable(YAMLGenerator.Feature.MINIMIZE_QUOTES).enable(YAMLGenerator.Feature.INDENT_ARRAYS_WITH_INDICATOR));

    public String toYaml(Screenplay screenplay) {
        try { return yamlMapper.writerWithDefaultPrettyPrinter().writeValueAsString(buildYamlStructure(screenplay)); }
        catch (Exception e) { throw new RuntimeException("YAML 生成失败: " + e.getMessage(), e); }
    }

    @SuppressWarnings("unchecked")
    public ScreenplayDTO parseYamlToScreenplayDTO(String yamlContent, Long novelId) {
        try {
            if (yamlContent == null) throw new RuntimeException("YAML 内容为空");
            String c = yamlContent;
            int yamlStart = c.indexOf("```yaml");
            int codeEnd = c.lastIndexOf("```");
            if (yamlStart != -1 && codeEnd != -1 && codeEnd > yamlStart) {
                c = c.substring(yamlStart + 7, codeEnd).trim();
            }
            return buildDTOFromMap(yamlMapper.readValue(c, Map.class), novelId);
        } catch (Exception e) { throw new RuntimeException("YAML 解析失败: " + e.getMessage(), e); }
    }

    public String dtoToYaml(ScreenplayDTO dto) {
        try { return yamlMapper.writerWithDefaultPrettyPrinter().writeValueAsString(buildYamlFromDTO(dto)); }
        catch (Exception e) { throw new RuntimeException("YAML 生成失败", e); }
    }

    private Map<String, Object> buildYamlStructure(Screenplay sp) {
        Map<String, Object> r = new LinkedHashMap<>();
        Map<String, Object> m = new LinkedHashMap<>(); m.put("title", sp.getTitle()); m.put("subtitle", sp.getSubtitle()); m.put("version", sp.getVersion()); m.put("source_chapters", sp.getSourceChapters()); r.put("screenplay", m);
        List<Map<String, Object>> cl = new ArrayList<>(); for (com.moying.entity.Character c : sp.getCharacters()) { Map<String, Object> cm = new LinkedHashMap<>(); cm.put("name", c.getName()); cm.put("description", c.getDescription()); cm.put("traits", c.getTraits()); cm.put("type", c.getCharacterType()); cl.add(cm); } r.put("characters", cl);
        List<Map<String, Object>> sl = new ArrayList<>(); for (Scene s : sp.getScenes()) { Map<String, Object> sm = new LinkedHashMap<>(); sm.put("scene_number", s.getSceneNumber()); Map<String, Object> h = new LinkedHashMap<>(); h.put("setting", s.getSetting()); h.put("location", s.getLocation()); h.put("time_of_day", s.getTimeOfDay()); if (s.getTitle() != null) h.put("title", s.getTitle()); sm.put("heading", h); sm.put("summary", s.getSummary()); List<Map<String, Object>> dl = new ArrayList<>(); for (Dialogue d : s.getDialogues()) { Map<String, Object> dm = new LinkedHashMap<>(); dm.put("character", d.getCharacterName()); dm.put("text", d.getText()); if (d.getDirection() != null) dm.put("direction", d.getDirection()); dl.add(dm); } sm.put("dialogues", dl); List<String> al = new ArrayList<>(); for (Action a : s.getActions()) al.add(a.getDescription()); sm.put("actions", al); sl.add(sm); } r.put("scenes", sl);
        return r;
    }

    @SuppressWarnings("unchecked")
    private ScreenplayDTO buildDTOFromMap(Map<String, Object> r, Long nid) {
        log.info("YAML 根键: {}, scenes 类型: {}", r.keySet(), r.get("scenes") == null ? "null" : r.get("scenes").getClass().getSimpleName());
        ScreenplayDTO d = ScreenplayDTO.builder().novelId(nid).status("DRAFT").build();
        Object spObj = r.get("screenplay"); if (spObj != null && !(spObj instanceof Map)) throw new RuntimeException("YAML 中 screenplay 字段格式错误，需要是 Map 类型"); Map<String, Object> m = (Map<String, Object>) spObj; if (m != null) { d.setTitle((String) m.getOrDefault("title", "未命名")); d.setSubtitle((String) m.get("subtitle")); d.setSourceChapters((String) m.get("source_chapters")); }
        List<ScreenplayDTO.CharacterDTO> cs = new ArrayList<>(); Object co = r.get("characters"); if (co instanceof List) for (Object o : (List<?>) co) { Map<String, Object> cm = (Map<String, Object>) o; cs.add(ScreenplayDTO.CharacterDTO.builder().name((String) cm.get("name")).description((String) cm.get("description")).traits((String) cm.get("traits")).characterType((String) cm.getOrDefault("type", "SUPPORTING")).build()); } d.setCharacters(cs);
        List<ScreenplayDTO.SceneDTO> ss = new ArrayList<>(); Object so = r.get("scenes"); if (so == null && m != null) so = m.get("scenes"); if (so instanceof List) { int sn = 0; for (Object o : (List<?>) so) { Map<String, Object> sm = (Map<String, Object>) o; sn++; Map<String, Object> hd = (Map<String, Object>) sm.get("heading"); String st = "INT", lc = "", td = "DAY", stl = null; if (hd != null) { st = (String) hd.getOrDefault("setting", "INT"); lc = (String) hd.getOrDefault("location", ""); td = (String) hd.getOrDefault("time_of_day", "DAY"); stl = (String) hd.get("title"); } List<ScreenplayDTO.DialogueDTO> ds = new ArrayList<>(); Object dobj = sm.get("dialogues"); if (dobj instanceof List) { int dq = 0; for (Object dob : (List<?>) dobj) { Map<String, Object> dm = (Map<String, Object>) dob; ds.add(ScreenplayDTO.DialogueDTO.builder().characterName((String) dm.get("character")).text((String) dm.get("text")).direction((String) dm.get("direction")).sequence(dq++).build()); } } List<ScreenplayDTO.ActionDTO> as = new ArrayList<>(); Object aobj = sm.get("actions"); if (aobj instanceof List) { int aq = 0; for (Object ao : (List<?>) aobj) { as.add(ScreenplayDTO.ActionDTO.builder().description(ao.toString()).sequence(aq++).build()); } } Object cp = sm.get("characters_present"); String cl = cp instanceof List ? String.join(",", (List<String>) cp) : ""; ss.add(ScreenplayDTO.SceneDTO.builder().sceneNumber(((Number) sm.getOrDefault("scene_number", sn)).intValue()).title(stl).setting(st).location(lc).timeOfDay(td).summary((String) sm.get("summary")).characterList(cl).dialogues(ds).actions(as).build()); } } d.setScenes(ss); return d;
    }

    private Map<String, Object> buildYamlFromDTO(ScreenplayDTO dto) {
        Map<String, Object> r = new LinkedHashMap<>(); Map<String, Object> m = new LinkedHashMap<>(); m.put("title", dto.getTitle()); m.put("subtitle", dto.getSubtitle()); m.put("version", dto.getVersion()); m.put("status", dto.getStatus()); m.put("source_chapters", dto.getSourceChapters()); r.put("screenplay", m);
        List<Map<String, Object>> cl = new ArrayList<>(); if (dto.getCharacters() != null) for (var c : dto.getCharacters()) { Map<String, Object> cm = new LinkedHashMap<>(); cm.put("name", c.getName()); cm.put("description", c.getDescription()); cm.put("traits", c.getTraits()); cm.put("type", c.getCharacterType()); cl.add(cm); } r.put("characters", cl);
        List<Map<String, Object>> sl = new ArrayList<>(); if (dto.getScenes() != null) for (var s : dto.getScenes()) { Map<String, Object> sm = new LinkedHashMap<>(); sm.put("scene_number", s.getSceneNumber()); Map<String, Object> h = new LinkedHashMap<>(); h.put("setting", s.getSetting()); h.put("location", s.getLocation()); h.put("time_of_day", s.getTimeOfDay()); if (s.getTitle() != null) h.put("title", s.getTitle()); sm.put("heading", h); sm.put("summary", s.getSummary()); List<Map<String, Object>> dl = new ArrayList<>(); if (s.getDialogues() != null) for (var d : s.getDialogues()) { Map<String, Object> dm = new LinkedHashMap<>(); dm.put("character", d.getCharacterName()); dm.put("text", d.getText()); if (d.getDirection() != null) dm.put("direction", d.getDirection()); dl.add(dm); } sm.put("dialogues", dl); List<String> al = new ArrayList<>(); if (s.getActions() != null) for (var a : s.getActions()) al.add(a.getDescription()); sm.put("actions", al); sl.add(sm); } r.put("scenes", sl);
        return r;
    }
}
