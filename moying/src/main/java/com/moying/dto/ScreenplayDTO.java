package com.moying.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ScreenplayDTO {
    private Long id; private Long novelId; private String title;
    private String subtitle; private Integer version; private String status;
    private String sourceChapters; private String yamlContent;
    private LocalDateTime createdAt; private LocalDateTime updatedAt;
    private List<SceneDTO> scenes; private List<CharacterDTO> characters;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SceneDTO {
        private Long id; private Integer sceneNumber; private String title;
        private String setting; private String location; private String timeOfDay;
        private String summary; private String characterList;
        private List<DialogueDTO> dialogues; private List<ActionDTO> actions;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DialogueDTO {
        private Long id; private String characterName; private String text;
        private String direction; private Integer sequence;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ActionDTO {
        private Long id; private String description; private Integer sequence;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CharacterDTO {
        private Long id; private String name; private String description;
        private String traits; private String characterType;
    }
}
