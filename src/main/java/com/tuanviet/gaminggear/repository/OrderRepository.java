package com.tuanviet.gaminggear.repository;

import com.tuanviet.gaminggear.entity.order.Order;
import com.tuanviet.gaminggear.entity.order.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByIdAndUserId(Long orderId, Long userId);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    long countByStatus(OrderStatus status);

    @Query("""
            select coalesce(sum(o.totalAmount), 0)
            from Order o
            where o.status = :status
            """)
    BigDecimal sumTotalAmountByStatus(@Param("status") OrderStatus status);

    @Query("""
            select orderItem.variant.id
            from OrderItem orderItem
            where orderItem.order.id = :orderId
""")
    List<Long> findVariantIdsByOrderId(@Param("orderId") Long orderId);

    @Query("""
            select orderItem.variant.id
            from OrderItem orderItem
            where orderItem.order.id = :orderId
                and orderItem.order.user.id = :userId
""")
    List<Long> findVariantIdsByOrderIdAndUserId(
            @Param("orderId") Long orderId,
            @Param("userId") Long userId
    );
}
