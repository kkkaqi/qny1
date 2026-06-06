package com.moying.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "dialogues")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Dialogue {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "scene_id", nullable = false) @JsonIgnore
    private Scene scene;
    @Column(name = "character_name", nullable = false, length = 200) private String characterName;
    @Column(columnDefinition = "TEXT", nullable = false) private String text;
    @Column(length = 500) private String direction;
    @Column(nullable = false) private Integer sequence;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
}
