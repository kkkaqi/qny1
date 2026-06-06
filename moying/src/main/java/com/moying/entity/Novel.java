package com.moying.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "novels")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Novel {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Column(nullable = false, length = 500)
    private String title;

    @Size(max = 200) @Column(length = 200)
    private String author;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "total_chapters")
    private Integer totalChapters;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20) @Builder.Default
    private NovelStatus status = NovelStatus.PENDING;

    @OneToMany(mappedBy = "novel", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("chapterNumber ASC") @Builder.Default
    private List<Chapter> chapters = new ArrayList<>();

    @OneToMany(mappedBy = "novel", cascade = CascadeType.ALL, fetch = FetchType.LAZY) @Builder.Default
    private List<Screenplay> screenplays = new ArrayList<>();

    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void addChapter(Chapter chapter) { chapters.add(chapter); chapter.setNovel(this); }
    public void refreshChapterCount() { this.totalChapters = this.chapters.size(); }

    public enum NovelStatus { PENDING, PROCESSING, COMPLETED, FAILED }
}
