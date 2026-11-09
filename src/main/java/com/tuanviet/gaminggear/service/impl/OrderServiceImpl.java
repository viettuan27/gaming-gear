package com.tuanviet.gaminggear.service.impl;

import com.tuanviet.gaminggear.dto.request.CreateOrderRequest;
import com.tuanviet.gaminggear.dto.request.UpdateOrderStatusRequest;
import com.tuanviet.gaminggear.dto.response.OrderResponse;
import com.tuanviet.gaminggear.dto.response.OrderStatisticsResponse;
import com.tuanviet.gaminggear.dto.response.OrderSummaryResponse;
import com.tuanviet.gaminggear.dto.response.PageResponse;
import com.tuanviet.gaminggear.entity.cart.Cart;
import com.tuanviet.gaminggear.entity.cart.CartItem;
import com.tuanviet.gaminggear.entity.catalog.Product;
import com.tuanviet.gaminggear.entity.catalog.ProductVariant;
import com.tuanviet.gaminggear.entity.order.Order;
import com.tuanviet.gaminggear.entity.order.OrderItem;
import com.tuanviet.gaminggear.entity.order.OrderStatus;
import com.tuanviet.gaminggear.entity.order.PaymentMethod;
import com.tuanviet.gaminggear.exception.BadRequestException;
import com.tuanviet.gaminggear.exception.ConflictException;
import com.tuanviet.gaminggear.exception.ResourceNotFoundException;
import com.tuanviet.gaminggear.mapper.OrderMapper;
import com.tuanviet.gaminggear.repository.CartItemRepository;
import com.tuanviet.gaminggear.repository.CartRepository;
import com.tuanviet.gaminggear.repository.OrderRepository;
import com.tuanviet.gaminggear.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private static final long LOCK_WAIT_SECONDS = 5;

    private final OrderTransactionService orderTransactionService;
    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderMapper orderMapper;
    private final RedissonClient redissonClient;

    @Override
    @CacheEvict(cacheNames = "product-detail", allEntries = true)
    public OrderResponse createOrder(Long userId, CreateOrderRequest request) {
        List<Long> variantIds = normalizeVariantIds(
                cartItemRepository.findProductVariantIdsByCartUserId(userId)
        );

        return executeWithLocks(
                getVariantLockNames(variantIds),
                () ->orderTransactionService.createOrder(
                        userId,
                        request,
                        variantIds
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> getMyOrders(Long userId, int page, int size, String sortDirection) {
        Pageable pageable = createPageable(page, size, sortDirection);

        Page<Order> orderPage = orderRepository.findByUserId(userId,pageable);

        return toPageResponse(orderPage);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderDetails(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId,userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));

        return orderMapper.toResponse(order);
    }

    @Override
    @CacheEvict(cacheNames = "product-detail", allEntries = true)
    public OrderResponse cancelOrder(Long userId, Long orderId) {
        List<Long> variantId = normalizeVariantIds(
                orderRepository.findVariantIdsByOrderIdAndUserId(orderId,userId));

        List<String> lockNames = new ArrayList<>();
        lockNames.add(getOrderLockName(orderId));
        lockNames.addAll(getVariantLockNames(variantId));
        return executeWithLocks(
                lockNames,
                () -> orderTransactionService.cancelOrder(userId,orderId)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> getAllOrders(OrderStatus status, int page, int size, String sortDirection) {
        Pageable pageable = createPageable(page, size, sortDirection);

        Page<Order> orderPage = status == null
                ? orderRepository.findAll(pageable)
                : orderRepository.findByStatus(status,pageable);
        return toPageResponse(orderPage);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderStatisticsResponse getAdminOrderStatistics() {
        OrderStatus completedStatus = OrderStatus.DELIVERED;

        return new OrderStatisticsResponse(
                orderRepository.sumTotalAmountByStatus(completedStatus),
                orderRepository.countByStatus(completedStatus)
        );
    }

    @Override
    @CacheEvict(cacheNames = "product-detail", allEntries = true)
    public OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request) {
        List<String> lockNames = new ArrayList<>();
        lockNames.add(getOrderLockName(orderId));

        if (request.status() == OrderStatus.CANCELLED){
            List<Long> variantIds = normalizeVariantIds(
                    orderRepository.findVariantIdsByOrderId(orderId)
            );

            lockNames.addAll(getVariantLockNames(variantIds));
        }

        return executeWithLocks(
                lockNames,
                () -> orderTransactionService.updateOrderStatus(orderId, request)
        );
    }

    private Pageable createPageable(int page, int size, String sortDirection){
        Sort sort = "asc".equalsIgnoreCase(sortDirection)
                ? Sort.by("createdAt").ascending()
                : Sort.by("createdAt").descending();
        return PageRequest.of(page,size,sort);
    }

    private PageResponse<OrderSummaryResponse> toPageResponse(Page<Order> orderPage){
        Page<OrderSummaryResponse> responsePage = orderPage
                .map(orderMapper::toSummaryResponse);

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages(),
                responsePage.isLast()
        );
    }


    private List<Long> normalizeVariantIds(List<Long> variantIds) {
        return variantIds.stream()
                .distinct()
                .sorted()
                .toList();
    }

    private String getLockStockName(Long variantId){
        return "lock:stock:variant:{"+variantId+"}";
    }

    private String getOrderLockName(Long orderId){
        return "lock:order:{"+orderId+"}";
    }

    private List<String> getVariantLockNames(List<Long> variantId){
        return variantId.stream()
                .map(this::getLockStockName)
                .toList();
    }

    private <T> T executeWithLocks(
            List<String> lockNames,
            Supplier<T> action
    ){
        List<RLock> locks = lockNames.stream()
                .distinct()
                .sorted()
                .map(redissonClient::getLock)
                .toList();

        try {
            for (RLock lock: locks){
                if(!lock.tryLock(LOCK_WAIT_SECONDS, TimeUnit.SECONDS)){
                    throw new ConflictException("Sản phẩm đang được xử lý, vui lòng thử lại");
                }
            }
            return action.get();
        } catch (InterruptedException e){
            Thread.currentThread().interrupt();

            throw new ConflictException("Yêu cầu đang được xử lý, vui lòng thử lại");
        } finally {
            for (int index=locks.size() - 1; index >= 0; index--){
                RLock lock = locks.get(index);
                if(lock.isHeldByCurrentThread()){
                    lock.unlock();
                }
            }
        }
    }


}
