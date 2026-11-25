package com.tuanviet.gaminggear;

import com.tuanviet.gaminggear.dto.request.CreateOrderRequest;
import com.tuanviet.gaminggear.dto.response.OrderResponse;
import com.tuanviet.gaminggear.entity.auth.User;
import com.tuanviet.gaminggear.entity.cart.Cart;
import com.tuanviet.gaminggear.entity.cart.CartItem;
import com.tuanviet.gaminggear.entity.catalog.Brand;
import com.tuanviet.gaminggear.entity.catalog.Category;
import com.tuanviet.gaminggear.entity.catalog.Product;
import com.tuanviet.gaminggear.entity.catalog.ProductVariant;
import com.tuanviet.gaminggear.entity.order.Order;
import com.tuanviet.gaminggear.entity.order.OrderItem;
import com.tuanviet.gaminggear.entity.order.OrderStatus;
import com.tuanviet.gaminggear.entity.order.PaymentMethod;
import com.tuanviet.gaminggear.exception.BadRequestException;
import com.tuanviet.gaminggear.exception.ResourceNotFoundException;
import com.tuanviet.gaminggear.repository.*;
import com.tuanviet.gaminggear.service.OrderService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class OrderIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void cannotCreateOrderWhenCartIsEmpty() {
        // 1. Chuẩn bị người dùng và giỏ hàng trống
        User user = userRepository.save(new User(
                "checkout-" + UUID.randomUUID() + "@example.com",
                "test-password-hash",
                "Khách hàng test",
                null
        ));

        Cart cart = new Cart();
        cart.setUser(user);
        cartRepository.save(cart);

        CreateOrderRequest request = new CreateOrderRequest(
                "Người nhận test",
                "0901234567",
                "Hà Nội",
                null
        );

        // 2. Thực hiện checkout và mong đợi có lỗi
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> orderService.createOrder(user.getId(), request)
        );

        // 3. Kiểm tra nội dung lỗi và đơn hàng của người dùng
        assertEquals("Giỏ hàng đang trống", exception.getMessage());

        long totalOrders = orderRepository
                .findByUserId(user.getId(), PageRequest.of(0, 1))
                .getTotalElements();

        assertEquals(0L, totalOrders);
    }

    @Test
    void createOrderSuccessfullyAndUpdateStock() {
        // 1. Chuẩn bị người dùng
        Cart cart = createCartWithProduct(10, 2);

        Long userId = cart.getUser().getId();
        Long variantId = cart.getCartItems()
                .get(0)
                .getProductVariant()
                .getId();

        entityManager.flush();
        entityManager.clear();

        // 5. Thực hiện checkout
        CreateOrderRequest request = new CreateOrderRequest(
                "Người nhận test",
                "0901234567",
                "Hà Nội",
                null
        );

        OrderResponse response = orderService.createOrder(userId, request);

        assertNotNull(response.orderId());

        // 6. Đồng bộ và đọc lại dữ liệu để kiểm tra
        entityManager.flush();
        entityManager.clear();

        Order savedOrder = orderRepository
                .findByIdAndUserId(response.orderId(), userId)
                .orElseThrow();

        ProductVariant savedVariant = productVariantRepository
                .findById(variantId)
                .orElseThrow();

        Cart savedCart = cartRepository
                .findByUserId(userId)
                .orElseThrow();

        // 7. Kiểm tra đơn hàng
        assertEquals(OrderStatus.PENDING, savedOrder.getStatus());
        assertEquals(PaymentMethod.COD, savedOrder.getPaymentMethod());
        assertEquals(0, new BigDecimal("200000").compareTo(savedOrder.getTotalAmount()));

        assertEquals(1, savedOrder.getOrderItems().size());

        OrderItem savedItem = savedOrder.getOrderItems().get(0);

        assertEquals(variantId.longValue(), savedItem.getVariant().getId());
        assertEquals(2, savedItem.getQuantity().intValue());
        assertEquals(0, new BigDecimal("100000").compareTo(savedItem.getUnitPrice()));

        // 8. Kiểm tra tồn kho và giỏ hàng
        assertEquals(8, savedVariant.getStockQuantity());
        assertEquals(0, savedCart.getCartItems().size());
    }

    @Test
    void cannotCreateOrderWhenStockIsInsufficient() {
        Cart cart = createCartWithProduct(1, 2);

        Long userId = cart.getUser().getId();
        Long variantId = cart.getCartItems()
                .get(0)
                .getProductVariant()
                .getId();

        entityManager.flush();
        entityManager.clear();

        CreateOrderRequest request = new CreateOrderRequest(
                "Người nhận test",
                "0901234567",
                "Hà Nội",
                null
        );

        // 5. Thực hiện checkout và mong đợi có lỗi
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> orderService.createOrder(userId, request)
        );

        assertEquals("Số lượng còn lại không đủ", exception.getMessage());

        // 6. Đọc lại dữ liệu để kiểm tra
        entityManager.flush();
        entityManager.clear();

        ProductVariant savedVariant = productVariantRepository
                .findById(variantId)
                .orElseThrow();

        Cart savedCart = cartRepository
                .findByUserId(userId)
                .orElseThrow();

        long totalOrders = orderRepository
                .findByUserId(userId, PageRequest.of(0, 1))
                .getTotalElements();

        // 7. Tồn kho và giỏ hàng giữ nguyên, không có đơn hàng
        assertEquals(1, savedVariant.getStockQuantity());

        assertEquals(1, savedCart.getCartItems().size());
        assertEquals(2, savedCart.getCartItems().get(0).getQuantity().intValue());

        assertEquals(0L, totalOrders);
    }

    @Test
    void cancelPendingOrderRestoresStockOnlyOnce() {
        // 1. Tạo giỏ hàng: tồn kho 10, mua 2
        Cart cart = createCartWithProduct(10, 2);

        Long userId = cart.getUser().getId();
        Long variantId = cart.getCartItems()
                .get(0)
                .getProductVariant()
                .getId();

        entityManager.flush();
        entityManager.clear();

        CreateOrderRequest request = new CreateOrderRequest(
                "Người nhận test",
                "0901234567",
                "Hà Nội",
                null
        );

        // 2. Đặt hàng thành công
        OrderResponse createdOrder = orderService.createOrder(userId, request);
        Long orderId = createdOrder.orderId();

        entityManager.flush();
        entityManager.clear();

        ProductVariant variantAfterOrder = productVariantRepository
                .findById(variantId)
                .orElseThrow();

        assertEquals(8, variantAfterOrder.getStockQuantity());

        // 3. Hủy đơn hàng
        orderService.cancelOrder(userId, orderId);

        entityManager.flush();
        entityManager.clear();

        Order cancelledOrder = orderRepository
                .findByIdAndUserId(orderId, userId)
                .orElseThrow();

        ProductVariant variantAfterCancel = productVariantRepository
                .findById(variantId)
                .orElseThrow();

        Cart savedCart = cartRepository
                .findByUserId(userId)
                .orElseThrow();

        assertEquals(OrderStatus.CANCELLED, cancelledOrder.getStatus());
        assertEquals(10, variantAfterCancel.getStockQuantity());
        assertEquals(0, savedCart.getCartItems().size());

        // 4. Hủy lần thứ hai phải bị từ chối
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> orderService.cancelOrder(userId, orderId)
        );

        assertEquals(
                "Chỉ có thể hủy đơn hàng đang chờ xác nhận",
                exception.getMessage()
        );

        entityManager.flush();
        entityManager.clear();

        ProductVariant variantAfterSecondCancel = productVariantRepository
                .findById(variantId)
                .orElseThrow();

        assertEquals(10, variantAfterSecondCancel.getStockQuantity());
    }

    @Test
    void cannotViewOrCancelAnotherUsersOrder() {
        // 1. Tạo giỏ hàng của người dùng A
        Cart cart = createCartWithProduct(10, 2);

        Long ownerId = cart.getUser().getId();
        Long variantId = cart.getCartItems()
                .get(0)
                .getProductVariant()
                .getId();

        // 2. Tạo người dùng B
        User otherUser = userRepository.save(new User(
                "other-" + UUID.randomUUID() + "@example.com",
                "test-password-hash",
                "Khách hàng khác",
                null
        ));

        Long otherUserId = otherUser.getId();

        entityManager.flush();
        entityManager.clear();

        // 3. Người dùng A đặt hàng
        CreateOrderRequest request = new CreateOrderRequest(
                "Người nhận test",
                "0901234567",
                "Hà Nội",
                null
        );

        OrderResponse createdOrder = orderService.createOrder(ownerId, request);
        Long orderId = createdOrder.orderId();

        assertNotNull(orderId);

        entityManager.flush();
        entityManager.clear();

        // 4. Người dùng A xem được đơn hàng của mình
        OrderResponse ownerView = orderService.getOrderDetails(ownerId, orderId);

        assertEquals(orderId, ownerView.orderId());

        // 5. Người dùng B không được xem đơn hàng của A
        ResourceNotFoundException viewException = assertThrows(
                ResourceNotFoundException.class,
                () -> orderService.getOrderDetails(otherUserId, orderId)
        );

        assertEquals("Không tìm thấy đơn hàng", viewException.getMessage());

        // 6. Người dùng B không được hủy đơn hàng của A
        ResourceNotFoundException cancelException = assertThrows(
                ResourceNotFoundException.class,
                () -> orderService.cancelOrder(otherUserId, orderId)
        );

        assertEquals("Không tìm thấy đơn hàng", cancelException.getMessage());

        // 7. Kiểm tra đơn hàng và tồn kho không bị thay đổi
        entityManager.flush();
        entityManager.clear();

        Order savedOrder = orderRepository
                .findByIdAndUserId(orderId, ownerId)
                .orElseThrow();

        ProductVariant savedVariant = productVariantRepository
                .findById(variantId)
                .orElseThrow();

        assertEquals(OrderStatus.PENDING, savedOrder.getStatus());
        assertEquals(8, savedVariant.getStockQuantity());
    }

    private Cart createCartWithProduct(int stockQuantity, int quantity) {
        String unique = UUID.randomUUID().toString();

        User user = userRepository.save(new User(
                "checkout-" + unique + "@example.com",
                "test-password-hash",
                "Khách hàng test",
                null
        ));

        Category category = new Category();
        category.setName("Danh mục test " + unique);
        categoryRepository.save(category);

        Brand brand = new Brand();
        brand.setName("Thương hiệu test " + unique);
        brandRepository.save(brand);

        Product product = new Product();
        product.setName("Bàn phím test");
        product.setCategory(category);
        product.setBrand(brand);
        productRepository.save(product);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setName("Phiên bản test");
        variant.setSku("TEST-" + unique);
        variant.setPrice(new BigDecimal("100000"));
        variant.setStockQuantity(stockQuantity);
        productVariantRepository.save(variant);

        Cart cart = new Cart();
        cart.setUser(user);

        CartItem cartItem = new CartItem();
        cartItem.setCart(cart);
        cartItem.setProductVariant(variant);
        cartItem.setQuantity(quantity);

        cart.getCartItems().add(cartItem);

        return cartRepository.save(cart);
    }
}