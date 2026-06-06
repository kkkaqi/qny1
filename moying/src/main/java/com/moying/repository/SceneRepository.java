package com.moying.repository;

import com.moying.entity.Scene;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SceneRepository extends JpaRepository<Scene, Long> {
    List<Scene> findByScreenplayIdOrderBySceneNumberAsc(Long screenplayId);
    void deleteByScreenplayId(Long screenplayId);
}
