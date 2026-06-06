package com.moying.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "characters")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Character {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "screenplay_id", nullable = false) @JsonIgnore
    private Screenplay screenplay;
    @Column(nullable = false, length = 200) private String name;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(length = 500) private String traits;
    @Column(name = "character_type", length = 30) private String characterType;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
}
