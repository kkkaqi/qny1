package com.moying.controller;

import com.moying.dto.ApiResponse;
import com.moying.dto.ScreenplayDTO;
import com.moying.service.ScreenplayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/screenplays")
@RequiredArgsConstructor
public class ScreenplayController {

    private final ScreenplayService screenplayService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ScreenplayDTO>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(screenplayService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ScreenplayDTO>> update(@PathVariable Long id, @RequestParam(required = false) String title, @RequestParam(required = false) String subtitle) {
        return ResponseEntity.ok(ApiResponse.ok("更新成功", screenplayService.updateMeta(id, title, subtitle)));
    }

    @PutMapping("/{spId}/scenes/{scId}")
    public ResponseEntity<ApiResponse<ScreenplayDTO>> updateScene(@PathVariable Long spId, @PathVariable Long scId, @RequestBody ScreenplayDTO.SceneDTO sd) {
        return ResponseEntity.ok(ApiResponse.ok("场景更新成功", screenplayService.updateScene(spId, scId, sd)));
    }

    @PostMapping("/{spId}/scenes")
    public ResponseEntity<ApiResponse<ScreenplayDTO>> addScene(@PathVariable Long spId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("场景已添加", screenplayService.addScene(spId)));
    }

    @DeleteMapping("/{spId}/scenes/{scId}")
    public ResponseEntity<ApiResponse<ScreenplayDTO>> deleteScene(@PathVariable Long spId, @PathVariable Long scId) {
        return ResponseEntity.ok(ApiResponse.ok("场景已删除", screenplayService.deleteScene(spId, scId)));
    }

    @PostMapping("/{spId}/scenes/{scId}/dialogues")
    public ResponseEntity<ApiResponse<ScreenplayDTO>> addDialogue(@PathVariable Long spId, @PathVariable Long scId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("对白已添加", screenplayService.addDialogue(spId, scId,
                body.get("characterName"), body.get("text"), body.get("direction"))));
    }

    @DeleteMapping("/{spId}/dialogues/{dId}")
    public ResponseEntity<ApiResponse<ScreenplayDTO>> deleteDialogue(@PathVariable Long spId, @PathVariable Long dId) {
        return ResponseEntity.ok(ApiResponse.ok("对白已删除", screenplayService.deleteDialogue(spId, dId)));
    }

    @PostMapping("/{spId}/scenes/{scId}/actions")
    public ResponseEntity<ApiResponse<ScreenplayDTO>> addAction(@PathVariable Long spId, @PathVariable Long scId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("动作已添加", screenplayService.addAction(spId, scId, body.get("description"))));
    }

    @DeleteMapping("/{spId}/actions/{aId}")
    public ResponseEntity<ApiResponse<ScreenplayDTO>> deleteAction(@PathVariable Long spId, @PathVariable Long aId) {
        return ResponseEntity.ok(ApiResponse.ok("动作已删除", screenplayService.deleteAction(spId, aId)));
    }

    @PutMapping("/{spId}/characters/{chId}")
    public ResponseEntity<ApiResponse<ScreenplayDTO>> updateCharacter(@PathVariable Long spId, @PathVariable Long chId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("角色已更新", screenplayService.updateCharacter(spId, chId,
                body.get("name"), body.get("description"), body.get("traits"), body.get("characterType"))));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<String> exportYaml(@PathVariable Long id) {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=screenplay-" + id + ".yaml").contentType(MediaType.parseMediaType("application/x-yaml")).body(screenplayService.exportYaml(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        screenplayService.deleteScreenplay(id); return ResponseEntity.ok(ApiResponse.ok("删除成功", null));
    }
}
