package com.moying.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ConversionRequest {
    @NotNull private Long novelId;
    private List<Integer> chapterNumbers;
    @Builder.Default private String mode = "AI";
    private String customInstruction;
}
