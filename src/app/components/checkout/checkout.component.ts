import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AddressService, Address } from '../../services/address.service';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { PaymentService, VerifyPaymentPayload } from '../../services/payment.service';
import { INDIAN_STATES } from '../../constants/indianStates';
import * as L from 'leaflet';

declare let Razorpay: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  addresses: Address[] = [];
  selectedAddressId: string | null = null;
  selectedAddress: Address | null = null;
  loadingAddresses = true;

  showAddressForm = false;
  isEditing = false;
  editingAddressId: string | null = null;
  savingAddress = false;

  indianStates = INDIAN_STATES;

  // Map State
  map: L.Map | undefined;
  marker: L.Marker | undefined;
  loadingGeocode = false;

  formData: Address = this.resetAddressForm();

  paymentMethod = 'COD';
  cartItems: any[] = [];
  grandTotal = 0;
  placingOrder = false;

  constructor(
    private addressService: AddressService,
    private cartService: CartService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchAddresses();
    this.fetchCartSummary();
  }

  fetchAddresses(): void {
    this.loadingAddresses = true;
    this.addressService.getAddresses().subscribe({
      next: (res) => {
        this.addresses = res.data || [];
        this.loadingAddresses = false;

        if (this.addresses.length > 0) {
          const defaultAddr = this.addresses.find(a => a.isDefault) || this.addresses[0];
          this.selectAddress(defaultAddr);
        } else {
          this.selectedAddress = null;
          this.selectedAddressId = null;
          this.showAddressForm = true;
          setTimeout(() => this.initMap(), 150);
        }
      },
      error: (err) => {
        this.loadingAddresses = false;
        console.error('Failed to load addresses:', err);
      }
    });
  }

  fetchCartSummary(): void {
    this.cartService.getCart().subscribe({
      next: (res: any) => {
        this.cartItems = res.data?.items || [];
        this.grandTotal = this.cartItems.reduce((acc, item) => {
          return acc + (item.product?.price || 0) * item.quantity;
        }, 0);
      }
    });
  }

  selectAddress(addr: Address): void {
    this.selectedAddress = addr;
    this.selectedAddressId = addr._id || null;
  }

  toggleAddForm(): void {
    this.isEditing = false;
    this.editingAddressId = null;
    this.formData = this.resetAddressForm();
    this.showAddressForm = !this.showAddressForm;
    if (this.showAddressForm) {
      setTimeout(() => this.initMap(), 150);
    }
  }

  startEditAddress(addr: Address, event: Event): void {
    event.stopPropagation();
    this.isEditing = true;
    this.editingAddressId = addr._id || null;
    this.formData = { ...addr };
    this.showAddressForm = true;
    setTimeout(() => this.initMap(), 150);
  }

  resetAddressForm(): Address {
    return {
      fullName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      isDefault: false
    };
  }

  saveAddress(): void {
    if (!this.formData.fullName || !this.formData.phone || !this.formData.address || !this.formData.pincode || !this.formData.state) {
      alert('Please complete all required fields.');
      return;
    }

    this.savingAddress = true;

    if (this.isEditing && this.editingAddressId) {
      this.addressService.updateAddress(this.editingAddressId, this.formData).subscribe({
        next: () => {
          this.savingAddress = false;
          alert('Address updated successfully!');
          this.showAddressForm = false;
          this.fetchAddresses();
        },
        error: (err) => {
          this.savingAddress = false;
          alert(err.error?.message || 'Failed to update address');
        }
      });
    } else {
      this.addressService.addAddress(this.formData).subscribe({
        next: () => {
          this.savingAddress = false;
          alert('Address added successfully!');
          this.showAddressForm = false;
          this.fetchAddresses();
        },
        error: (err) => {
          this.savingAddress = false;
          alert(err.error?.message || 'Failed to add address');
        }
      });
    }
  }

  deleteAddress(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this address?')) {
      this.addressService.deleteAddress(id).subscribe({
        next: () => {
          this.fetchAddresses();
        },
        error: (err) => alert(err.error?.message || 'Failed to delete address')
      });
    }
  }

  setAsDefault(id: string, event: Event): void {
    event.stopPropagation();
    this.addressService.setDefaultAddress(id).subscribe({
      next: () => {
        this.fetchAddresses();
      }
    });
  }

  // --- ORDER PLACEMENT LOGIC ---
  onPlaceOrder(): void {
    if (!this.selectedAddress) {
      alert('Please choose a shipping address before placing your order.');
      return;
    }

    this.placingOrder = true;

    const orderPayload = {
      items: this.cartItems.map(item => ({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      })),
      shippingAddress: {
        fullName: this.selectedAddress.fullName,
        phone: this.selectedAddress.phone,
        address: this.selectedAddress.address,
        city: this.selectedAddress.city,
        state: this.selectedAddress.state,
        country: this.selectedAddress.country,
        pincode: this.selectedAddress.pincode,
        location: (this.selectedAddress as any).location
      },
      paymentMethod: this.paymentMethod,
      totalAmount: this.grandTotal
    };

    if (this.paymentMethod === 'COD') {
      this.processCODOrder(orderPayload);
    } else {
      this.processOnlinePayment(orderPayload);
    }
  }

  private processCODOrder(orderPayload: any): void {
    this.orderService.checkout(orderPayload).subscribe({
      next: () => {
        this.placingOrder = false;
        alert('Order placed successfully!');
        this.router.navigate(['/products']);
      },
      error: (err: any) => {
        this.placingOrder = false;
        alert(err.error?.message || 'Failed to place order.');
      }
    });
  }

  private processOnlinePayment(orderPayload: any): void {

    this.orderService.checkout(orderPayload).subscribe({
      next: (res: any) => {
        const orderData = res.data; // Expecting created order containing razorpayOrderId

        const options = {
          key: 'rzp_test_TNJH9x0z3Ail4F', // Replace with your actual Razorpay Key ID
          amount: orderData.totalAmount * 100,
          currency: 'INR',
          name: 'Your E-Commerce Store',
          description: 'Payment for Order',
          order_id: orderData.razorpayOrderId,
          handler: (response: any) => {
            this.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
          },
          prefill: {
            name: this.selectedAddress?.fullName,
            contact: this.selectedAddress?.phone
          },
          theme: {
            color: '#10B981'
          },
          modal: {
            ondismiss: () => {
              this.placingOrder = false;
              alert('Payment modal closed before completing payment.');
            }
          }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: (err: any) => {
        this.placingOrder = false;
        alert(err.error?.message || 'Failed to create order for online payment.');
      }
    });
  }

  private verifyPayment(payload: VerifyPaymentPayload): void {
    this.paymentService.verifyPayment(payload).subscribe({
      next: () => {
        this.placingOrder = false;
        alert('Payment verified and order confirmed successfully!');
        this.router.navigate(['/products']);
      },
      error: (err: any) => {
        this.placingOrder = false;
        alert(err.error?.message || 'Payment verification failed.');
      }
    });
  }

  // --- LEAFLET MAP & REVERSE GEOCODING IMPLEMENTATION ---
  initMap(): void {
    const mapElement = document.getElementById('location-map');
    if (!mapElement) return;

    if (this.map) {
      this.map.remove();
    }

    let center: L.LatLngTuple = [20.5937, 78.9629];
    let zoomLevel = 5;

    const existingLoc = (this.formData as any).location;
    if (existingLoc && existingLoc.lat && existingLoc.lng) {
      center = [existingLoc.lat, existingLoc.lng];
      zoomLevel = 14;
    }

    this.map = L.map('location-map').setView(center, zoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const iconDefault = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    if (existingLoc && existingLoc.lat && existingLoc.lng) {
      this.marker = L.marker([existingLoc.lat, existingLoc.lng]).addTo(this.map);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (this.map) {
          this.map.setView([lat, lng], 14);
          this.setMarkerAndGeocode(lat, lng);
        }
      });
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setMarkerAndGeocode(e.latlng.lat, e.latlng.lng);
    });
  }

  setMarkerAndGeocode(lat: number, lng: number): void {
    if (this.marker && this.map) {
      this.map.removeLayer(this.marker);
    }

    if (this.map) {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }

    (this.formData as any).location = { lat, lng };

    this.loadingGeocode = true;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.loadingGeocode = false;
        if (res && res.address) {
          const addr = res.address;

          this.formData.address = res.display_name || '';
          this.formData.city = addr.city || addr.town || addr.village || addr.suburb || '';
          this.formData.state = addr.state || '';
          this.formData.country = addr.country || 'India';
          this.formData.pincode = addr.postcode || '';

          if (addr.state) {
            const matchedState = this.indianStates.find(s => s.toLowerCase() === addr.state.toLowerCase());
            if (matchedState) {
              this.formData.state = matchedState;
            }
          }
        }
      },
      error: () => {
        this.loadingGeocode = false;
      }
    });
  }

  useCurrentLocation(): void {
    if (navigator.geolocation) {
      this.loadingGeocode = true;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          if (this.map) {
            this.map.setView([lat, lng], 16);
            this.setMarkerAndGeocode(lat, lng);
          }
        },
        (error) => {
          this.loadingGeocode = false;
          let errorMsg = 'Unable to fetch your location.';
          if (error.code === 1) errorMsg = 'Location access denied by user.';
          else if (error.code === 2) errorMsg = 'Location unavailable.';
          else if (error.code === 3) errorMsg = 'Location request timed out.';
          alert(errorMsg);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }
}