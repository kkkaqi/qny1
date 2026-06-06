package com.moying.service;

import com.moying.dto.NovelImportRequest;
import com.moying.entity.Chapter;
import com.moying.entity.Novel;
import com.moying.repository.NovelRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j @Service @RequiredArgsConstructor @Transactional
public class NovelService {
    private final NovelRepository novelRepo;

    public Novel importNovel(NovelImportRequest req) {
        Novel n = Novel.builder().title(req.getTitle()).author(req.getAuthor()).summary(req.getSummary()).status(Novel.NovelStatus.PENDING).build();
        if (req.getChapters() != null) { int cn = 1; for (var c : req.getChapters()) n.addChapter(Chapter.builder().chapterNumber(cn++).title(c.getTitle()).content(c.getContent()).build()); }
        n.refreshChapterCount(); n = novelRepo.save(n);
        log.info("小说导入: id={}, title={}, chapters={}", n.getId(), n.getTitle(), n.getTotalChapters());
        return n;
    }

    public Novel addChapters(Long id, List<NovelImportRequest.ChapterDTO> cds) {
        Novel n = novelRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("小说不存在: " + id));
        int nn = n.getTotalChapters() + 1;
        for (var c : cds) n.addChapter(Chapter.builder().chapterNumber(nn++).title(c.getTitle()).content(c.getContent()).build());
        n.refreshChapterCount(); return novelRepo.save(n);
    }

    @Transactional(readOnly = true)
    public Novel getById(Long id) { return novelRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("小说不存在: " + id)); }

    @Transactional(readOnly = true)
    public Novel getByIdWithChapters(Long id) { Novel n = novelRepo.findByIdWithChapters(id); if (n == null) throw new EntityNotFoundException("小说不存在: " + id); return n; }

    @Transactional(readOnly = true)
    public List<Novel> listAll() { return novelRepo.findAllByOrderByUpdatedAtDesc(); }

    public void deleteNovel(Long id) { if (!novelRepo.existsById(id)) throw new EntityNotFoundException("小说不存在: " + id); novelRepo.deleteById(id); }
}
