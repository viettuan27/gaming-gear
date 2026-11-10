package com.tuanviet.gaminggear.entity.cms;

import com.tuanviet.gaminggear.entity.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.JoinTable;
import jakarta.persistence.JoinColumn;
import com.tuanviet.gaminggear.entity.catalog.Product;
import com.tuanviet.gaminggear.entity.catalog.Category;
import java.util.Set;
import java.util.HashSet;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "cms_promotions")
@Getter
@Setter
@NoArgsConstructor
public class Promotion extends AuditableEntity {

    @ManyToMany
    @JoinTable(name = "cms_promotion_products", joinColumns = @JoinColumn(name = "promotion_id"), inverseJoinColumns = @JoinColumn(name = "product_id"))
    private Set<Product> products = new HashSet<>();

    @ManyToMany
    @JoinTable(name = "cms_promotion_categories", joinColumns = @JoinColumn(name = "promotion_id"), inverseJoinColumns = @JoinColumn(name = "category_id"))
    private Set<Category> categories = new HashSet<>();

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 200)
    private String slug;

    @Column(length = 500)
    private String excerpt;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "cover_image_object_key", length = 500)
    private String coverImageObjectKey;

    @Column(name = "meta_title", length = 160)
    private String metaTitle;

    @Column(name = "meta_description", length = 300)
    private String metaDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ContentStatus status = ContentStatus.DRAFT;

    @Column(name = "published_at")
    private Instant publishedAt;
}