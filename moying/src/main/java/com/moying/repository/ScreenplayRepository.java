package com.moying.repository;

import com.moying.entity.Screenplay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScreenplayRepository extends JpaRepository<Screenplay, Long> {
    List<Screenplay> findByNovelIdOrderByVersionDesc(Long novelId);
    Optional<Screenplay> findTopByNovelIdOrderByVersionDesc(Long novelId);
}
