<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <!-- Page Header -->
        <div class="text-center mb-5">
          <h2 class="display-6 fw-bold text-primary mb-2">Checkout</h2>
          <p class="text-muted">Complete your purchase</p>
        </div>

        <!-- Main Content -->
        <div class="checkout-container">
          <!-- Shipping Address Card -->
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <div class="d-flex align-items-center mb-3">
                <i class="bi bi-geo-alt-fill text-primary me-2"></i>
                <h4 class="mb-0 fw-bold">Shipping Address</h4>
              </div>
              <div class="ms-4">
                <p class="mb-0 fw-bold">Rumah - Agus Buntun</p>
                <p class="text-muted mb-0">Perumahan Neraka terdalam</p>
              </div>
            </div>
          </div>

          <!-- Selected Items -->
          <div v-if="selectedStores.length === 0" class="card shadow-sm mb-4">
            <div class="card-body text-center py-5">
              <i class="bi bi-cart-x display-1 text-muted mb-3"></i>
              <p class="lead mb-0">No items selected for checkout</p>
            </div>
          </div>

          <div v-else v-for="store in selectedStores" :key="store.store_id" class="card shadow-sm mb-4">
            <div class="card-header bg-white py-3">
              <div class="d-flex align-items-center">
                <i class="bi bi-shop text-primary me-2"></i>
                <h5 class="mb-0 fw-bold">{{ store.store_name }}</h5>
              </div>
            </div>
            <div class="card-body">
              <div v-for="product in store.products" :key="product.id" class="product-item mb-3">
                <div class="row align-items-center">
                  <div class="col-md-8">
                    <h6 class="fw-bold mb-1">{{ product.product_name }}</h6>
                    <p class="text-muted small mb-1">Quantity: {{ product.quantity }}</p>
                    <div class="price-container mb-2">
                      <span v-if="product.discount_percentage" class="text-decoration-line-through text-muted me-2">
                        Rp{{ formatPrice(product.price) }}
                      </span>
                      <span class="fw-bold text-danger">
                        Rp{{ formatPrice(product.discount_percentage ? discountedPrice(product.price, product.discount_percentage) : product.price) }}
                      </span>
                      <span v-if="product.discount_percentage" class="badge bg-danger ms-2">
                        -{{ Math.round(product.discount_percentage) }}%
                      </span>
                    </div>
                    <p v-if="product.note" class="note-text">
                      <i class="bi bi-pencil-fill text-muted me-1"></i>
                      <small class="text-muted">{{ product.note }}</small>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Method Card -->
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <div class="d-flex align-items-center mb-3">
                <i class="bi bi-credit-card-fill text-primary me-2"></i>
                <h4 class="mb-0 fw-bold">Payment Method</h4>
              </div>
              <div class="payment-options ms-4">
                <div class="form-check mb-3">
                  <input type="radio" id="bank-transfer" class="form-check-input" name="payment" value="Bank Transfer" v-model="paymentMethod">
                  <label class="form-check-label payment-label" for="bank-transfer">
                    <i class="bi bi-bank me-2"></i>Bank Transfer
                  </label>
                </div>
                <div class="form-check mb-3">
                  <input type="radio" id="gopay" class="form-check-input" name="payment" value="Gopay" v-model="paymentMethod">
                  <label class="form-check-label payment-label" for="gopay">
                    <i class="bi bi-wallet2 me-2"></i>Gopay
                  </label>
                </div>
                <div class="form-check">
                  <input type="radio" id="cod" class="form-check-input" name="payment" value="COD" v-model="paymentMethod">
                  <label class="form-check-label payment-label" for="cod">
                    <i class="bi bi-cash me-2"></i>COD (Cash on Delivery)
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Summary Card -->
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <div class="d-flex align-items-center mb-4">
                <i class="bi bi-receipt text-primary me-2"></i>
                <h4 class="mb-0 fw-bold">Order Summary</h4>
              </div>
              
              <div class="summary-item d-flex justify-content-between mb-2">
                <span class="text-muted">Items ({{ selectedStores.reduce((sum, store) => sum + store.products.length, 0) }})</span>
                <span class="fw-bold">Rp{{ formatPrice(totalPrice) }}</span>
              </div>
              
              <div class="summary-item d-flex justify-content-between mb-2">
                <span class="text-muted">Shipping Cost</span>
                <span class="fw-bold">Rp{{ formatPrice(shippingCost) }}</span>
              </div>
              
              <div class="summary-item d-flex justify-content-between mb-3">
                <span class="text-muted">Insurance</span>
                <span class="fw-bold">Rp{{ formatPrice(insuranceCost) }}</span>
              </div>
              
              <hr>
              
              <div class="d-flex justify-content-between align-items-center mb-4">
                <span class="h5 mb-0">Total</span>
                <span class="h4 mb-0 text-primary fw-bold">
                  Rp{{ formatPrice(totalPrice + shippingCost + insuranceCost) }}
                </span>
              </div>

              <button @click="completeCheckout" class="btn btn-primary w-100 py-3 rounded-pill">
                <i class="bi bi-lock-fill me-2"></i>Complete Payment
              </button>
            </div>
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
      selectedStores: [],
      paymentMethod: "Bank Transfer",
      shippingCost: 10000,
      insuranceCost: 10000,
    };
  },
  computed: {
    totalPrice() {
      return this.selectedStores.reduce((sum, store) => {
        return (
          sum +
          store.products.reduce((storeSum, product) => {
            const price = product.discount_percentage
              ? this.discountedPrice(product.price, product.discount_percentage)
              : product.price;
            return storeSum + price * product.quantity;
          }, 0)
        );
      }, 0);
    },
  },
  created() {
    this.fetchCheckoutItems();
  },
  methods: {
    async fetchCheckoutItems() {
      try {
        const response = await axios.get("http://localhost:5000/api/cart");
        const checkedItems = response.data.filter((item) => item.is_checked);

        // Group by store
        const grouped = {};
        checkedItems.forEach((item) => {
          if (!grouped[item.store_id]) {
            grouped[item.store_id] = {
              store_id: item.store_id,
              store_name: item.store_name,
              products: [],
            };
          }
          grouped[item.store_id].products.push(item);
        });
        this.selectedStores = Object.values(grouped);
      } catch (error) {
        console.error("Error fetching checkout items:", error);
      }
    },

    discountedPrice(price, discount) {
      return Math.round(price - (price * discount) / 100);
    },

    formatPrice(price) {
      return price.toLocaleString("id-ID", { minimumFractionDigits: 0 });
    },

    async completeCheckout() {
      try {
        await axios.post("http://localhost:5000/api/checkout", {
          paymentMethod: this.paymentMethod,
        });
        // Remove checked items from the cart
        const productIds = this.selectedStores.flatMap((store) =>
          store.products.map((product) => product.id)
        );
        await Promise.all(
          productIds.map((id) => axios.delete(`http://localhost:5000/api/cart/${id}`))
        );

        alert("Checkout berhasil!");
        this.$router.push({ name: "Home" });
      } catch (error) {
        console.error("Error during checkout:", error);
        alert("Checkout gagal. Silakan coba lagi.");
      }
    },
  },
};
</script>


<style scoped>
/* Import Bootstrap Icons */
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css");

.checkout-container {
  max-width: 800px;
  margin: 0 auto;
}

.card {
  border: none;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-2px);
}

.product-item {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.product-item:last-child {
  border-bottom: none;
}

.payment-label {
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 0;
}

.form-check-input {
  cursor: pointer;
}

.summary-item {
  font-size: 1.1rem;
}

.btn-primary {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.note-text {
  background-color: #f8f9fa;
  padding: 0.5rem;
  border-radius: 0.5rem;
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .summary-item {
    font-size: 1rem;
  }
}
</style>