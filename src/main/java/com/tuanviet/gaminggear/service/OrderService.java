package com.tuanviet.gaminggear.service;

import com.tuanviet.gaminggear.dto.request.CreateOrderRequest;
import com.tuanviet.gaminggear.dto.request.UpdateOrderStatusRequest;
import com.tuanviet.gaminggear.dto.response.OrderResponse;
import com.tuanviet.gaminggear.dto.response.OrderStatisticsResponse;
import com.tuanviet.gaminggear.dto.response.OrderSummaryResponse;
import com.tuanviet.gaminggear.dto.response.PageResponse;
import com.tuanviet.gaminggear.entity.order.Order;
import com.tuanviet.gaminggear.entity.order.OrderStatus;
import org.springframework.data.domain.Page;


public interface OrderService {
    OrderResponse createOrder(Long userId, CreateOrderRequest request);
    PageResponse<OrderSummaryResponse> getMyOrders(Long userId, int page, int size, String sortDirection);
    OrderResponse getOrderDetails(Long userId, Long orderId);
    OrderResponse cancelOrder(Long userId, Long orderId);

    PageResponse<OrderSummaryResponse> getAllOrders(OrderStatus status, int page, int size, String sortDirection);

    OrderStatisticsResponse getAdminOrderStatistics();

    OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request);

}
