package com.tuanviet.gaminggear;

import com.jayway.jsonpath.JsonPath;
import com.tuanviet.gaminggear.dto.request.CreateOrderRequest;
import com.tuanviet.gaminggear.dto.response.OrderResponse;
import com.tuanviet.gaminggear.entity.auth.RoleName;
import com.tuanviet.gaminggear.entity.auth.User;
import com.tuanviet.gaminggear.entity.cart.Cart;
import com.tuanviet.gaminggear.entity.cart.CartItem;
import com.tuanviet.gaminggear.entity.catalog.Brand;
import com.tuanviet.gaminggear.entity.catalog.Category;
import com.tuanviet.gaminggear.entity.catalog.Product;
import com.tuanviet.gaminggear.entity.catalog.ProductVariant;
import com.tuanviet.gaminggear.entity.order.OrderStatus;
import com.tuanviet.gaminggear.repository.BrandRepository;
import com.tuanviet.gaminggear.repository.CartRepository;
import com.tuanviet.gaminggear.repository.CategoryRepository;
import com.tuanviet.gaminggear.repository.OrderRepository;
import com.tuanviet.gaminggear.repository.ProductRepository;
import com.tuanviet.gaminggear.repository.ProductVariantRepository;
import com.tuanviet.gaminggear.repository.RoleRepository;
import com.tuanviet.gaminggear.repository.UserRepository;
import com.tuanviet.gaminggear.security.jwt.JwtService;
import com.tuanviet.gaminggear.service.OrderService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class SecurityIntegrationTests {
    private static final String TEST_PASSWORD = "Test12345!";

    @Autowired private WebApplicationContext webApplicationContext;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private BrandRepository brandRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductVariantRepository productVariantRepository;
    @Autowired private CartRepository cartRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderService orderService;
    @Autowired private EntityManager entityManager;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    void protectedOrdersRejectMissingInvalidAndRefreshTokens() throws Exception {
        User customer = createUser(RoleName.CUSTOMER);
        String refreshToken = jwtService.generateRefreshToken(customer, UUID.randomUUID());

        mvc.perform(get("/api/v1/orders/my"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/orders/my").header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/orders/my").header(HttpHeaders.AUTHORIZATION, "Bearer " + refreshToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginReturnsAccessTokenForProtectedOrders() throws Exception {
        User customer = createUser(RoleName.CUSTOMER);
        String accessToken = login(customer.getEmail());

        mvc.perform(get("/api/v1/orders/my").header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    void adminOrdersRequireAdminRole() throws Exception {
        User customer = createUser(RoleName.CUSTOMER);
        User admin = createUser(RoleName.ADMIN);
        String customerToken = login(customer.getEmail());
        String adminToken = login(admin.getEmail());

        mvc.perform(get("/api/v1/admin/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void customerCannotViewOrCancelAnotherCustomersOrder() throws Exception {
        User owner = createUser(RoleName.CUSTOMER);
        User other = createUser(RoleName.CUSTOMER);
        String ownerToken = login(owner.getEmail());
        String otherToken = login(other.getEmail());

        ProductVariant variant = createVariant();
        Cart cart = new Cart();
        cart.setUser(owner);

        CartItem item = new CartItem();
        item.setCart(cart);
        item.setProductVariant(variant);
        item.setQuantity(2);
        cart.getCartItems().add(item);
        cartRepository.save(cart);

        Long ownerId = owner.getId();
        Long variantId = variant.getId();
        entityManager.flush();
        entityManager.clear();

        OrderResponse order = orderService.createOrder(ownerId, new CreateOrderRequest(
                "Nguoi nhan test", "0901234567", "Ha Noi", null
        ));
        entityManager.flush();
        entityManager.clear();

        mvc.perform(get("/api/v1/orders/{id}", order.orderId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));
        mvc.perform(get("/api/v1/orders/{id}", order.orderId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mvc.perform(put("/api/v1/orders/{id}/cancel", order.orderId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        entityManager.flush();
        entityManager.clear();
        assertEquals(OrderStatus.PENDING, orderRepository
                .findByIdAndUserId(order.orderId(), ownerId).orElseThrow().getStatus());
        assertEquals(8, productVariantRepository.findById(variantId).orElseThrow().getStockQuantity());
    }

    private User createUser(RoleName roleName) {
        User user = new User(
                "test-" + UUID.randomUUID() + "@example.com",
                passwordEncoder.encode(TEST_PASSWORD),
                "Khach hang test",
                null
        );
        user.addRole(roleRepository.findByName(roleName).orElseThrow());
        return userRepository.saveAndFlush(user);
    }

    private String login(String email) throws Exception {
        String json = "{\"email\":\"" + email + "\",\"password\":\"" + TEST_PASSWORD + "\"}";
        String hex = UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        String testIp = "2001:db8:" + hex.replaceAll("(.{4})(?!$)", "$1:");

        String response = mvc.perform(post("/api/v1/auth/login")
                        .with(request -> {
                            request.setRemoteAddr(testIp);
                            return request;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return JsonPath.read(response, "$.data.accessToken");
    }

    private ProductVariant createVariant() {
        String unique = UUID.randomUUID().toString();
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
        variant.setStockQuantity(10);
        return productVariantRepository.save(variant);
    }
}
