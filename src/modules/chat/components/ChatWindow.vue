<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { chatService } from '@/services/chat'
import { notificationsService } from '@/services/notifications'

const props = defineProps({
  conversation: { type: Object, required: true },
  // { id, buyer_id, seller_id, buyer_name, seller_name,
  //   product_title, status, final_price,
  //   buyer_signed, seller_signed }
})

const emit = defineEmits(['close', 'updated'])

const authStore = useAuthStore()
const messages     = ref([])
const loading      = ref(true)
const sending      = ref(false)
const text         = ref('')
const showOffer    = ref(false)
const offerAmount  = ref('')
const conv         = ref({ ...props.conversation })
const messagesEnd  = ref(null)

let msgChannel  = null
let convChannel = null

// ── Computed ───────────────────────────────────────────────────
const isMyTurn   = computed(() => authStore.user?.id === conv.value.buyer_id || authStore.user?.id === conv.value.seller_id)
const myRole     = computed(() => authStore.user?.id === conv.value.buyer_id ? 'buyer' : 'seller')
const isSigned   = computed(() => myRole.value === 'buyer' ? conv.value.buyer_signed : conv.value.seller_signed)
const bothSigned = computed(() => conv.value.buyer_signed && conv.value.seller_signed)
const canSign    = computed(() => conv.value.status === 'accepted' && !isSigned.value)

// ── Methods ────────────────────────────────────────────────────
async function load() {
  loading.value = true
  const { data } = await chatService.getMessages(conv.value.id)
  messages.value = data ?? []
  loading.value = false
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

async function sendText() {
  if (!text.value.trim() || sending.value) return
  sending.value = true
  const content = text.value.trim()
  text.value = ''
  await chatService.sendMessage({
    conversationId: conv.value.id,
    senderId: authStore.user.id,
    senderName: authStore.userDisplayName,
    content,
    type: 'text'
  })
  // Notificar al otro usuario
  const otherId = authStore.user.id === conv.value.buyer_id ? conv.value.seller_id : conv.value.buyer_id
  await notificationsService.createNotification({
    userId: otherId,
    type: 'new_message',
    title: `Mensaje de ${authStore.userDisplayName}`,
    body: content.slice(0, 80),
    conversationId: conv.value.id
  })
  sending.value = false
}

async function sendOffer() {
  const amount = parseFloat(offerAmount.value)
  if (!amount || amount <= 0) return
  sending.value = true
  await chatService.sendMessage({
    conversationId: conv.value.id,
    senderId: authStore.user.id,
    senderName: authStore.userDisplayName,
    content: `Oferta: $${amount.toFixed(2)}`,
    type: 'offer',
    offerAmount: amount
  })
  // Notificar al otro usuario
  const otherId = authStore.user.id === conv.value.buyer_id ? conv.value.seller_id : conv.value.buyer_id
  await notificationsService.createNotification({
    userId: otherId,
    type: 'new_offer',
    title: `Nueva oferta de ${authStore.userDisplayName}`,
    body: `Ha propuesto $${amount.toFixed(2)}`,
    conversationId: conv.value.id
  })
  offerAmount.value = ''
  showOffer.value = false
  sending.value = false
}

async function respondOffer(msg, status) {
  await chatService.respondToOffer(msg.id, status, conv.value.id, msg.offer_amount)
  const m = messages.value.find(m => m.id === msg.id)
  if (m) m.offer_status = status
  const otherId = msg.sender_id
  if (status === 'accepted') {
    conv.value.status = 'accepted'
    conv.value.final_price = msg.offer_amount
    emit('updated', conv.value)
    await chatService.sendMessage({
      conversationId: conv.value.id,
      senderId: authStore.user.id,
      senderName: 'Sistema',
      content: `✅ Oferta de $${msg.offer_amount} aceptada. Ahora ambas partes deben firmar el contrato.`,
      type: 'system'
    })
    await notificationsService.createNotification({
      userId: otherId,
      type: 'offer_accepted',
      title: '✅ Oferta aceptada',
      body: `Tu oferta de $${msg.offer_amount} ha sido aceptada. Firma el contrato.`,
      conversationId: conv.value.id
    })
  } else {
    await notificationsService.createNotification({
      userId: otherId,
      type: 'offer_rejected',
      title: '❌ Oferta rechazada',
      body: `Tu oferta de $${msg.offer_amount} ha sido rechazada.`,
      conversationId: conv.value.id
    })
  }
}

async function signContract() {
  const { data } = await chatService.signContract(conv.value.id, myRole.value)
  if (data) {
    conv.value = data
    emit('updated', data)
    if (data.buyer_signed && data.seller_signed) {
      await chatService.sendMessage({
        conversationId: conv.value.id,
        senderId: authStore.user.id,
        senderName: 'Sistema',
        content: `🎉 ¡Contrato firmado por ambas partes! Trato cerrado por $${data.final_price}.`,
        type: 'system'
      })
    } else {
      await chatService.sendMessage({
        conversationId: conv.value.id,
        senderId: authStore.user.id,
        senderName: 'Sistema',
        content: `✍️ ${authStore.userDisplayName} ha firmado el contrato. Esperando la firma de la otra parte.`,
        type: 'system'
      })
    }
  }
}

function isOwn(msg) {
  return msg.sender_id === authStore.user?.id
}

function canRespondOffer(msg) {
  return msg.type === 'offer' &&
    msg.offer_status === 'pending' &&
    msg.sender_id !== authStore.user?.id
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// ── Realtime ───────────────────────────────────────────────────
onMounted(async () => {
  await load()

  msgChannel = chatService.subscribeToMessages(conv.value.id, (newMsg) => {
    messages.value.push(newMsg)
    scrollToBottom()
  })

  convChannel = chatService.subscribeToConversation(conv.value.id, (updated) => {
    conv.value = updated
    emit('updated', updated)
  })
})

onUnmounted(() => {
  chatService.unsubscribe(msgChannel)
  chatService.unsubscribe(convChannel)
})

watch(messages, scrollToBottom)
</script>

<template>
  <div class="chat-overlay" @click.self="emit('close')">
    <div class="chat-window">

      <!-- Header -->
      <div class="chat-header">
        <div class="chat-info">
          <div class="chat-avatar">
            {{ (conv.buyer_id === authStore.user?.id ? conv.seller_name : conv.buyer_name).charAt(0).toUpperCase() }}
          </div>
          <div>
            <h3>{{ conv.buyer_id === authStore.user?.id ? conv.seller_name : conv.buyer_name }}</h3>
            <p v-if="conv.product_title" class="product-ref">
              <i class="ri-price-tag-3-fill"></i> {{ conv.product_title }}
            </p>
          </div>
        </div>
        <div class="chat-status-badges">
          <span :class="['status-badge', conv.status]">{{ conv.status }}</span>
          <span v-if="conv.final_price" class="price-badge">${{ conv.final_price }}</span>
        </div>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>

      <!-- Contrato banner -->
      <div v-if="conv.status === 'accepted'" class="contract-banner">
        <div class="contract-info">
          <i class="ri-file-text-fill"></i>
          <div>
            <p><strong>Trato acordado por ${{ conv.final_price }}</strong></p>
            <p class="sign-status">
              Comprador: <span :class="conv.buyer_signed ? 'signed' : 'pending'">{{ conv.buyer_signed ? '✅ Firmado' : '⏳ Pendiente' }}</span>
              &nbsp;·&nbsp;
              Vendedor: <span :class="conv.seller_signed ? 'signed' : 'pending'">{{ conv.seller_signed ? '✅ Firmado' : '⏳ Pendiente' }}</span>
            </p>
          </div>
        </div>
        <button v-if="canSign" class="sign-btn" @click="signContract">
          <i class="ri-pen-nib-fill"></i> Firmar contrato
        </button>
        <div v-else-if="isSigned && !bothSigned" class="signed-waiting">
          <i class="ri-check-fill"></i> Firmado — esperando a la otra parte
        </div>
        <div v-else-if="bothSigned" class="completed-badge">
          <i class="ri-shield-check-fill"></i> Contrato completado
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-area">
        <div v-if="loading" class="loading-msg">
          <div class="spinner"></div>
        </div>

        <template v-else>
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="['msg-wrapper', {
              own: isOwn(msg),
              system: msg.type === 'system'
            }]"
          >
            <!-- System message -->
            <div v-if="msg.type === 'system'" class="system-msg">
              {{ msg.content }}
            </div>

            <!-- Offer message -->
            <div v-else-if="msg.type === 'offer'" :class="['bubble offer-bubble', { own: isOwn(msg) }]">
              <p class="offer-label"><i class="ri-hand-coin-fill"></i> Propuesta de oferta</p>
              <p class="offer-amount">${{ parseFloat(msg.offer_amount).toFixed(2) }}</p>

              <!-- Responder si no es mía y está pendiente -->
              <div v-if="canRespondOffer(msg)" class="offer-actions">
                <button class="offer-accept" @click="respondOffer(msg, 'accepted')">
                  <i class="ri-check-fill"></i> Aceptar
                </button>
                <button class="offer-reject" @click="respondOffer(msg, 'rejected')">
                  <i class="ri-close-fill"></i> Rechazar
                </button>
              </div>

              <!-- Estado de la oferta -->
              <div v-else-if="msg.offer_status !== 'pending'" :class="['offer-status', msg.offer_status]">
                {{ msg.offer_status === 'accepted' ? '✅ Aceptada' : '❌ Rechazada' }}
              </div>
              <div v-else-if="isOwn(msg)" class="offer-status pending">⏳ Pendiente de respuesta</div>

              <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
            </div>

            <!-- Text message -->
            <div v-else :class="['bubble', { own: isOwn(msg) }]">
              <p class="msg-sender" v-if="!isOwn(msg)">{{ msg.sender_name }}</p>
              <p class="msg-text">{{ msg.content }}</p>
              <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
            </div>
          </div>

          <div ref="messagesEnd"></div>
        </template>
      </div>

      <!-- Offer input -->
      <div v-if="showOffer" class="offer-input-area">
        <p class="offer-input-label"><i class="ri-hand-coin-fill"></i> Proponer precio</p>
        <div class="offer-input-row">
          <span>$</span>
          <input
            v-model="offerAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            @keyup.enter="sendOffer"
            autofocus
          />
          <button class="send-offer-btn" @click="sendOffer" :disabled="!offerAmount">
            Enviar oferta
          </button>
          <button class="cancel-offer-btn" @click="showOffer = false">
            <i class="ri-close-fill"></i>
          </button>
        </div>
      </div>

      <!-- Input bar -->
      <div class="input-bar" v-if="conv.status !== 'completed'">
        <button
          class="offer-toggle-btn"
          @click="showOffer = !showOffer"
          title="Proponer precio"
          :class="{ active: showOffer }"
        >
          <i class="ri-hand-coin-fill"></i>
        </button>
        <input
          v-model="text"
          class="msg-input"
          placeholder="Escribe un mensaje..."
          @keyup.enter="sendText"
          :disabled="sending"
        />
        <button class="send-btn" @click="sendText" :disabled="!text.trim() || sending">
          <i class="ri-send-plane-fill"></i>
        </button>
      </div>

      <div v-else class="completed-bar">
        <i class="ri-shield-check-fill"></i> Trato completado — conversación cerrada
      </div>

    </div>
  </div>
</template>

<style scoped>
.chat-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  z-index: 3000; display: flex; justify-content: center; align-items: center; padding: 20px;
}

.chat-window {
  background: #121212; border: 1px solid #333; border-radius: 20px;
  width: 100%; max-width: 580px; height: 80vh; max-height: 700px;
  display: flex; flex-direction: column; overflow: hidden;
}

/* Header */
.chat-header {
  display: flex; align-items: center; gap: 12px;
  padding: 1rem 1.25rem; border-bottom: 1px solid #222; flex-shrink: 0;
}
.chat-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.chat-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: linear-gradient(135deg, #b11db9, #7b2cbf);
  display: flex; align-items: center; justify-content: center;
  color: var(--text); font-weight: 700; font-size: 1.1rem; flex-shrink: 0;
}
.chat-info h3 { color: var(--text); font-size: 1rem; margin: 0; }
.product-ref { color: var(--text-muted); font-size: 0.78rem; margin: 2px 0 0; display: flex; align-items: center; gap: 4px; }
.product-ref i { color: #b11db9; }
.chat-status-badges { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
.status-badge {
  padding: 2px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; text-transform: capitalize;
}
.status-badge.open { background: rgba(255,255,255,0.1); color: var(--text-muted); }
.status-badge.accepted { background: rgba(46,204,113,0.2); color: #2ecc71; }
.status-badge.completed { background: rgba(177,29,185,0.2); color: #b11db9; }
.status-badge.rejected { background: rgba(231,76,60,0.2); color: #e74c3c; }
.price-badge { background: rgba(255,215,0,0.15); color: #ffd700; padding: 2px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
.close-btn { background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer; flex-shrink: 0; }
.close-btn:hover { color: var(--text); }

/* Contract banner */
.contract-banner {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem 1.25rem; gap: 1rem;
  background: rgba(46,204,113,0.08); border-bottom: 1px solid rgba(46,204,113,0.2);
  flex-shrink: 0; flex-wrap: wrap;
}
.contract-info { display: flex; align-items: flex-start; gap: 10px; }
.contract-info i { color: #2ecc71; font-size: 1.2rem; margin-top: 2px; }
.contract-info p { margin: 0; font-size: 0.85rem; color: var(--text-soft); }
.contract-info strong { color: var(--text); }
.sign-status { font-size: 0.78rem; margin-top: 3px !important; }
.signed { color: #2ecc71; }
.pending { color: #f39c12; }
.sign-btn {
  display: flex; align-items: center; gap: 6px;
  background: #2ecc71; color: #000; border: none;
  padding: 8px 16px; border-radius: 20px;
  font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.2s; flex-shrink: 0;
}
.sign-btn:hover { background: #27ae60; }
.signed-waiting { color: #2ecc71; font-size: 0.82rem; display: flex; align-items: center; gap: 6px; }
.completed-badge { color: #b11db9; font-size: 0.82rem; display: flex; align-items: center; gap: 6px; font-weight: 600; }

/* Messages */
.messages-area {
  flex: 1; overflow-y: auto; padding: 1rem;
  display: flex; flex-direction: column; gap: 8px;
}
.loading-msg { display: flex; justify-content: center; padding: 2rem; }
.spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(177,29,185,0.3); border-top-color: #b11db9;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.msg-wrapper { display: flex; flex-direction: column; }
.msg-wrapper.own { align-items: flex-end; }
.msg-wrapper.system { align-items: center; }

.system-msg {
  background: var(--input-bg); border: 1px solid var(--border);
  color: var(--text-muted); font-size: 0.78rem; padding: 6px 14px;
  border-radius: 20px; text-align: center; max-width: 90%;
}

.bubble {
  max-width: 75%; background: #1e1e2a; border: 1px solid #333;
  border-radius: 16px 16px 16px 4px;
  padding: 10px 14px; position: relative;
}
.bubble.own {
  background: rgba(177,29,185,0.2); border-color: rgba(177,29,185,0.3);
  border-radius: 16px 16px 4px 16px;
}
.msg-sender { font-size: 0.72rem; color: #b11db9; font-weight: 600; margin-bottom: 4px; }
.msg-text { color: #eee; font-size: 0.9rem; line-height: 1.5; word-break: break-word; }
.msg-time { font-size: 0.68rem; color: #555; margin-top: 4px; display: block; text-align: right; }

/* Offer bubble */
.offer-bubble {
  max-width: 280px; background: #1a1a2e;
  border: 1px solid rgba(177,29,185,0.4);
  border-radius: 16px; padding: 14px 16px;
  text-align: center;
}
.offer-bubble.own { background: rgba(177,29,185,0.15); }
.offer-label { color: #b11db9; font-size: 0.78rem; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; justify-content: center; gap: 5px; }
.offer-amount { font-family: 'Impact', sans-serif; font-size: 2rem; color: var(--text); margin-bottom: 12px; }
.offer-actions { display: flex; gap: 8px; justify-content: center; margin-bottom: 8px; }
.offer-accept {
  display: flex; align-items: center; gap: 5px;
  background: #2ecc71; color: #000; border: none;
  padding: 7px 14px; border-radius: 20px;
  font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.2s;
}
.offer-accept:hover { background: #27ae60; }
.offer-reject {
  display: flex; align-items: center; gap: 5px;
  background: transparent; border: 1px solid #e74c3c; color: #e74c3c;
  padding: 7px 14px; border-radius: 20px;
  font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.offer-reject:hover { background: #e74c3c; color: var(--text); }
.offer-status { font-size: 0.82rem; font-weight: 600; padding: 4px 0; }
.offer-status.accepted { color: #2ecc71; }
.offer-status.rejected { color: #e74c3c; }
.offer-status.pending { color: #f39c12; }

/* Offer input */
.offer-input-area {
  padding: 0.75rem 1rem;
  background: rgba(177,29,185,0.08);
  border-top: 1px solid rgba(177,29,185,0.2);
  flex-shrink: 0;
}
.offer-input-label { color: #b11db9; font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.offer-input-row { display: flex; align-items: center; gap: 8px; }
.offer-input-row span { color: var(--text-muted); font-size: 1rem; }
.offer-input-row input {
  flex: 1; background: var(--input-bg); border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px; color: var(--text); padding: 8px 12px; font-size: 1rem; outline: none;
}
.offer-input-row input:focus { border-color: #b11db9; }
.send-offer-btn {
  background: #b11db9; color: var(--text); border: none;
  padding: 8px 16px; border-radius: 20px;
  font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.2s;
  white-space: nowrap;
}
.send-offer-btn:hover:not(:disabled) { background: #9a18a3; }
.send-offer-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.cancel-offer-btn {
  background: transparent; border: 1px solid #444; color: var(--text-muted);
  width: 34px; height: 34px; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 1rem;
}

/* Input bar */
.input-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 0.75rem 1rem; border-top: 1px solid #222; flex-shrink: 0;
}
.offer-toggle-btn {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  background: var(--input-bg); border: 1px solid rgba(255,255,255,0.12);
  color: var(--text-muted); cursor: pointer; font-size: 1rem;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.offer-toggle-btn:hover, .offer-toggle-btn.active { background: rgba(177,29,185,0.2); border-color: #b11db9; color: #b11db9; }
.msg-input {
  flex: 1; background: var(--input-bg); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px; color: var(--text); padding: 10px 16px; font-size: 0.9rem; outline: none;
}
.msg-input:focus { border-color: #b11db9; }
.msg-input::placeholder { color: #555; }
.send-btn {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  background: #b11db9; border: none; color: var(--text); cursor: pointer;
  font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: background 0.2s;
}
.send-btn:hover:not(:disabled) { background: #9a18a3; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.completed-bar {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 0.75rem; border-top: 1px solid #222;
  color: #b11db9; font-size: 0.85rem; font-weight: 600; flex-shrink: 0;
}

@media (max-width: 600px) {
  .chat-window { height: 100vh; max-height: 100vh; border-radius: 0; }
  .chat-overlay { padding: 0; }
  .bubble { max-width: 88%; }
}
</style>
