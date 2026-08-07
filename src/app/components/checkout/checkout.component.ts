import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AddressService, Address } from '../../services/address.service';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service'; // Adjust import path if needed
import { INDIAN_STATES } from '../../constants/indianStates';
import * as L from 'leaflet';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  // Addresses State
  addresses: Address[] = [];
  selectedAddressId: string | null = null;
  selectedAddress: Address | null = null;
  loadingAddresses = true;

  // New/Edit Address Form State
  showAddressForm = false;
  isEditing = false;
  editingAddressId: string | null = null;
  savingAddress = false;

  indianStates = INDIAN_STATES;

  // Map State
  map: L.Map | undefined;
  marker: L.Marker | undefined;

  formData: Address = this.resetAddressForm();

  // Payment & Cart
  paymentMethod = 'COD';
  cartItems: any[] = [];
  grandTotal = 0;
  placingOrder = false;

  constructor(
    private addressService: AddressService,
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

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

        // Auto-select default address or first address available
        if (this.addresses.length > 0) {
          const defaultAddr = this.addresses.find(a => a.isDefault) || this.addresses[0];
          this.selectAddress(defaultAddr);
        } else {
          this.selectedAddress = null;
          this.selectedAddressId = null;
          this.showAddressForm = true; // Auto open form if no addresses saved
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
      setTimeout(() => this.initMap(), 100);
    }
  }

  startEditAddress(addr: Address, event: Event): void {
    event.stopPropagation();
    this.isEditing = true;
    this.editingAddressId = addr._id || null;
    this.formData = { ...addr };
    this.showAddressForm = true;
    setTimeout(() => this.initMap(), 100);
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
        location: this.selectedAddress.location
      },
      paymentMethod: this.paymentMethod,
      totalAmount: this.grandTotal
    };

    this.orderService.checkout(orderPayload).subscribe({
      next: () => {
        this.placingOrder = false;
        alert('Order placed successfully!');
        this.router.navigate(['/products']);
      },
      error: (err:any) => {
        this.placingOrder = false;
        alert(err.error?.message || 'Failed to place order.');
      }
    });
  }

  initMap(): void {
    const mapElement = document.getElementById('location-map');
    if (!mapElement) return;

    if (this.map) {
      this.map.remove(); // Clean up existing map instance
    }

    // Default center (e.g., center of India)
    let center: L.LatLngTuple = [20.5937, 78.9629];
    if (this.formData.location && this.formData.location.lat && this.formData.location.lng) {
      center = [this.formData.location.lat, this.formData.location.lng];
    }

    this.map = L.map('location-map').setView(center, 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Fix default marker icon issue with Leaflet in Angular
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

    if (this.formData.location && this.formData.location.lat && this.formData.location.lng) {
      this.marker = L.marker([this.formData.location.lat, this.formData.location.lng]).addTo(this.map);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.marker && this.map) {
        this.map.removeLayer(this.marker);
      }
      if (this.map) {
         this.marker = L.marker(e.latlng).addTo(this.map);
      }
      this.formData.location = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      };
    });
  }
}