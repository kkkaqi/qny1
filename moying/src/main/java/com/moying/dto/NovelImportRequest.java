package com.moying.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NovelImportRequest {
    @NotBlank @Size(max = 500) private String title;
    @Size(max = 200) private String author;
    @Size(max = 2000) private String summary;
    @NotEmpty private List<ChapterDTO> chapters;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ChapterDTO {
        @NotBlank @Size(max = 500) private String title;
        @NotBlank private String content;
    }
}
