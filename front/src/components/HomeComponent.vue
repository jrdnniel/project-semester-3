<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-end mb-4">
      <button class="btn btn-outline-secondary position-relative" @click="goToCart">
        🛒 Cart
        <span class="badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill">
          {{ totalCartItems }}
        </span>
      </button>
    </div>

    <!-- Store and Products -->
    <div v-for="store in stores" :key="store.id" class="mb-5">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom py-3">
          <div class="d-flex align-items-center">
            <img 
              :src="store.avatar_url" 
              alt="Store Avatar" 
              class="rounded-circle me-3 border" 
              style="width: 48px; height: 48px; object-fit: cover;"
            >
            <h4 class="mb-0 fw-bold text-primary">{{ store.name }}</h4>
          </div>
        </div>

        <div class="card-body p-4">
          <div class="row g-4">
            <!-- Products -->
            <div v-for="product in store.products" :key="product.id" class="col-12 col-md-6 col-lg-4">
              <div class="card h-100 border-0 shadow-sm hover-shadow transition">
                <!-- Product Image -->
                <div class="position-relative">
                  <img 
                    :src="product.image_url" 
                    alt="Product Image" 
                    class="card-img-top p-3 bg-light"
                    style="height: 200px; object-fit: contain;"
                  >
                  <div 
                    v-if="product.discount_percentage" 
                    class="position-absolute top-0 end-0 m-3"
                  >
                    <span class="badge bg-danger rounded-pill px-3 py-2">
                      -{{ Math.round(product.discount_percentage) }}%
                    </span>
                  </div>
                </div>

                <!-- Product Details -->
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title fw-bold text-truncate">{{ product.name }}</h5>
                  
                  <div class="mb-2">
                    <span 
                      v-if="product.discount_percentage" 
                      class="text-decoration-line-through text-muted me-2"
                    >
                      {{ formatPrice(product.price) }}
                    </span>
                    <span class="fs-5 fw-bold text-success">
                      {{ formatPrice(discountedPrice(product.price, product.discount_percentage)) }}
                    </span>
                  </div>

                  <p class="card-text text-muted small mb-3">{{ product.description }}</p>
                  
                  <button 
                    class="btn btn-success mt-auto w-100"
                    @click="addToCart(product)"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
      <div 
        class="toast align-items-center bg-success text-white border-0"
        :class="{ 'show': showToast }"
        role="alert"
      >
        <div class="d-flex">
          <div class="toast-body">
            {{ toastMessage }}
          </div>
          <button 
            type="button" 
            class="btn-close btn-close-white me-2 m-auto" 
            @click="showToast = false"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";


export default {
  data() {
    return {
      stores: [],
      cart: JSON.parse(localStorage.getItem("cart")) || [],
      showToast: false,
      toastMessage: "",
    };
  },
  created() {
    this.fetchStores();
  },
  methods: {
    async fetchStores() {
      try {
        const storesResponse = await axios.get("http://localhost:5000/api/stores");
        this.stores = await Promise.all(
          storesResponse.data.map(async (store) => {
            const productsResponse = await axios.get(
              `http://localhost:5000/api/products?store_id=${store.id}`
            );
            return { ...store, products: productsResponse.data };
          })
        );
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    },
    formatPrice(price) {
  return `Rp.${parseInt(price).toLocaleString("id-ID").replace(/,/g, ".")}`;
}
,
    discountedPrice(price, discount) {
      if (!discount) return price;
      return Math.round(price - (price * discount) / 100);
    },
    addToCart(product) {
      const cartItem = {
        product_id: product.id,
        quantity: 1,
        is_checked: false,
        note: "",
        name: product.name,
        price: product.price,
        discount_percentage: product.discount_percentage,
        image_url: product.image_url,
      };
      axios.post("http://localhost:5000/api/cart", cartItem).then((response) => {
        cartItem.id = response.data.id;
        this.cart.push(cartItem);
        localStorage.setItem("cart", JSON.stringify(this.cart));
        this.showToastNotification(`${product.name} has been added to your cart.`);
      });
    },
    showToastNotification(message) {
      this.toastMessage = message;
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
      }, 3000); // Toast hilang setelah 3 detik
    },
    goToCart() {
      this.$router.push({ name: "Cart" });
    },
  },
};
</script>

<style scoped>
/* Minimal custom CSS, only for things not available in Bootstrap */
.hover-shadow {
  transition: all 0.2s ease-in-out;
}

.hover-shadow:hover {
  transform: translateY(-5px);
}

.transition {
  transition: all 0.2s ease;
}
</style>