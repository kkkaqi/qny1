package com.moying.repository;

import com.moying.entity.Novel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NovelRepository extends JpaRepository<Novel, Long> {
    List<Novel> findAllByOrderByUpdatedAtDesc();
    @Query("SELECT n FROM Novel n LEFT JOIN FETCH n.chapters WHERE n.id = :id")
    Novel findByIdWithChapters(Long id);
}
