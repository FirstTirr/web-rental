export type Product = {
  id: string;
  name: string;
  category: "Kendaraan" | "Elektronik";
  pricePerDay: number;
  description: string;
  image: string;
};

export const products: Product[] = [
  {
    id: "v-avanza",
    name: "Toyota Avanza",
    category: "Kendaraan",
    pricePerDay: 350000,
    description: "MPV andalan keluarga, 7 seat dengan bagasi luas. Mesin irit dan bertenaga, sangat pas untuk perjalanan dinas maupun liburan.",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "v-brio",
    name: "Honda Brio",
    category: "Kendaraan",
    pricePerDay: 300000,
    description: "City car gesit dan lincah, sangat mudah bermanuver di jalan kota maupun gang sempit. 5 seat, irit bahan bakar.",
    image: "https://images.unsplash.com/photo-1518987048-93e29699e79a?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "v-innova",
    name: "Toyota Innova Reborn",
    category: "Kendaraan",
    pricePerDay: 500000,
    description: "Kenyamanan ekstra di kelas MPV premium. Interior luas, suspensi empuk, dan sangat pas untuk mengantar tamu VIP atau rombongan jauh.",
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "e-laptop",
    name: "Laptop Core i5 / R5",
    category: "Elektronik",
    pricePerDay: 180000,
    description: "Laptop kencang untuk kerja, presentasi, atau administrasi event. 8GB RAM, 512GB SSD, baterai tahan lama.",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "e-camera",
    name: "Kamera Mirrorless",
    category: "Elektronik",
    pricePerDay: 220000,
    description: "Kamera saku mirrorless 24MP dengan lensa kit untuk mengabadikan momen event kamu dengan mudah dan jernih. Sudah termasuk SD card 64GB.",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "e-projector",
    name: "Proyektor Meeting Full HD",
    category: "Elektronik",
    pricePerDay: 150000,
    description: "Proyektor berkualitas 4000 Lumens, cocok untuk nobar atau meeting di ruangan berukuran sedang. Dilengkapi kabel HDMI/VGA yang panjang.",
    image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=800",
  }
];
