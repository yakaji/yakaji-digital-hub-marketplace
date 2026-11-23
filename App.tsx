import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { auth, api, notifications, ws } from '@appdeploy/client';
import {
  ArrowLeft, ArrowRight, BarChart3, CheckCircle2, Clock3, Heart, ImagePlus, LayoutDashboard,
  LogIn, LogOut, Package, PlayCircle, Plus, Search, ShieldCheck, ShoppingBag, Store,
  TrendingUp, UserRound, Wallet, Users, Trash2, UploadCloud, X, ChevronLeft, ChevronRight, Share2, Copy, MessageCircle, Bell, Send, MessageSquare
} from 'lucide-react';

type User = { userId: string; email?: string; name?: string; picture?: string };
type Media = { path: string; url: string; type: 'image' | 'video' };
type Product = {
  id: string; name: string; category: string; price: number; description: string;
  tag: string; images: string[]; videos: string[]; imagePaths?: string[]; videoPaths?: string[]; stock: number;
  options: string[]; vendorId: string; vendorName: string; status: string; affiliateCommissionPercent?: number; marketplaceCommissionPercent?: number;
  standardPrice?: number; discountPrice?: number; discountPercent?: number; discountActive?: boolean; discountStartAt?: string; discountEndAt?: string;
};
type Vendor = { id: string; shopName: string; ownerName: string; email: string; phone: string; description: string; status: string; createdAt: string };
type MarketSettings = {customerTransferFee:number;withdrawalFee:number;walletFundingFee:number;commissionPercent:number;cashbackPercent:number};
type Order = {
  id: string; orderNumber: string; customerName: string; phone: string; email: string;
  address: string; paymentMethod: string; items: Array<{ productId: string; name: string; quantity: number; price: number; vendorId: string; option: string }>;
  total: number; subtotal?: number; transferFee?: number; status: string; paymentStatus?: string; paymentNotificationSentAt?: string; paymentCompletedAt?: string; paystackReference?: string; paymentReference?: string; trackingNumber?: string; courier?: string; refundStatus?: string; refundedAt?: string; updatedAt?: string; createdAt: string;
};
type ProductDraft = {
  id?: string; name: string; category: string; price: string; description: string;
  stock: string; tag: string; options: string; images: string[]; videos: string[]; affiliateCommissionPercent: string; marketplaceCommissionPercent: string;
  discountMode: string; discountValue: string; discountStartAt: string; discountEndAt: string;
};
const blankDraft: ProductDraft = { name: '', category: 'Digital Products', price: '', description: '', stock: '10', tag: 'New', options: '', images: [], videos: [], affiliateCommissionPercent: '5', marketplaceCommissionPercent: '', discountMode: 'none', discountValue: '', discountStartAt: '', discountEndAt: '' };
const categories = ['Digital Products', 'Electronics', 'Fashion', 'Beauty & Personal Care', 'Home & Living', 'Food & Groceries', 'Digital Courses', 'Social Media', 'Digital Services', 'Other'];
const heroSlides = [
  {
    eyebrow: 'WELCOME TO YAKAJI DIGITAL HUB',
    title: 'Discover Amazing',
    highlight: 'Digital & Physical',
    ending: 'Products',
    description: 'Shop with Confidence, Learn with Ease, and Grow Your Business! Explore digital products, online courses, services and everyday essentials from trusted independent vendors.',
    button: 'Start Shopping',
    category: 'All',
    action: 'shop',
    trust: ['Best Prices', 'Instant Access', 'Trusted Market'],
    visualTitle: 'SHOP • SELL • GROW',
    visualSubtitle: 'Everything you love, in one place',
    tag: 'Discover something new',
    footnote: 'Trusted local sellers',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1100&q=90',
    icons: ['▶', '♪', 'AI', '🎓', '🛍️']
  },
  {
    eyebrow: 'LEARN • BUILD • SUCCEED',
    title: 'Unlock Your',
    highlight: 'Potential with',
    ending: 'Premium Courses',
    description: 'Learn practical skills with online courses, AI tutorials and expert training. Discover learning resources from independent creators on one marketplace.',
    button: 'Explore Courses',
    category: 'Digital Courses',
    action: 'category',
    trust: ['Learn Anywhere', 'Instant Access', 'Expert Content'],
    visualTitle: 'LEARN • GROW • ACHIEVE',
    visualSubtitle: 'Your next skill starts here',
    tag: 'Invest in your skills',
    footnote: 'Courses from trusted creators',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1100&q=90',
    icons: ['🎓', '▶', 'AI', '📚', '💡']
  },
  {
    eyebrow: 'TOOLS FOR YOUR NEXT MOVE',
    title: 'Grow Your',
    highlight: 'Business with',
    ending: 'Digital Services',
    description: 'Find digital services, software, social media solutions and business tools to help you build your brand and reach more customers.',
    button: 'Discover Services',
    category: 'Digital Services',
    action: 'category',
    trust: ['Business Tools', 'Skilled Vendors', 'More Opportunities'],
    visualTitle: 'CREATE • CONNECT • GROW',
    visualSubtitle: 'Bring your next big idea to life',
    tag: 'Boost your business',
    footnote: 'Independent digital vendors',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1100&q=90',
    icons: ['📈', '💼', 'AI', '⚙️', '🤝']
  },
  {
    eyebrow: 'SMART FINDS • GREAT VALUE',
    title: 'Discover',
    highlight: 'Amazing Deals',
    ending: '& Special Offers',
    description: 'Browse products and special offers from marketplace vendors. Find something you love and enjoy a simple, convenient shopping experience.',
    button: 'Shop Deals',
    category: 'All',
    action: 'shop',
    trust: ['Great Finds', 'Secure Shopping', 'Trusted Sellers'],
    visualTitle: 'FIND • SAVE • ENJOY',
    visualSubtitle: 'Great finds in one marketplace',
    tag: 'Discover great value',
    footnote: 'Shop from marketplace vendors',
    image: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1100&q=90',
    icons: ['🎁', '🛍️', '⭐', '🏷️', '💛']
  }
];
const money = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n || 0);
const paymentStatusLabel = (status?: string) => status === 'completed' ? 'Payment Successful' : status === 'rejected' ? 'Payment Rejected' : 'Pending Payment';
const errorText = (e: unknown) => {
  const err = e as { response?: { data?: { error?: string; message?: string } }; message?: string };
  return err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
};
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Could not read selected file.'));
    reader.readAsDataURL(file);
  });
}
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userNotifications, setUserNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatConversations, setChatConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: '', message: '', audience: 'all' });
  const [announcementHistory, setAnnouncementHistory] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorReports, setVendorReports] = useState<any>(null);
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);
  const [settings,setSettings]=useState<MarketSettings>({customerTransferFee:100,withdrawalFee:100,walletFundingFee:100,commissionPercent:8,cashbackPercent:1});
  const [wallet,setWallet]=useState<any>(null);
  const [walletSummary,setWalletSummary]=useState<any>(null);
  const [walletTopupAmount,setWalletTopupAmount]=useState('');
  const [walletTopupMethod,setWalletTopupMethod]=useState('Bank transfer');
  const [walletTopupEmail,setWalletTopupEmail]=useState('');
  const [walletTopupBusy,setWalletTopupBusy]=useState(false);
  const [customerWithdrawalBusy,setCustomerWithdrawalBusy]=useState(false);
  const [walletTransferDetails,setWalletTransferDetails]=useState<{reference:string;amount:number;fee:number;total:number}|null>(null);
  const [walletTopups,setWalletTopups]=useState<any[]>([]);
  const [customerWithdrawals,setCustomerWithdrawals]=useState<any[]>([]);
  const [customerWithdrawalForm,setCustomerWithdrawalForm]=useState({amount:'',bankName:'',accountNumber:'',accountName:''});
  const [vendorCreditForm,setVendorCreditForm]=useState({vendorId:'',amount:''});
  const [customerCreditForm,setCustomerCreditForm]=useState({customerId:'',amount:''});
  const [withdrawForm,setWithdrawForm]=useState({amount:'',bankName:'',accountNumber:'',accountName:''});
  const [withdrawals,setWithdrawals]=useState<any[]>([]);
  const [adminUsers,setAdminUsers]=useState<any[]>([]);
  const [affiliateData,setAffiliateData]=useState<any>({affiliates:[],commissions:[],withdrawals:[],summary:{}});
  const [profile,setProfile]=useState<any>(null);
  const [avatarFile,setAvatarFile]=useState<File|null>(null);
  const [selectedProduct,setSelectedProduct]=useState<Product|null>(null);
  const deepLinkRequestRef = useRef('');
  const [selectedProductOption,setSelectedProductOption]=useState('');
  const [selectedImageIndex,setSelectedImageIndex]=useState(0);

  const [photoViewerOpen,setPhotoViewerOpen]=useState(false);
  const [touchStartX,setTouchStartX]=useState<number|null>(null);
  const [reviewSubmitting,setReviewSubmitting]=useState(false);
  const [detailQuantity,setDetailQuantity]=useState(1);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [page, setPage] = useState<'home' | 'vendor' | 'admin' | 'profile' | 'wallet' | 'support' | 'orders' | 'affiliate'>('home');
  const [affiliateApplication, setAffiliateApplication] = useState<any>(null);
  const [affiliateDashboard, setAffiliateDashboard] = useState<any>({ commissions: [], withdrawals: [], summary: {} });
  const [affiliateTransfer, setAffiliateTransfer] = useState<any>(null);
  const [affiliateForm, setAffiliateForm] = useState({ fullName: '', phone: '', whatsapp: '', address: '', city: '', state: '', socialHandle: '', promotionMethod: 'WhatsApp and social media', paymentMethod: 'Wallet' });
  const [affiliateProducts, setAffiliateProducts] = useState<Product[]>([]);
  const [affiliateWithdrawForm, setAffiliateWithdrawForm] = useState({ amount: '', bankName: '', accountNumber: '', accountName: '' });
  const [affiliateWithdrawBusy, setAffiliateWithdrawBusy] = useState(false);
  const [category, setCategory] = useState('All');
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroTouchStart, setHeroTouchStart] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('yakaji-market-favorites') || '[]'); }
    catch { return []; }
  });
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number; option: string }>>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [vendorCoupons, setVendorCoupons] = useState<any[]>([]);
  const [adminCoupons, setAdminCoupons] = useState<any[]>([]);
  const [adminCouponDraft, setAdminCouponDraft] = useState({ code: '', discountType: 'percentage', discountValue: '10', productIds: [] as string[], minOrderAmount: '', maxDiscount: '', usageLimit: '0', startsAt: '', expiresAt: '' });
  const [couponDraft, setCouponDraft] = useState({ code: '', discountType: 'percentage', discountValue: '10', productIds: [] as string[], minOrderAmount: '', maxDiscount: '', usageLimit: '0', startsAt: '', expiresAt: '' });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [manualTransferOrder, setManualTransferOrder] = useState<{orderNumber:string;total:number;creditAmount?:number;fee?:number}|null>(null);
  const [paystackReady, setPaystackReady] = useState(false);
  const [paystackMode, setPaystackMode] = useState('');
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerOrdersLoading, setCustomerOrdersLoading] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState('');
  const notificationDeepLinkHandledRef = useRef(false);
  const [supportConversation, setSupportConversation] = useState('');
  const supportConversationRef = useRef('');
  supportConversationRef.current = supportConversation;
  const [supportStatus, setSupportStatus] = useState<any>({ online: true, offlineMessage: '' });
  const [supportAdminSettings, setSupportAdminSettings] = useState<any>({ online: true, maxConcurrent: 1, offlineMessage: 'Live support is currently offline. Leave a message and our team will reply, or use WhatsApp or email.' });
  const supportSocketRef = useRef<any>(null);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportDraft, setSupportDraft] = useState('');
  const [supportName, setSupportName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportConversations, setSupportConversations] = useState<any[]>([]);
  const [activeSupportConversation, setActiveSupportConversation] = useState('');
  const [adminReply, setAdminReply] = useState('');
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [reviewAverage, setReviewAverage] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const photoCount = selectedProduct?.images?.length || 0;
  const activePhoto = selectedProduct?.images?.[selectedImageIndex] || '';
  const [draft, setDraft] = useState<ProductDraft>(blankDraft);
  const [editing, setEditing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '', paymentMethod: 'Bank transfer' });
  const [shopForm, setShopForm] = useState({ shopName: '', phone: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const isAdmin = user?.email?.toLowerCase() === 'salimaminu103@gmail.com';

  function flash(message: string) { setNotice(message); window.setTimeout(() => setNotice(''), 4000); }
  async function loadNotifications() {
    if (!user) return;
    try { const r = await api.get('/api/notifications'); setUserNotifications(r.data.notifications || []); setUnreadNotifications(Number(r.data.unreadCount || 0)); } catch { /* optional account feature */ }
  }
  async function openNotifications() { if (!user) { await signIn(); return; } await loadNotifications(); setNotificationsOpen(true); }
  async function openNotificationTarget(notification: any) {
    const id = String(notification.id || '');
    if (id) await markNotificationRead(id);
    setNotificationsOpen(false);
    const link = String(notification.link || '');
    let params: URLSearchParams;
    try { params = new URL(link, window.location.origin).searchParams; }
    catch { params = new URLSearchParams(); }
    const conversationId = params.get('conversationId') || String(notification.conversationId || '');
    const orderId = params.get('orderId') || String(notification.orderId || '');
    const kind = String(notification.kind || '').toLowerCase();
    if (kind === 'support' || params.get('view') === 'support') {
      if (conversationId) window.history.replaceState({}, '', window.location.pathname + '?view=support&conversationId=' + encodeURIComponent(conversationId));
      setSupportConversation(conversationId);
      if (conversationId) {
        try { const thread = await api.get('/api/support/messages?conversationId=' + encodeURIComponent(conversationId)); setSupportMessages(thread.data.messages || []); setSupportStatus((current:any) => ({ ...current, conversation: thread.data.conversation })); }
        catch (e) { setError(errorText(e)); }
      }
      setPage('support');
      return;
    }
    if (kind === 'chat' || conversationId) {
      await openChatInbox(undefined, conversationId);
      return;
    }
    if (kind === 'order' || orderId || params.get('view') === 'orders') {
      setHighlightedOrderId(orderId);
      setPage('orders');
      void loadCustomerOrders();
      return;
    }
    flash('This notification has been marked as read.');
  }
  async function enablePushNotifications() { try { await notifications.subscribe(); flash('Device notifications enabled.'); } catch (e) { setError(errorText(e)); } }
  async function markNotificationRead(id: string) {
    try { await api.put('/api/notifications/read', { ids: [id] }); await loadNotifications(); }
    catch (e) { setError(errorText(e)); }
  }
  async function markAllNotificationsRead() {
    try { await api.put('/api/notifications/read', { all: true }); await loadNotifications(); }
    catch (e) { setError(errorText(e)); }
  }
  async function openChatInbox(product?: Product, requestedConversationId = '') {
    if (!user) { flash('Please sign in with your customer account, then tap Chat with vendor again.'); await signIn(); return; }
    if (product && product.vendorId === user.userId) {
      setError('This is your own product. To test customer chat, sign out and open this product using a different customer account.');
      return;
    }
    setError(''); setChatMessages([]); setChatDraft(''); setActiveChatId(''); setChatOpen(true);
    try {
      let conversationId = '';
      if (product) {
        const started = await api.post('/api/chat/conversations', { productId: product.id });
        conversationId = String(started.data.conversationId || '');
        if (!conversationId) throw new Error('The conversation could not be opened. Please try again.');
      }
      const r = await api.get('/api/chat/conversations');
      const rows = r.data.conversations || []; setChatConversations(rows);
      const nextId = conversationId || requestedConversationId || (rows.length ? String(rows[0].id) : '');
      if (requestedConversationId && !rows.some((row: any) => String(row.id) === requestedConversationId)) throw new Error('This chat is no longer available to your account.');
      setActiveChatId(nextId);
      if (nextId) await loadChatMessages(nextId);
    } catch (e) { setChatOpen(false); setError(errorText(e)); }
  }
  async function loadChatMessages(id: string) {
    if (!id) { setChatMessages([]); return; }
    try { const r = await api.get('/api/chat/messages?conversationId='+encodeURIComponent(id)); setChatMessages(r.data.messages || []); }
    catch (e) { setError(errorText(e)); }
  }
  async function sendChatMessage(e: FormEvent) {
    e.preventDefault(); if (!activeChatId || !chatDraft.trim() || chatBusy) return; setChatBusy(true);
    try {
      await api.post('/api/chat/messages', { conversationId: activeChatId, message: chatDraft.trim() });
      setChatDraft(''); await loadChatMessages(activeChatId);
      const r = await api.get('/api/chat/conversations'); setChatConversations(r.data.conversations || []);
      flash('Message sent successfully.');
    } catch (e) { setError(errorText(e)); } finally { setChatBusy(false); }
  }
  async function sendAnnouncement(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const r = await api.post('/api/admin/announcements', announcement);
      setAnnouncementHistory(current => [r.data.announcement, ...current].filter(Boolean).slice(0, 100));
      flash(r.data.message || 'Announcement sent.');
      setAnnouncement({ title: '', message: '', audience: 'all' });
    }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  async function loadProducts() {
    const r = await api.get('/api/products');
    setProducts(r.data.products || []);
  }
  async function loadCustomerOrders() {
    if (!user) { setCustomerOrders([]); return; }
    setCustomerOrdersLoading(true);
    try {
      const r = await api.get('/api/customer/orders');
      setCustomerOrders(r.data.orders || []);
    } catch (e) { setError(errorText(e)); }
    finally { setCustomerOrdersLoading(false); }
  }
  async function loadVendor(): Promise<Vendor | null> {
    if (!user) { setVendor(null); return null; }
    try {
      const r = await api.get('/api/vendor/me');
      const current = r.data.vendor || null;
      setVendor(current);
      return current;
    } catch { setVendor(null); return null; }
  }
  async function loadVendorWorkspace() {
    const [p, o, c, walletResult] = await Promise.all([
      api.get('/api/vendor/products'),
      api.get('/api/vendor/orders'),
      api.get('/api/vendor/coupons'),
      api.get('/api/vendor/wallet')
    ]);
    setVendorCoupons(c.data.coupons || []);
    setProducts(current => [...current.filter(x => !p.data.products.some((v: Product) => v.id === x.id)), ...p.data.products]);
    setOrders(o.data.orders || []);
    setVendorReports(o.data.summary || null);
    setWallet(walletResult.data);
  }
  async function loadAdmin() {
    await api.post('/api/admin/products/affiliate-default', {});
    const [v, o, p, a, s, w, u, t, c, af, announcements] = await Promise.all([api.get('/api/admin/vendors'), api.get('/api/admin/orders'), api.get('/api/admin/products'), api.get('/api/admin/analytics'),api.get('/api/admin/settings'),api.get('/api/admin/withdrawals'),api.get('/api/admin/users'),api.get('/api/admin/wallet-topups'),api.get('/api/admin/coupons'),api.get('/api/admin/affiliates'),api.get('/api/admin/announcements')]);
    setAdminCoupons(c.data.coupons || []); setAffiliateData(af.data || {affiliates:[],commissions:[],withdrawals:[],summary:{}});
    setSettings(s.data.settings); setWithdrawals(w.data.withdrawals||[]); setAdminUsers(u.data.users||[]); setWalletTopups(t.data.topups||[]);
    setVendors(v.data.vendors || []);
    setOrders(o.data.orders || []);
    setProducts(p.data.products || []);
    setAdminAnalytics(a.data);
    setAnnouncementHistory(announcements.data.announcements || []);
  }

  useEffect(() => {
    const timer = window.setInterval(() => setHeroSlide(current => (current + 1) % heroSlides.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const restored = await auth.getUser();
        if (!active) return;
        setUser(restored);
        const [r,s] = await Promise.all([api.get('/api/products'),api.get('/api/settings/public')]);
        if (active) { setProducts(r.data.products || []); setSettings(s.data.settings); }
        if (restored) {
          try {
            const pr = await api.get('/api/profile');
            if (active) {
              const savedProfile = pr.data.profile || null;
              setProfile(savedProfile);
              setCustomer(current => ({
                ...current,
                name: savedProfile?.fullName || restored.name || current.name,
                phone: savedProfile?.phone || current.phone,
                email: savedProfile?.email || restored.email || current.email,
                address: savedProfile?.address || current.address
              }));
            }
          } catch { /* profile can be completed later */ }
          try {
            const v = await api.get('/api/vendor/me');
            if (active) setVendor(v.data.vendor || null);
          } catch { /* vendor profile is optional */ }
        }
      } catch (e) { if (active) setError(errorText(e)); }
      finally { /* startup restoration has completed */ }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('wallet') === 'paystack') {
      if (!user) return;
      const reference = params.get('reference') || params.get('trxref');
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      if (!reference) { setError('Paystack returned without a wallet reference. Please contact support.'); return; }
      api.post('/api/wallet/topups/paystack/verify', { reference }).then(async r => {
        const w = await api.get('/api/wallet');
        setWalletSummary(w.data);
        flash(r.data.message || 'Wallet funded successfully.');
      }).catch(e => setError(errorText(e)));
      return;
    }
    if (params.get('payment') !== 'paystack') return;
    const reference = params.get('reference') || params.get('trxref');
    window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    if (!reference) { setError('Paystack returned without a transaction reference. Please contact support.'); return; }
    api.post('/api/payments/paystack/verify', { reference })
      .then(r => flash(r.data.message || 'Paystack payment verified successfully.'))
      .catch(e => setError(errorText(e)));
  }, [user]);

  useEffect(() => {
    if (!user) { setWalletSummary(null); return; }
    api.get('/api/wallet').then(r => setWalletSummary(r.data)).catch(() => setWalletSummary(null));
  }, [user]);

  useEffect(() => {
    api.get('/api/payments/status').then(r => {
      const ready = Boolean(r.data.paystackConfigured && r.data.paystackValid);
      setPaystackReady(ready);
      setPaystackMode(String(r.data.mode || ''));
      if (ready) { setCustomer(current => ({ ...current, paymentMethod: 'Paystack' })); setWalletTopupMethod('Paystack'); }
    }).catch(() => setPaystackReady(false));
  }, []);

  useEffect(() => {
    localStorage.setItem('yakaji-market-favorites', JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    if (page !== 'support') return;
    api.get('/api/support/status').then(r => setSupportStatus(r.data)).catch(() => {});
    if (!user) { setSupportConversation(''); setSupportMessages([]); return; }
    const requestedConversation = new URLSearchParams(window.location.search).get('conversationId') || '';
    const openExisting = async (id: string) => {
      const thread = await api.get('/api/support/messages?conversationId=' + encodeURIComponent(id));
      setSupportConversation(id);
      setSupportMessages(thread.data.messages || []);
      setSupportStatus((current:any) => ({ ...current, conversation: thread.data.conversation }));
    };
    if (requestedConversation) { openExisting(requestedConversation).catch(e => setError(errorText(e))); return; }
    api.post('/api/support/conversations', {}).then(r => {
      const id = String(r.data.conversation?.id || '');
      setSupportConversation(id);
      if (id) api.get('/api/support/messages?conversationId=' + encodeURIComponent(id)).then(m => { setSupportMessages(m.data.messages || []); setSupportStatus((current: any) => ({ ...current, conversation: m.data.conversation })); }).catch(() => {});
    }).catch(e => setError(errorText(e)));
  }, [page, user]);
  useEffect(() => {
    if (!user) return;
    const conn = ws.connect();
    supportSocketRef.current = conn;
    conn.onMessage((message: any) => {
      if (message?.type !== 'entity.update') return;
      const entity = message.payload || {};
      if (entity.entity_type === 'support_conversation' && entity.entity_id === supportConversationRef.current) {
        api.get('/api/support/messages?conversationId=' + encodeURIComponent(supportConversationRef.current)).then(r => { setSupportMessages(r.data.messages || []); setSupportStatus((current: any) => ({ ...current, conversation: r.data.conversation })); if (r.data.messages?.some((item:any) => item.sender === 'admin')) void loadNotifications(); }).catch(() => {});
      }
      if (entity.entity_type === 'support_admin_queue' && isAdmin) {
        api.get('/api/admin/support/conversations').then(r => setSupportConversations(r.data.conversations || [])).catch(() => {});
      }
    });
    return () => { conn.disconnect(); supportSocketRef.current = null; };
  }, [user]);
  useEffect(() => {
    const conn = supportSocketRef.current;
    if (!conn || !conn.connectionId) return;
    const subscriptions = async () => {
      if (page === 'support' && supportConversation) await api.post('/api/subscriptions', { entity_type: 'support_conversation', entity_id: supportConversation, connection_id: conn.connectionId });
      if (page === 'admin' && isAdmin) await api.post('/api/subscriptions', { entity_type: 'support_admin_queue', entity_id: 'marketplace', connection_id: conn.connectionId });
    };
    conn.ready.then(subscriptions).catch(() => {});
    return () => {
      if (page === 'support' && supportConversation) void api.post('/api/subscriptions/remove', { entity_type: 'support_conversation', entity_id: supportConversation, connection_id: conn.connectionId });
      if (page === 'admin' && isAdmin) void api.post('/api/subscriptions/remove', { entity_type: 'support_admin_queue', entity_id: 'marketplace', connection_id: conn.connectionId });
    };
  }, [page, supportConversation, isAdmin, user]);
  useEffect(() => {
    if (!user) { setUserNotifications([]); setUnreadNotifications(0); return; }
    void loadNotifications();
    const timer = window.setInterval(() => { void loadNotifications(); }, 20000);
    const off = notifications.onMessage(() => { void loadNotifications(); });
    return () => { window.clearInterval(timer); off(); };
  }, [user]);
  useEffect(() => {
    if (!chatOpen) return;
    let active = true;
    const refreshInbox = async () => {
      try {
        const r = await api.get('/api/chat/conversations');
        if (!active) return;
        const rows = r.data.conversations || [];
        setChatConversations(rows);
        if (!activeChatId && rows.length) setActiveChatId(String(rows[0].id));
      } catch (e) {
        if (active) setError(errorText(e));
      }
    };
    void refreshInbox();
    if (activeChatId) void loadChatMessages(activeChatId);
    const timer = window.setInterval(() => {
      void refreshInbox();
      if (activeChatId) void loadChatMessages(activeChatId);
    }, 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, [chatOpen, activeChatId]);
  useEffect(() => {
    if (page !== 'orders' || !user) return;
    void loadCustomerOrders();
    // Keep My Orders in sync when an admin confirms a payment from another device.
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void loadCustomerOrders(); }, 8000);
    const refreshOnReturn = () => { if (document.visibilityState === 'visible') void loadCustomerOrders(); };
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refreshOnReturn); };
  }, [page, user]);
  useEffect(() => {
    if (!user || notificationDeepLinkHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const orderId = params.get('orderId') || '';
    const conversationId = params.get('conversationId') || '';
    if (view === 'orders' || orderId) {
      notificationDeepLinkHandledRef.current = true;
      setHighlightedOrderId(orderId);
      setPage('orders');
      void loadCustomerOrders();
    } else if (view === 'chat' || conversationId) {
      notificationDeepLinkHandledRef.current = true;
      void openChatInbox(undefined, conversationId);
    }
  }, [user]);
  useEffect(() => {
    if (page !== 'orders' || !highlightedOrderId || !customerOrders.some(order => order.id === highlightedOrderId)) return;
    const timer = window.setTimeout(() => document.getElementById('customer-order-' + highlightedOrderId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    return () => window.clearTimeout(timer);
  }, [page, highlightedOrderId, customerOrders]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get('ref');
    const sharePathMatch = window.location.pathname.match(/^\/share\/product\/([^/]+)\/?$/);
    let pathProductId = '';
    try { pathProductId = sharePathMatch ? decodeURIComponent(sharePathMatch[1]) : ''; } catch { pathProductId = ''; }
    const sharedProductId = params.get('product') || pathProductId;
    if (referralCode) { localStorage.setItem('yakaji-affiliate-ref', referralCode); const clickKey = 'yakaji-aff-clicked:' + referralCode + ':' + String(sharedProductId || ''); if (sharedProductId && !sessionStorage.getItem(clickKey)) { sessionStorage.setItem(clickKey, '1'); api.post('/api/affiliate/click', { referralCode, productId: sharedProductId }).catch(() => sessionStorage.removeItem(clickKey)); } }
    if (!sharedProductId) return;
    const sharedProduct = products.find(product => product.id === sharedProductId && product.status === 'approved');
    if (sharedProduct) {
      deepLinkRequestRef.current = sharedProductId;
      setSelectedProduct(sharedProduct);
      setSelectedProductOption(sharedProduct.options?.[0] || '');
      setSelectedImageIndex(0);
      setPhotoViewerOpen(false);
      setDetailQuantity(1);
      return;
    }
    if (deepLinkRequestRef.current === sharedProductId) return;
    deepLinkRequestRef.current = sharedProductId;
    api.get('/api/products/' + encodeURIComponent(sharedProductId)).then(r => {
      const product = r.data.product as Product;
      if (!product?.id || product.status !== 'approved') throw new Error('This product is no longer available.');
      setProducts(current => current.some(item => item.id === product.id) ? current : [...current, product]);
      setSelectedProduct(product);
      setSelectedProductOption(product.options?.[0] || '');
      setSelectedImageIndex(0);
      setPhotoViewerOpen(false);
      setDetailQuantity(1);
    }).catch(e => {
      deepLinkRequestRef.current = '';
      setError(errorText(e));
    });
  }, [products]);

  useEffect(() => {
    if (!selectedProduct) return;
    let active = true;
    setProductReviews([]); setReviewAverage(0); setReviewCount(0); setReviewComment(''); setReviewRating(5);
    api.get('/api/products/' + selectedProduct.id + '/reviews').then(r => {
      if (!active) return;
      setProductReviews(r.data.reviews || []); setReviewAverage(Number(r.data.average || 0)); setReviewCount(Number(r.data.count || 0));
    }).catch(() => { if (active) { setProductReviews([]); setReviewAverage(0); setReviewCount(0); } });
    return () => { active = false; };
  }, [selectedProduct?.id]);
  useEffect(() => {
    if (!photoViewerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPhotoViewerOpen(false);
      if (event.key === 'ArrowRight') setSelectedImageIndex(index => Math.min(index + 1, Math.max(0, photoCount - 1)));
      if (event.key === 'ArrowLeft') setSelectedImageIndex(index => Math.max(0, index - 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [photoViewerOpen, photoCount]);
  useEffect(() => {
    if (page !== 'admin' || !isAdmin) return;
    Promise.all([api.get('/api/admin/support/conversations'), api.get('/api/admin/support/settings')]).then(([c,s]) => {
      setSupportConversations(c.data.conversations || []);
      setSupportAdminSettings(s.data.settings || { online: true, maxConcurrent: 1, offlineMessage: '' });
    }).catch(e => setError(errorText(e)));
  }, [page, isAdmin]);

  const visibleProducts = useMemo(() => {
    const result = products.filter(p =>
      p.status === 'approved' &&
      (category === 'All' || p.category === category) &&
      (!showFavoritesOnly || favorites.includes(p.id)) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()) || (p.vendorName || '').toLowerCase().includes(search.toLowerCase()))
    );
    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, category, search, sortBy, showFavoritesOnly, favorites]);
  function toggleFavorite(id: string) {
    setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }
  function productShareUrl(product: Product, referralCode?: string) {
    // Use the deployed marketplace root with a query-string deep link. The host reliably serves the SPA at '/',
    // while nested /share/product paths can be treated as static folders and fail to load app assets.
    const url = new URL('/', window.location.origin);
    url.searchParams.set('product', product.id);
    if (referralCode) url.searchParams.set('ref', referralCode);
    return url.toString();
  }
  function shareProductToNetwork(product: Product, network: 'whatsapp' | 'facebook' | 'x', referralCode?: string) {
    const link = productShareUrl(product, referralCode);
    const text = product.name + ' — ' + money(product.price) + '. ' + String(product.description || '').slice(0, 160);
    const target = network === 'whatsapp'
      ? 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + link)
      : network === 'facebook'
        ? 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link)
        : 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(product.name + ' — ' + money(product.price)) + '&url=' + encodeURIComponent(link);
    window.open(target, '_blank', 'noopener,noreferrer');
  }
  function openProduct(product: Product) {
    setSelectedProduct(product);
    setSelectedProductOption(product.options?.[0] || '');
    setSelectedImageIndex(0);
    setPhotoViewerOpen(false);
    setDetailQuantity(1);
    const url = new URL(window.location.href);
    url.pathname = '/';
    url.searchParams.set('product', product.id);
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }
  function closeProduct() {
    setPhotoViewerOpen(false);
    setSelectedProduct(null);
    const url = new URL(window.location.href);
    url.pathname = '/';
    url.searchParams.delete('product');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }
  async function copyProductLink(product: Product) {
    const link = productShareUrl(product);
    try {
      await navigator.clipboard.writeText(link);
      flash('Product link copied. You can paste and share it anywhere.');
    } catch {
      window.prompt('Copy this product link:', link);
    }
  }
  async function copyProductLinkWithReferral(product: Product, referralCode: string) {
    const link = productShareUrl(product, referralCode);
    try {
      await navigator.clipboard.writeText(link);
      flash('Your product affiliate link has been copied.');
    } catch {
      window.prompt('Copy your product affiliate link:', link);
    }
  }
  async function shareAffiliateProduct(product: Product) {
    const link = productShareUrl(product, affiliateApplication?.referralCode);
    const title = product.name + ' | Yakaji Digital Hub';
    const text = product.name + ' — ' + money(product.price) + '. ' + String(product.description || '').slice(0, 160);
    if (navigator.share) {
      try { await navigator.share({ title, text, url: link }); }
      catch (e) { if (!(e instanceof Error && e.name === 'AbortError')) flash('Sharing was not completed. You can copy your affiliate link instead.'); }
    } else {
      await copyProductLinkWithReferral(product, String(affiliateApplication?.referralCode || ''));
    }
  }
  async function shareProduct(product: Product) {
    const url = productShareUrl(product);
    const title = product.name + ' | Yakaji Digital Hub';
    const shareText = product.name + ' — ' + money(product.price) + '. View this product on Yakaji Digital Hub:';
    if (navigator.share) {
      try { await navigator.share({ title, text: shareText, url }); }
      catch (e) { if (!(e instanceof Error && e.name === 'AbortError')) flash('Sharing was not completed. You can copy the product link instead.'); }
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(shareText + ' ' + url), '_blank', 'noopener,noreferrer');
    }
  }
  const cartSubtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const couponSavings = Math.min(cartSubtotal, Number(appliedCoupon?.discount || 0));
  const cartTotal = Math.max(0, cartSubtotal - couponSavings) + (customer.paymentMethod === 'Bank transfer' ? settings.customerTransferFee : 0);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const dailyTrend = adminAnalytics?.dailyTrend || [];
  const monthlyTrend = adminAnalytics?.monthlyTrend || [];
  const orderStatuses = adminAnalytics?.orderStatuses || [];
  const paymentMethods = adminAnalytics?.paymentMethods || [];
  const maxTrendRevenue = Math.max(1, ...monthlyTrend.map((point: any) => Number(point.paidRevenue || 0)));
  const maxTrendOrders = Math.max(1, ...dailyTrend.map((point: any) => Number(point.orders || 0)));

  async function signIn() {
    setError('');
    try { await auth.signInWithRedirect(); }
    catch (e) { setError(errorText(e)); }
  }
  async function signOut() {
    await auth.signOut();
    setUser(null); setVendor(null); setPage('home'); flash('You have signed out.');
  }
  function addToCart(product: Product, optionOverride?: string, quantityToAdd = 1) {
    if (product.stock < 1) { flash('This product is currently out of stock.'); return; }
    setCart(items => {
      const found = items.find(x => x.product.id === product.id);
      if (found) return items.map(x => x.product.id === product.id ? { ...x, quantity: Math.min(x.quantity + quantityToAdd, product.stock) } : x);
      return [...items, { product, quantity: Math.min(quantityToAdd, product.stock), option: optionOverride || product.options[0] || '' }];
    });
    flash('Added to your shopping cart.');
  }
  async function placeOrder(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const orderPayload = {
        customerName: customer.name, phone: customer.phone, email: customer.email.trim(),
        address: customer.address,
        couponCode: appliedCoupon?.code || '',
        referralCode: localStorage.getItem('yakaji-affiliate-ref') || '',
        items: cart.map(x => ({ productId: x.product.id, quantity: x.quantity, option: x.option }))
      };
      const r = customer.paymentMethod === 'Wallet'
        ? await api.post('/api/orders/wallet', orderPayload)
        : await api.post('/api/orders', { ...orderPayload, paymentMethod: customer.paymentMethod });
      setCart([]); setCheckoutOpen(false); setCouponCode(''); setAppliedCoupon(null);
      setCustomer({ name: '', phone: '', email: '', address: '', paymentMethod: 'Paystack' });
      if (customer.paymentMethod === 'Paystack' && r.data.authorizationUrl) {
        window.location.href = r.data.authorizationUrl;
        return;
      }
      if (customer.paymentMethod === 'Bank transfer') {
        setManualTransferOrder({ orderNumber: r.data.orderNumber, total: Number(r.data.total || 0) });
      } else if (customer.paymentMethod === 'Wallet') {
        const [w, history] = await Promise.all([api.get('/api/wallet'), api.get('/api/customer/orders')]);
        setWalletSummary(w.data); setCustomerOrders(history.data.orders || []);
        flash('Order ' + r.data.orderNumber + ' paid successfully. Exactly ' + money(Number(r.data.total)) + ' was deducted from your wallet.');
      } else {
        flash('Order ' + r.data.orderNumber + ' placed successfully.' + (Number(r.data.couponDiscount || 0) ? ' Coupon saved ' + money(Number(r.data.couponDiscount)) + '.' : ''));
      }
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function openWallet() {
    if (!user) { setPage('wallet'); await signIn(); return; }
    setError('');
    try {
      const [walletResult, withdrawalResult] = await Promise.all([api.get('/api/wallet'), api.get('/api/customer/withdrawals')]);
      setWalletSummary(walletResult.data);
      setCustomerWithdrawals(withdrawalResult.data.withdrawals || []);
      setPage('wallet');
    } catch (e) { setError(errorText(e)); }
  }
  async function refreshWallet() {
    if (!user) return;
    try {
      const [walletResult, withdrawalResult] = await Promise.all([api.get('/api/wallet'), api.get('/api/customer/withdrawals')]);
      setWalletSummary(walletResult.data);
      setCustomerWithdrawals(withdrawalResult.data.withdrawals || []);
      flash('Wallet balance, funding and withdrawal status refreshed.');
    } catch (e) { setError(errorText(e)); }
  }
  async function requestCustomerWithdrawal(e: FormEvent) {
    e.preventDefault(); setCustomerWithdrawalBusy(true); setError('');
    try {
      const result = await api.post('/api/customer/withdrawals', { ...customerWithdrawalForm, amount: Number(customerWithdrawalForm.amount) });
      const [walletResult, history] = await Promise.all([api.get('/api/wallet'), api.get('/api/customer/withdrawals')]);
      setWalletSummary(walletResult.data);
      setCustomerWithdrawals(history.data.withdrawals || []);
      setCustomerWithdrawalForm({ amount:'', bankName:'', accountNumber:'', accountName:'' });
      flash(result.data.message || 'Withdrawal request submitted for owner approval.');
    } catch (e) { setError(errorText(e)); }
    finally { setCustomerWithdrawalBusy(false); }
  }
  async function startWalletTopup(e: FormEvent) {
    e.preventDefault();
    const amount = Number(walletTopupAmount);
    if (!Number.isSafeInteger(amount) || amount < 100 || amount > 5000000) { setError('Enter an amount from ₦100 to ₦5,000,000.'); return; }
    setWalletTopupBusy(true); setError('');
    try {
      const r = await api.post('/api/wallet/topups', { amount, paymentMethod: walletTopupMethod, email: walletTopupEmail.trim() });
      if (walletTopupMethod === 'Paystack') {
        if (!r.data.authorizationUrl) throw new Error('Paystack did not return a checkout link. Your wallet was not credited. Refresh wallet history or contact support before trying again.');
        window.location.href = r.data.authorizationUrl;
        return;
      }
      setWalletTransferDetails({ reference: r.data.reference, amount: Number(r.data.amount), fee: Number(r.data.fee), total: Number(r.data.total) });
      const walletResult = await api.get('/api/wallet');
      setWalletSummary(walletResult.data);
      setWalletTopupAmount('');
    } catch (e) { setError(errorText(e)); }
    finally { setWalletTopupBusy(false); }
  }
  async function confirmWalletTopup(id: string) {
    try {
      const result = await api.put('/api/admin/wallet-topups/' + id + '/confirm', {});
      await loadAdmin();
      flash(result.data.message || 'Wallet top-up reviewed.');
    } catch (e) { setError(errorText(e)); }
  }
  async function rejectWalletTopup(id: string) {
    if (!window.confirm('Reject this pending wallet top-up? The customer wallet will not be credited.')) return;
    try { await api.put('/api/admin/wallet-topups/' + id + '/reject', {}); await loadAdmin(); flash('Wallet top-up request rejected.'); }
    catch (e) { setError(errorText(e)); }
  }
  async function fundCustomerWallet(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r = await api.post('/api/admin/customers/' + customerCreditForm.customerId + '/wallet-credit', { amount: Number(customerCreditForm.amount) });
      setCustomerCreditForm({customerId:'',amount:''});
      await loadAdmin();
      flash('Customer wallet funded: ' + money(Number(r.data.amount)) + '. New balance: ' + money(Number(r.data.balance)));
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function fundVendorWallet(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try { const r = await api.post('/api/admin/vendors/' + vendorCreditForm.vendorId + '/wallet-credit', { amount: Number(vendorCreditForm.amount) }); setVendorCreditForm({vendorId:'',amount:''}); await loadAdmin(); flash('Vendor wallet funded: ' + money(Number(r.data.amount)) + '.'); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function openProfile() {
    if (!user) { await signIn(); return; }
    setError('');
    try {
      const r = await api.get('/api/profile');
      setProfile(r.data.profile || null);
      setAvatarFile(null);
      setPage('profile');
    } catch (e) { setError(errorText(e)); }
  }
  async function saveProfile(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (avatarFile) {
        const base64 = await fileToBase64(avatarFile);
        await api.post('/api/profile/avatar', { fileName: avatarFile.name, contentType: avatarFile.type, base64 });
      }
      const r = await api.put('/api/profile', profile);
      setProfile(r.data.profile || null);
      setAvatarFile(null);
      flash('Your marketplace profile has been saved.');
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function cancelCustomerOrder(order: Order) {
    if (!window.confirm('Cancel unpaid order ' + order.orderNumber + '?')) return;
    try { await api.put('/api/customer/orders/' + order.id + '/cancel', {}); await loadCustomerOrders(); flash('Your unpaid order has been cancelled.'); }
    catch (e) { setError(errorText(e)); }
  }
  async function sendSupportMessage(e: FormEvent) {
    e.preventDefault(); if (!supportDraft.trim() || !supportConversation) return;
    setBusy(true);
    try {
      const r = await api.post('/api/support/messages', { conversationId: supportConversation, message: supportDraft.trim() });
      setSupportDraft('');
      const thread = await api.get('/api/support/messages?conversationId=' + encodeURIComponent(supportConversation));
      setSupportMessages(thread.data.messages || []);
      setSupportStatus((current: any) => ({ ...current, conversation: thread.data.conversation }));
      if (r.data.handedOff) flash('Your request has been sent to a human support agent. Yakaji AI is now paused for this chat.');
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  async function requestHumanSupport() {
    if (!supportConversation) return;
    try {
      await api.post('/api/support/messages', { conversationId: supportConversation, message: 'I want to speak with a human live support agent, please.' });
      const thread = await api.get('/api/support/messages?conversationId=' + encodeURIComponent(supportConversation));
      setSupportMessages(thread.data.messages || []);
      setSupportStatus((current:any) => ({ ...current, conversation: thread.data.conversation }));
      flash('Human support requested. AI replies are paused until the agent finishes or resumes AI support.');
    } catch (e) { setError(errorText(e)); }
  }
  async function sendAdminReply(e: FormEvent) {
    e.preventDefault();
    const message = adminReply.trim();
    const conversationId = activeSupportConversation;
    if (!message || !conversationId || busy) return;
    setBusy(true);
    setError('');
    try {
      await api.post('/api/admin/support/reply', { conversationId, message });
      setAdminReply('');
      const [thread, inbox] = await Promise.all([
        api.get('/api/support/messages?conversationId=' + encodeURIComponent(conversationId)),
        api.get('/api/admin/support/conversations')
      ]);
      setSupportMessages(thread.data.messages || []);
      setSupportConversations(inbox.data.conversations || []);
      flash('Your private reply was sent to this customer.');
    } catch (e) {
      setError('Reply was not sent: ' + errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function updateSupportAvailability(online: boolean) {
    try {
      const r = await api.put('/api/admin/support/settings', { ...supportAdminSettings, online });
      setSupportAdminSettings(r.data.settings);
      flash(online ? 'Live support is now available.' : 'Live support is now offline. Customers can still leave messages.');
    } catch (e) { setError(errorText(e)); }
  }
  async function updateSupportConversationStatus(conversationId: string, status: string, mode?: string) {
    try {
      await api.put('/api/admin/support/conversations/' + encodeURIComponent(conversationId), { status, ...(mode ? { mode } : {}) });
      const r = await api.get('/api/admin/support/conversations');
      setSupportConversations(r.data.conversations || []);
      if (activeSupportConversation === conversationId) {
        const m = await api.get('/api/support/messages?conversationId=' + encodeURIComponent(conversationId));
        setSupportMessages(m.data.messages || []);
      }
    } catch (e) { setError(errorText(e)); }
  }
  async function submitProductReview(e: FormEvent) {
    e.preventDefault();
    if (!selectedProduct || !user || !reviewComment.trim()) { setError('Please choose a star rating and write your product review.'); return; }
    setReviewSubmitting(true); setError('');
    try {
      await api.post('/api/products/' + selectedProduct.id + '/reviews', { rating: reviewRating, comment: reviewComment.trim() });
      setReviewComment('');
      const r = await api.get('/api/products/' + selectedProduct.id + '/reviews');
      setProductReviews(r.data.reviews || []); setReviewAverage(Number(r.data.average || 0)); setReviewCount(Number(r.data.count || 0));
      flash('Your product review has been published. Thank you!');
    } catch (e) { setError(errorText(e)); }
    finally { setReviewSubmitting(false); }
  }
  function changePhoto(direction: number) {
    if (!photoCount) return;
    setSelectedImageIndex(index => (index + direction + photoCount) % photoCount);
  }
  async function reviewPayment(id: string, decision: 'pending' | 'rejected') {
    const reason = decision === 'rejected'
      ? window.prompt('Reason for rejecting this payment (optional):', 'Payment not received or could not be verified.')
      : '';
    if (decision === 'rejected' && reason === null) return;
    try {
      const r = await api.put('/api/admin/orders/' + id + '/payment-review', { decision, reason: reason || '' });
      await loadAdmin();
      flash(r.data.message || 'Payment review saved.');
    } catch (e) { setError(errorText(e)); }
  }
  async function confirmPayment(id: string, manualPaystack = false) {
    let payload: Record<string, unknown> = {};
    if (manualPaystack) {
      const confirmationNote = window.prompt('You must first check your Paystack dashboard and confirm that this exact order reference and amount show SUCCESS. Enter an audit note (for example: Checked Paystack dashboard; transaction successful; amount and reference match):');
      if (confirmationNote === null || confirmationNote.trim().length < 8) { setError('Manual confirmation cancelled. Enter an audit note after checking Paystack.'); return; }
      if (!window.confirm('Confirm that you personally checked Paystack and verified the successful payment, exact amount and transaction reference? This will mark the payment successful and notify the customer.')) return;
      payload = { manualConfirmation: true, confirmationNote: confirmationNote.trim() };
    }
    try {
      const r = await api.put('/api/admin/orders/' + id + '/payment', payload);
      await loadAdmin();
      flash(r.data.message || 'Payment review completed.');
    } catch (e) { setError(errorText(e)); }
  }
  async function openAffiliate() {
    setPage('affiliate');
    if (!user) { await signIn(); return; }
    setError('');
    try {
      const params = new URLSearchParams(window.location.search);
      // Load the affiliate account and eligible product catalogue concurrently to reduce dashboard wait time.
      const [r, catalog] = await Promise.all([
        api.get('/api/affiliate/me'),
        api.get('/api/affiliate/products').then(response => response).catch(() => ({ data: { products: [] } }))
      ]);
      if (r.data.affiliate && ['approved','active'].includes(String(r.data.affiliate.status))) setAffiliateProducts(catalog.data.products || []);
      setAffiliateApplication(r.data.affiliate || null);
      setAffiliateDashboard({ commissions: r.data.commissions || [], withdrawals: r.data.withdrawals || [], summary: r.data.summary || {} });
      if (params.get('affiliate') === 'paystack' && params.get('reference')) {
        const verified = await api.post('/api/affiliate/paystack/verify', { reference: params.get('reference') });
        setAffiliateApplication(verified.data.affiliate);
        window.history.replaceState({}, '', window.location.pathname);
        flash('Affiliate registration payment verified. Your application is awaiting owner approval.');
      }
      if (r.data.affiliate) {
        const a = r.data.affiliate;
        setAffiliateForm(current => ({ ...current, fullName: String(a.fullName || current.fullName), phone: String(a.phone || current.phone), whatsapp: String(a.whatsapp || current.whatsapp), address: String(a.address || ''), city: String(a.city || ''), state: String(a.state || ''), socialHandle: String(a.socialHandle || ''), paymentMethod: String(a.registrationPaymentMethod || 'Wallet') }));
      } else {
        setAffiliateForm(current => ({ ...current, fullName: current.fullName || user.name || '', phone: current.phone || profile?.phone || '', whatsapp: current.whatsapp || profile?.whatsapp || '', address: profile?.address || '', city: profile?.city || '', state: profile?.state || '' }));
      }
    } catch (e) { setError(errorText(e)); }
  }
  async function requestAffiliateWithdrawal(e: FormEvent) {
    e.preventDefault(); setAffiliateWithdrawBusy(true); setError('');
    try { const result = await api.post('/api/affiliate/withdrawals', { ...affiliateWithdrawForm, amount: Number(affiliateWithdrawForm.amount) }); setAffiliateWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountName: '' }); await openAffiliate(); flash(result.data.message || 'Withdrawal request submitted.'); }
    catch (e) { setError(errorText(e)); } finally { setAffiliateWithdrawBusy(false); }
  }
  async function applyAsAffiliate(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await api.post('/api/affiliate/apply', affiliateForm);
      setAffiliateApplication(r.data.affiliate);
      if (r.data.authorizationUrl) { window.location.href = r.data.authorizationUrl; return; }
      if (r.data.bankTransfer) setAffiliateTransfer(r.data.bankTransfer);
      flash(affiliateForm.paymentMethod === 'Wallet' ? 'Registration fee paid from your wallet. Your application is awaiting owner approval.' : 'Application submitted. Complete the manual transfer and wait for owner confirmation.');
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function applyAsVendor(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r = await api.post('/api/vendor/apply', shopForm);
      setVendor(r.data.vendor); flash('Vendor application submitted. Your shop will open after approval.');
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  function startNewProduct() { setDraft(blankDraft); setSelectedFiles([]); setEditing(false); }
  function startEdit(p: Product) {
    setDraft({ id: p.id, name: p.name, category: p.category, price: String(p.standardPrice ?? p.price), description: p.description, stock: String(p.stock), tag: p.tag, options: p.options.join(', '), images: p.imagePaths || [], videos: p.videoPaths || [], affiliateCommissionPercent: String(Number(p.affiliateCommissionPercent ?? 0) >= 5 ? p.affiliateCommissionPercent : 5), marketplaceCommissionPercent: p.marketplaceCommissionPercent === undefined ? '' : String(p.marketplaceCommissionPercent), discountMode: p.discountPrice ? 'manual' : 'none', discountValue: p.discountPrice ? String(p.discountPrice) : '', discountStartAt: p.discountStartAt ? new Date(p.discountStartAt).toISOString().slice(0,16) : '', discountEndAt: p.discountEndAt ? new Date(p.discountEndAt).toISOString().slice(0,16) : '' });
    setSelectedFiles([]); setEditing(true);
    document.getElementById('product-editor')?.scrollIntoView({ behavior: 'smooth' });
  }
  async function uploadMedia(): Promise<Media[]> {
    const uploaded: Media[] = [];
    for (const file of selectedFiles) {
      const max = file.type.startsWith('video/') ? 30 * 1024 * 1024 : 8 * 1024 * 1024;
      if (file.size > max) throw new Error(file.type.startsWith('video/') ? 'Each video must be 30MB or smaller.' : 'Each image must be 8MB or smaller.');
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) throw new Error('Only image and video files are supported.');
      const data = await fileToBase64(file);
      const r = await api.post('/api/media', { fileName: file.name, contentType: file.type, base64: data });
      uploaded.push({ path: r.data.path, url: r.data.url, type: file.type.startsWith('video/') ? 'video' : 'image' });
    }
    return uploaded;
  }
  async function saveProduct(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const media = await uploadMedia();
      const standardPrice = Number(draft.price);
      const discountPrice = draft.discountMode === 'manual'
        ? Number(draft.discountValue || 0)
        : draft.discountMode === 'percentage'
          ? Math.round(standardPrice * (1 - Number(draft.discountValue || 0) / 100))
          : 0;
      if (discountPrice > 0 && discountPrice >= standardPrice) throw new Error('Discount price must be lower than the standard price.');
      if (draft.discountMode === 'percentage' && (Number(draft.discountValue) <= 0 || Number(draft.discountValue) >= 100)) throw new Error('Enter a discount percentage between 1 and 99.');
      const payload = {
        name: draft.name, category: draft.category, price: standardPrice, discountPrice,
        discountStartAt: draft.discountStartAt ? new Date(draft.discountStartAt).toISOString() : '',
        discountEndAt: draft.discountEndAt ? new Date(draft.discountEndAt).toISOString() : '',
        description: draft.description, stock: Number(draft.stock), tag: draft.tag,
        affiliateCommissionPercent: Number(draft.affiliateCommissionPercent),
        ...(isAdmin && draft.marketplaceCommissionPercent !== '' ? { marketplaceCommissionPercent: Number(draft.marketplaceCommissionPercent) } : {}),
        options: draft.options.split(',').map(x => x.trim()).filter(Boolean),
        images: [...draft.images, ...media.filter(x => x.type === 'image').map(x => x.path)],
        videos: [...draft.videos, ...media.filter(x => x.type === 'video').map(x => x.path)]
      };
      if (editing && draft.id) await api.put((isAdmin ? '/api/admin/products/' : '/api/vendor/products/') + draft.id, payload);
      else await api.post(isAdmin ? '/api/admin/products' : '/api/vendor/products', payload);
      await loadProducts();
      if (page === 'admin') await loadAdmin(); else await loadVendorWorkspace();
      startNewProduct(); flash(editing ? 'Product updated.' : 'Product submitted. It will appear after approval.');
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function applyCoupon() {
    if (!couponCode.trim()) { setError('Enter a coupon code first.'); return; }
    if (!cart.length) { setError('Add products to your cart before applying a coupon.'); return; }
    setCouponBusy(true); setError('');
    try {
      const result = await api.post('/api/coupons/validate', {
        code: couponCode.trim(),
        items: cart.map(line => ({ productId: line.product.id, quantity: line.quantity }))
      });
      setAppliedCoupon(result.data);
      flash('Coupon ' + result.data.code + ' applied. You save ' + money(Number(result.data.discount)) + '.');
    } catch (e) {
      setAppliedCoupon(null);
      setError(errorText(e));
    } finally { setCouponBusy(false); }
  }
  async function saveVendorCoupon(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api.post('/api/vendor/coupons', {
        ...couponDraft,
        discountValue: Number(couponDraft.discountValue),
        minOrderAmount: Number(couponDraft.minOrderAmount || 0),
        maxDiscount: Number(couponDraft.maxDiscount || 0),
        usageLimit: Number(couponDraft.usageLimit || 0),
        startsAt: couponDraft.startsAt ? new Date(couponDraft.startsAt).toISOString() : '',
        expiresAt: couponDraft.expiresAt ? new Date(couponDraft.expiresAt).toISOString() : ''
      });
      setCouponDraft({ code: '', discountType: 'percentage', discountValue: '10', productIds: [], minOrderAmount: '', maxDiscount: '', usageLimit: '0', startsAt: '', expiresAt: '' });
      const refreshed = await api.get('/api/vendor/coupons');
      setVendorCoupons(refreshed.data.coupons || []);
      flash('Coupon created successfully.');
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function saveAdminCoupon(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api.post('/api/admin/coupons', {
        ...adminCouponDraft,
        discountValue: Number(adminCouponDraft.discountValue),
        minOrderAmount: Number(adminCouponDraft.minOrderAmount || 0),
        maxDiscount: Number(adminCouponDraft.maxDiscount || 0),
        usageLimit: Number(adminCouponDraft.usageLimit || 0),
        startsAt: adminCouponDraft.startsAt ? new Date(adminCouponDraft.startsAt).toISOString() : '',
        expiresAt: adminCouponDraft.expiresAt ? new Date(adminCouponDraft.expiresAt).toISOString() : ''
      });
      setAdminCouponDraft({ code: '', discountType: 'percentage', discountValue: '10', productIds: [], minOrderAmount: '', maxDiscount: '', usageLimit: '0', startsAt: '', expiresAt: '' });
      const refreshed = await api.get('/api/admin/coupons');
      setAdminCoupons(refreshed.data.coupons || []);
      flash('Marketplace coupon created successfully.');
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function updateAdminCoupon(id: string, status: string) {
    try {
      await api.put('/api/admin/coupons/' + id, { status });
      const refreshed = await api.get('/api/admin/coupons');
      setAdminCoupons(refreshed.data.coupons || []);
      flash('Marketplace coupon status updated.');
    } catch (e) { setError(errorText(e)); }
  }
  async function deleteAdminCoupon(id: string) {
    if (!window.confirm('Delete this marketplace coupon?')) return;
    try {
      await api.delete('/api/admin/coupons/' + id);
      setAdminCoupons(current => current.filter(coupon => coupon.id !== id));
      flash('Marketplace coupon deleted.');
    } catch (e) { setError(errorText(e)); }
  }
  async function updateVendorCoupon(id: string, status: string) {
    try {
      await api.put('/api/vendor/coupons/' + id, { status });
      const refreshed = await api.get('/api/vendor/coupons');
      setVendorCoupons(refreshed.data.coupons || []);
      flash('Coupon status updated.');
    } catch (e) { setError(errorText(e)); }
  }
  async function deleteVendorCoupon(id: string) {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete('/api/vendor/coupons/' + id);
      setVendorCoupons(current => current.filter(coupon => coupon.id !== id));
      flash('Coupon deleted.');
    } catch (e) { setError(errorText(e)); }
  }
  async function deleteProduct(id: string) {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete((isAdmin ? '/api/admin/products/' : '/api/vendor/products/') + id);
      await loadProducts(); if (page === 'admin') await loadAdmin(); else await loadVendorWorkspace();
      flash('Product deleted.');
    } catch (e) { setError(errorText(e)); }
  }
  async function openVendor() {
    if (!user) { await signIn(); return; }
    setPage('vendor'); setError('');
    // The vendor profile is already restored during app startup. Show the approved dashboard immediately
    // and refresh its panels in parallel instead of waiting for another profile round trip.
    if (vendor?.status === 'approved') {
      void Promise.all([loadVendorWorkspace(), loadVendor()]).catch(e => setError(errorText(e)));
      return;
    }
    try {
      const currentVendor = await loadVendor();
      if (currentVendor?.status === 'approved') await loadVendorWorkspace();
    } catch (e) { setError(errorText(e)); }
  }
  async function openAdmin() {
    if (!isAdmin) { await signIn(); return; }
    setPage('admin'); setError('');
    try {
      const [settings, inbox] = await Promise.all([api.get('/api/admin/support/settings'), api.get('/api/admin/support/conversations')]);
      setSupportAdminSettings(settings.data.settings);
      setSupportConversations(inbox.data.conversations || []);
      await loadAdmin();
    } catch (e) { setError(errorText(e)); }
  }
  async function saveSettings(){try{const r=await api.put('/api/admin/settings',settings);setSettings(r.data.settings);flash('Marketplace fees and commission saved.');}catch(e){setError(errorText(e));}}
  async function setDefaultAffiliateRates(){
    if (!window.confirm('Set every existing product with no affiliate rate (or below 5%) to 5%? Existing rates of 5% or more will stay unchanged.')) return;
    setBusy(true); setError('');
    try { const r=await api.post('/api/admin/products/affiliate-default',{}); await loadAdmin(); flash('Affiliate rate update complete: '+r.data.updatedCount+' of '+r.data.totalProducts+' products set to 5%.'); }
    catch(e){setError(errorText(e));}
    finally{setBusy(false);}
  }
  async function requestWithdrawal(e:FormEvent){e.preventDefault();try{await api.post('/api/vendor/withdrawals',{...withdrawForm,amount:Number(withdrawForm.amount)});setWithdrawForm({amount:'',bankName:'',accountNumber:'',accountName:''});await loadVendorWorkspace();flash('Withdrawal request submitted for owner approval.');}catch(e){setError(errorText(e));}}
  async function updateWithdrawal(id:string,status:string){try{await api.put('/api/admin/withdrawals/'+id,{status});await loadAdmin();flash('Withdrawal status updated.');}catch(e){setError(errorText(e));}}
  async function updateAffiliateStatus(id:string,status:string) {
    try { await api.put('/api/admin/affiliates/'+id,{status}); await loadAdmin(); flash('Affiliate status updated.'); }
    catch(e) { setError(errorText(e)); }
  }
  async function updateAffiliateWithdrawal(id:string,status:string) {
    try { await api.put('/api/admin/affiliate-withdrawals/'+id,{status}); await loadAdmin(); flash('Affiliate withdrawal updated.'); }
    catch(e) { setError(errorText(e)); }
  }
  async function approveVendor(id: string, status: string) {
    try { await api.put('/api/admin/vendors/' + id, { status }); await loadAdmin(); flash('Vendor status updated.'); }
    catch (e) { setError(errorText(e)); }
  }
  async function approveProduct(id: string, status: string) {
    try { await api.put('/api/admin/products/' + id + '/review', { status }); await loadAdmin(); flash('Product review status updated.'); }
    catch (e) { setError(errorText(e)); }
  }
  async function changeOrderStatus(id: string, status: string) {
    try {
      await api.put('/api/admin/orders/' + id, { status });
      await loadAdmin();
      flash('Order status updated.');
    } catch (e) { setError(errorText(e)); }
  }

  return <div className="market">
    <div className="top-strip">
      <div className="top-strip-left"><span>🛡️ 100% Secure &amp; Trusted</span><i></i><span>⚡ Instant Delivery</span><i></i><span>🎧 24/7 Support</span></div>
      <div className="top-strip-right"><button onClick={signIn}>Login</button><i></i><button onClick={signIn}>Register</button></div>
    </div>
    <header className="site-header">
      <button className="brand" onClick={() => setPage('home')} aria-label="Yakaji Digital Hub home"><span className="brand-symbol">Y<span>.</span></span><span><b>Yakaji</b><strong>Digital Hub</strong><small>Shop · Learn · Grow</small></span></button>
      <label className="header-search"><Search size={19}/><input aria-label="Search marketplace" value={search} onChange={e=>{setSearch(e.target.value);setPage('home');}} onKeyDown={e=>{if(e.key==='Enter')document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}} placeholder="Search for products, courses, or services..."/><button type="button" aria-label="Search" onClick={()=>{setPage('home');document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}}><Search size={19}/></button></label>
      <div className="header-right">
        {user && <button className="header-action-icon" onClick={()=>void openChatInbox()} aria-label="Messages"><MessageSquare size={19}/><small>Messages</small></button>}
        {user && <button className="header-action-icon" onClick={()=>{setHighlightedOrderId('');setPage('orders');void loadCustomerOrders();}} aria-label="My orders"><Package size={19}/><small>My Orders</small></button>
        }{user && <button className="header-action-icon notification-trigger" onClick={()=>void openNotifications()} aria-label="Notifications"><Bell size={19}/>{unreadNotifications>0 && <b>{unreadNotifications>99?'99+':unreadNotifications}</b>}<small>Notifications</small></button>}
        <button className={showFavoritesOnly ? 'header-wishlist active' : 'header-wishlist'} onClick={()=>{setShowFavoritesOnly(v=>!v);setPage('home');document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}} aria-label="Wishlist"><Heart size={19}/><span>{favorites.length}</span><small>Wishlist</small></button>
        <button className="cart-btn" onClick={() => setCheckoutOpen(true)}><ShoppingBag size={19}/> <span>Cart</span> <b>{cartCount}</b></button>
        <button className="account-btn" onClick={user ? openProfile : signIn}><UserRound size={17}/><span>{user ? 'My Account' : 'My Account'}</span><small>⌄</small></button>
        {user && <><button className="profile-nav" onClick={openWallet}>Wallet</button><button className="profile-nav" onClick={openProfile}>Profile</button><button className="icon-btn" onClick={signOut} title="Sign out"><LogOut size={18}/></button></>}
      </div>
    </header>

    {page === 'home' && <>
      <nav className="market-nav" aria-label="Main marketplace navigation">
        <button className="nav-all" onClick={()=>{setCategory('All');document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}}>☰ <span>All Categories</span>⌄</button>
        <button className="nav-active" onClick={()=>{setPage('home');window.scrollTo({top:0,behavior:'smooth'});}}>⌂ <span>Home</span></button>
        <button onClick={()=>{setCategory('Digital Products');document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}}>▣ <span>Digital Products</span></button>
        <button onClick={()=>{setCategory('Digital Courses');document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}}>🎓 <span>Courses</span></button>
        <button onClick={()=>{setCategory('Digital Services');document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}}>✦ <span>Services</span></button>
        <button onClick={()=>{setCategory('Electronics');document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}}>▤ <span>Physical Products</span></button>
        <button onClick={openVendor}>♙ <span>Vendor Dashboard</span></button>
        <div className="nav-more"><button>More⌄</button><div className="nav-more-menu"><button onClick={openAffiliate}>Affiliate Dashboard</button><button onClick={openVendor}>Vendor Dashboard</button><button onClick={()=>setPage('support')}>Help &amp; Support</button>{isAdmin && <button onClick={openAdmin}>Owner dashboard</button>}</div></div>
      </nav>

      <section
        className="hero hero-carousel"
        aria-roledescription="carousel"
        aria-label="Yakaji Digital Hub promotions"
        onTouchStart={event => setHeroTouchStart(event.touches[0]?.clientX ?? null)}
        onTouchEnd={event => {
          if (heroTouchStart === null) return;
          const delta = event.changedTouches[0]?.clientX - heroTouchStart;
          if (delta < -45) setHeroSlide(current => (current + 1) % heroSlides.length);
          if (delta > 45) setHeroSlide(current => (current - 1 + heroSlides.length) % heroSlides.length);
          setHeroTouchStart(null);
        }}
      >
        <button className="hero-arrow hero-arrow-left" type="button" aria-label="Previous promotion" onClick={() => setHeroSlide(current => (current - 1 + heroSlides.length) % heroSlides.length)}><ChevronLeft size={25}/></button>
        <div className="hero-copy" key={heroSlide}>
          <span className="hero-welcome">{heroSlides[heroSlide].eyebrow}</span>
          <h1>{heroSlides[heroSlide].title}<br/><em>{heroSlides[heroSlide].highlight}</em>{heroSlides[heroSlide].ending && <><br/>{heroSlides[heroSlide].ending}</>}</h1>
          <p>{heroSlides[heroSlide].description}</p>
          <div className="hero-buttons">
            <button className="primary-btn" type="button" onClick={() => {
              if (heroSlides[heroSlide].action === 'vendor') openVendor();
              else {
                setCategory(heroSlides[heroSlide].category);
                document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}>{heroSlides[heroSlide].button} <ArrowRight size={18}/></button>
            {heroSlide === 0 && <button className="secondary-btn" onClick={openVendor}>Start selling <Store size={17}/></button>}
          </div>
          <div className="trust-row"><span><CheckCircle2/> {heroSlides[heroSlide].trust[0]}</span><span><CheckCircle2/> {heroSlides[heroSlide].trust[1]}</span><span><CheckCircle2/> {heroSlides[heroSlide].trust[2]}</span></div>
        </div>
        <div className="hero-visual">
          <div className="hero-glow"></div>
          <div className="hero-photo-card" style={{ backgroundImage: `linear-gradient(90deg, #004b2dcc 0%, #004b2d22 72%), url('${heroSlides[heroSlide].image}')` }}>
            <div className="hero-photo-shade"></div>
            <div className="hero-photo-caption"><b>{heroSlides[heroSlide].visualTitle}</b><small>{heroSlides[heroSlide].visualSubtitle}</small></div>
          </div>
          <div className="hero-float-icons">{heroSlides[heroSlide].icons.map((icon, index) => <span key={icon + index} className={['float-youtube', 'float-tiktok', 'float-ai', 'float-course', 'float-bag'][index]}>{icon}</span>)}</div>
          <span className="float-tag">✨ {heroSlides[heroSlide].tag}</span><span className="float-tag second">{heroSlides[heroSlide].footnote}</span>
        </div>
        <button className="hero-arrow hero-arrow-right" type="button" aria-label="Next promotion" onClick={() => setHeroSlide(current => (current + 1) % heroSlides.length)}><ChevronRight size={25}/></button>
        <div className="hero-pagination" aria-label="Choose promotion slide">
          {heroSlides.map((slide, index) => <button key={slide.eyebrow} type="button" aria-label={`Show promotion ${index + 1}`} aria-current={heroSlide === index ? 'true' : undefined} className={heroSlide === index ? 'active' : ''} onClick={() => setHeroSlide(index)} />)}
        </div>
      </section>

      <section className="benefit-strip"><div><span>🛡️</span><b>Secure Payment</b><small>Your data is safe</small></div><div><span>⚡</span><b>Instant Delivery</b><small>Get your product fast</small></div><div><span>🎧</span><b>24/7 Support</b><small>We're always here</small></div><div><span>⭐</span><b>Trusted Marketplace</b><small>Shop with confidence</small></div></section>

      <section className="category-showcase market-section" aria-label="Shop by category">
        <div className="section-head"><div><span className="eyebrow">EXPLORE OUR MARKETPLACE</span><h2>Shop by Categories</h2><p>Find exactly what you need from our marketplace.</p></div><button className="view-all-link" onClick={()=>{setCategory('All');document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}}>View All Categories <ArrowRight size={15}/></button></div>
        <div className="category-card-grid">
          {[{name:'Digital Products',icon:'💻',hint:'Digital Products'},{name:'Digital Courses',icon:'🎓',hint:'Online Courses'},{name:'Social Media',icon:'▶️',hint:'Social Media Accounts'},{name:'Software & Applications',icon:'⚙️',hint:'Software & Apps'},{name:'Design Templates',icon:'🎨',hint:'Design Templates'},{name:'Digital Services',icon:'☁️',hint:'Digital Services'},{name:'Electronics',icon:'🛍️',hint:'Physical Products'},{name:'Special Offers',icon:'🎁',hint:'Special Offers'}].map(item=><button className={category===item.name?'category-showcase-card selected':'category-showcase-card'} key={item.name} onClick={()=>{setCategory(item.name==='Special Offers'?'All':item.name);if(item.name==='Special Offers')setSortBy('price-low');document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}}><span>{item.icon}</span><b>{item.name==='Digital Courses'?'Online Courses':item.name==='Electronics'?'Physical Products':item.name==='Social Media'?'Social Media Accounts':item.name==='Software & Applications'?'Software & Apps':item.name}</b><small>{item.hint}</small></button>)}
        </div>
      </section>

      <section className="promo-grid">
        <article className="promo-card promo-course"><div className="promo-art">🎓<span>▶</span></div><span>LEARN • BUILD • SUCCEED</span><h2>Grow Your Skills with Our Premium Courses</h2><p>Video Courses · AI Tutorials · Expert Training</p><button onClick={()=>{setCategory('Digital Courses');document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}}>Explore Courses <ArrowRight size={16}/></button></article>
        <article className="promo-card promo-services"><div className="promo-art">🚀<span>📈</span></div><span>TOOLS FOR YOUR NEXT MOVE</span><h2>Boost Your Business with Digital Services</h2><p>Social Media Growth · CAC Registration · And More</p><button onClick={()=>{setCategory('Digital Services');document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}}>Get Started <ArrowRight size={16}/></button></article>
        <article className="promo-card promo-deals"><div className="promo-art">🎁<span>🏷️</span></div><span>SMART FINDS • GREAT VALUE</span><h2>Amazing Deals &amp; Discounts</h2><p>Shop More, Save More!</p><button onClick={()=>{setCategory('All');setSortBy('price-low');document.getElementById('market')?.scrollIntoView({behavior:'smooth'});}}>Shop Now <ArrowRight size={16}/></button></article>
      </section>

      <section className="market-section" id="market">
        <div className="section-head"><div><span className="eyebrow">HANDPICKED FROM OUR LIVE CATALOGUE</span><h2>🔥 Trending Products</h2><p>Discover products currently available from Yakaji Digital Hub vendors.</p></div><button className="view-all-link" onClick={()=>{setCategory('All');setSearch('');setShowFavoritesOnly(false);}}>View All <ArrowRight size={15}/></button></div>
        <label className="search-field market-search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products, categories or sellers"/></label>
        <div className="category-list"><button className={category === 'All' ? 'selected' : ''} onClick={() => setCategory('All')}>✨ All products</button>{categories.map(c => <button key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div>
        <div className="catalog-toolbar"><span>{visibleProducts.length} live products</span><div><button className={showFavoritesOnly ? 'filter-chip active' : 'filter-chip'} onClick={() => setShowFavoritesOnly(value => !value)}><Heart size={15} fill={showFavoritesOnly ? 'currentColor' : 'none'}/> Saved ({favorites.length})</button><label className="sort-control">Sort by <select aria-label="Sort products" value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="featured">Trending / Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name A–Z</option></select></label></div></div>
        {visibleProducts.length ? <div className="product-grid">{visibleProducts.map(p => <article className="product-card clickable-product" key={p.id} onClick={() => openProduct(p)} onKeyDown={e=>{if(e.key==='Enter')openProduct(p);}} role="button" tabIndex={0}>
          <div className="product-media">{p.images?.[0] ? <img src={p.images[0]} alt={p.name}/> : <div className="media-placeholder"><Package size={38}/><span>{p.category}</span></div>}<button className={favorites.includes(p.id) ? 'favorite-btn saved' : 'favorite-btn'} aria-label={favorites.includes(p.id) ? 'Remove from saved products' : 'Save product'} onClick={e => {e.stopPropagation();toggleFavorite(p.id);}}><Heart size={17} fill={favorites.includes(p.id) ? 'currentColor' : 'none'}/></button>{p.tag && <span className="product-tag">{p.tag}</span>}{p.stock < 1 && <span className="sold-out">Out of stock</span>}{p.videos?.length > 0 && <span className="video-indicator"><PlayCircle size={14}/> Video</span>}</div>
          <div className="product-body"><span className="product-cat">{p.category}</span><h3>{p.name}</h3><p>{p.description}</p><small className="seller-line">Store: {p.vendorName || 'Yakaji Digital Hub'}</small>{Number((p as any).averageRating || (p as any).ratingAverage || 0) > 0 && <small className="card-rating">⭐ {Number((p as any).averageRating || (p as any).ratingAverage).toFixed(1)} <span>({Number((p as any).reviewCount || 0)})</span></small>}<div className="product-foot"><b>{p.discountActive ? <span className="sale-prices"><del>{money(p.standardPrice || p.price)}</del><strong>{money(p.price)}</strong><small>{p.discountPercent}% OFF</small></span> : money(p.price)}</b><button disabled={p.stock < 1} onClick={e => {e.stopPropagation();addToCart(p);}}><Plus size={16}/> Add to Cart</button></div><small className="view-details-hint">View details · {p.stock > 0 ? 'In stock' : 'Sold out'}</small></div>
        </article>)}</div> : <div className="empty-box"><Package size={38}/><h3>No products found</h3><p>Try another category or search term. New products will appear here after approval.</p></div>}
      </section>

      <section className="vendor-callout"><div><span className="eyebrow">GROW YOUR BUSINESS</span><h2>Become a Vendor Today!</h2><p>Sell your digital or physical products on Yakaji Digital Hub and reach more customers. Manage your products and orders from one dashboard.</p></div><button className="primary-btn" onClick={openVendor}>🏬 Start Selling <ArrowRight size={17}/></button></section>
      <section className="vendor-callout affiliate-callout"><div><span className="eyebrow">EARN BY SHARING PRODUCTS</span><h2>Become an Affiliate Marketer.</h2><p>You do not need to own a shop. Register with your customer account, share marketplace product links and earn the commission set by each vendor when a referred sale is verified.</p></div><button className="primary-btn" onClick={openAffiliate}>Become an Affiliate <TrendingUp size={17}/></button></section>
    </>}

    {page === 'affiliate' && <main className="workspace">
      <button className="back-link" onClick={() => setPage('home')}><ArrowLeft size={16}/> Back to marketplace</button>
      <div className="workspace-heading"><div><span className="eyebrow">YAKAJI DIGITAL HUB PARTNER PROGRAMME</span><h1>{affiliateApplication && ['approved','active'].includes(String(affiliateApplication.status)) ? 'Affiliate Dashboard' : 'Become an Affiliate Marketer'}</h1><p>{affiliateApplication && ['approved','active'].includes(String(affiliateApplication.status)) ? 'Browse eligible products, copy or share your unique product links, and track your affiliate earnings.' : 'Earn by sharing products from the marketplace. You can become an affiliate using your customer account; you do not need to register as a vendor.'}</p></div><span className="role-pill"><TrendingUp size={16}/> Affiliate programme</span></div>
      <section className="panel">
        <h2>How it works</h2>
        <div className="stats-row"><div><small>Step 1</small><b>Create / sign in</b><p className="muted">Use your normal marketplace customer account.</p></div><div><small>Step 2</small><b>Register as affiliate</b><p className="muted">Submit your name and contact details below.</p></div><div><small>Step 3</small><b>Get approved</b><p className="muted">The marketplace owner reviews your application.</p></div><div><small>Step 4</small><b>Promote products</b><p className="muted">Share referral links and earn on verified sales.</p></div></div>
      </section>
      {affiliateTransfer && <section className="panel transfer-card"><h2>Complete affiliate registration payment</h2><p>Transfer exactly {money(Number(affiliateTransfer.amount))} using this reference: <b>{affiliateTransfer.reference}</b></p><p>Bank: <b>{affiliateTransfer.bankName}</b></p><p>Account name: <b>{affiliateTransfer.accountName}</b></p><h2>{affiliateTransfer.accountNumber}</h2><button className="secondary-btn" onClick={()=>navigator.clipboard?.writeText(affiliateTransfer.accountNumber).then(()=>flash('Account number copied.'))}>Copy account number</button><p className="checkout-note">Your application stays pending until the owner confirms the money has arrived. Do not pay twice.</p></section>}{!user ? <section className="panel centered"><LogIn size={36}/><h2>Sign in or create a customer account</h2><p>Any marketplace customer can apply using their normal customer account.</p><button className="primary-btn" onClick={signIn}>Sign in / Create customer account <ArrowRight size={16}/></button></section> : affiliateApplication && affiliateApplication.registrationPaymentStatus === 'paid' ? <><section className="panel"><div className="panel-title"><div><span className="eyebrow">APPLICATION STATUS</span><h2>Affiliate application {affiliateApplication.status}</h2><p>Registration payment confirmed · {money(Number(affiliateApplication.registrationFee || 2000))}</p></div><button className="secondary-btn" onClick={openAffiliate}>Refresh dashboard</button></div>{affiliateApplication.status === 'approved' || affiliateApplication.status === 'active' ? <div className="stats-row"><div><small>Tracked sales</small><b>{affiliateDashboard.summary?.trackedSales || 0}</b></div><div><small>Product link clicks</small><b>{affiliateDashboard.summary?.totalClicks || 0}</b></div><div><small>Total commission</small><b>{money(Number(affiliateDashboard.summary?.totalEarned || 0))}</b></div><div><small>Paid commission</small><b>{money(Number(affiliateDashboard.summary?.paidCommission || 0))}</b></div><div><small>Available balance</small><b>{money(Number(affiliateDashboard.summary?.availableBalance || 0))}</b></div></div> : <p className="checkout-note">Your payment is confirmed. The owner must approve your application before your affiliate dashboard and promotion tools are activated.</p>}</section>{(affiliateApplication.status === 'approved' || affiliateApplication.status === 'active') && <section className="panel"><h2>Your affiliate promotion link</h2><p>Share your personal referral code with customers. Your affiliate ID: <b>{affiliateApplication.referralCode}</b></p><div className="manage-row"><code>{window.location.origin}/?ref={affiliateApplication.referralCode}</code><button className="secondary-btn" onClick={()=>navigator.clipboard?.writeText(window.location.origin+'/?ref='+affiliateApplication.referralCode).then(()=>flash('Affiliate link copied.'))}>Copy link</button></div><div className="affiliate-catalogue-heading"><div><h3>Products you can promote</h3><p className="muted">These are real marketplace products with affiliate commission enabled. Every link opens the exact product, shows its own product photo and details in WhatsApp, Facebook and X previews, and keeps your referral code.</p></div><span className="role-pill">{affiliateProducts.length} eligible products</span></div>{affiliateProducts.length ? <div className="affiliate-product-grid">{affiliateProducts.map((p:any)=><article className="affiliate-product-card" key={p.id}><div className="affiliate-product-photo">{p.images?.[0] ? <img src={p.images[0]} alt={p.name}/> : <Package size={42}/>}</div><div className="affiliate-product-content"><span className="product-cat">{p.category}</span><h4>{p.name}</h4><b className="affiliate-product-price">{money(Number(p.price))}</b><p>{String(p.description || '').slice(0,150)}{String(p.description || '').length>150?'…':''}</p><div className="affiliate-rate-box"><span>Affiliate commission</span><strong>{Number(p.affiliateCommissionPercent)}%</strong><small>Estimated earning per unit: {money(Number(p.affiliateCommissionAmount || 0))}</small></div><small className="muted">{p.vendorName || 'Marketplace vendor'} · {Number(p.stock || 0)} in stock</small><div className="affiliate-share-buttons"><button className="secondary-btn" onClick={()=>copyProductLinkWithReferral(p,affiliateApplication.referralCode)}><Copy size={14}/> Copy link</button><button className="primary-btn" onClick={()=>shareAffiliateProduct(p)}><Share2 size={14}/> Share</button><button className="share-social whatsapp" onClick={()=>shareProductToNetwork(p,'whatsapp',affiliateApplication.referralCode)}><MessageCircle size={14}/> WhatsApp</button><button className="share-social" onClick={()=>shareProductToNetwork(p,'facebook',affiliateApplication.referralCode)}>Facebook</button><button className="share-social" onClick={()=>shareProductToNetwork(p,'x',affiliateApplication.referralCode)}>X</button></div></div></article>)}</div> : <p className="muted">No active products currently have affiliate commission enabled. Products with 0% affiliate commission are not included.</p>}<h3>Request a withdrawal</h3><p>Available balance: <b>{money(Number(affiliateDashboard.summary?.availableBalance || 0))}</b> · Minimum ₦1,000.</p><form className='product-form' onSubmit={requestAffiliateWithdrawal}><label>Amount (₦)<input type='number' min='1000' step='1' required value={affiliateWithdrawForm.amount} onChange={e=>setAffiliateWithdrawForm({...affiliateWithdrawForm,amount:e.target.value})}/></label><label>Bank name<input required value={affiliateWithdrawForm.bankName} onChange={e=>setAffiliateWithdrawForm({...affiliateWithdrawForm,bankName:e.target.value})}/></label><label>Account number<input required inputMode='numeric' value={affiliateWithdrawForm.accountNumber} onChange={e=>setAffiliateWithdrawForm({...affiliateWithdrawForm,accountNumber:e.target.value})}/></label><label>Account name<input required value={affiliateWithdrawForm.accountName} onChange={e=>setAffiliateWithdrawForm({...affiliateWithdrawForm,accountName:e.target.value})}/></label><button className='primary-btn' disabled={affiliateWithdrawBusy || Number(affiliateWithdrawForm.amount)>Number(affiliateDashboard.summary?.availableBalance || 0)}>{affiliateWithdrawBusy ? 'Submitting...' : 'Request bank withdrawal'}</button></form><h3>Commission history</h3>{affiliateDashboard.commissions?.length ? affiliateDashboard.commissions.map((c:any)=><div className="manage-row" key={c.id}><div className="manage-main"><b>{c.productName || 'Product sale'}</b><small>{c.orderNumber || c.orderId} · {Number(c.commissionPercent || 0)}% · {new Date(c.createdAt).toLocaleString()}</small></div><b>{money(Number(c.commissionAmount || 0))}</b><span className="status">{c.status}</span></div>) : <p className="muted">No attributed sales have been recorded yet.</p>}<h3>Withdrawal history</h3>{affiliateDashboard.withdrawals?.length ? affiliateDashboard.withdrawals.map((w:any)=><div className="manage-row" key={w.id}><b>{money(Number(w.amount || 0))}</b><span>{w.bankName} · {w.accountNumber}</span><span className="status">{w.status}</span></div>) : <p className="muted">No withdrawal requests yet.</p>}</section>}</> : <form className="panel form-panel" onSubmit={applyAsAffiliate}>
        <h2>Affiliate marketer registration</h2><p>Complete your personal and promotion details, then pay the one-time registration fee of ₦2,000.</p>
        <label>Full legal name<input required maxLength={100} value={affiliateForm.fullName} onChange={e=>setAffiliateForm({...affiliateForm,fullName:e.target.value})}/></label>
        <label>Phone number<input required type="tel" maxLength={25} value={affiliateForm.phone} onChange={e=>setAffiliateForm({...affiliateForm,phone:e.target.value})}/></label>
        <label>WhatsApp number<input required type="tel" maxLength={25} value={affiliateForm.whatsapp} onChange={e=>setAffiliateForm({...affiliateForm,whatsapp:e.target.value})}/></label>
        <label>Email address<input value={user.email || ''} disabled/></label>
        <label>Residential address<input required value={affiliateForm.address} onChange={e=>setAffiliateForm({...affiliateForm,address:e.target.value})}/></label>
        <label>City<input required value={affiliateForm.city} onChange={e=>setAffiliateForm({...affiliateForm,city:e.target.value})}/></label>
        <label>State<input required value={affiliateForm.state} onChange={e=>setAffiliateForm({...affiliateForm,state:e.target.value})}/></label>
        <label>Social media username / profile link<input value={affiliateForm.socialHandle} onChange={e=>setAffiliateForm({...affiliateForm,socialHandle:e.target.value})} placeholder="Optional"/></label>
        <label>How will you promote products?<select required value={affiliateForm.promotionMethod} onChange={e=>setAffiliateForm({...affiliateForm,promotionMethod:e.target.value})}><option>WhatsApp and social media</option><option>Facebook</option><option>TikTok</option><option>Instagram</option><option>YouTube</option><option>Website or blog</option><option>In-person referrals</option><option>Other</option></select></label>
        <label>Registration payment method<select value={affiliateForm.paymentMethod} onChange={e=>setAffiliateForm({...affiliateForm,paymentMethod:e.target.value})}><option value="Wallet">1. Pay from marketplace wallet</option><option value="Paystack">2. Pay with Paystack</option><option value="Bank transfer">3. Manual bank transfer</option></select></label>
        <div className="checkout-note full-field"><b>Registration fee: ₦2,000.</b> Wallet payments are deducted immediately. Paystack payments are verified automatically. Manual transfers remain pending until the owner confirms receipt.</div>
        <button className="primary-btn" disabled={busy}>{busy ? 'Processing registration...' : 'Submit application & continue to payment'} <ArrowRight size={16}/></button>
      </form>}
    </main>}
    {page === 'support' && <main className="workspace">
      <button className="back-link" onClick={() => setPage('home')}><ArrowLeft size={16}/> Back to marketplace</button>
      <div className="workspace-heading"><div><span className="eyebrow">YAKAJI CUSTOMER CARE</span><h1>Help & Support Centre</h1><p>Your conversation is private. Only you and authorised marketplace support staff can read it.</p></div></div>
      <div className="support-contact-grid"><a className="support-contact-card" href="https://wa.me/2349042497253" target="_blank" rel="noreferrer"><b>WhatsApp Support</b><strong>09042497253</strong><small>Chat with our team on WhatsApp</small></a><a className="support-contact-card" href="mailto:yakajidigitalhub@gmail.com"><b>Email Support</b><strong>yakajidigitalhub@gmail.com</strong><small>Send us your question or complaint</small></a></div>
      <section className="panel support-chat-panel"><div className="panel-title"><div><h2>Live customer support</h2><p>{supportStatus.online ? 'Support is online. If an agent is busy, you will be placed in the private queue.' : (supportStatus.offlineMessage || 'Live chat is offline. You can still leave a private message or contact us below.')}</p></div><span className="role-pill">{supportStatus.online ? '🟢 Support online' : '⚪ Support offline'}</span></div>
        {!user ? <div className="panel centered"><h3>Sign in to start a private support conversation</h3><p>Sign-in protects your chat so other customers cannot access your messages.</p><button className="primary-btn" onClick={signIn}>Sign in to chat</button></div> : <>
          <div className="checkout-note"><b>{supportStatus.conversation?.mode === 'human' ? 'Human agent requested / connected' : 'Yakaji AI Assistant is ready'}</b><br/>{supportStatus.conversation?.mode === 'human' ? 'The AI assistant is paused for this conversation. Only a human support agent can reply until the team resumes AI support.' : 'Ask about shopping, orders, payments, vendors, affiliate accounts, wallets, products and how to use the marketplace.'}</div>
          {supportStatus.conversation?.status === 'waiting' && <div className="checkout-note">Your request is waiting for a human support agent{supportStatus.conversation.queuePosition ? ' — queue position ' + supportStatus.conversation.queuePosition : ''}.</div>}
          {supportStatus.conversation?.status === 'on_hold' && <div className="checkout-note">Your human support conversation is currently on hold. The support team will continue when available.</div>}
          {supportStatus.conversation?.status === 'closed' && <div className="checkout-note">This conversation is closed. Start a new chat by reopening Support Centre.</div>}
          <div className="support-messages">{supportMessages.map((m:any)=><div key={m.id} className={'support-message '+m.sender}><small>{m.sender === 'admin' ? 'Yakaji Support' : m.sender === 'customer' ? 'You' : m.sender === 'assistant' ? 'Yakaji AI Assistant' : 'Support'}</small><p>{m.message}</p></div>)}{!supportMessages.length && <p className="muted">Welcome. Ask Yakaji Assistant how to use the marketplace or request a human support agent.</p>}</div>
          <div className="support-chat-actions"><button type="button" className="secondary-btn" onClick={requestHumanSupport} disabled={!supportConversation || supportStatus.conversation?.mode === 'human' || supportStatus.conversation?.status === 'closed'}>Talk to a human agent</button><small>Human support will take over this private conversation and pause AI replies.</small></div>
          <form className="support-send-row" onSubmit={sendSupportMessage}><input required maxLength={1500} value={supportDraft} onChange={e=>setSupportDraft(e.target.value)} placeholder={supportStatus.conversation?.mode === 'human' ? 'Message the human support team...' : 'Ask Yakaji Assistant a question...'} disabled={!supportConversation || supportStatus.conversation?.status === 'closed'}/><button className="primary-btn" disabled={busy || !supportConversation || supportStatus.conversation?.status === 'closed'}>Send <ArrowRight size={16}/></button></form>
        </>}
      </section>
      <section className="panel"><h2>Refund & Return Policy</h2><p>Contact support within 48 hours after delivery if an item is damaged, incorrect or significantly different from its listing. Keep the product, packaging and proof of purchase while your request is reviewed.</p><p>Digital products and services are generally not returnable after delivery, download, access or activation, except where delivery failed, the product is materially defective or applicable law requires otherwise.</p><p>Refunds are not automatic. The support team reviews each request, may ask for photos or order details, and confirms whether it is approved. Approved refunds are returned through the original payment method where possible. Bank-transfer refunds may require verified bank details.</p><p><b>How to request:</b> Send your order number, reason and supporting evidence through this chat, WhatsApp or email. Do not send passwords, card PINs or OTPs.</p></section>
    </main>}
    {page === 'orders' && <main className="workspace">
      <button className="back-link" onClick={() => setPage('home')}><ArrowLeft size={16}/> Back to marketplace</button>
      <div className="workspace-heading"><div><span className="eyebrow">YOUR PURCHASES</span><h1>My Orders & History</h1><p>Every order, item, payment, delivery and refund detail in one place.</p></div><button className="secondary-btn" onClick={loadCustomerOrders} disabled={customerOrdersLoading}>{customerOrdersLoading ? 'Refreshing...' : 'Refresh history'}</button></div>
      {!user ? <div className="panel centered"><h2>Sign in to view your order history</h2><button className="primary-btn" onClick={signIn}>Sign in</button></div> :
      customerOrdersLoading && !customerOrders.length ? <div className="panel centered"><p>Loading your order history...</p></div> :
      customerOrders.length ? customerOrders.map(order => {
        const subtotal = Number(order.subtotal ?? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0));
        const transferFee = Number(order.transferFee || 0);
        const stages = ['New', 'Confirmed', 'Processing', 'Ready for Shipping', 'Shipped', 'Out for Delivery', 'Delivered', 'Completed'];
        const currentStage = ['Cancelled', 'Refunded', 'Returned'].includes(order.status) ? -1 : stages.indexOf(order.status);
        return <section className="panel order-history-card" id={'customer-order-' + order.id} key={order.id} style={highlightedOrderId===order.id?{outline:'2px solid #0b8b4b',boxShadow:'0 0 0 4px #e3f6e9'}:undefined}>
          <div className="panel-title"><div><span className="eyebrow">ORDER DETAILS</span><h2>{order.orderNumber}</h2><p>Placed {new Date(order.createdAt).toLocaleString()}</p></div><div><span className="status">{order.status}</span><p><span className={'status '+(order.paymentStatus === 'completed' ? 'approved' : order.paymentStatus === 'rejected' ? 'rejected' : 'pending')}>{paymentStatusLabel(order.paymentStatus)}</span></p></div></div>
          <div className="order-history-items"><h3>Items ordered</h3>{order.items.map((item, index) => <div className="manage-row" key={item.productId + '-' + index}><div className="manage-main"><b>{item.name}</b><small>Quantity: {item.quantity}{item.option ? ' · Option: ' + item.option : ''} · Unit price: {money(item.price)}</small></div><b>{money(item.price * item.quantity)}</b></div>)}</div>
          <div className="panel-title"><h3>Order progress</h3><b>{order.status}</b></div>
          {['Cancelled', 'Refunded', 'Returned'].includes(order.status) ? <p className="checkout-note">This order is {order.status.toLowerCase()}.{order.refundStatus ? ' Refund: ' + order.refundStatus + '.' : ''}</p> : <div className="order-progress">{stages.map((stage, index) => <div className={'order-progress-step ' + (currentStage >= index ? 'is-complete' : '')} key={stage}><span>{index + 1}</span><small>{stage}</small></div>)}</div>}
          <div className="total-line"><span>Products subtotal</span><b>{money(subtotal)}</b></div>
          {transferFee > 0 && <div className="total-line"><span>Bank transfer fee</span><b>{money(transferFee)}</b></div>}
          <div className="total-line"><span>Order total</span><b>{money(order.total)}</b></div>
          <div className="order-info-grid">
            <div><small>Payment method</small><b>{order.paymentMethod || 'Not recorded'}</b></div>
            <div><small>Payment status</small><b>{paymentStatusLabel(order.paymentStatus)}</b></div>
            <div><small>Payment reference</small><b>{order.paystackReference || order.paymentReference || order.orderNumber}</b></div>
            <div><small>Paid date</small><b>{order.paymentCompletedAt ? new Date(order.paymentCompletedAt).toLocaleString() : 'Awaiting payment confirmation'}</b></div>
            <div><small>Customer name</small><b>{order.customerName || 'Not provided'}</b></div>
            <div><small>Phone / WhatsApp</small><b>{order.phone || 'Not provided'}</b></div>
            <div><small>Email</small><b>{order.email || 'Not provided'}</b></div>
            <div><small>Delivery address / instructions</small><b>{order.address || 'Not provided'}</b></div>
            {(order.trackingNumber || order.courier) && <div><small>Delivery tracking</small><b>{[order.courier, order.trackingNumber].filter(Boolean).join(' · ')}</b></div>}
            {order.refundStatus && <div><small>Refund status</small><b>{order.refundStatus}{order.refundedAt ? ' · ' + new Date(order.refundedAt).toLocaleString() : ''}</b></div>}
            <div><small>Last updated</small><b>{order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'No later update recorded'}</b></div>
          </div>
          {order.paymentStatus !== 'completed' && order.status === 'New' && order.paymentMethod !== 'Wallet' && <button className="danger-icon" onClick={() => cancelCustomerOrder(order)}>Cancel unpaid order</button>}
        </section>;
      }) : <div className="panel centered"><Package size={36}/><h2>No purchases yet</h2><p>Your orders will appear here as soon as you place an order.</p><button className="primary-btn" onClick={() => setPage('home')}>Start shopping</button></div>}
    </main>}
    {page === 'profile' && <main className="workspace">
      <button className="back-link" onClick={() => setPage('home')}><ArrowLeft size={16}/> Back to marketplace</button>
      <div className="workspace-heading"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>My profile</h1><p>Keep your contact and delivery information up to date.</p></div></div>
      {!user ? <div className="panel centered"><h2>Sign in to manage your profile</h2><button className="primary-btn" onClick={signIn}>Sign in</button></div> :
      <form className="panel form-panel profile-form" onSubmit={saveProfile}>
        <div className="profile-picture-row">{profile?.avatarUrl ? <img className="profile-large-avatar" src={profile.avatarUrl} alt="Profile"/> : <div className="profile-large-avatar avatar-placeholder"><UserRound size={38}/></div>}<label className="avatar-picker">Upload profile picture<input type="file" accept="image/*" onChange={e=>setAvatarFile(e.target.files?.[0] || null)}/><small>{avatarFile ? avatarFile.name : 'Optional · JPG, PNG or WebP · up to 8MB'}</small></label></div>
        <label>Full name<input required value={profile?.fullName || ''} onChange={e=>setProfile({...profile,fullName:e.target.value})}/></label>
        <label>Email address<input value={profile?.email || user.email || ''} disabled/></label>
        <label>Phone number<input required type="tel" value={profile?.phone || ''} onChange={e=>setProfile({...profile,phone:e.target.value})} placeholder="+234..."/></label>
        <label>WhatsApp number<input type="tel" value={profile?.whatsapp || ''} onChange={e=>setProfile({...profile,whatsapp:e.target.value})} placeholder="Optional"/></label>
        <label className="full-field">Home / delivery address<textarea rows={2} value={profile?.address || ''} onChange={e=>setProfile({...profile,address:e.target.value})}/></label>
        <label>City<input value={profile?.city || ''} onChange={e=>setProfile({...profile,city:e.target.value})}/></label>
        <label>State<input value={profile?.state || ''} onChange={e=>setProfile({...profile,state:e.target.value})}/></label>
        <label>Country<input value={profile?.country || 'Nigeria'} onChange={e=>setProfile({...profile,country:e.target.value})}/></label>
        <button className="primary-btn" disabled={busy}>{busy ? 'Saving profile...' : 'Save profile details'}</button>
      </form>}
    </main>}

    {page === 'vendor' && <main className="workspace">
      <button className="back-link" onClick={() => setPage('home')}><ArrowLeft size={16}/> Back to marketplace</button>
      <div className="workspace-heading"><div><span className="eyebrow">SELLER CENTRE</span><h1>Vendor dashboard</h1><p>Register your shop and manage your products and orders.</p></div><span className="role-pill"><Store size={16}/> Vendor portal</span></div>
      {!user ? <div className="panel centered"><LogIn size={36}/><h2>Sign in to continue</h2><p>Use your account to register as a seller or manage your shop.</p><button className="primary-btn" onClick={signIn}>Sign in / Register <ArrowRight size={16}/></button></div> :
      !vendor ? <form className="panel form-panel" onSubmit={applyAsVendor}><h2>Register your vendor shop</h2><p>Tell us about your business. Your shop will be reviewed before you can publish products.</p><label>Shop name<input required value={shopForm.shopName} onChange={e => setShopForm({...shopForm, shopName:e.target.value})} placeholder="Your shop or business name"/></label><label>Phone / WhatsApp<input required type="tel" value={shopForm.phone} onChange={e => setShopForm({...shopForm, phone:e.target.value})} placeholder="+234..."/></label><label>What will you sell?<textarea required rows={4} value={shopForm.description} onChange={e => setShopForm({...shopForm, description:e.target.value})} placeholder="Describe your products and services"/></label><button className="primary-btn" disabled={busy}>{busy ? 'Submitting...' : 'Submit vendor application'} <ArrowRight size={16}/></button></form> :
      vendor.status !== 'approved' ? <div className="panel centered"><Clock3 size={42}/><h2>Application {vendor.status === 'rejected' ? 'not approved' : 'under review'}</h2><p>{vendor.status === 'rejected' ? 'Please contact Yakaji Digital Hub for more information.' : 'Thank you for registering. Your vendor account is awaiting owner approval. You will be able to publish products once approved.'}</p><b>{vendor.shopName}</b></div> :
      <><div className="stats-row"><div><small>My shop</small><b>{vendor.shopName}</b></div><div><small>My products</small><b>{products.filter(p => p.vendorId === user.userId).length}</b></div><div><small>My orders</small><b>{orders.length}</b></div><div><small>Completed earnings</small><b>{money(vendorReports?.year?.completedEarnings || 0)}</b></div></div>
      <section className="panel"><h2>My wallet & withdrawals</h2><div className="stats-row"><div><small>Wallet funds available to spend</small><b>{money(wallet?.walletBalance||0)}</b></div><div><small>Completed gross sales</small><b>{money(wallet?.gross||0)}</b></div><div><small>Marketplace commission</small><b>{money(wallet?.marketplaceCommission||0)}</b></div><div><small>Affiliate commission</small><b>{money(wallet?.affiliateCommission||0)}</b></div><div><small>Payment gateway fees</small><b>{money(wallet?.paymentGatewayFees||0)}</b></div><div><small>Available earnings to withdraw</small><b>{money(wallet?.available||0)}</b></div></div><p className="muted">Wallet funds are separate from your sales earnings. You can add funds from the Wallet button above. Owner can also manually fund your vendor wallet.</p><form className="product-form" onSubmit={requestWithdrawal}><label>Withdrawal amount (₦)<input type="number" min="1" required value={withdrawForm.amount} onChange={e=>setWithdrawForm({...withdrawForm,amount:e.target.value})}/></label><label>Bank name<input required value={withdrawForm.bankName} onChange={e=>setWithdrawForm({...withdrawForm,bankName:e.target.value})}/></label><label>Account number<input required inputMode="numeric" maxLength={10} value={withdrawForm.accountNumber} onChange={e=>setWithdrawForm({...withdrawForm,accountNumber:e.target.value})}/></label><label>Account name<input required value={withdrawForm.accountName} onChange={e=>setWithdrawForm({...withdrawForm,accountName:e.target.value})}/></label><p className="muted">Vendor net earnings are calculated after marketplace commission, any affiliate commission and the actual Paystack processing fee. Withdrawal transfer fee: {money(wallet?.withdrawalFee??settings.withdrawalFee)}. Owner approval is required.</p><button className="primary-btn">Request withdrawal</button></form>{(wallet?.withdrawals||[]).map((w:any)=><div className="manage-row" key={w.id}><b>{money(w.amount)} · {w.status}</b><small>{w.bankName} · {w.accountNumber} · Fee {money(w.fee)} · Net {money(w.netAmount)}</small></div>)}</section>
      <section className="panel"><h2>My sales and earnings</h2><p className="muted">Sales are calculated from your own products only. Completed earnings include orders marked completed by the marketplace admin.</p><div className="category-list">{(['day','week','month','year'] as const).map(period=><button key={period} className={analyticsPeriod===period?'selected':''} onClick={()=>setAnalyticsPeriod(period)}>{period==='day'?'Today':period==='week'?'This week':period==='month'?'This month':'This year'}</button>)}</div><div className="stats-row"><div><small>Orders</small><b>{vendorReports?.[analyticsPeriod]?.orders || 0}</b></div><div><small>Units sold</small><b>{vendorReports?.[analyticsPeriod]?.unitsSold || 0}</b></div><div><small>Gross sales</small><b>{money(vendorReports?.[analyticsPeriod]?.grossSales || 0)}</b></div><div><small>Completed earnings</small><b>{money(vendorReports?.[analyticsPeriod]?.completedEarnings || 0)}</b></div></div></section>
      <section className="panel" id="product-editor"><div className="panel-title"><div><h2>{editing ? 'Edit product' : 'Publish a product'}</h2><p>Add product details, photos, video, price and options.</p></div>{editing && <button className="secondary-btn" onClick={startNewProduct}>Cancel edit</button>}</div>
        <form className="product-form" onSubmit={saveProduct}><label>Product name<input required value={draft.name} onChange={e => setDraft({...draft,name:e.target.value})} placeholder="Enter product name"/></label><label>Category<select value={draft.category} onChange={e => setDraft({...draft,category:e.target.value})}>{categories.filter(x=>x!=='All').map(x=><option key={x}>{x}</option>)}</select></label><label>Standard price (₦)<input required type="number" min="1" value={draft.price} onChange={e => setDraft({...draft,price:e.target.value})}/></label>
        <label>Discount method<select value={draft.discountMode} onChange={e=>setDraft({...draft,discountMode:e.target.value,discountValue:''})}><option value="none">No discount</option><option value="manual">Enter discount price</option><option value="percentage">Enter discount percentage</option></select></label>
        {draft.discountMode !== 'none' && <label>{draft.discountMode === 'manual' ? 'Discount price (₦)' : 'Discount percentage (%)'}<input required type="number" min="1" max={draft.discountMode === 'percentage' ? 99 : undefined} step="1" value={draft.discountValue} onChange={e=>setDraft({...draft,discountValue:e.target.value})}/><small>{draft.discountMode === 'manual' ? 'Enter the exact sale price. It must be lower than the standard price.' : 'The sale price will be calculated automatically from the standard price.'}</small></label>}
        {draft.discountMode !== 'none' && <><label>Discount starts (optional)<input type="datetime-local" value={draft.discountStartAt} onChange={e=>setDraft({...draft,discountStartAt:e.target.value})}/></label><label>Discount ends (optional)<input type="datetime-local" value={draft.discountEndAt} onChange={e=>setDraft({...draft,discountEndAt:e.target.value})}/></label></>}<label>Available stock<input required type="number" min="0" value={draft.stock} onChange={e => setDraft({...draft,stock:e.target.value})}/></label><label>Product label<input value={draft.tag} onChange={e => setDraft({...draft,tag:e.target.value})} placeholder="New / Popular / Sale"/></label><label>Options / variations<input value={draft.options} onChange={e => setDraft({...draft,options:e.target.value})} placeholder="Small, Medium, Large or Basic, Pro"/></label><label>Affiliate commission (%)<input type="number" required min="0" max="25" step="1" value={draft.affiliateCommissionPercent} onChange={e => setDraft({...draft,affiliateCommissionPercent:e.target.value})}/><small>Choose 0% to disable affiliate earnings, or 5%–25% to pay an affiliate on verified sales.</small></label>{isAdmin && <label>Marketplace commission (%)<input type="number" min="0" max="100" step="0.1" value={draft.marketplaceCommissionPercent} onChange={e=>setDraft({...draft,marketplaceCommissionPercent:e.target.value})} placeholder={'Use marketplace default: '+settings.commissionPercent+'%'}/><small>Owner only. Leave blank to use the current marketplace default of {settings.commissionPercent}%.</small></label>}<label className="full-field">Description<textarea required rows={3} value={draft.description} onChange={e => setDraft({...draft,description:e.target.value})} placeholder="Describe the product clearly"/></label><label className="full-field upload-field"><span><ImagePlus/> Product images and videos (optional when editing)</span><input type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" onChange={e => setSelectedFiles(Array.from(e.target.files || []))}/><small>Choose new photos or videos to add. Existing media stays unless you remove it below. Images up to 8MB and videos up to 30MB each.</small>{selectedFiles.length > 0 && <b>{selectedFiles.length} new file(s) selected</b>}{(draft.images.length + draft.videos.length > 0) && <small>{draft.images.length} saved image(s), {draft.videos.length} saved video(s)</small>}</label>{editing && draft.id && <div className="full-field product-media-editor"><b>Current product photos</b><div className="product-media-edit-grid">{(products.find(p=>p.id===draft.id)?.images || []).map((src,index)=><div className="product-media-edit-item" key={draft.images[index] || index}><img src={src} alt={'Product photo '+(index+1)}/><button type="button" className="danger-icon" onClick={()=>setDraft(current=>({...current,images:current.images.filter((_,i)=>i!==index)}))}>Remove photo</button></div>)}</div><small>Photo changes are optional. Removing a photo updates the product gallery when you save.</small></div>}<button className="primary-btn" disabled={busy}>{busy ? 'Saving product...' : editing ? 'Save changes' : 'Publish product'} <UploadCloud size={17}/></button></form>
      </section>
            <section className="panel"><div className="panel-title"><div><h2>My products</h2><p>Manage products in your shop.</p></div></div>{products.filter(p=>p.vendorId===user.userId).map(p=><div className="manage-row" key={p.id}><div className="mini-product">{p.images?.[0] ? <img src={p.images[0]} alt="" /> : <Package/>}</div><div className="manage-main"><b>{p.name}</b><small>{p.discountActive ? money(p.price)+' sale · '+money(p.standardPrice || p.price)+' standard' : money(p.price)} · Stock {p.stock} · {p.status}</small></div><button onClick={()=>startEdit(p)}>Edit</button><button className="danger-icon" onClick={()=>deleteProduct(p.id)}><Trash2 size={17}/></button></div>)}</section>
      <section className="panel" id="vendor-coupons"><div className="panel-title"><div><h2>My product coupons</h2><p>Create discount codes customers can enter at checkout. Choose the exact expiry date and time.</p></div></div>
        <form className="product-form" onSubmit={saveVendorCoupon}>
          <label>Coupon code<input required minLength={3} maxLength={32} value={couponDraft.code} onChange={e=>setCouponDraft({...couponDraft,code:e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g,'')})} placeholder="e.g. SAVE10"/></label>
          <label>Discount type<select value={couponDraft.discountType} onChange={e=>setCouponDraft({...couponDraft,discountType:e.target.value})}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed amount (₦)</option></select></label>
          <label>Discount value<input required type="number" min="1" max={couponDraft.discountType==='percentage'?100:10000000} value={couponDraft.discountValue} onChange={e=>setCouponDraft({...couponDraft,discountValue:e.target.value})}/></label>
          <label>Products covered<select multiple value={couponDraft.productIds} onChange={e=>setCouponDraft({...couponDraft,productIds:Array.from(e.target.selectedOptions).map(option=>option.value)})}>{products.filter(p=>p.vendorId===user.userId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><small>Leave unselected to apply to all your products.</small></label>
          <label>Minimum order amount (₦)<input type="number" min="0" value={couponDraft.minOrderAmount} onChange={e=>setCouponDraft({...couponDraft,minOrderAmount:e.target.value})} placeholder="0 = no minimum"/></label>
          <label>Maximum discount (₦)<input type="number" min="0" value={couponDraft.maxDiscount} onChange={e=>setCouponDraft({...couponDraft,maxDiscount:e.target.value})} placeholder="0 = no cap"/></label>
          <label>Maximum uses<input type="number" min="0" step="1" value={couponDraft.usageLimit} onChange={e=>setCouponDraft({...couponDraft,usageLimit:e.target.value})}/><small>Enter 0 for unlimited uses.</small></label>
          <label>Starts at (optional)<input type="datetime-local" value={couponDraft.startsAt} onChange={e=>setCouponDraft({...couponDraft,startsAt:e.target.value})}/></label>
          <label>Expiry date and time<input required type="datetime-local" value={couponDraft.expiresAt} onChange={e=>setCouponDraft({...couponDraft,expiresAt:e.target.value})}/></label>
          <button className="primary-btn" disabled={busy}>{busy?'Creating coupon...':'Create coupon'}</button>
        </form>
        <h3>Coupons you created</h3>{vendorCoupons.length ? vendorCoupons.map(coupon=><div className="manage-row" key={coupon.id}><div className="manage-main"><b>{coupon.code} · {coupon.discountType==='percentage'?coupon.discountValue+'%':money(Number(coupon.discountValue))} off</b><small>Expires {new Date(coupon.expiresAt).toLocaleString()} · Used {coupon.usedCount || 0}{coupon.usageLimit ? ' / '+coupon.usageLimit : ''} · {coupon.productIds?.length ? coupon.productIds.length+' selected product(s)' : 'All your products'}</small></div><span className={'status '+(coupon.status==='active'?'approved':'suspended')}>{new Date(coupon.expiresAt).getTime()<=Date.now()?'expired':coupon.status}</span>{coupon.status==='active' && new Date(coupon.expiresAt).getTime()>Date.now() && <button className="secondary-btn" onClick={()=>updateVendorCoupon(coupon.id,'inactive')}>Deactivate</button>}{coupon.status==='inactive' && new Date(coupon.expiresAt).getTime()>Date.now() && <button className="secondary-btn" onClick={()=>updateVendorCoupon(coupon.id,'active')}>Activate</button>}<button className="danger-icon" onClick={()=>deleteVendorCoupon(coupon.id)}><Trash2 size={17}/></button></div>) : <p className="muted">You have not created any coupons yet.</p>}
      </section>
      <section className="panel"><h2>My customer orders</h2><p className="muted">You can view customer and delivery details. Only the marketplace admin can approve, process, ship, cancel or complete orders.</p>{orders.length ? orders.map(o=><div className="order-row" key={o.id}><div><b>{o.orderNumber} · {o.status}</b><p>{o.customerName} · Phone: {o.phone}</p><p>Email: {o.email || 'Not provided'} · Payment: {o.paymentMethod}</p><p>Address / instructions: {o.address || 'Not provided'}</p><small>{o.items.map(i=>i.name+' × '+i.quantity+(i.option?' ('+i.option+')':'')).join(', ')} · Your sales: {money((o as any).vendorTotal || o.items.reduce((sum,i)=>sum+i.price*i.quantity,0))}</small></div></div>) : <p className="muted">Orders containing your products will appear here.</p>}</section></>}
    </main>}

        {page === 'wallet' && <main className="workspace"><button className="back-link" onClick={() => setPage('home')}><ArrowLeft size={16}/> Back to marketplace</button><div className="workspace-heading"><div><span className="eyebrow">YOUR MONEY</span><h1>My wallet</h1><p>Add money, request a bank withdrawal, or use your balance to pay for marketplace products.</p></div><span className="role-pill">Wallet account</span></div>{!user ? <div className="panel centered"><h2>Sign in to access your wallet</h2><button className="primary-btn" onClick={signIn}>Sign in</button></div> : <><div className="stats-row"><div><small>Available wallet balance</small><b>{money(walletSummary?.balance || 0)}</b></div><div><small>Wallet funding fee</small><b>{money(walletSummary?.topupFee ?? 100)}</b></div><div><small>Withdrawal transfer fee</small><b>{money(settings.withdrawalFee)}</b></div></div><section className="panel"><div className="panel-title"><div><h2>Wallet actions</h2><p>Fund your wallet, request a withdrawal, or refresh the latest balance.</p></div><button className="secondary-btn" onClick={refreshWallet}>Refresh wallet</button></div><div className="hero-buttons"><a className="primary-btn" href="#wallet-fund">Add money</a><a className="secondary-btn" href="#wallet-withdraw">Withdraw money</a></div></section><section className="panel" id="wallet-fund"><h2>Add money to wallet</h2><p className="muted">Enter the exact amount you want credited. Paystack uses a secure hosted checkout and credits your wallet only after server verification. Manual bank transfers remain pending until the owner confirms receipt. The wallet funding fee is fixed at ₦100 for every wallet top-up.</p><form className="product-form" onSubmit={startWalletTopup}><label>Amount to add (₦)<input type="number" min="100" max="5000000" step="1" required value={walletTopupAmount} onChange={e=>setWalletTopupAmount(e.target.value)} placeholder="e.g. 5000"/></label><label>Payment method<select value={walletTopupMethod} onChange={e=>setWalletTopupMethod(e.target.value)}><option value="Paystack" disabled={!paystackReady}>Paystack {paystackReady ? '(Card / Bank / USSD)' : '(not connected — add Paystack Secret Key)'}</option><option value="Bank transfer">Manual bank transfer</option></select></label>{walletTopupMethod==='Paystack' && <label>Email address for Paystack<input type="email" required value={walletTopupEmail || user?.email || ''} onChange={e=>setWalletTopupEmail(e.target.value)} placeholder="name@example.com"/></label>}<div className="full-field checkout-note">Wallet credit: {money(Number(walletTopupAmount)||0)} · Fixed fee: {money(walletSummary?.topupFee ?? 100)} · Total payment: {money((Number(walletTopupAmount)||0)+(walletSummary?.topupFee ?? 100))}</div><button type="submit" className="primary-btn" disabled={walletTopupBusy || !walletTopupAmount || (walletTopupMethod==='Paystack' && !paystackReady)}>{walletTopupBusy ? 'Preparing wallet funding...' : walletTopupMethod==='Paystack' ? 'Continue to Paystack funding' : 'Continue to manual bank funding'}</button></form></section><section className="panel"><div className="panel-title"><div><h2>My wallet top-up requests</h2><p>Pending transfers are not spendable. Completed payments are credited to your wallet.</p></div><button className="secondary-btn" onClick={refreshWallet}>Refresh status</button></div>{walletSummary?.topups?.length ? walletSummary.topups.map((t:any)=><div className="manage-row" key={t.id}><div className="manage-main"><b>{money(t.amount)} wallet credit</b><small>{t.paymentMethod} · Fee {money(t.fee)} · Total paid {money(t.total)} · {new Date(t.createdAt).toLocaleString()}</small><small>Reference: {t.id}{t.paystackReference ? ' · Paystack: '+t.paystackReference : ''}</small></div><span className={'status '+(t.status==='completed'?'approved':'')}>{t.status}</span></div>) : <p className="muted">No wallet top-up requests yet.</p>}</section><section className="panel" id="wallet-withdraw"><h2>Withdraw money to your bank</h2><p className="muted">Enter your bank details and amount. The requested amount plus the displayed transfer fee is reserved from your wallet. The marketplace owner reviews the request and completes the bank transfer manually. If rejected, the full reserved amount and fee are returned to your wallet.</p><form className="product-form" onSubmit={requestCustomerWithdrawal}><label>Amount to receive (₦)<input type="number" min="1000" max="5000000" step="1" required value={customerWithdrawalForm.amount} onChange={e=>setCustomerWithdrawalForm({...customerWithdrawalForm,amount:e.target.value})}/></label><label>Bank name<input required value={customerWithdrawalForm.bankName} onChange={e=>setCustomerWithdrawalForm({...customerWithdrawalForm,bankName:e.target.value})} placeholder="e.g. Moniepoint"/></label><label>10-digit account number<input required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={customerWithdrawalForm.accountNumber} onChange={e=>setCustomerWithdrawalForm({...customerWithdrawalForm,accountNumber:e.target.value.replace(/\D/g,'').slice(0,10)})}/></label><label>Account name<input required value={customerWithdrawalForm.accountName} onChange={e=>setCustomerWithdrawalForm({...customerWithdrawalForm,accountName:e.target.value})}/></label><div className="full-field checkout-note">Amount to receive: {money(Number(customerWithdrawalForm.amount)||0)} · Fee: {money(settings.withdrawalFee)} · Total wallet debit: {money((Number(customerWithdrawalForm.amount)||0)+settings.withdrawalFee)}</div><button type="submit" className="primary-btn" disabled={customerWithdrawalBusy || !customerWithdrawalForm.amount}>{customerWithdrawalBusy ? 'Submitting withdrawal request...' : 'Submit withdrawal request'}</button></form><h3>My withdrawal requests</h3>{customerWithdrawals.length ? customerWithdrawals.map((w:any)=><div className="manage-row" key={w.id}><div className="manage-main"><b>{money(w.amount)} requested · Fee {money(w.fee)}</b><small>{w.bankName} · {w.accountNumber} · {w.accountName}</small><small>{new Date(w.createdAt).toLocaleString()}</small></div><span className={'status '+(w.status==='paid'?'approved':w.status)}>{w.status}</span></div>) : <p className="muted">No withdrawal requests yet.</p>}</section><section className="panel"><h2>Wallet transaction history</h2>{walletSummary?.transactions?.length ? walletSummary.transactions.map((t:any)=><div className="manage-row" key={t.id}><div className="manage-main"><b>{t.description}</b><small>{new Date(t.createdAt).toLocaleString()} · {t.type} · Ref: {t.reference}</small></div><b>{t.amount>0?'+':''}{money(t.amount)}</b></div>) : <p className="muted">No wallet transactions yet.</p>}</section></>}</main>}

    {page === 'admin' && <main className="workspace">
      <button className="back-link" onClick={() => setPage('home')}><ArrowLeft size={16}/> Back to marketplace</button>
      {!isAdmin ? <div className="panel centered"><ShieldCheck size={40}/><h2>Owner access only</h2><p>Sign in with the marketplace owner account to continue.</p><button className="primary-btn" onClick={signIn}>Sign in</button></div> : <>
      <div className="admin-heading"><div className="workspace-heading"><div><span className="eyebrow">YAKAJI DIGITAL HUB · CONTROL CENTRE</span><h1>Marketplace overview</h1><p>Monitor performance, manage daily operations and control your marketplace.</p></div><span className="role-pill"><ShieldCheck size={16}/> Owner / Admin</span></div><button className="secondary-btn admin-refresh" onClick={loadAdmin}><TrendingUp size={16}/> Refresh live data</button></div>
      <section className="panel" id="admin-support"><div className="panel-title"><div><h2>Live customer support desk</h2><p>Each customer has a separate private conversation. Set your availability and manage the waiting queue.</p></div><button className="secondary-btn" onClick={()=>api.get('/api/admin/support/conversations').then(r=>setSupportConversations(r.data.conversations||[]))}>Refresh inbox</button></div>
        <div className="support-admin-controls"><b>Live chat availability: {supportAdminSettings.online ? 'ONLINE' : 'OFFLINE'}</b><button className="primary-btn" onClick={()=>updateSupportAvailability(true)}>Admin available</button><button className="secondary-btn" onClick={()=>updateSupportAvailability(false)}>Set offline / weekend closed</button><label>Maximum active chats <select value={supportAdminSettings.maxConcurrent} onChange={e=>setSupportAdminSettings((current:any)=>({...current,maxConcurrent:Number(e.target.value)}))}><option value={1}>1 customer at a time</option><option value={2}>2 customers</option><option value={3}>3 customers</option></select></label><button className="secondary-btn" onClick={()=>api.put('/api/admin/support/settings',supportAdminSettings).then(r=>{setSupportAdminSettings(r.data.settings);flash('Support settings saved.');}).catch(e=>setError(errorText(e)))}>Save support settings</button></div>
        {supportConversations.length ? <div className="support-admin-grid"><div>{supportConversations.map((conversation:any)=><button key={conversation.id} className={'support-thread '+(activeSupportConversation===conversation.id?'active':'')} onClick={async()=>{setActiveSupportConversation(conversation.id);const m=await api.get('/api/support/messages?conversationId='+encodeURIComponent(conversation.id));setSupportMessages(m.data.messages||[]);}}><b>{conversation.customerName}</b><small>{conversation.email || conversation.customerId}</small><span>{conversation.lastMessage?.message || 'New support request'}</span><small>{conversation.mode === 'human' ? 'Human agent requested' : 'AI assistant handling chat'}</small><em>{conversation.mode === 'human' ? 'Human agent mode' : 'AI assistant mode'} · {conversation.status === 'waiting' ? 'Waiting for agent' : conversation.status === 'on_hold' ? 'On hold' : conversation.status === 'active' ? 'Active' : 'Closed'}</em></button>)}</div><div>{activeSupportConversation ? <><div className="support-admin-messages">{supportMessages.filter(m=>m.conversationId===activeSupportConversation).map((m:any)=><p key={m.id}><b>{m.sender === 'admin' ? 'You' : m.sender === 'assistant' ? 'Yakaji AI Assistant' : m.customerName || 'Customer'}:</b> {m.message}</p>)}</div><div className="support-admin-controls"><button className="primary-btn" onClick={()=>updateSupportConversationStatus(activeSupportConversation,'active','human')}>Take over as human agent</button><button className="secondary-btn" onClick={()=>updateSupportConversationStatus(activeSupportConversation,'active','ai')}>Resume AI assistant</button><button className="secondary-btn" onClick={()=>updateSupportConversationStatus(activeSupportConversation,'on_hold','human')}>Put on hold</button><button className="secondary-btn" onClick={()=>updateSupportConversationStatus(activeSupportConversation,'closed','human')}>Finish chat</button><button className="secondary-btn" onClick={()=>updateSupportConversationStatus(activeSupportConversation,'active','human')}>Reopen / continue chat</button></div><form className="support-send-row" onSubmit={sendAdminReply}><input required maxLength={1500} value={adminReply} onChange={e=>setAdminReply(e.target.value)} placeholder="Write a private reply to this customer"/><button type="submit" className="primary-btn" disabled={busy || !activeSupportConversation || !adminReply.trim()}>{busy ? 'Sending…' : 'Send private reply'}</button></form></> : <p className="muted">Select a customer to open their private conversation.</p>}</div></div> : <p className="muted">No support conversations yet.</p>}
      </section>
      <nav className="admin-nav" aria-label="Owner dashboard navigation"><a href="#admin-overview"><LayoutDashboard size={15}/> Overview</a><a href="#admin-analytics"><BarChart3 size={15}/> Analytics</a><a href="#admin-commission-profit"><TrendingUp size={15}/> Profit & commission</a><a href="#admin-orders"><Package size={15}/> Order management</a><a href="#admin-payments"><Wallet size={15}/> Order payments</a><a href="#admin-announcements"><Bell size={15}/> Announcements</a><a href="#admin-vendors"><Store size={15}/> Vendors</a><a href="#admin-products"><ShoppingBag size={15}/> Products</a><a href="#admin-users"><Users size={15}/> Customers</a><a href="#admin-affiliate-marketing"><TrendingUp size={15}/> Affiliate Marketing</a><a href="#admin-finance"><Wallet size={15}/> Finance settings</a><a href="#admin-vendor-funding">Fund vendor</a><a href="#admin-topups">Wallet top-ups</a><a href="#admin-withdrawals">Customer & vendor withdrawals</a><a href="#admin-support">Support inbox</a><a href="#admin-sales-reports">Sales reports</a></nav>
      <section className="admin-kpis" id="admin-overview">
        <article className="admin-kpi kpi-green"><span><Wallet size={18}/></span><small>Paid revenue · all time</small><b>{money(adminAnalytics?.paidRevenue || 0)}</b><em>Verified completed payments</em></article>
        <article className="admin-kpi"><span><Package size={18}/></span><small>Total orders</small><b>{orders.length.toLocaleString()}</b><em>{orders.filter(o=>o.status!=='Cancelled').length} excluding cancelled</em></article>
        <article className="admin-kpi"><span><Store size={18}/></span><small>Active vendors</small><b>{vendors.filter(v=>v.status==='approved').length}</b><em>{vendors.filter(v=>v.status==='pending').length} awaiting review</em></article>
        <article className="admin-kpi"><span><ShoppingBag size={18}/></span><small>Marketplace products</small><b>{products.length.toLocaleString()}</b><em>{products.filter(p=>p.status==='approved').length} published</em></article>
        <article className="admin-kpi"><span><Users size={18}/></span><small>Registered customers</small><b>{adminUsers.length.toLocaleString()}</b><em>Profiles in marketplace</em></article>
      </section>
      <section className="admin-quick-controls" aria-label="Quick owner controls">
        <div className="admin-quick-heading"><div><span className="eyebrow">QUICK ACTIONS</span><h2>What would you like to manage?</h2><p>Choose a task to jump straight to its controls.</p></div></div>
        <div className="admin-quick-grid">
          <a href="#admin-orders"><Package/><b>Manage order fulfilment</b><small>Confirm, process, ship, deliver, complete or cancel customer orders</small></a><a href="#admin-payments"><Wallet/><b>Manage order payments</b><small>Verify received money, keep payments pending or reject unverified transactions</small></a><a href="#admin-announcements"><Bell/><b>Marketplace announcements</b><small>Notify all customers, vendors or one audience group</small></a>
          <a href="#admin-vendors"><Store/><b>Manage vendors</b><small>Approve, reject or suspend sellers</small></a>
          <a href="#admin-products"><ShoppingBag/><b>Manage products</b><small>Add, edit, approve or remove listings</small></a>
          <a href="#admin-finance"><Wallet/><b>Fees & commission</b><small>Control marketplace charges and rates</small></a>
          <a href="#admin-vendor-funding"><Plus/><b>Fund vendor wallet</b><small>Add a custom amount to a vendor</small></a>
          <a href="#admin-topups"><Wallet/><b>Customer top-ups</b><small>Review and confirm transfer requests</small></a>
          <a href="#admin-withdrawals"><ArrowRight/><b>Customer & vendor withdrawals</b><small>Review wallet and vendor sales bank withdrawal requests</small></a>
          <a href="#admin-users"><Users/><b>Customer directory</b><small>View registered marketplace accounts</small></a>
          <a href="#admin-affiliate-marketing"><TrendingUp/><b>Affiliate Marketing</b><small>Review applicants, commissions, sales and withdrawals</small></a>
          <a href="#admin-support"><Heart/><b>Customer support</b><small>Read and reply to customer messages</small></a>
          <a href="#admin-sales-reports"><BarChart3/><b>Sales reports</b><small>Compare daily, weekly, monthly and yearly sales</small></a>
        </div>
      </section>
      <section className="panel" id="admin-commission-profit"><div className="panel-title"><div><span className="eyebrow">OWNER ONLY · PLATFORM EARNINGS</span><h2>Marketplace profit & commission analytics</h2><p>Private to the marketplace owner. Calculated from verified successful vendor payments only.</p></div><span className="role-pill"><ShieldCheck size={15}/> Admin only</span></div><div className="stats-row"><div><small>Today's commission</small><b>{money(adminAnalytics?.commissionAnalytics?.today || 0)}</b></div><div><small>This week's commission</small><b>{money(adminAnalytics?.commissionAnalytics?.thisWeek || 0)}</b></div><div><small>This month's commission</small><b>{money(adminAnalytics?.commissionAnalytics?.thisMonth || 0)}</b></div><div><small>All-time marketplace profit</small><b>{money(adminAnalytics?.commissionAnalytics?.netProfit || 0)}</b></div><div><small>Refunded commission reversed</small><b>{money(adminAnalytics?.commissionAnalytics?.refundedCommission || 0)}</b></div></div><p className="muted">Verified vendor sales: {money(adminAnalytics?.commissionAnalytics?.verifiedPaidSales || 0)} · Pending unpaid sales excluded: {money(adminAnalytics?.commissionAnalytics?.pendingSales || 0)}.</p><h3>Commission earned by vendor</h3>{(adminAnalytics?.commissionAnalytics?.commissionByVendor || []).length ? adminAnalytics.commissionAnalytics.commissionByVendor.map((v:any)=><div className="manage-row" key={v.vendorId}><div className="manage-main"><b>{v.shopName}</b><small>Vendor sales {money(v.sales)} · Marketplace commission {money(v.commissionEarned)} · Affiliate commission {money(v.affiliateCommission || 0)} · Gateway fees {money(v.paymentGatewayFees || 0)} · Vendor net {money(v.vendorNetEarnings)}</small></div><b>{money(v.commissionEarned)}</b></div>) : <p className="muted">No verified vendor commissions yet.</p>}<h3>Commission earned by product</h3>{(adminAnalytics?.commissionAnalytics?.commissionByProduct || []).length ? adminAnalytics.commissionAnalytics.commissionByProduct.map((p:any)=><div className="manage-row" key={p.productId}><div className="manage-main"><b>{p.productName}</b><small>Vendor: {p.vendorName || p.vendorId} · Sales {money(p.sales)} · Marketplace commission earned {money(p.commissionEarned)}</small></div><b>{money(p.commissionEarned)}</b></div>) : <p className="muted">No product commission records yet.</p>}<h3>Daily marketplace profit · last 30 days</h3><div className="payment-method-list">{(adminAnalytics?.commissionAnalytics?.dailyCommissionTrend || []).map((d:any)=><div className="payment-method-row" key={d.label}><span>{d.label}</span><b>{money(d.commissionEarned)}</b></div>)}</div><h3>Monthly marketplace profit · last 12 months</h3><div className="payment-method-list">{(adminAnalytics?.commissionAnalytics?.monthlyCommissionTrend || []).map((m:any)=><div className="payment-method-row" key={m.label}><span>{m.label}</span><b>{money(m.commissionEarned)}</b></div>)}</div></section>
      <section className="panel" id="admin-affiliate-marketing">
        <div className="panel-title"><div><span className="eyebrow">OWNER ONLY · AFFILIATE PROGRAM</span><h2>Affiliate Marketing Dashboard</h2><p>One place to monitor affiliate applicants, approved marketers, tracked sales, commissions and withdrawal requests.</p></div><button className="secondary-btn" onClick={loadAdmin}>Refresh affiliate data</button></div>
        <div className="stats-row">
          <div><small>Affiliate applications</small><b>{Number(affiliateData.summary?.totalApplicants||0)}</b></div>
          <div><small>Awaiting approval</small><b>{Number(affiliateData.summary?.pendingApplicants||0)}</b></div>
          <div><small>Active affiliates</small><b>{Number(affiliateData.summary?.activeAffiliates||0)}</b></div>
          <div><small>Tracked sales</small><b>{Number(affiliateData.summary?.totalTrackedSales||0)}</b></div>
          <div><small>Total affiliate commissions</small><b>{money(Number(affiliateData.summary?.totalCommission||0))}</b></div>
          <div><small>Commission awaiting payout</small><b>{money(Number(affiliateData.summary?.payableCommission||0))}</b></div>
          <div><small>Paid affiliate commissions</small><b>{money(Number(affiliateData.summary?.paidCommission||0))}</b></div>
          <div><small>Pending withdrawals</small><b>{Number(affiliateData.summary?.pendingWithdrawals||0)} · {money(Number(affiliateData.summary?.withdrawalAmountPending||0))}</b></div>
        </div>
        <h3>Affiliate registration applicants</h3>
        <p className="muted">Review applicant details and approve, reject or suspend affiliate accounts. Registration payment status is shown when supplied by the registration system.</p>
        {affiliateData.affiliates?.length ? affiliateData.affiliates.map((a:any)=><div className="manage-row" key={a.id}><div className="manage-main"><b>{a.fullName || a.name || a.email || 'Affiliate applicant'}</b><small>{a.email || 'No email'} · {a.phone || 'No phone'} · WhatsApp {a.whatsapp || 'Not provided'}</small><small>{a.address || ''} {a.city || ''} {a.state || ''} · Promotion: {a.promotionMethod || 'Not supplied'}</small><small>Applied {a.createdAt ? new Date(a.createdAt).toLocaleString() : 'Date not recorded'} · Payment: {a.registrationPaymentStatus || a.paymentStatus || 'Not recorded'} · Method: {a.registrationPaymentMethod || 'Not selected'} · Fee {money(Number(a.registrationFee || 2000))}</small></div><span className={'status '+(a.status==='approved'?'approved':a.status==='rejected'?'rejected':a.status==='suspended'?'suspended':'pending')}>{a.status || 'pending'}</span>{a.registrationPaymentMethod==='Bank transfer' && a.registrationPaymentStatus==='pending_confirmation' && <button className="primary-btn" onClick={async()=>{try{await api.post('/api/admin/affiliates/'+a.id+'/confirm-transfer',{});await loadAdmin();flash('Affiliate transfer confirmed.');}catch(e){setError(errorText(e));}}}>Confirm received transfer</button>}<select aria-label={'Affiliate status for '+(a.email||a.id)} value={a.status || 'pending'} onChange={e=>updateAffiliateStatus(a.id,e.target.value)}><option value="pending">Pending review</option><option value="approved" disabled={a.registrationPaymentStatus!=='paid'}>Approve affiliate</option><option value="rejected">Reject application</option><option value="suspended">Suspend affiliate</option></select></div>) : <div className="chart-empty compact"><Users size={27}/><b>No affiliate applications yet</b><small>New applications will appear here when the affiliate registration form is connected.</small></div>}
        <h3>Affiliate sales & commission records</h3>
        {affiliateData.commissions?.length ? affiliateData.commissions.map((c:any)=><div className="manage-row" key={c.id}><div className="manage-main"><b>{c.affiliateName || c.affiliateEmail || 'Affiliate'} · {c.productName || 'Product sale'}</b><small>Order {c.orderNumber || c.orderId || 'Not recorded'} · Sale {money(Number(c.saleAmount||0))} · Rate {Number(c.commissionPercent||0)}% · {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</small></div><b>{money(Number(c.commissionAmount||0))}</b><span className={'status '+(c.status==='paid'?'approved':'pending')}>{c.status || 'pending'}</span></div>) : <p className="muted">No affiliate-attributed sales or commission records yet.</p>}
        <h3>Affiliate withdrawal requests</h3>
        {affiliateData.withdrawals?.length ? affiliateData.withdrawals.map((w:any)=><div className="manage-row" key={w.id}><div className="manage-main"><b>{w.affiliateName || w.affiliateEmail || 'Affiliate'} · {money(Number(w.amount||0))}</b><small>{w.bankName || 'Bank not provided'} · {w.accountName || ''} · {w.accountNumber || ''} · Requested {w.createdAt ? new Date(w.createdAt).toLocaleString() : ''}</small></div><span className={'status '+(w.status==='paid'?'approved':w.status==='rejected'?'rejected':'pending')}>{w.status || 'pending'}</span><select aria-label={'Affiliate withdrawal status '+w.id} value={w.status || 'pending'} onChange={e=>updateAffiliateWithdrawal(w.id,e.target.value)}><option value="pending">Pending</option><option value="approved" disabled={w.status!=='pending'}>Approve</option><option value="rejected" disabled={!['pending','approved'].includes(w.status)}>Reject</option><option value="paid" disabled={w.status!=='approved'}>Mark paid</option></select></div>) : <p className="muted">No affiliate withdrawal requests yet.</p>}
        <div className="checkout-note"><b>Affiliate programme:</b> Approved affiliates can access eligible active products, create unique product links, track clicks and verified completed sales, and request bank withdrawals. Each product uses the commission percentage selected by its vendor.</div>
      </section>
      <section className="admin-chart-grid" id="admin-analytics">
        <article className="admin-chart-card admin-chart-wide">
          <div className="admin-chart-head"><div><span className="eyebrow">REVENUE PERFORMANCE</span><h2>Paid revenue by month</h2><p>Last 6 months · verified completed payments only</p></div><span className="chart-key"><i/> Paid revenue</span></div>
          {monthlyTrend.some((point:any)=>Number(point.paidRevenue)>0) ? <div className="revenue-bars">{monthlyTrend.map((point:any,index:number)=><div className="revenue-bar-column" key={point.label}><b>{money(point.paidRevenue)}</b><div className="revenue-bar-track"><span style={{height:Math.max(4,(Number(point.paidRevenue)/maxTrendRevenue)*100)+'%'}}/></div><small>{point.label}</small></div>)}</div> : <div className="chart-empty"><BarChart3 size={30}/><b>No verified revenue yet</b><small>When payments are completed, monthly revenue will appear here.</small></div>}
        </article>
        <article className="admin-chart-card">
          <div className="admin-chart-head"><div><span className="eyebrow">ORDER ACTIVITY</span><h2>Daily orders</h2><p>Last 14 days · all order statuses</p></div><span className="chart-total">{orders.length}</span></div>
          {dailyTrend.some((point:any)=>Number(point.orders)>0) ? <div className="daily-bars">{dailyTrend.map((point:any,index:number)=><div className="daily-bar-column" key={index} title={point.label+': '+point.orders+' orders'}><span style={{height:Math.max(4,(Number(point.orders)/maxTrendOrders)*100)+'%'}}/><small>{index%2===0?point.label:''}</small></div>)}</div> : <div className="chart-empty compact"><Package size={27}/><b>No orders yet</b><small>New orders will be charted here.</small></div>}
        </article>
      </section>
      <section className="admin-chart-grid admin-chart-grid-lower">
        <article className="admin-chart-card">
          <div className="admin-chart-head"><div><span className="eyebrow">FULFILMENT</span><h2>Order status breakdown</h2><p>Current order pipeline</p></div></div>
          {orderStatuses.some((row:any)=>row.count>0) ? <div className="status-chart-list">{orderStatuses.map((row:any)=><div className="status-chart-row" key={row.status}><div><span>{row.status}</span><b>{row.count}</b></div><div className="status-track"><i style={{width:(orders.length?row.count/orders.length*100:0)+'%'}}/></div></div>)}</div> : <div className="chart-empty compact"><Package size={27}/><b>No order statuses yet</b></div>}
        </article>
        <article className="admin-chart-card">
          <div className="admin-chart-head"><div><span className="eyebrow">PAYMENT CHANNELS</span><h2>Payment methods</h2><p>Based on recorded orders</p></div></div>
          {paymentMethods.length ? <div className="payment-method-list">{paymentMethods.map((row:any)=><div className="payment-method-row" key={row.method}><span>{row.method}</span><b>{row.count} orders</b></div>)}</div> : <div className="chart-empty compact"><Wallet size={27}/><b>No payment records yet</b></div>}
        </article>
      </section>
      <div className="admin-section-title"><div><span className="eyebrow">MARKETPLACE OPERATIONS</span><h2>Manage your business</h2><p>Open any section below to manage the marketplace.</p></div></div>
      <section className="panel" id="admin-orders">
        <div className="panel-title"><div><span className="eyebrow">OWNER ONLY · ORDER FULFILMENT</span><h2>Order Management</h2><p>Manage the product order lifecycle separately from payment verification. Updating an order stage never changes its payment status.</p></div><button className="secondary-btn" onClick={loadAdmin}>Refresh orders</button></div>
        <div className="stats-row">
          <div><small>New orders</small><b>{orders.filter(o => o.status === 'New').length}</b></div>
          <div><small>Being processed</small><b>{orders.filter(o => ['Confirmed','Processing','Ready for Shipping'].includes(o.status)).length}</b></div>
          <div><small>In delivery</small><b>{orders.filter(o => ['Shipped','Out for Delivery'].includes(o.status)).length}</b></div>
          <div><small>Delivered / completed</small><b>{orders.filter(o => ['Delivered','Completed'].includes(o.status)).length}</b></div>
        </div>
        {orders.length ? [...orders].sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(order => <article className="panel order-history-card" key={'fulfilment-' + order.id}>
          <div className="panel-title"><div><span className="eyebrow">ORDER {order.orderNumber}</span><h3>{order.customerName || 'Customer'} · {money(order.total)}</h3><p>{new Date(order.createdAt).toLocaleString()} · {order.phone || 'No phone'} · {order.email || 'No email'}</p></div><div><span className="status">{order.status}</span><p><small>Payment: </small><b>{paymentStatusLabel(order.paymentStatus)}</b></p></div></div>
          <div className="order-history-items"><b>Items to fulfil</b>{order.items.map((item,index) => <div className="manage-row" key={item.productId + '-' + index}><div className="manage-main"><b>{item.name} × {item.quantity}</b><small>{money(item.price)} each{item.option ? ' · ' + item.option : ''}</small></div><b>{money(item.price * item.quantity)}</b></div>)}</div>
          <div className="order-info-grid"><div><small>Delivery address</small><b>{order.address || 'Not provided'}</b></div><div><small>Customer phone</small><b>{order.phone || 'Not provided'}</b></div><div><small>Courier</small><b>{order.courier || 'Not assigned'}</b></div><div><small>Tracking number</small><b>{order.trackingNumber || 'Not assigned'}</b></div></div>
          <div className="product-form">
            <label>Update order stage
              <select aria-label={'Order stage for ' + order.orderNumber} value={order.status} onChange={e => { if (window.confirm('Change order ' + order.orderNumber + ' to ' + e.target.value + '? The payment status will not change.')) void changeOrderStatus(order.id, e.target.value); }}>
                <option value="New">New order</option><option value="Confirmed">Confirmed</option><option value="Processing">Processing</option><option value="Ready for Shipping">Ready for Shipping</option><option value="Shipped">Shipped</option><option value="Out for Delivery">Out for Delivery</option><option value="Delivered">Delivered</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option><option value="Returned">Returned</option><option value="Refunded">Refunded</option>
              </select>
              <small>Choose the actual fulfilment stage. Customers receive an order-status notification when it changes.</small>
            </label>
          </div>
          <div className="panel payment-review-inline" style={{marginTop:12,padding:14,border:'1px solid #dce9df',background:'#f7fbf8'}}>
            <div className="panel-title"><div><span className="eyebrow">SEPARATE PAYMENT CONTROL</span><h3>Payment Verification</h3><p>This controls only the money transaction. It will not change the order stage above.</p></div><span className={'status '+(order.paymentStatus === 'completed' ? 'approved' : order.paymentStatus === 'rejected' ? 'rejected' : 'pending')}>{paymentStatusLabel(order.paymentStatus).toUpperCase()}</span></div>
            <div className="order-info-grid"><div><small>Payment method</small><b>{order.paymentMethod || 'Not recorded'}</b></div><div><small>Transaction reference</small><b>{order.paystackReference || order.paymentReference || order.orderNumber}</b></div><div><small>Payment amount</small><b>{money(order.total)}</b></div><div><small>Payment confirmation</small><b>{order.paymentCompletedAt ? new Date(order.paymentCompletedAt).toLocaleString() : 'Not confirmed'}</b></div></div>
            {order.paymentStatus !== 'completed' && !['Cancelled','Refunded'].includes(order.status) ? <div className="hero-buttons" style={{marginTop:12}}>
              {order.paymentMethod === 'Paystack' && <><button className="primary-btn" onClick={() => confirmPayment(order.id)}>Verify Paystack automatically</button><button className="secondary-btn" onClick={() => confirmPayment(order.id, true)}>I checked Paystack dashboard — confirm received</button></>}
              {order.paymentMethod === 'Bank transfer' && <button className="primary-btn" onClick={() => { if (window.confirm('Have you checked your bank account and confirmed that this transfer was received for order ' + order.orderNumber + '?')) void confirmPayment(order.id); }}>Confirm received money & mark payment successful</button>}
              {!['Paystack','Bank transfer','Wallet'].includes(order.paymentMethod) && <span className="checkout-note">This payment provider must be verified through its own transaction system before it can be marked successful.</span>}
              <button className="secondary-btn" onClick={() => reviewPayment(order.id, 'pending')}>Keep payment pending</button>
              <button className="danger-icon" onClick={() => reviewPayment(order.id, 'rejected')}>Reject payment</button>
            </div> : <p className="checkout-note">{order.paymentStatus === 'completed' ? 'Payment is confirmed. Order fulfilment remains ' + order.status + '.' : 'This cancelled or refunded order cannot be marked as paid here.'}</p>}
          </div>
        </article>) : <div className="chart-empty"><Package size={28}/><b>No customer orders yet</b></div>}
      </section>
      <section className="panel" id="admin-payments">
        <div className="panel-title"><div><span className="eyebrow">OWNER ONLY · PAYMENT CONTROL</span><h2>Order Payment Management</h2><p>Confirm only money you have actually received. Paystack payments are verified against Paystack before they can be marked paid.</p></div><button className="secondary-btn" onClick={loadAdmin}>Refresh orders</button></div>
        <div className="stats-row">
          <div><small>Awaiting payment</small><b>{orders.filter(o => o.paymentStatus !== 'completed' && !['Cancelled','Refunded'].includes(o.status)).length}</b></div>
          <div><small>Payment completed</small><b>{orders.filter(o => o.paymentStatus === 'completed').length}</b></div>
          <div><small>Rejected payments</small><b>{orders.filter(o => o.paymentStatus === 'rejected').length}</b></div>
        </div>
        {orders.length ? [...orders].sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(order => <article className="panel order-history-card" key={order.id}>
          <div className="panel-title"><div><span className="eyebrow">ORDER {order.orderNumber}</span><h3>{order.customerName || 'Customer'} · {money(order.total)}</h3><p>{new Date(order.createdAt).toLocaleString()} · {order.paymentMethod}</p></div><div><span className={'status ' + (order.paymentStatus === 'completed' ? 'approved' : order.paymentStatus === 'rejected' ? 'rejected' : 'pending')}>{order.paymentStatus === 'completed' ? 'PAYMENT COMPLETED' : String(order.paymentStatus || 'pending').toUpperCase()}</span><p><span className="status">{order.status}</span></p></div></div>
          <div className="order-history-items"><b>Products</b>{order.items.map((item,index) => <div className="manage-row" key={item.productId + '-' + index}><div className="manage-main"><b>{item.name} × {item.quantity}</b><small>{money(item.price)} each{item.option ? ' · ' + item.option : ''}</small></div><b>{money(item.price * item.quantity)}</b></div>)}</div>
          <div className="order-info-grid">
            <div><small>Customer</small><b>{order.customerName}</b></div><div><small>Phone</small><b>{order.phone || 'Not provided'}</b></div><div><small>Email</small><b>{order.email || 'Not provided'}</b></div><div><small>Payment method</small><b>{order.paymentMethod}</b></div>
            <div><small>Payment reference</small><b>{order.paystackReference || order.paymentReference || order.orderNumber}</b></div><div><small>Delivery details</small><b>{order.address || 'Not provided'}</b></div>
          </div>
          {order.paymentStatus !== 'completed' && !['Cancelled','Refunded'].includes(order.status) && <div className="hero-buttons">
            {order.paymentMethod === 'Paystack' && <button className="primary-btn" onClick={() => confirmPayment(order.id)}>Verify Paystack & confirm payment</button>}
            {order.paymentMethod === 'Bank transfer' && <button className="primary-btn" onClick={() => { if (window.confirm('Confirm that the bank transfer has arrived in your bank account for order ' + order.orderNumber + '?')) void confirmPayment(order.id); }}>Confirm received transfer & mark paid</button>}
            {!['Paystack','Bank transfer','Wallet'].includes(order.paymentMethod) && <span className="checkout-note">This payment method needs its own provider verification. It cannot be manually overridden.</span>}
            <button className="secondary-btn" onClick={() => reviewPayment(order.id, 'pending')}>Keep pending</button>
            <button className="danger-icon" onClick={() => reviewPayment(order.id, 'rejected')}>Reject payment</button>
          </div>}
          {order.paymentStatus === 'completed' && <p className="checkout-note">Payment confirmed {order.paymentCompletedAt ? 'on ' + new Date(order.paymentCompletedAt).toLocaleString() : ''}. The order remains in its separate fulfilment status ({order.status}).</p>}
          {order.paymentStatus === 'rejected' && <p className="checkout-note">Payment was rejected. You can still review it again and keep it pending if the customer provides new evidence.</p>}
        </article>) : <div className="chart-empty"><Package size={28}/><b>No customer orders yet</b></div>}
      </section>
      <section className="panel" id="admin-finance"><h2>Marketplace fees & earnings settings</h2><div className="product-form"><label>Customer transfer fee (₦)<input type="number" min="0" value={settings.customerTransferFee} onChange={e=>setSettings({...settings,customerTransferFee:Number(e.target.value)})}/></label><label>Vendor withdrawal fee (₦)<input type="number" min="0" value={settings.withdrawalFee} onChange={e=>setSettings({...settings,withdrawalFee:Number(e.target.value)})}/></label><label>Default marketplace commission (%)<input type="number" min="0" max="100" step="0.1" value={settings.commissionPercent} onChange={e=>setSettings({...settings,commissionPercent:Number(e.target.value)})}/><small>Default is 8%. The owner can override this percentage on individual products.</small></label><label>Wallet funding fee (₦)<input type="number" value="100" readOnly/><small>Fixed at ₦100 for every wallet funding request.</small></label><label>Customer cashback (%)<input type="number" min="0" max="100" step="0.1" value={settings.cashbackPercent} onChange={e=>setSettings({...settings,cashbackPercent:Number(e.target.value)})}/></label><button className="primary-btn" onClick={saveSettings}>Save marketplace settings</button></div><p className="muted">Cashback percentage is stored as a setting; customer wallet crediting is not enabled in this release.</p></section>
      <section className="panel" id="admin-sales-reports"><h2>Sales reports by period</h2><p className="muted">All marketplace vendors and Yakaji Digital Hub owner products are included.</p><div className="category-list">{(['day','week','month','year'] as const).map(period=><button key={period} className={analyticsPeriod===period?'selected':''} onClick={()=>setAnalyticsPeriod(period)}>{period==='day'?'Today':period==='week'?'This week':period==='month'?'This month':'This year'}</button>)}</div><div className="stats-row"><div><small>Orders</small><b>{adminAnalytics?.reports?.[analyticsPeriod]?.orders || 0}</b></div><div><small>Units sold</small><b>{adminAnalytics?.reports?.[analyticsPeriod]?.unitsSold || 0}</b></div><div><small>Gross sales</small><b>{money(adminAnalytics?.reports?.[analyticsPeriod]?.grossSales || 0)}</b></div><div><small>Completed earnings</small><b>{money(adminAnalytics?.reports?.[analyticsPeriod]?.completedEarnings || 0)}</b></div><div><small>Pending sales</small><b>{money(adminAnalytics?.reports?.[analyticsPeriod]?.pendingSales || 0)}</b></div></div><h3>Vendor sales ranking</h3>{(adminAnalytics?.vendorSales || []).map((v:any)=><div className="manage-row" key={v.vendorId}><div className="manage-main"><b>{v.shopName}</b><small>{v.orders} orders · {v.unitsSold} units · Completed {money(v.completedEarnings)}</small></div><b>{money(v.grossSales)}</b></div>)}</section>
      <section className="panel" id="admin-users"><h2>Registered marketplace users</h2><p className="muted">These are authenticated marketplace accounts that have opened the marketplace profile at least once. Only the owner can view this directory.</p><div className="stats-row"><div><small>Total registered users</small><b>{adminUsers.length}</b></div><div><small>Customers</small><b>{adminUsers.filter(u=>u.vendorStatus==='customer').length}</b></div><div><small>Vendor accounts</small><b>{adminUsers.filter(u=>u.vendorStatus!=='customer').length}</b></div></div>{adminUsers.length ? adminUsers.map(u=><div className="user-directory-row" key={u.id}><div className="directory-avatar">{u.avatarUrl ? <img src={u.avatarUrl} alt=""/> : <UserRound size={20}/>}</div><div className="manage-main"><b>{u.fullName || 'Name not provided'}</b><small>{u.email} · {u.phone || 'No phone provided'} · {u.whatsapp || 'No WhatsApp'}</small><small>{[u.address,u.city,u.state,u.country].filter(Boolean).join(', ') || 'Address not provided'}</small><small>{u.orderCount} orders · Paid total {money(u.totalSpent)} · {u.vendorStatus}</small></div></div>) : <p className="muted">No registered user profiles yet. Users appear here after signing in and opening the marketplace.</p>}</section>
      <section className="panel" id="admin-coupons"><div className="panel-title"><div><h2>Marketplace coupon management</h2><p>Create coupons that apply to all marketplace products or selected products. Choose an exact expiry date and time.</p></div></div>
        <form className="product-form" onSubmit={saveAdminCoupon}>
          <label>Coupon code<input required minLength={3} maxLength={32} value={adminCouponDraft.code} onChange={e=>setAdminCouponDraft({...adminCouponDraft,code:e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g,'')})} placeholder="e.g. YAKAJI20"/></label>
          <label>Discount type<select value={adminCouponDraft.discountType} onChange={e=>setAdminCouponDraft({...adminCouponDraft,discountType:e.target.value})}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed amount (₦)</option></select></label>
          <label>Discount value<input required type="number" min="1" max={adminCouponDraft.discountType==='percentage'?100:10000000} value={adminCouponDraft.discountValue} onChange={e=>setAdminCouponDraft({...adminCouponDraft,discountValue:e.target.value})}/></label>
          <label>Products covered<select multiple value={adminCouponDraft.productIds} onChange={e=>setAdminCouponDraft({...adminCouponDraft,productIds:Array.from(e.target.selectedOptions).map(option=>option.value)})}>{products.filter(p=>p.status==='approved').map(p=><option key={p.id} value={p.id}>{p.name} — {p.vendorName}</option>)}</select><small>Leave unselected to apply to all approved marketplace products.</small></label>
          <label>Minimum order amount (₦)<input type="number" min="0" value={adminCouponDraft.minOrderAmount} onChange={e=>setAdminCouponDraft({...adminCouponDraft,minOrderAmount:e.target.value})}/></label>
          <label>Maximum discount (₦)<input type="number" min="0" value={adminCouponDraft.maxDiscount} onChange={e=>setAdminCouponDraft({...adminCouponDraft,maxDiscount:e.target.value})}/></label>
          <label>Maximum uses<input type="number" min="0" step="1" value={adminCouponDraft.usageLimit} onChange={e=>setAdminCouponDraft({...adminCouponDraft,usageLimit:e.target.value})}/><small>0 means unlimited.</small></label>
          <label>Starts at (optional)<input type="datetime-local" value={adminCouponDraft.startsAt} onChange={e=>setAdminCouponDraft({...adminCouponDraft,startsAt:e.target.value})}/></label>
          <label>Expiry date and time<input required type="datetime-local" value={adminCouponDraft.expiresAt} onChange={e=>setAdminCouponDraft({...adminCouponDraft,expiresAt:e.target.value})}/></label>
          <button className="primary-btn" disabled={busy}>{busy?'Creating coupon...':'Create marketplace coupon'}</button>
        </form>
        <h3>Marketplace coupons</h3>{adminCoupons.filter(coupon=>coupon.vendorId==='marketplace').length ? adminCoupons.filter(coupon=>coupon.vendorId==='marketplace').map(coupon=><div className="manage-row" key={coupon.id}><div className="manage-main"><b>{coupon.code} · {coupon.discountType==='percentage'?coupon.discountValue+'%':money(Number(coupon.discountValue))} off</b><small>Expires {new Date(coupon.expiresAt).toLocaleString()} · Used {coupon.usedCount || 0}{coupon.usageLimit?' / '+coupon.usageLimit:''}</small></div><span className={'status '+(coupon.status==='active'?'approved':'suspended')}>{new Date(coupon.expiresAt).getTime()<=Date.now()?'expired':coupon.status}</span>{coupon.status==='active' && <button className="secondary-btn" onClick={()=>updateAdminCoupon(coupon.id,'inactive')}>Deactivate</button>}{coupon.status==='inactive' && <button className="secondary-btn" onClick={()=>updateAdminCoupon(coupon.id,'active')}>Activate</button>}<button className="danger-icon" onClick={()=>deleteAdminCoupon(coupon.id)}><Trash2 size={17}/></button></div>) : <p className="muted">No marketplace coupons created yet.</p>}
      </section>
      <section className="panel" id="admin-products"><div className="panel-title"><div><h2>{editing ? 'Edit marketplace product' : 'Add a product to Yakaji Digital Hub'}</h2><p>Publish products directly as the marketplace owner. Add photos, videos, options and stock.</p></div>{editing && <button className="secondary-btn" onClick={startNewProduct}>Cancel edit</button>}</div><form className="product-form" onSubmit={saveProduct}><label>Product name<input required value={draft.name} onChange={e => setDraft({...draft,name:e.target.value})} placeholder="Enter product name"/></label><label>Category<select value={draft.category} onChange={e => setDraft({...draft,category:e.target.value})}>{categories.map(x=><option key={x}>{x}</option>)}</select></label><label>Standard price (₦)<input required type="number" min="1" value={draft.price} onChange={e => setDraft({...draft,price:e.target.value})}/></label>
        <label>Discount method<select value={draft.discountMode} onChange={e=>setDraft({...draft,discountMode:e.target.value,discountValue:''})}><option value="none">No discount</option><option value="manual">Enter discount price</option><option value="percentage">Enter discount percentage</option></select></label>
        {draft.discountMode !== 'none' && <label>{draft.discountMode === 'manual' ? 'Discount price (₦)' : 'Discount percentage (%)'}<input required type="number" min="1" max={draft.discountMode === 'percentage' ? 99 : undefined} step="1" value={draft.discountValue} onChange={e=>setDraft({...draft,discountValue:e.target.value})}/><small>{draft.discountMode === 'manual' ? 'Enter the exact sale price. It must be lower than the standard price.' : 'The sale price will be calculated automatically from the standard price.'}</small></label>}
        {draft.discountMode !== 'none' && <><label>Discount starts (optional)<input type="datetime-local" value={draft.discountStartAt} onChange={e=>setDraft({...draft,discountStartAt:e.target.value})}/></label><label>Discount ends (optional)<input type="datetime-local" value={draft.discountEndAt} onChange={e=>setDraft({...draft,discountEndAt:e.target.value})}/></label></>}<label>Available stock<input required type="number" min="0" value={draft.stock} onChange={e => setDraft({...draft,stock:e.target.value})}/></label><label>Product label<input value={draft.tag} onChange={e => setDraft({...draft,tag:e.target.value})} placeholder="New / Popular / Sale"/></label><label>Options / variations<input value={draft.options} onChange={e => setDraft({...draft,options:e.target.value})} placeholder="Small, Medium, Large or Basic, Pro"/></label><label>Affiliate commission (%)<input type="number" required min="0" max="25" step="1" value={draft.affiliateCommissionPercent} onChange={e => setDraft({...draft,affiliateCommissionPercent:e.target.value})}/><small>Choose 0% to disable affiliate earnings, or 5%–25% to pay an affiliate on verified sales.</small></label>{isAdmin && <label>Marketplace commission (%)<input type="number" min="0" max="100" step="0.1" value={draft.marketplaceCommissionPercent} onChange={e=>setDraft({...draft,marketplaceCommissionPercent:e.target.value})} placeholder={'Use marketplace default: '+settings.commissionPercent+'%'}/><small>Owner only. Leave blank to use the current marketplace default of {settings.commissionPercent}%.</small></label>}<label className="full-field">Description<textarea required rows={3} value={draft.description} onChange={e => setDraft({...draft,description:e.target.value})} placeholder="Describe the product clearly"/></label><label className="full-field upload-field"><span><ImagePlus/> Product images and videos (optional when editing)</span><input type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" onChange={e => setSelectedFiles(Array.from(e.target.files || []))}/><small>Choose new photos or videos to add. Existing media stays unless you remove it below. Images up to 8MB and videos up to 30MB each.</small>{selectedFiles.length > 0 && <b>{selectedFiles.length} new file(s) selected</b>}{(draft.images.length + draft.videos.length > 0) && <small>{draft.images.length} saved image(s), {draft.videos.length} saved video(s)</small>}</label>{editing && draft.id && <div className="full-field product-media-editor"><b>Current product photos</b><div className="product-media-edit-grid">{(products.find(p=>p.id===draft.id)?.images || []).map((src,index)=><div className="product-media-edit-item" key={draft.images[index] || index}><img src={src} alt={'Product photo '+(index+1)}/><button type="button" className="danger-icon" onClick={()=>setDraft(current=>({...current,images:current.images.filter((_,i)=>i!==index)}))}>Remove photo</button></div>)}</div><small>Photo changes are optional. Removing a photo updates the product gallery when you save.</small></div>}<button className="primary-btn" disabled={busy}>{busy ? 'Saving product...' : editing ? 'Save changes' : 'Publish product'} <UploadCloud size={17}/></button></form></section>
      <section className="panel" id="admin-vendor-funding"><h2>Fund a vendor wallet</h2><p className="muted">As marketplace owner, manually add any amount to an approved vendor's spendable wallet balance.</p><form className="product-form" onSubmit={fundVendorWallet}><label>Vendor<select required value={vendorCreditForm.vendorId} onChange={e=>setVendorCreditForm({...vendorCreditForm,vendorId:e.target.value})}><option value="">Select approved vendor</option>{vendors.filter(v=>v.status==='approved').map(v=><option key={v.id} value={v.id}>{v.shopName} — {v.email}</option>)}</select></label><label>Amount to add (₦)<input type="number" min="1" max="10000000" required value={vendorCreditForm.amount} onChange={e=>setVendorCreditForm({...vendorCreditForm,amount:e.target.value})}/></label><button className="primary-btn" disabled={busy || !vendorCreditForm.vendorId}>Add money to vendor wallet</button></form></section>
      <section className="panel" id="admin-topups"><h2>Customer wallet top-up requests</h2><p className="muted">Review all incoming wallet funding. For manual bank transfers, confirm only after the money is received in your bank account. For Paystack, use server-side verification: the wallet is credited only when Paystack confirms success and the amount, currency and reference match. If Paystack still reports pending or failed, the request stays pending and no credit is made. Rejecting a request never credits the wallet.</p>{walletTopups.length ? walletTopups.map(t=><div className="manage-row" key={t.id}><div className="manage-main"><b>{t.userName || t.email || 'Customer'} · {money(t.amount)} wallet credit</b><small>{t.role} · {t.email || 'No email'} · {t.paymentMethod} · Fee {money(t.fee)} · Total received {money(t.total)} · {new Date(t.createdAt).toLocaleString()}</small><small>Reference: {t.id}{t.paystackReference ? ' · Paystack reference: '+t.paystackReference : ''} · Status: {t.status}</small></div>{t.status==='pending' && <>{t.paymentMethod==='Bank transfer' ? <button className="primary-btn" onClick={()=>confirmWalletTopup(t.id)}>Confirm received transfer & credit</button> : t.paymentMethod==='Paystack' ? <button className="primary-btn" onClick={()=>confirmWalletTopup(t.id)}>Verify Paystack & credit if successful</button> : null}<button className="secondary-btn" onClick={()=>rejectWalletTopup(t.id)}>Reject request</button></>}<span className={'status '+(t.status==='completed'?'approved':t.status)}>{t.status}</span></div>) : <p className="muted">No customer wallet top-up requests.</p>}</section>
      <section className="panel" id="admin-customer-funding"><h2>Manually fund a customer wallet</h2><p className="muted">As marketplace owner, select a customer and add any amount directly to their spendable wallet balance. This is separate from vendor wallet funding and customer top-up requests.</p><form className="product-form" onSubmit={fundCustomerWallet}><label>Customer<select required value={customerCreditForm.customerId} onChange={e=>setCustomerCreditForm({...customerCreditForm,customerId:e.target.value})}><option value="">Select customer account</option>{adminUsers.filter(u=>u.vendorStatus==='customer').map(u=><option key={u.id} value={u.id}>{u.fullName || 'Customer'} — {u.email || u.id}</option>)}</select></label><label>Amount to add (₦)<input type="number" min="1" max="10000000" required value={customerCreditForm.amount} onChange={e=>setCustomerCreditForm({...customerCreditForm,amount:e.target.value})} placeholder="Enter amount"/></label><button type="submit" className="primary-btn" disabled={busy || !customerCreditForm.customerId || !customerCreditForm.amount}>Manually add money to customer wallet</button></form><p className="checkout-note">Customer accounts appear after they sign in and open their profile. Manual credits are recorded in wallet transaction history.</p></section>
      <section className="panel" id="admin-withdrawals"><h2>Customer & vendor bank withdrawals</h2><p className="muted">Review customer wallet withdrawals and vendor sales withdrawals separately. Approve a pending request before marking it paid. Rejecting a customer request automatically returns the reserved amount and fee to the customer's wallet. Bank transfers are completed manually by the owner.</p>{withdrawals.length?withdrawals.map(w=><div className="manage-row" key={w.id}><div className="manage-main"><b>{w.withdrawalType==='customer' ? (w.customerName || w.email || 'Customer') : (w.shopName || 'Vendor')} · {money(w.amount)}</b><small>{w.withdrawalType==='customer' ? 'CUSTOMER WALLET' : 'VENDOR SALES'} · {w.bankName} · {w.accountNumber} · {w.accountName}</small><small>Fee {money(w.fee)} · {w.withdrawalType==='customer' ? 'Customer receives' : 'Vendor receives'} {money(w.netAmount ?? Math.max(0,Number(w.amount)-Number(w.fee)))}</small></div><span className={'status '+(w.status==='paid'?'approved':w.status)}>{w.status}</span><select value={w.status} onChange={e=>updateWithdrawal(w.id,e.target.value)}><option value="pending">Pending</option><option value="approved" disabled={w.status!=='pending'}>Approve</option><option value="rejected" disabled={!['pending','approved'].includes(w.status)}>Reject</option><option value="paid" disabled={w.status!=='approved'}>Mark paid</option></select></div>):<p className="muted">No withdrawal requests.</p>}</section>
      <section className="panel" id="admin-vendors"><h2>Vendor applications and permissions</h2>{vendors.length ? vendors.map(v=><div className="manage-row" key={v.id}><div className="vendor-avatar"><Store/></div><div className="manage-main"><b>{v.shopName}</b><small>{v.ownerName} · {v.email} · {v.phone}</small><small>{v.description}</small></div><span className={'status '+v.status}>{v.status}</span><select value={v.status} onChange={e=>approveVendor(v.id,e.target.value)}><option value="pending">Pending</option><option value="approved">Approve vendor</option><option value="rejected">Reject</option><option value="suspended">Suspend</option></select></div>) : <p className="muted">No vendor applications yet.</p>}</section>
      <section className="panel"><div className="panel-title"><div><h2>All marketplace products</h2><p>Review, edit product details, photos, pricing, stock and affiliate commission.</p></div><button className="secondary-btn" onClick={setDefaultAffiliateRates} disabled={busy}>Set missing affiliate rates to 5%</button></div>{products.map(p=><div className="manage-row" key={p.id}><div className="mini-product">{p.images?.[0]?<img src={p.images[0]} alt=""/>:<Package/>}</div><div className="manage-main"><b>{p.name}</b><small>{p.vendorName} · {money(p.price)} · Affiliate {Number(p.affiliateCommissionPercent ?? 0)}% · {p.status}</small></div><button onClick={()=>startEdit(p)}>Edit</button>{p.status !== 'approved' && <button onClick={()=>approveProduct(p.id,'approved')}>Approve</button>}<select aria-label={'Product status for '+p.name} value={p.status} onChange={e=>approveProduct(p.id,e.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><button className="danger-icon" onClick={()=>deleteProduct(p.id)}><Trash2 size={17}/></button></div>)}</section>
      <section className="panel" id="admin-announcements"><div className="panel-title"><div><h2>Marketplace announcements</h2><p className="muted">Send a saved in-app announcement and notification to all customers, vendors or one audience group.</p></div><button className="secondary-btn" onClick={async()=>{try{const r=await api.get('/api/admin/announcements');setAnnouncementHistory(r.data.announcements||[]);}catch(e){setError(errorText(e));}}}>Refresh history</button></div><form className="product-form" onSubmit={sendAnnouncement}><label>Announcement title<input required maxLength={120} value={announcement.title} onChange={e=>setAnnouncement({...announcement,title:e.target.value})} placeholder="Announcement title"/></label><label>Audience<select value={announcement.audience} onChange={e=>setAnnouncement({...announcement,audience:e.target.value})}><option value="all">All customers and vendors</option><option value="customers">Customers only</option><option value="vendors">Vendors only</option></select></label><label className="full-field">Message<textarea required maxLength={1000} rows={3} value={announcement.message} onChange={e=>setAnnouncement({...announcement,message:e.target.value})} placeholder="Write your announcement..."/></label><button className="primary-btn" disabled={busy || !announcement.title.trim() || !announcement.message.trim()}>{busy?'Sending...':'Send announcement'}</button></form>
        <h3>Announcement history</h3>
        {announcementHistory.length ? announcementHistory.map((item:any) => <div className="manage-row" key={item.id}><div className="manage-main"><b>{item.title}</b><small>{item.audience === 'all' ? 'Customers and vendors' : item.audience} · {item.deliveredCount ?? item.sentCount ?? 0} notified · {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</small><p>{item.message}</p></div><span className="status approved">Saved</span></div>) : <p className="muted">No announcements have been sent yet.</p>}
      </section>
      <section className="product-review-section"><div className="review-heading"><div><h3>Customer reviews</h3><p className="review-summary"><b>{reviewAverage.toFixed(1)} / 5</b> <span aria-label="average rating">★★★★★</span> · {reviewCount} review(s)</p></div><span className="review-verified-label">Verified purchase reviews</span></div>{productReviews.length ? productReviews.map((review:any)=><article className="product-review" key={review.id}><b>{'★'.repeat(Number(review.rating))}{'☆'.repeat(5-Number(review.rating))}</b><small>{review.customerName} · {new Date(review.createdAt).toLocaleDateString()}</small><p>{review.comment}</p></article>) : <p className="muted">No customer reviews yet. Be the first verified buyer to share your experience.</p>}{user ? <form onSubmit={submitProductReview} className="review-form"><div className="review-star-picker"><span>Your star rating</span><div role="radiogroup" aria-label="Choose your star rating">{[1,2,3,4,5].map(star=><button type="button" key={star} role="radio" aria-checked={reviewRating===star} aria-label={star+' star'+(star===1?'':'s')} className={reviewRating>=star?'selected':''} onClick={()=>setReviewRating(star)}>★</button>)}</div><small>{reviewRating} out of 5 stars</small></div><label>Write your review<textarea required minLength={3} maxLength={1200} value={reviewComment} onChange={e=>setReviewComment(e.target.value)} placeholder="Tell other customers about the product quality, features and your experience..."/></label><button className="primary-btn" disabled={reviewSubmitting || !reviewComment.trim()}>{reviewSubmitting ? 'Submitting review...' : 'Submit my review'}</button><small className="muted">Reviews are accepted from signed-in customers who have paid for this product. One review per product; you can update it later.</small></form> : <div className="review-signin"><p>Sign in with the account used to buy this product to write a review.</p><button className="secondary-btn" onClick={signIn}>Sign in to review</button></div>}</section>
      </>}
    </main>}

    {selectedProduct && <div className="overlay product-detail-overlay" onClick={closeProduct}><section className="product-detail-panel temu-detail" onClick={e=>e.stopPropagation()}><div className="checkout-head"><div><span className="eyebrow">YAKAJI MARKETPLACE · PRODUCT</span><h2>{selectedProduct.name}</h2></div><button className="icon-btn" aria-label="Close product details" onClick={closeProduct}><X/></button></div><div className="detail-gallery"><button className="detail-main-image" onClick={()=>photoCount && setPhotoViewerOpen(true)} aria-label="Open full size product photos">{selectedProduct.images?.length ? <img src={selectedProduct.images[Math.min(selectedImageIndex,selectedProduct.images.length-1)]} alt={selectedProduct.name}/> : <div className="media-placeholder"><Package size={54}/><span>{selectedProduct.category}</span></div>}<span className="photo-open-hint">{photoCount ? 'Tap photo to view full size' : 'No product photos'}</span></button>{(selectedProduct.images?.length || 0)>1 && <div className="detail-thumbnails">{selectedProduct.images.map((url,index)=><button className={selectedImageIndex===index?'active':''} key={url+index} onClick={()=>setSelectedImageIndex(index)}><img src={url} alt={'Product view '+(index+1)}/></button>)}</div>}{selectedProduct.videos?.length>0 && <div className="detail-video-list">{selectedProduct.videos.map((url,index)=><video key={index} src={url} controls playsInline/> )}</div>}</div><div className="detail-product-info"><span className="product-cat">{selectedProduct.category}</span><h2 className="detail-title">{selectedProduct.name}</h2><div className="detail-price-row"><b>{selectedProduct.discountActive ? <span className="sale-prices"><del>{money(selectedProduct.standardPrice || selectedProduct.price)}</del><strong>{money(selectedProduct.price)}</strong><small>{selectedProduct.discountPercent}% OFF</small></span> : money(selectedProduct.price)}</b><span className={selectedProduct.stock>0?'stock-live':'stock-out'}>{selectedProduct.stock>0?'● In stock · '+selectedProduct.stock+' available':'● Out of stock'}</span></div><p className="detail-description">{selectedProduct.description}</p><p className="seller-line">Sold by <strong>{selectedProduct.vendorName || 'Yakaji Digital Hub'}</strong></p><button type="button" className="secondary-btn chat-vendor-btn" onClick={()=>void openChatInbox(selectedProduct)}><MessageCircle size={16}/> Chat with vendor about this product</button><div className="product-share-panel"><b>Share this product</b><div className="product-share-actions"><button type="button" className="secondary-btn" onClick={()=>copyProductLink(selectedProduct)}><Copy size={15}/> Copy link</button><button type="button" className="primary-btn" onClick={()=>shareProduct(selectedProduct)}><Share2 size={15}/> Share</button><a className="share-social whatsapp" href={'https://wa.me/?text='+encodeURIComponent(selectedProduct.name+' — '+money(selectedProduct.price)+'. View on Yakaji Digital Hub: '+productShareUrl(selectedProduct))} target="_blank" rel="noopener noreferrer"><MessageCircle size={15}/> WhatsApp</a><a className="share-social" href={'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(productShareUrl(selectedProduct))} target="_blank" rel="noopener noreferrer">Facebook</a><a className="share-social" href={'https://twitter.com/intent/tweet?url='+encodeURIComponent(productShareUrl(selectedProduct))+'&text='+encodeURIComponent(selectedProduct.name+' — '+money(selectedProduct.price))} target="_blank" rel="noopener noreferrer">X / Twitter</a></div><small>Anyone who opens this link will go directly to this product.</small></div>{selectedProduct.options?.length>0 && <label className="detail-option">Select an option<select value={selectedProductOption} onChange={e=>setSelectedProductOption(e.target.value)}>{selectedProduct.options.map(option=><option key={option}>{option}</option>)}</select></label>}<div className="detail-quantity"><b>Quantity</b><div><button disabled={detailQuantity<=1} onClick={()=>setDetailQuantity(q=>Math.max(1,q-1))}>−</button><span>{detailQuantity}</span><button disabled={detailQuantity>=selectedProduct.stock} onClick={()=>setDetailQuantity(q=>Math.min(selectedProduct.stock,q+1))}>+</button></div></div><div className="detail-assurances"><div><span>🚚</span><p><b>Delivery arrangement</b><small>Confirm delivery details at checkout</small></p></div><div><span>🔒</span><p><b>Secure payment choices</b><small>Wallet, Paystack or bank transfer</small></p></div><div><span>🤝</span><p><b>Marketplace support</b><small>Order assistance from Yakaji Digital Hub</small></p></div></div>
      <section className="product-review-section"><div className="review-heading"><div><h3>Customer reviews</h3><p className="review-summary"><b>{reviewAverage.toFixed(1)} / 5</b> <span aria-label="average rating">★★★★★</span> · {reviewCount} review(s)</p></div><span className="review-verified-label">Verified purchase reviews</span></div>{productReviews.length ? productReviews.map((review:any)=><article className="product-review" key={review.id}><b>{'★'.repeat(Number(review.rating))}{'☆'.repeat(5-Number(review.rating))}</b><small>{review.customerName} · {new Date(review.createdAt).toLocaleDateString()}</small><p>{review.comment}</p></article>) : <p className="muted">No customer reviews yet. Be the first verified buyer to share your experience.</p>}{user ? <form onSubmit={submitProductReview} className="review-form"><div className="review-star-picker"><span>Your star rating</span><div role="radiogroup" aria-label="Choose your star rating">{[1,2,3,4,5].map(star=><button type="button" key={star} role="radio" aria-checked={reviewRating===star} aria-label={star+' star'+(star===1?'':'s')} className={reviewRating>=star?'selected':''} onClick={()=>setReviewRating(star)}>★</button>)}</div><small>{reviewRating} out of 5 stars</small></div><label>Write your review<textarea required minLength={3} maxLength={1200} value={reviewComment} onChange={e=>setReviewComment(e.target.value)} placeholder="Tell other customers about the product quality, features and your experience..."/></label><button className="primary-btn" disabled={reviewSubmitting || !reviewComment.trim()}>{reviewSubmitting ? 'Submitting review...' : 'Submit my review'}</button><small className="muted">Reviews are accepted from signed-in customers who have paid for this product. One review per product; you can update it later.</small></form> : <div className="review-signin"><p>Sign in with the account used to buy this product to write a review.</p><button className="secondary-btn" onClick={signIn}>Sign in to review</button></div>}</section>
      <button className="primary-btn full-btn detail-add-btn" disabled={selectedProduct.stock<1} onClick={()=>{addToCart(selectedProduct,selectedProductOption,detailQuantity);setSelectedProduct(null);}}><ShoppingBag size={17}/> Add {detailQuantity} to cart · {money(selectedProduct.price*detailQuantity)}</button></div></section></div>}
    {photoViewerOpen && selectedProduct && photoCount>0 && <div className="photo-viewer-overlay" onClick={()=>setPhotoViewerOpen(false)}><div className="photo-viewer" onClick={e=>e.stopPropagation()} onTouchStart={e=>setTouchStartX(e.touches[0].clientX)} onTouchEnd={e=>{if(touchStartX!==null){const delta=e.changedTouches[0].clientX-touchStartX;if(Math.abs(delta)>45)changePhoto(delta<0?1:-1);}setTouchStartX(null);}}><div className="photo-viewer-toolbar"><span>{selectedProduct.name} · {selectedImageIndex+1} / {photoCount}</span><button className="photo-viewer-close" aria-label="Close photo viewer" onClick={()=>setPhotoViewerOpen(false)}><X/></button></div><button className="photo-viewer-arrow previous" aria-label="Previous photo" onClick={()=>changePhoto(-1)} disabled={photoCount<2}><ChevronLeft/></button><img className="photo-viewer-image" src={activePhoto} alt={selectedProduct.name+' full size photo '+(selectedImageIndex+1)}/><button className="photo-viewer-arrow next" aria-label="Next photo" onClick={()=>changePhoto(1)} disabled={photoCount<2}><ChevronRight/></button><div className="photo-viewer-thumbnails">{selectedProduct.images.map((url,index)=><button key={url+index} className={selectedImageIndex===index?'active':''} onClick={()=>setSelectedImageIndex(index)}><img src={url} alt={'Select photo '+(index+1)}/></button>)}</div><small>Swipe left or right to browse photos · Use arrow keys on desktop</small></div></div>}
    {checkoutOpen && <div className="overlay" onClick={()=>setCheckoutOpen(false)}><section className="checkout" onClick={e=>e.stopPropagation()}><div className="checkout-head"><div><span className="eyebrow">YOUR SHOPPING CART</span><h2>Checkout</h2></div><button className="icon-btn" onClick={()=>setCheckoutOpen(false)}><X/></button></div>{cart.length ? <><div className="cart-lines">{cart.map(line=><div className="cart-line" key={line.product.id}><div><b>{line.product.name}</b><small>{line.product.discountActive ? <><del>{money(line.product.standardPrice || line.product.price)}</del> {money(line.product.price)} sale price</> : money(line.product.price)} each</small>{line.product.options.length>0&&<select value={line.option} onChange={e=>setCart(items=>items.map(x=>x.product.id===line.product.id?{...x,option:e.target.value}:x))}>{line.product.options.map(o=><option key={o}>{o}</option>)}</select>}</div><div className="qty"><button onClick={()=>setCart(items=>items.map(x=>x.product.id===line.product.id?{...x,quantity:Math.max(1,x.quantity-1)}:x))}>−</button><b>{line.quantity}</b><button onClick={()=>setCart(items=>items.map(x=>x.product.id===line.product.id?{...x,quantity:Math.min(x.product.stock,x.quantity+1)}:x))}>+</button><button className="remove" onClick={()=>setCart(items=>items.filter(x=>x.product.id!==line.product.id))}><Trash2 size={15}/></button></div></div>)}</div><div className="total-line"><span>Products subtotal</span><b>{money(cartSubtotal)}</b></div>
      <div className="coupon-entry"><label>Have a coupon code?</label><div><input value={couponCode} onChange={e=>{setCouponCode(e.target.value.toUpperCase());setAppliedCoupon(null);}} placeholder="Enter coupon code"/><button type="button" className="secondary-btn" onClick={applyCoupon} disabled={couponBusy || !couponCode.trim()}>{couponBusy?'Checking...':'Apply'}</button></div>{appliedCoupon && <small className="coupon-success">✓ {appliedCoupon.code} applied — you save {money(couponSavings)}</small>}</div>
      {couponSavings>0 && <div className="total-line coupon-saving"><span>Coupon discount</span><b>−{money(couponSavings)}</b></div>}
      {customer.paymentMethod === 'Bank transfer' && <div className="total-line"><span>Transfer fee</span><b>{money(settings.customerTransferFee)}</b></div>}<div className="total-line"><span>Total to pay</span><b>{money(cartTotal)}</b></div><form className="checkout-form" onSubmit={placeOrder}><label>Full name<input required value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/></label><label>Phone / WhatsApp<input required type="tel" minLength={7} value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/></label><label>Email {customer.paymentMethod === 'Paystack' ? '(required for payment receipt)' : '(optional for guest checkout)'}<input required={customer.paymentMethod === 'Paystack'} type="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})} placeholder="name@example.com"/></label><label>Delivery address / instructions<textarea rows={2} value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/></label><label>Payment method<select value={customer.paymentMethod} onChange={e=>setCustomer({...customer,paymentMethod:e.target.value})}><option value="Wallet" disabled={!user}>1. Pay with wallet ({money(walletSummary?.balance || 0)} available)</option><option value="Paystack" disabled={!paystackReady}>2. Pay online with Paystack (Card / Bank / USSD){paystackReady ? '' : ' — awaiting setup'}</option><option value="Bank transfer">3. Manual bank transfer</option></select></label><p className="checkout-note">You can order as a guest without creating an account. Email is optional for manual bank transfer, but required for Paystack receipts. Create an account or sign in if you want to use your wallet, save your profile and manage your account when you return. Manual transfers are confirmed by the marketplace admin. {paystackMode === 'test' ? 'Paystack is currently in TEST MODE: test payments are simulations and cannot collect real customer money.' : paystackMode === 'live' ? 'Paystack is connected in LIVE MODE.' : ''}</p><button className="primary-btn full-btn" disabled={busy}>{busy?'Placing order...':'Place order'} <ArrowRight size={17}/></button></form></> : <div className="empty-box"><ShoppingBag size={40}/><h3>Your cart is empty</h3><p>Add products from the marketplace to begin.</p><button className="primary-btn" onClick={()=>setCheckoutOpen(false)}>Continue shopping</button></div>}</section></div>}
    {walletTransferDetails && <div className="overlay" onClick={()=>setWalletTransferDetails(null)}><section className="checkout transfer-instructions" onClick={e=>e.stopPropagation()}><div className="checkout-head"><div><span className="eyebrow">WALLET FUNDING · MANUAL BANK TRANSFER</span><h2>Continue funding your wallet</h2></div><button className="icon-btn" onClick={()=>setWalletTransferDetails(null)}><X/></button></div><div className="transfer-card"><p>Wallet funding reference: <b>{walletTransferDetails.reference}</b></p><p>Wallet amount to credit: <b>{money(walletTransferDetails.amount)}</b> · Fee: {money(walletTransferDetails.fee)}</p><p>Amount to transfer: <strong>{money(walletTransferDetails.total)}</strong></p><hr/><p>Account name</p><h3>Yakaji Digital Hub</h3><p>Account number</p><h2>3005758913</h2><p>Bank</p><h3>Moniepoint MFB</h3><p className="checkout-note">Use the wallet funding reference above as your transfer narration so the owner can identify your payment.</p><button className="secondary-btn full-btn" onClick={()=>navigator.clipboard?.writeText('3005758913').then(()=>flash('Account number copied.'))}>Copy account number</button></div><p className="checkout-note">Your wallet will be credited only after Yakaji Digital Hub confirms the transfer. This is a wallet funding action only; it does not submit or change any withdrawal request.</p><button className="primary-btn full-btn" onClick={()=>setWalletTransferDetails(null)}>I understand</button></section></div>}
    {manualTransferOrder && <div className="overlay" onClick={()=>setManualTransferOrder(null)}><section className="checkout transfer-instructions" onClick={e=>e.stopPropagation()}><div className="checkout-head"><div><span className="eyebrow">MANUAL BANK TRANSFER</span><h2>{manualTransferOrder.creditAmount ? 'Fund your wallet' : 'Complete your payment'}</h2></div><button className="icon-btn" onClick={()=>setManualTransferOrder(null)}><X/></button></div><div className="transfer-card"><p>{manualTransferOrder.creditAmount ? 'Top-up reference:' : 'Order number:'} <b>{manualTransferOrder.orderNumber}</b></p>{manualTransferOrder.creditAmount && <p>Wallet amount to credit: <b>{money(manualTransferOrder.creditAmount)}</b> · Fee: {money(manualTransferOrder.fee || 0)}</p>}<p>Amount to transfer: <strong>{money(manualTransferOrder.total)}</strong></p><hr/><p>Account name</p><h3>Yakaji Digital Hub</h3><p>Account number</p><h2>3005758913</h2><p>Bank</p><h3>Moniepoint MFB</h3>{manualTransferOrder.creditAmount && <p className="checkout-note">Use the top-up reference above as your transfer narration so the owner can identify your payment.</p>}<button className="secondary-btn full-btn" onClick={()=>navigator.clipboard?.writeText('3005758913').then(()=>flash('Account number copied.'))}>Copy account number</button></div><p className="checkout-note">After making the transfer, keep your receipt. Your order or wallet top-up will remain pending until Yakaji Digital Hub confirms the money received. Do not make a second payment for the same reference.</p><button className="primary-btn full-btn" onClick={()=>setManualTransferOrder(null)}>I understand</button></section></div>}
    {notificationsOpen && <div className="overlay" onClick={()=>setNotificationsOpen(false)}><section className="checkout notifications-panel" onClick={e=>e.stopPropagation()}><div className="checkout-head"><div><span className="eyebrow">YAKAJI DIGITAL HUB</span><h2>Notifications</h2></div><button className="icon-btn" onClick={()=>setNotificationsOpen(false)}><X/></button></div><div className="notification-actions"><button className="secondary-btn" onClick={enablePushNotifications}>Enable device alerts</button>{unreadNotifications>0 && <button className="secondary-btn" onClick={markAllNotificationsRead}>Mark all as read</button>}</div><div className="notification-list">{userNotifications.length ? userNotifications.map(n=><article className={'notification-item '+(n.read?'read':'unread')} key={n.id} onClick={()=>void openNotificationTarget(n)} role="button" tabIndex={0}><span className="notification-dot">{n.kind==='order'?'📦':n.kind==='chat'?'💬':n.kind==='announcement'?'📢':'🔔'}</span><div className="notification-copy"><b>{n.title}</b><p>{n.message}</p><small>{new Date(n.createdAt).toLocaleString()}</small>{!n.read && <button type="button" className="notification-mark-read" onClick={()=>void markNotificationRead(String(n.id))}>Mark as read</button>}</div></article>) : <div className="empty-box"><Bell size={34}/><h3>You're all caught up</h3><p>Order updates, vendor approvals and announcements will appear here.</p></div>}</div></section></div>}
    {chatOpen && <div className="overlay" onClick={()=>setChatOpen(false)}><section className="checkout chat-panel" onClick={e=>e.stopPropagation()}><div className="checkout-head"><div><span className="eyebrow">DIRECT MESSAGING</span><h2>Messages</h2></div><button className="icon-btn" onClick={()=>setChatOpen(false)}><X/></button></div><div className="chat-layout"><aside className="chat-conversations">{chatConversations.length ? chatConversations.map(c=><button key={c.id} className={activeChatId===c.id?'active':''} onClick={()=>setActiveChatId(c.id)}><b>{user?.userId===c.vendorId?c.customerName:c.vendorName}</b><small>{c.productName}</small><span>{c.lastMessage || 'Start the conversation'}</span></button>) : <p className="muted">No conversations yet. Open a product and select “Chat with vendor”.</p>}</aside><div className="chat-thread"><div className="chat-thread-title">{chatConversations.find(c=>c.id===activeChatId)?.productName || 'Select a conversation'}<small>Private messages between customer and vendor</small></div><div className="chat-message-list">{chatMessages.map(m=><div key={m.id} className={'chat-bubble '+(m.senderId===user?.userId?'mine':'theirs')}><b>{m.senderName}</b><p>{m.message}</p><small>{new Date(m.createdAt).toLocaleString()}</small></div>)}</div><form className="chat-compose" onSubmit={sendChatMessage}><input value={chatDraft} onChange={e=>setChatDraft(e.target.value)} placeholder="Write a message..." maxLength={2000} disabled={!activeChatId}/><button className="primary-btn" disabled={!activeChatId || !chatDraft.trim() || chatBusy}><Send size={16}/></button></form></div></div></section></div>}
    {error && <div className="alert-error"><span>{error}</span><button onClick={()=>setError('')}><X size={16}/></button></div>}
    {notice && <div className="toast"><CheckCircle2 size={18}/>{notice}</div>}
    {!isAdmin && page !== 'support' && <button type="button" className="floating-support-help" onClick={()=>setPage('support')} aria-label="Open customer support"><MessageCircle size={19}/><span>Need help? Live support</span></button>}
    <footer className="footer"><div className="footer-brand"><b>YAKAJI DIGITAL HUB</b><span>Shop • Sell • Grow</span><small>Discover products, learn new skills and grow your business.</small></div><div className="footer-links"><button onClick={()=>setPage('home')}>About Yakaji</button><button onClick={()=>setPage('support')}>Contact & Support</button><button onClick={()=>setPage('support')}>Help Centre</button><button onClick={openVendor}>Become a Vendor</button><button onClick={openAffiliate}>Affiliate Program</button><button onClick={()=>{if(user)void openProfile();else void signIn();}}>My Account</button></div><small>© {new Date().getFullYear()} Yakaji Digital Hub. All rights reserved.</small></footer>
  </div>;
}
export default App;
