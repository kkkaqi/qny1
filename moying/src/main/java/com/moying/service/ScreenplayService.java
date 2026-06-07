package com.moying.service;

import com.moying.dto.ConversionRequest;
import com.moying.dto.ScreenplayDTO;
import com.moying.entity.*;
import com.moying.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j @Service @RequiredArgsConstructor @Transactional
public class ScreenplayService {

    private final ScreenplayRepository screenplayRepo;
    private final SceneRepository sceneRepo;
    private final NovelRepository novelRepo;
    private final ConversionService conversionService;
    private final YamlService yamlService;
    private final DialogueRepository dialogueRepo;
    private final ActionRepository actionRepo;
    private final CharacterRepository characterRepo;

    public ScreenplayDTO convert(ConversionRequest req) {
        Novel n = novelRepo.findById(req.getNovelId()).orElseThrow(() -> new EntityNotFoundException("小说不存在: " + req.getNovelId()));
        n.setStatus(Novel.NovelStatus.PROCESSING); novelRepo.save(n);
        try {
            ScreenplayDTO dto = conversionService.convertNovelToScreenplay(n, req.getChapterNumbers(), req.getCustomInstruction());
            Screenplay sp = dtoToEntity(dto, n); sp = screenplayRepo.save(sp);
            sp.setYamlContent(yamlService.toYaml(sp)); screenplayRepo.save(sp);
            n.setStatus(Novel.NovelStatus.COMPLETED); novelRepo.save(n);
            return entityToDTO(sp);
        } catch (Exception e) { n.setStatus(Novel.NovelStatus.FAILED); novelRepo.save(n); throw new RuntimeException("转换失败: " + e.getMessage(), e); }
    }

    @Transactional(readOnly = true)
    public ScreenplayDTO getById(Long id) { return entityToDTO(loadWithCollections(id)); }

    @Transactional(readOnly = true)
    public List<ScreenplayDTO> getByNovelId(Long nid) { return screenplayRepo.findByNovelIdOrderByVersionDesc(nid).stream().map(sp -> entityToDTO(loadCollections(sp))).collect(Collectors.toList()); }

    public ScreenplayDTO updateMeta(Long id, String title, String subtitle) { Screenplay sp = screenplayRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("剧本不存在: " + id)); if (title != null) sp.setTitle(title); if (subtitle != null) sp.setSubtitle(subtitle); screenplayRepo.save(sp); return entityToDTO(sp); }

    public ScreenplayDTO updateScene(Long spId, Long scId, ScreenplayDTO.SceneDTO sd) { Scene sc = sceneRepo.findById(scId).orElseThrow(() -> new EntityNotFoundException("场景不存在: " + scId)); if (sd.getTitle() != null) sc.setTitle(sd.getTitle()); if (sd.getSetting() != null) sc.setSetting(sd.getSetting()); if (sd.getLocation() != null) sc.setLocation(sd.getLocation()); if (sd.getTimeOfDay() != null) sc.setTimeOfDay(sd.getTimeOfDay()); if (sd.getSummary() != null) sc.setSummary(sd.getSummary()); sceneRepo.save(sc); refreshYaml(spId); return getById(spId); }

    @Transactional(readOnly = true)
    public String exportYaml(Long id) { return yamlService.toYaml(loadWithCollections(id)); }

    private void refreshYaml(Long id) { Screenplay sp = loadWithCollections(id); if (sp != null) { sp.setYamlContent(yamlService.toYaml(sp)); screenplayRepo.save(sp); } }

    /** 加载剧本并初始化所有懒加载集合，避免 MultipleBagFetchException */
    private Screenplay loadWithCollections(Long id) {
        Screenplay sp = screenplayRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("剧本不存在: " + id));
        return loadCollections(sp);
    }

    private Screenplay loadCollections(Screenplay sp) {
        if (sp != null) {
            sp.getScenes().size();
            sp.getCharacters().size();
            for (Scene s : sp.getScenes()) { s.getDialogues().size(); s.getActions().size(); }
        }
        return sp;
    }

    /** 更新角色信息 */
    public ScreenplayDTO updateCharacter(Long screenplayId, Long characterId, String name, String description, String traits, String characterType) {
        com.moying.entity.Character ch = characterRepo.findById(characterId)
                .orElseThrow(() -> new EntityNotFoundException("角色不存在: " + characterId));
        if (name != null) ch.setName(name);
        if (description != null) ch.setDescription(description);
        if (traits != null) ch.setTraits(traits);
        if (characterType != null) ch.setCharacterType(characterType);
        characterRepo.save(ch);
        refreshYaml(screenplayId);
        return getById(screenplayId);
    }

    public void deleteScreenplay(Long id) {
        if (!screenplayRepo.existsById(id)) {
            throw new EntityNotFoundException("剧本不存在: " + id);
        }
        screenplayRepo.deleteById(id);
    }

    /** 添加新场景 */
    public ScreenplayDTO addScene(Long screenplayId) {
        Screenplay sp = screenplayRepo.findById(screenplayId)
                .orElseThrow(() -> new EntityNotFoundException("剧本不存在: " + screenplayId));
        int nextNum = sp.getScenes().stream().mapToInt(Scene::getSceneNumber).max().orElse(0) + 1;
        Scene scene = Scene.builder().screenplay(sp).sceneNumber(nextNum)
                .setting("INT").location("").timeOfDay("DAY").build();
        sp.addScene(scene);
        screenplayRepo.save(sp);
        refreshYaml(screenplayId);
        return getById(screenplayId);
    }

    /** 删除场景 */
    public ScreenplayDTO deleteScene(Long screenplayId, Long sceneId) {
        Screenplay sp = screenplayRepo.findById(screenplayId)
                .orElseThrow(() -> new EntityNotFoundException("剧本不存在: " + screenplayId));
        Scene scene = sceneRepo.findById(sceneId)
                .orElseThrow(() -> new EntityNotFoundException("场景不存在: " + sceneId));
        sp.getScenes().remove(scene);
        screenplayRepo.save(sp);
        refreshYaml(screenplayId);
        return getById(screenplayId);
    }

    /** 添加对白 */
    public ScreenplayDTO addDialogue(Long screenplayId, Long sceneId, String characterName, String text, String direction) {
        Scene scene = sceneRepo.findById(sceneId)
                .orElseThrow(() -> new EntityNotFoundException("场景不存在: " + sceneId));
        int seq = scene.getDialogues().stream().mapToInt(Dialogue::getSequence).max().orElse(-1) + 1;
        Dialogue d = Dialogue.builder().scene(scene).characterName(characterName).text(text)
                .direction(direction).sequence(seq).build();
        scene.addDialogue(d);
        sceneRepo.save(scene);
        refreshYaml(screenplayId);
        return getById(screenplayId);
    }

    /** 删除对白 */
    public ScreenplayDTO deleteDialogue(Long screenplayId, Long dialogueId) {
        Dialogue dialogue = dialogueRepo.findById(dialogueId)
                .orElseThrow(() -> new EntityNotFoundException("对白不存在: " + dialogueId));
        Scene scene = dialogue.getScene();
        scene.getDialogues().remove(dialogue);
        dialogueRepo.delete(dialogue);
        refreshYaml(screenplayId);
        return getById(screenplayId);
    }

    /** 添加动作 */
    public ScreenplayDTO addAction(Long screenplayId, Long sceneId, String description) {
        Scene scene = sceneRepo.findById(sceneId)
                .orElseThrow(() -> new EntityNotFoundException("场景不存在: " + sceneId));
        int seq = scene.getActions().stream().mapToInt(Action::getSequence).max().orElse(-1) + 1;
        Action a = Action.builder().scene(scene).description(description).sequence(seq).build();
        scene.addAction(a);
        sceneRepo.save(scene);
        refreshYaml(screenplayId);
        return getById(screenplayId);
    }

    /** 删除动作 */
    public ScreenplayDTO deleteAction(Long screenplayId, Long actionId) {
        Action action = actionRepo.findById(actionId)
                .orElseThrow(() -> new EntityNotFoundException("动作不存在: " + actionId));
        Scene scene = action.getScene();
        scene.getActions().remove(action);
        actionRepo.delete(action);
        refreshYaml(screenplayId);
        return getById(screenplayId);
    }

    private Screenplay dtoToEntity(ScreenplayDTO dto, Novel n) {
        Screenplay sp = Screenplay.builder().novel(n).title(dto.getTitle() != null ? dto.getTitle() : n.getTitle()).subtitle(dto.getSubtitle()).version(nextVersion(n.getId())).status(Screenplay.ScreenplayStatus.DRAFT).sourceChapters(dto.getSourceChapters()).build();
        if (dto.getScenes() != null) for (var sd : dto.getScenes()) { Scene sc = Scene.builder().screenplay(sp).sceneNumber(sd.getSceneNumber()).title(sd.getTitle()).setting(sd.getSetting()).location(sd.getLocation()).timeOfDay(sd.getTimeOfDay()).summary(sd.getSummary()).characterList(sd.getCharacterList()).build(); if (sd.getDialogues() != null) for (var dd : sd.getDialogues()) sc.addDialogue(Dialogue.builder().scene(sc).characterName(dd.getCharacterName()).text(dd.getText()).direction(dd.getDirection()).sequence(dd.getSequence()).build()); if (sd.getActions() != null) for (var ad : sd.getActions()) sc.addAction(Action.builder().scene(sc).description(ad.getDescription()).sequence(ad.getSequence()).build()); sp.addScene(sc); }
        if (dto.getCharacters() != null) for (var cd : dto.getCharacters()) sp.addCharacter(com.moying.entity.Character.builder().screenplay(sp).name(cd.getName()).description(cd.getDescription()).traits(cd.getTraits()).characterType(cd.getCharacterType()).build());
        return sp;
    }

    private ScreenplayDTO entityToDTO(Screenplay sp) {
        ScreenplayDTO dto = ScreenplayDTO.builder().id(sp.getId()).novelId(sp.getNovel().getId()).title(sp.getTitle()).subtitle(sp.getSubtitle()).version(sp.getVersion()).status(sp.getStatus().name()).sourceChapters(sp.getSourceChapters()).yamlContent(sp.getYamlContent()).createdAt(sp.getCreatedAt()).updatedAt(sp.getUpdatedAt()).build();
        log.info("剧本 id={} version={} sourceChapters={} scenes={}", sp.getId(), sp.getVersion(), sp.getSourceChapters(), sp.getScenes().size());
        if (sp.getScenes() != null) dto.setScenes(sp.getScenes().stream().sorted(Comparator.comparing(Scene::getSceneNumber)).map(s -> ScreenplayDTO.SceneDTO.builder().id(s.getId()).sceneNumber(s.getSceneNumber()).title(s.getTitle()).setting(s.getSetting()).location(s.getLocation()).timeOfDay(s.getTimeOfDay()).summary(s.getSummary()).characterList(s.getCharacterList()).dialogues(s.getDialogues().stream().sorted(Comparator.comparing(Dialogue::getSequence)).map(d -> ScreenplayDTO.DialogueDTO.builder().id(d.getId()).characterName(d.getCharacterName()).text(d.getText()).direction(d.getDirection()).sequence(d.getSequence()).build()).collect(Collectors.toList())).actions(s.getActions().stream().sorted(Comparator.comparing(Action::getSequence)).map(a -> ScreenplayDTO.ActionDTO.builder().id(a.getId()).description(a.getDescription()).sequence(a.getSequence()).build()).collect(Collectors.toList())).build()).collect(Collectors.toList()));
        if (sp.getCharacters() != null) dto.setCharacters(sp.getCharacters().stream().map(c -> ScreenplayDTO.CharacterDTO.builder().id(c.getId()).name(c.getName()).description(c.getDescription()).traits(c.getTraits()).characterType(c.getCharacterType()).build()).collect(Collectors.toList()));
        return dto;
    }

    private int nextVersion(Long nid) { return screenplayRepo.findTopByNovelIdOrderByVersionDesc(nid).map(s -> s.getVersion() + 1).orElse(1); }
}
