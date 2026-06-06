package com.moying.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "chapters", uniqueConstraints = {@UniqueConstraint(columnNames = {"novel_id", "chapter_number"})})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Chapter {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "novel_id", nullable = false)
    private Novel novel;
    @Min(1) @Column(name = "chapter_number", nullable = false)
    private Integer chapterNumber;
    @NotBlank @Column(nullable = false, length = 500)
    private String title;
    @NotBlank @Column(columnDefinition = "MEDIUMTEXT", nullable = false)
    private String content;
    @Column(name = "word_count")
    private Integer wordCount;
    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @PrePersist @PreUpdate
    public void calculateWordCount() { if (content != null) this.wordCount = content.length(); }
}
