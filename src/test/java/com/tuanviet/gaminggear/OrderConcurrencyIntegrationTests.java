package com.tuanviet.gaminggear;

import com.tuanviet.gaminggear.dto.request.CreateOrderRequest;
import com.tuanviet.gaminggear.entity.auth.User;
import com.tuanviet.gaminggear.entity.cart.Cart;
import com.tuanviet.gaminggear.entity.cart.CartItem;
import com.tuanviet.gaminggear.entity.catalog.Brand;
import com.tuanviet.gaminggear.entity.catalog.Category;
import com.tuanviet.gaminggear.entity.catalog.Product;
import com.tuanviet.gaminggear.entity.catalog.ProductVariant;
import com.tuanviet.gaminggear.exception.BadRequestException;
import com.tuanviet.gaminggear.repository.BrandRepository;
import com.tuanviet.gaminggear.repository.CartRepository;
import com.tuanviet.gaminggear.repository.CategoryRepository;
import com.tuanviet.gaminggear.repository.OrderRepository;
import com.tuanviet.gaminggear.repository.ProductRepository;
import com.tuanviet.gaminggear.repository.ProductVariantRepository;
import com.tuanviet.gaminggear.repository.UserRepository;
import com.tuanviet.gaminggear.service.OrderService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
class OrderConcurrencyIntegrationTests {
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private BrandRepository brandRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductVariantRepository productVariantRepository;
    @Autowired private CartRepository cartRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderService orderService;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private PlatformTransactionManager transactionManager;

    private TransactionTemplate transactions;
    private TestData testData;

    @BeforeEach
    void setUp() {
        transactions = new TransactionTemplate(transactionManager);
        testData = transactions.execute(status -> {
            String unique = UUID.randomUUID().toString();
            User first = userRepository.save(new User(
                    "first-" + unique + "@example.com", "test-password-hash", "Khach thu nhat", null));
            User second = userRepository.save(new User(
                    "second-" + unique + "@example.com", "test-password-hash", "Khach thu hai", null));

            Category category = new Category();
            category.setName("test-category-" + unique);
            categoryRepository.save(category);

            Brand brand = new Brand();
            brand.setName("test-brand-" + unique);
            brandRepository.save(brand);

            Product product = new Product();
            product.setName("Ban phim test");
            product.setCategory(category);
            product.setBrand(brand);
            productRepository.save(product);

            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);
            variant.setName("Phien ban test");
            variant.setSku("TEST-" + unique);
            variant.setPrice(new BigDecimal("100000"));
            variant.setStockQuantity(1);
            productVariantRepository.save(variant);

            createCart(first, variant);
            createCart(second, variant);
            return new TestData(first.getId(), second.getId(), variant.getId(),
                    product.getId(), category.getId(), brand.getId());
        });
        assertNotNull(testData);
    }

    @Test
    void onlyOneCustomerCanBuyTheLastProduct() throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<Boolean> first = executor.submit(() -> checkout(testData.firstUserId(), ready, start));
            Future<Boolean> second = executor.submit(() -> checkout(testData.secondUserId(), ready, start));

            assertTrue(ready.await(10, TimeUnit.SECONDS), "Hai luong chua san sang");
            start.countDown();

            boolean firstSucceeded = first.get(30, TimeUnit.SECONDS);
            boolean secondSucceeded = second.get(30, TimeUnit.SECONDS);
            assertNotEquals(firstSucceeded, secondSucceeded);

            transactions.executeWithoutResult(status -> {
                assertEquals(0, productVariantRepository.findById(testData.variantId())
                        .orElseThrow().getStockQuantity());
                assertEquals(firstSucceeded ? 1L : 0L, orderRepository
                        .findByUserId(testData.firstUserId(), PageRequest.of(0, 1)).getTotalElements());
                assertEquals(secondSucceeded ? 1L : 0L, orderRepository
                        .findByUserId(testData.secondUserId(), PageRequest.of(0, 1)).getTotalElements());
                assertEquals(firstSucceeded ? 0 : 1, cartRepository.findByUserId(testData.firstUserId())
                        .orElseThrow().getCartItems().size());
                assertEquals(secondSucceeded ? 0 : 1, cartRepository.findByUserId(testData.secondUserId())
                        .orElseThrow().getCartItems().size());
            });
        } finally {
            start.countDown();
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(30, TimeUnit.SECONDS), "Cac luong checkout chua ket thuc");
        }
    }

    private boolean checkout(Long userId, CountDownLatch ready, CountDownLatch start) throws InterruptedException {
        ready.countDown();
        if (!start.await(10, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Khong the bat dau checkout");
        }

        try {
            orderService.createOrder(userId, new CreateOrderRequest(
                    "Nguoi nhan test", "0901234567", "Ha Noi", null));
            return true;
        } catch (BadRequestException exception) {
            assertEquals("Sản phẩm đang hết hàng", exception.getMessage());
            return false;
        }
    }

    private void createCart(User user, ProductVariant variant) {
        Cart cart = new Cart();
        cart.setUser(user);
        CartItem item = new CartItem();
        item.setCart(cart);
        item.setProductVariant(variant);
        item.setQuantity(1);
        cart.getCartItems().add(item);
        cartRepository.save(cart);
    }

    @AfterEach
    void cleanUp() {
        if (testData == null) {
            return;
        }
        transactions.executeWithoutResult(status -> {
            jdbcTemplate.update("DELETE FROM orders WHERE user_id IN (?, ?)",
                    testData.firstUserId(), testData.secondUserId());
            jdbcTemplate.update("DELETE FROM carts WHERE user_id IN (?, ?)",
                    testData.firstUserId(), testData.secondUserId());
            jdbcTemplate.update("DELETE FROM products WHERE id = ?", testData.productId());
            jdbcTemplate.update("DELETE FROM categories WHERE id = ?", testData.categoryId());
            jdbcTemplate.update("DELETE FROM brands WHERE id = ?", testData.brandId());
            jdbcTemplate.update("DELETE FROM users WHERE id IN (?, ?)",
                    testData.firstUserId(), testData.secondUserId());
        });
    }

    private record TestData(Long firstUserId, Long secondUserId, Long variantId,
                            Long productId, Long categoryId, Long brandId) {
    }
}
