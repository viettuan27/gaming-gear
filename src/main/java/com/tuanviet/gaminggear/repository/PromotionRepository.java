package com.tuanviet.gaminggear.repository;

import com.tuanviet.gaminggear.entity.cms.Promotion;
import com.tuanviet.gaminggear.entity.cms.ContentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion,Long> {

    boolean existsBySlugIgnoreCase(String slug);

    boolean existsBySlugIgnoreCaseAndIdNot(String slug, long id);

    Optional<Promotion> findBySlugIgnoreCaseAndStatus(
            String slug,
            ContentStatus status
    );

    Page<Promotion> findByStatus(
            ContentStatus status,
            Pageable pageable
    );
}
