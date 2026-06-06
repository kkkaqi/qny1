package com.moying.controller;

import com.moying.dto.ApiResponse;
import com.moying.dto.ScreenplayDTO;
import com.moying.service.ScreenplayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/{id}/export")
    public ResponseEntity<String> exportYaml(@PathVariable Long id) {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=screenplay-" + id + ".yaml").contentType(MediaType.parseMediaType("application/x-yaml")).body(screenplayService.exportYaml(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        screenplayService.deleteScreenplay(id); return ResponseEntity.ok(ApiResponse.ok("删除成功", null));
    }
}
