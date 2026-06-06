package com.moying.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "screenplays")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Screenplay {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "novel_id", nullable = false)
    private Novel novel;
    @NotBlank @Column(nullable = false, length = 500)
    private String title;
    @Column(length = 1000) private String subtitle;
    @Column(nullable = false) @Builder.Default private Integer version = 1;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) @Builder.Default
    private ScreenplayStatus status = ScreenplayStatus.DRAFT;
    @Column(name = "source_chapters", length = 200) private String sourceChapters;
    @Column(name = "yaml_content", columnDefinition = "MEDIUMTEXT") private String yamlContent;
    @OneToMany(mappedBy = "screenplay", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("sceneNumber ASC") @Builder.Default
    private List<Scene> scenes = new ArrayList<>();
    @OneToMany(mappedBy = "screenplay", cascade = CascadeType.ALL, orphanRemoval = true) @Builder.Default
    private List<Character> characters = new ArrayList<>();
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at") private LocalDateTime updatedAt;
    public void addScene(Scene scene) { scenes.add(scene); scene.setScreenplay(this); }
    public void addCharacter(Character character) { characters.add(character); character.setScreenplay(this); }
    public enum ScreenplayStatus { DRAFT, REVIEW, POLISHED, FINAL }
}
