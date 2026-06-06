package com.moying.controller;

import com.moying.dto.ApiResponse;
import com.moying.dto.ConversionRequest;
import com.moying.dto.NovelImportRequest;
import com.moying.dto.ScreenplayDTO;
import com.moying.entity.Novel;
import com.moying.service.NovelService;
import com.moying.service.ScreenplayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/novels")
@RequiredArgsConstructor
public class NovelController {

    private final NovelService novelService;
    private final ScreenplayService screenplayService;

    @PostMapping("/import")
    public ResponseEntity<ApiResponse<Novel>> importNovel(@Valid @RequestBody NovelImportRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("小说导入成功", novelService.importNovel(req)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Novel>>> listNovels() {
        return ResponseEntity.ok(ApiResponse.ok(novelService.listAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Novel>> getNovel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(novelService.getByIdWithChapters(id)));
    }

    @PostMapping("/{id}/chapters")
    public ResponseEntity<ApiResponse<Novel>> addChapters(@PathVariable Long id, @Valid @RequestBody List<NovelImportRequest.ChapterDTO> chapters) {
        return ResponseEntity.ok(ApiResponse.ok("章节添加成功", novelService.addChapters(id, chapters)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNovel(@PathVariable Long id) {
        novelService.deleteNovel(id); return ResponseEntity.ok(ApiResponse.ok("删除成功", null));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<ApiResponse<ScreenplayDTO>> convert(@PathVariable Long id, @Valid @RequestBody ConversionRequest req) {
        req.setNovelId(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("剧本转换成功", screenplayService.convert(req)));
    }

    @GetMapping("/{id}/screenplays")
    public ResponseEntity<ApiResponse<List<ScreenplayDTO>>> getScreenplays(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(screenplayService.getByNovelId(id)));
    }
}
