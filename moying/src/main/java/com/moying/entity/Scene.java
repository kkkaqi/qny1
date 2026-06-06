package com.moying.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "scenes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Scene {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "screenplay_id", nullable = false) @JsonIgnore
    private Screenplay screenplay;
    @Column(name = "scene_number", nullable = false) private Integer sceneNumber;
    @Column(length = 500) private String title;
    @Column(length = 20) private String setting;
    @Column(length = 500) private String location;
    @Column(name = "time_of_day", length = 20) private String timeOfDay;
    @Column(columnDefinition = "TEXT") private String summary;
    @Column(name = "character_list", length = 1000) private String characterList;
    @OneToMany(mappedBy = "scene", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("sequence ASC") @Builder.Default
    private List<Dialogue> dialogues = new ArrayList<>();
    @OneToMany(mappedBy = "scene", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("sequence ASC") @Builder.Default
    private List<Action> actions = new ArrayList<>();
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    public void addDialogue(Dialogue d) { dialogues.add(d); d.setScene(this); }
    public void addAction(Action a) { actions.add(a); a.setScene(this); }
}
