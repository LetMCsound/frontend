<script>
export default {
  name: 'LicenseModal',
  props: {
    sound: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'buy'],
  data() {
    return {
      licenses: [
        {
          key: 'Standard',
          price: 29.99,
          features: ['Archivo MP3', '10k Streams', 'Sin Radio'],
          class: 'standard',
          btnClass: ''
        },
        {
          key: 'Premium',
          price: 79.99,
          features: ['MP3 + WAV', '500k Streams', 'Radio Regional'],
          class: 'premium',
          btnClass: ''
        },
        {
          key: 'Exclusiva',
          price: 199.99,
          features: ['Trackouts (Stems)', 'Streams Ilimitados', 'Propiedad Total'],
          class: 'exclusive',
          btnClass: 'gold'
        }
      ]
    }
  }
}
</script>

<template>
  <div v-if="sound" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-modal" @click="$emit('close')">&times;</button>
      <div class="modal-grid">

        <!-- Izquierda -->
        <div class="modal-left">
          <img :src="sound.cover" :alt="sound.title" class="modal-img" />
          <div class="audio-player-container">
            <p class="audio-label">Preview Track</p>
            <audio controls class="custom-audio">
              <source src="" type="audio/mpeg" />
            </audio>
          </div>
          <div class="beat-details">
            <h4>Detalles Técnicos</h4>
            <ul>
              <li><strong>BPM:</strong> {{ sound.bpm }}</li>
              <li><strong>Key:</strong> {{ sound.key }}</li>
              <li><strong>Scale:</strong> {{ sound.scale }}</li>
              <li><strong>Date:</strong> {{ sound.date }}</li>
            </ul>
          </div>
        </div>

        <!-- Derecha -->
        <div class="modal-right">
          <h2 class="beat-title">{{ sound.title }} - {{ sound.artist }}</h2>
          <p class="beat-desc">{{ sound.description }}</p>
          <h3 class="licenses-title">Selecciona tu Licencia</h3>
          <div class="pricing-cards">
            <div
              v-for="license in licenses"
              :key="license.key"
              :class="['price-card', license.class]"
            >
              <div class="card-header">
                <h4>{{ license.key }}</h4>
                <span class="price">${{ license.price }}</span>
              </div>
              <ul class="features">
                <li v-for="f in license.features" :key="f">{{ f }}</li>
              </ul>
              <button
                :class="['buy-btn', license.btnClass]"
                @click="$emit('buy', { licencia: license.key, precio: license.price })"
              >COMPRAR</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
  z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 20px;
}
.modal-content {
  background: #121212; width: 100%; max-width: 1000px;
  border-radius: 20px; border: 1px solid #333;
  box-shadow: 0 10px 40px rgba(0,0,0,0.8);
  position: relative; overflow: hidden; max-height: 90vh; overflow-y: auto;
}
.close-modal {
  position: absolute; top: 15px; right: 20px; background: none; border: none;
  color: #fff; font-size: 2rem; cursor: pointer; z-index: 10;
}
.modal-grid { display: grid; grid-template-columns: 350px 1fr; }
.modal-left {
  background: #0b0b0f; padding: 30px; display: flex; flex-direction: column;
  align-items: center; border-right: 1px solid #222;
}
.modal-img { width: 100%; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.5); margin-bottom: 20px; }
.audio-player-container { width: 100%; margin-bottom: 30px; text-align: center; }
.audio-label { color: #888; font-size: 0.8rem; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
.custom-audio { width: 100%; height: 40px; border-radius: 20px; }
.beat-details { width: 100%; background: #1a1a1d; padding: 20px; border-radius: 10px; }
.beat-details h4 { color: #fff; margin-bottom: 10px; font-size: 1rem; border-bottom: 1px solid #333; padding-bottom: 5px; }
.beat-details ul { list-style: none; padding: 0; }
.beat-details li { color: #ccc; font-size: 0.9rem; margin-bottom: 8px; display: flex; justify-content: space-between; }
.beat-details li strong { color: #b11db9; }
.modal-right { padding: 40px; }
.beat-title { font-family: 'Impact', sans-serif; font-size: 2.5rem; color: #fff; margin-bottom: 15px; letter-spacing: 1px; }
.beat-desc { color: #bbb; line-height: 1.6; margin-bottom: 30px; font-size: 1rem; }
.licenses-title { color: #fff; margin-bottom: 20px; font-size: 1.2rem; text-transform: uppercase; border-left: 4px solid #b11db9; padding-left: 10px; }
.pricing-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.price-card {
  background: #1a1a1d; border: 1px solid #333; border-radius: 10px; padding: 20px;
  text-align: center; transition: transform 0.3s, border-color 0.3s;
  display: flex; flex-direction: column; justify-content: space-between;
}
.price-card:hover { transform: translateY(-5px); border-color: #b11db9; }
.price-card.exclusive:hover { border-color: #ffd700; }
.card-header h4 { color: #fff; margin: 0; font-size: 1.1rem; }
.price { display: block; font-size: 1.5rem; color: #fff; font-weight: bold; margin: 10px 0; }
.features { list-style: none; padding: 0; margin: 15px 0; color: #888; font-size: 0.85rem; text-align: left; }
.features li { margin-bottom: 5px; border-bottom: 1px solid #2a2a2a; padding-bottom: 5px; }
.buy-btn {
  background: transparent; border: 1px solid #b11db9; color: #b11db9;
  padding: 10px; border-radius: 20px; font-weight: bold; cursor: pointer;
  transition: all 0.3s; width: 100%;
}
.buy-btn:hover { background: #b11db9; color: #fff; }
.buy-btn.gold { border-color: #ffd700; color: #ffd700; }
.buy-btn.gold:hover { background: #ffd700; color: #000; }
</style>
