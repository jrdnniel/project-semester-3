<template>
  <div class="container py-4">
    <!-- Header with improved styling -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <button @click="goBackHome" class="btn btn-outline-primary rounded-pill px-4">
        <i class="bi bi-house-door me-2"></i>Home
      </button>
      <h4 class="mb-0 fw-bold text-primary">Gopek 178 Market</h4>
    </div>

    <!-- Select All with card styling -->
    <div class="card shadow-sm mb-4">
      <div class="card-body py-3">
        <div class="form-check">
          <input
            type="checkbox"
            class="form-check-input"
            :checked="isAllChecked"
            @change="toggleSelectAll"
            id="selectAll"
          />
          <label class="form-check-label fw-semibold" for="selectAll">
            Select All Items
          </label>
        </div>
      </div>
    </div>

    <!-- Empty Cart State -->
    <div v-if="groupedCart.length === 0" class="text-center py-5">
      <div class="display-1 mb-4">🛒</div>
      <h3 class="text-muted mb-4">Your cart is empty</h3>
      <button @click="goBackHome" class="btn btn-primary rounded-pill px-4">
        Continue Shopping
      </button>
    </div>

    <!-- Grouped Cart Items -->
    <div v-else class="row">
      <!-- Cart Items Column -->
      <div class="col-lg-8">
        <div v-for="store in groupedCart" :key="store.store_id" class="card shadow-sm mb-4">
          <!-- Store Header -->
          <div class="card-header bg-white border-bottom py-3">
            <div class="d-flex align-items-center">
              <div class="form-check">
                <input
                  type="checkbox"
                  class="form-check-input me-3"
                  :checked="isStoreChecked(store)"
                  @change="toggleStoreCheck(store)"
                />
              </div>
              <img
                :src="store.store_avatar_url"
                alt="Store Avatar"
                class="rounded-circle me-3"
                style="width: 40px; height: 40px; object-fit: cover"
              />
              <h5 class="mb-0 fw-bold">{{ store.store_name }}</h5>
              <button 
                class="btn btn-outline-danger btn-sm ms-auto rounded-pill"
                @click="removeStore(store.store_id)"
              >
                <i class="bi bi-trash me-1"></i>Remove Store
              </button>
            </div>
          </div>

          <!-- Product List -->
          <div class="card-body">
            <div v-for="item in store.products" :key="item.id" class="mb-4 border-bottom pb-4">
              <div class="row align-items-center">
                <!-- Checkbox and Image -->
                <div class="col-auto">
                  <div class="form-check">
                    <input
                      type="checkbox"
                      class="form-check-input"
                      :checked="item.is_checked"
                      @change="toggleCheck(item)"
                    />
                  </div>
                </div>
                <div class="col-auto">
                  <img
                    :src="item.image_url"
                    alt="Product"
                    class="rounded"
                    style="width: 100px; height: 100px; object-fit: cover"
                  />
                </div>

                <!-- Product Details -->
                <div class="col">
                  <h6 class="mb-2 fw-bold">{{ item.product_name }}</h6>
                  <div class="mb-2">
                    <span class="text-muted text-decoration-line-through me-2" v-if="item.discount_percentage">
                      {{ formatPrice(item.price) }}
                    </span>
                    <span class="fw-bold text-success">
                      {{ formatPrice(discountedPrice(item.price, item.discount_percentage)) }}
                    </span>
                    <span class="badge bg-danger ms-2" v-if="item.discount_percentage">
                      -{{ parseInt(item.discount_percentage) }}%
                    </span>
                  </div>

                  <!-- Quantity Controls -->
                  <div class="d-flex align-items-center mb-3">
                    <button 
                      class="btn btn-outline-secondary btn-sm px-3"
                      @click="decreaseQuantity(item)"
                      :disabled="item.quantity <= 1"
                    >−</button>
                    <span class="mx-3 fw-bold">{{ item.quantity }}</span>
                    <button 
                      class="btn btn-outline-secondary btn-sm px-3"
                      @click="increaseQuantity(item)"
                    >+</button>
                    <button 
                      class="btn btn-outline-danger btn-sm ms-3 rounded-pill"
                      @click="removeFromCart(item.id)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>

                  <!-- Note Input -->
                  <div class="input-group input-group-sm" style="max-width: 300px;">
                    <span class="input-group-text bg-light">Note</span>
                    <input
                      type="text"
                      v-model="item.note"
                      class="form-control form-control-sm"
                      @change="updateNote(item)"
                      placeholder="Add note for this item"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Checkout Summary Column -->
      <div class="col-lg-4">
        <div class="card shadow-sm position-sticky" style="top: 20px;">
          <div class="card-body">
            <h5 class="card-title mb-4 fw-bold">Order Summary</h5>
            
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Selected Items</span>
                <span class="fw-bold">{{ selectedItemsCount }}</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Subtotal</span>
                <span>{{ formatPrice(subtotal) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-3">
                <span class="text-muted">Total Discount</span>
                <span class="text-danger">-{{ formatPrice(totalDiscount) }}</span>
              </div>
              <hr>
              <div class="d-flex justify-content-between mb-4">
                <span class="fw-bold">Total</span>
                <span class="fw-bold text-primary h5 mb-0">{{ formatPrice(totalPrice) }}</span>
              </div>
            </div>

            <button 
              class="btn btn-primary w-100 rounded-pill py-2"
              @click="checkout"
              :disabled="selectedItemsCount === 0"
            >
              Proceed to Checkout
            </button>
          </div>
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
      cartItems: [],
    };
  },
  computed: {
    // Mengelompokkan produk berdasarkan toko
    groupedCart() {
      const grouped = {};
      this.cartItems.forEach((item) => {
        if (!grouped[item.store_id]) {
          grouped[item.store_id] = {
            store_id: item.store_id,
            store_name: item.store_name,
            store_avatar_url: item.store_avatar_url,
            products: [],
          };
        }
        grouped[item.store_id].products.push(item);
      });
      return Object.values(grouped);
    },
    // Cek apakah semua produk telah dipilih
    isAllChecked() {
      return this.cartItems.every((item) => item.is_checked);
    },
    // Menghitung jumlah item yang dipilih
    selectedItemsCount() {
      return this.cartItems.filter(item => item.is_checked).reduce((count, item) => count + item.quantity, 0);
    },
    // Menghitung subtotal harga berdasarkan item yang dicentang
    subtotal() {
      return this.cartItems.filter(item => item.is_checked).reduce((sum, item) => {
        const price = item.price || 0;
        const quantity = item.quantity || 0;
        return sum + price * quantity;
      }, 0);
    },
    // Menghitung total diskon berdasarkan item yang dicentang
    totalDiscount() {
      return this.cartItems.filter(item => item.is_checked).reduce((sum, item) => {
        const price = item.price || 0;
        const discount = item.discount_percentage || 0;
        const quantity = item.quantity || 0;
        return sum + (price * discount / 100) * quantity;
      }, 0);
    },
    // Menghitung total harga setelah diskon
    totalPrice() {
      return this.subtotal - this.totalDiscount;
    }
  },
  created() {
    this.fetchCartItems();
  },
  methods: {
    async fetchCartItems() {
      try {
        const response = await axios.get("http://localhost:5000/api/cart");
        this.cartItems = response.data;
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    },

    async toggleSelectAll() {
      const newStatus = !this.isAllChecked;
      this.cartItems.forEach((item) => item.is_checked = newStatus);
      await Promise.all(this.cartItems.map(item => this.updateCheckedStatus(item.id, newStatus)));
    },
    isStoreChecked(store) {
      return store.products.every((item) => item.is_checked);
    },
    async updateNote(item) {
      try {
        await axios.put(`http://localhost:5000/api/cart/${item.id}`, {
          note: item.note,
        });
        console.log(`Note for ${item.product_name} updated:`, item.note);
      } catch (error) {
        console.error("Error updating note:", error);
      }
    },
    async toggleStoreCheck(store) {
      const newStatus = !this.isStoreChecked(store);
      store.products.forEach(item => item.is_checked = newStatus);
      await Promise.all(store.products.map(item => this.updateCheckedStatus(item.id, newStatus)));
    },
    async toggleCheck(item) {
      item.is_checked = !item.is_checked;
      await this.updateCheckedStatus(item.id, item.is_checked);
    },
    async updateCheckedStatus(id, status) {
      try {
        await axios.put(`http://localhost:5000/api/cart/${id}`, {
          is_checked: status,
        });
      } catch (error) {
        console.error("Error updating check status:", error);
      }
    },
    async increaseQuantity(item) {
      item.quantity++;
      await this.sendCartUpdates(item);
    },
    async sendCartUpdates(item) {
      try {
        await axios.put(`http://localhost:5000/api/cart/${item.id}`, {
          quantity: item.quantity,
          is_checked: item.is_checked,
          note: item.note || "",
        });
      } catch (error) {
        console.error("Error updating cart item:", error);
      }
    },
    async decreaseQuantity(item) {
      if (item.quantity > 1) {
        item.quantity--;
        await this.sendCartUpdates(item);
      }
    },
    async removeFromCart(id) {
      try {
        await axios.delete(`http://localhost:5000/api/cart/${id}`);
        this.fetchCartItems();
      } catch (error) {
        console.error("Error removing cart item:", error);
      }
    },
    async removeStore(store_id) {
      try {
        await axios.delete(`http://localhost:5000/api/cart/store/${store_id}`);
        this.fetchCartItems();
      } catch (error) {
        console.error("Error removing store items:", error);
      }
    },

    // Metode checkout
    async checkout() {
      // Lakukan proses checkout (misalnya simpan data ke database atau lainnya)
      
      // Navigasi ke halaman checkout setelah proses checkout selesai
      this.$router.push({ name: 'Checkout' });
    },

    formatPrice(price) {
      if (isNaN(price) || price === undefined || price === null) {
        return "Rp.0";
      }
      return `Rp.${parseInt(price).toLocaleString("id-ID").replace(/,/g, ".")}`;
    },

    discountedPrice(price, discount) {
      if (!price || !discount) return 0;
      return Math.round(price - (price * discount) / 100);
    },

    goBackHome() {
      this.$router.push({ name: "Home" });
    },
  },
};
</script>

<style scoped>
/* Add Bootstrap Icons */
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css");

/* Optional custom styles for enhanced aesthetics */
.card {
  border: none;
  transition: transform 0.2s;
}

.btn {
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
}

.form-check-input {
  cursor: pointer;
}

.card-header {
  background-color: #fff;
}

/* Make the summary card sticky on desktop */
@media (min-width: 992px) {
  .position-sticky {
    position: sticky;
    top: 1rem;
  }
}
</style>