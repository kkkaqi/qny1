package com.moying.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "actions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Action {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "scene_id", nullable = false) @JsonIgnore
    private Scene scene;
    @Column(columnDefinition = "TEXT", nullable = false) private String description;
    @Column(nullable = false) private Integer sequence;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
}
