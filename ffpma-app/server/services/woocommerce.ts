import axios from 'axios';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { products, categories } from '@shared/schema';

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  status: string;
  stock_status: string;
  stock_quantity: number | null;
  type: string;
  sku: string;
  weight: string;
  dimensions: { length: string; width: string; height: string };
  shipping_class: string;
  shipping_class_id: number;
  categories: Array<{ id: number; name: string; slug: string }>;
  images: Array<{ id: number; src: string; name: string; alt: string }>;
  attributes: Array<{ id: number; name: string; slug?: string; options: string[]; visible: boolean; variation: boolean }>;
  brands?: Array<{ id: number; name: string; slug: string }>;
  brand?: string;
  average_rating: string;
  rating_count: number;
  meta_data?: Array<{ key: string; value: any }>;
}

interface WooCommerceVariation {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: string;
  stock_quantity: number | null;
  sku: string;
  image: { id: number; src: string; name: string; alt: string } | null;
  attributes: Array<{ id: number; name: string; option: string }>;
  weight: string;
  dimensions: { length: string; width: string; height: string };
  meta_data?: Array<{ key: string; value: any }>;
}

interface RolePricing {
  [role: string]: { price: string; visible: boolean };
}

interface ProductVariation {
  id: number;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  onSale: boolean;
  stockStatus: string;
  stockQuantity: number | null;
  sku: string;
  imageUrl: string | null;
  attributes: Array<{ name: string; option: string }>;
  rolePricing?: RolePricing;
}

interface ProductAttribute {
  id: number;
  name: string;
  options: string[];
  visible: boolean;
  variation: boolean;
}

interface ShippingInfo {
  weight: string;
  dimensions: { length: string; width: string; height: string };
  shippingClass: string;
}

interface ProductListItem {
  id: number;
  woocommerceId: number;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  onSale: boolean;
  stockStatus: string;
  category: string;
  categorySlug: string;
  categorySlugs: string[];
  brand: string | null;
  brandSlug: string | null;
  imageUrl: string | null;
  productType?: string;
  rating: number;
  reviewCount: number;
  rolePricing?: RolePricing;
  restrictedRoles?: string[];
  syncedAt: Date;
}

interface SyncedProduct {
  id: number;
  woocommerceId: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  onSale: boolean;
  stockStatus: string;
  stockQuantity: number | null;
  productType: string;
  sku: string;
  category: string;
  categorySlug: string;
  categorySlugs: string[];
  brand: string | null;
  brandSlug: string | null;
  imageUrl: string | null;
  images: Array<{ id: number; src: string; alt: string }>;
  rating: number;
  reviewCount: number;
  attributes: ProductAttribute[];
  shipping: ShippingInfo;
  rolePricing: RolePricing;
  restrictedRoles?: string[];
  variations?: ProductVariation[];
  syncedAt: Date;
}

function extractRolePricing(metaData: Array<{ key: string; value: any }> | undefined): RolePricing {
  const rolePricing: RolePricing = {};
  
  if (!metaData) return rolePricing;
  
  for (const meta of metaData) {
    const algRegularMatch = meta.key.match(/^_alg_wc_price_by_user_role_regular_price_(.+)$/);
    if (algRegularMatch && meta.value && meta.value !== '') {
      const role = algRegularMatch[1];
      rolePricing[role] = { price: String(meta.value), visible: true };
    }
    
    const algSaleMatch = meta.key.match(/^_alg_wc_price_by_user_role_sale_price_(.+)$/);
    if (algSaleMatch && meta.value && meta.value !== '') {
      const role = algSaleMatch[1];
      rolePricing[role] = { price: String(meta.value), visible: true };
    }
    
    const algEmptyMatch = meta.key.match(/^_alg_wc_price_by_user_role_empty_price_(.+)$/);
    if (algEmptyMatch && meta.value === 'yes') {
      const role = algEmptyMatch[1];
      if (!rolePricing[role]) {
        rolePricing[role] = { price: '0', visible: false };
      } else {
        rolePricing[role].visible = false;
      }
    }
    
    if (meta.key === '_role_based_price' && typeof meta.value === 'object') {
      for (const [role, price] of Object.entries(meta.value)) {
        if (typeof price === 'string' || typeof price === 'number') {
          rolePricing[role] = { price: String(price), visible: true };
        }
      }
    }
  }
  
  return rolePricing;
}

function extractRestrictedRoles(metaData: Array<{ key: string; value: any }> | undefined): string[] {
  const restrictedRoles: string[] = [];
  if (!metaData) return restrictedRoles;
  
  for (const meta of metaData) {
    if ((meta.key === '_alg_wc_pvbur_invisible' || meta.key === '_alg_wc_pvbur_visible') && Array.isArray(meta.value)) {
      // Different plugins use invisible or visible arrays; we map invisible directly.
      if (meta.key === '_alg_wc_pvbur_invisible') {
        restrictedRoles.push(...meta.value);
      }
    }
  }
  return restrictedRoles;
}

class WooCommerceService {
  private baseUrl: string | null = null;
  private consumerKey: string | null = null;
  private consumerSecret: string | null = null;
  private isStaging: boolean = false;

  constructor() {
    // Check if staging mode is enabled
    this.isStaging = process.env.USE_STAGING === 'true';
    
    if (this.isStaging) {
      // Use staging credentials
      this.baseUrl = process.env.STAGING_WC_URL || process.env.STAGING_WP_SITE_URL || null;
      this.consumerKey = process.env.STAGING_WC_CONSUMER_KEY || null;
      this.consumerSecret = process.env.STAGING_WC_CONSUMER_SECRET || null;
      console.log('WooCommerce: Using STAGING environment -', this.baseUrl);
    } else {
      // Use production credentials
      this.baseUrl = process.env.WOOCOMMERCE_URL || process.env.WP_SITE_URL || null;
      this.consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.WC_CONSUMER_KEY || null;
      this.consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.WC_CONSUMER_SECRET || null;
    }
  }

  private getApiUrl(endpoint: string): string {
    if (!this.baseUrl) {
      throw new Error('WooCommerce URL not configured');
    }
    return `${this.baseUrl}/wp-json/wc/v3/${endpoint}`;
  }

  private getAuthParams(): { consumer_key: string; consumer_secret: string } {
    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error('WooCommerce API credentials not configured');
    }
    return {
      consumer_key: this.consumerKey,
      consumer_secret: this.consumerSecret,
    };
  }

  async getConnectionStatus(): Promise<{
    connected: boolean;
    configured: boolean;
    storeUrl: string | null;
    error?: string;
  }> {
    const configured = !!(this.baseUrl && this.consumerKey && this.consumerSecret);

    if (!configured) {
      return {
        connected: false,
        configured: false,
        storeUrl: this.baseUrl,
        error: 'WooCommerce credentials not configured. Please add WC_CONSUMER_KEY and WC_CONSUMER_SECRET secrets.',
      };
    }

    try {
      const response = await axios.get(this.getApiUrl('system_status'), {
        params: this.getAuthParams(),
        timeout: 10000,
      });

      return {
        connected: true,
        configured: true,
        storeUrl: this.baseUrl,
      };
    } catch (error: any) {
      return {
        connected: false,
        configured: true,
        storeUrl: this.baseUrl,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async checkCommerceHealth(): Promise<{ status: string; details: any }> {
    try {
      if (!this.baseUrl || !this.consumerKey) {
        return { status: 'offline', details: { error: 'Credentials missing' } };
      }
      
      const startTime = Date.now();
      const response = await axios.get(this.getApiUrl('system_status'), {
        params: this.getAuthParams(),
        timeout: 5000,
      });
      
      // Also try fetching a single product to verify catalog access
      const productsRes = await axios.get(this.getApiUrl('products'), {
        params: { ...this.getAuthParams(), per_page: 1 },
        timeout: 5000,
      });

      return {
        status: 'nominal',
        details: {
          responseTimeMs: Date.now() - startTime,
          environment: response.data.environment?.environment,
          databaseVersion: response.data.environment?.wp_version,
          activeProducts: productsRes.data?.length > 0 ? 'Verified' : 'Accessible but empty',
        }
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        details: {
          error: error.response?.data?.message || error.message,
          code: error.response?.status
        }
      };
    }
  }

  async getProducts(page: number = 1, perPage: number = 100): Promise<{
    products: ProductListItem[];
    total: number;
    totalPages: number;
  }> {
    try {
      const response = await axios.get<WooCommerceProduct[]>(
        this.getApiUrl('products'),
        {
          params: {
            ...this.getAuthParams(),
            page,
            per_page: perPage,
            status: 'publish',
          },
          timeout: 30000,
        }
      );

      const total = parseInt(response.headers['x-wp-total'] || '0', 10);
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1', 10);

      const products: ProductListItem[] = response.data.map((product, index) => {
        // Extract brand - multiple fallback methods
        let brandName: string | null = null;
        let brandSlug: string | null = null;
        
        if (product.brands && product.brands.length > 0) {
          brandName = product.brands[0].name;
          brandSlug = product.brands[0].slug;
        } else if (product.brand) {
          brandName = product.brand;
          brandSlug = product.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        } else {
          const brandAttr = product.attributes?.find(
            (attr) => 
              attr.slug === 'pa_brand' || 
              attr.slug === 'brand' ||
              attr.name.toLowerCase() === 'brand' || 
              attr.name.toLowerCase().includes('brand')
          );
          if (brandAttr?.options?.[0]) {
            brandName = brandAttr.options[0];
            brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          }
        }
        
        // Extract role-based pricing
        const rolePricing = extractRolePricing(product.meta_data);
        
        return {
          id: index + 1 + (page - 1) * perPage,
          woocommerceId: product.id,
          name: product.name,
          description: product.short_description || product.description,
          price: parseFloat(product.price) || 0,
          salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
          onSale: product.on_sale,
          stockStatus: product.stock_status,
          category: product.categories[0]?.name || 'Uncategorized',
          categorySlug: product.categories[0]?.slug || 'uncategorized',
          categorySlugs: product.categories?.map(c => c.slug) || ['uncategorized'],
          brand: brandName,
          brandSlug: brandSlug,
          imageUrl: product.images[0]?.src || null,
          productType: product.type || 'simple',
          rating: parseFloat(product.average_rating) || 0,
          reviewCount: product.rating_count || 0,
          rolePricing: rolePricing,
          restrictedRoles: extractRestrictedRoles(product.meta_data),
          syncedAt: new Date(),
        };
      });

      return { products, total, totalPages };
    } catch (error: any) {
      throw new Error(`Failed to fetch products: ${error.response?.data?.message || error.message}`);
    }
  }

  async getProductById(productId: number): Promise<SyncedProduct | null> {
    try {
      const response = await axios.get<WooCommerceProduct>(
        this.getApiUrl(`products/${productId}`),
        {
          params: this.getAuthParams(),
          timeout: 15000,
        }
      );

      const product = response.data;
      
      // Extract brand - multiple fallback methods
      let brandName: string | null = null;
      let brandSlug: string | null = null;
      
      if (product.brands && product.brands.length > 0) {
        brandName = product.brands[0].name;
        brandSlug = product.brands[0].slug;
      } else if (product.brand) {
        brandName = product.brand;
        brandSlug = product.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      } else {
        const brandAttr = product.attributes?.find(
          (attr) => 
            attr.slug === 'pa_brand' || 
            attr.slug === 'brand' ||
            attr.name.toLowerCase() === 'brand' || 
            attr.name.toLowerCase().includes('brand')
        );
        if (brandAttr?.options?.[0]) {
          brandName = brandAttr.options[0];
          brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }
      }
      
      // Extract role-based pricing from meta_data
      const rolePricing = extractRolePricing(product.meta_data);
      
      // Process attributes (exclude brand from display attributes)
      const attributes: ProductAttribute[] = (product.attributes || [])
        .filter(attr => !attr.name.toLowerCase().includes('brand'))
        .map(attr => ({
          id: attr.id,
          name: attr.name,
          options: attr.options || [],
          visible: attr.visible !== false,
          variation: attr.variation === true,
        }));
      
      // Fetch variations for variable products
      let variations: ProductVariation[] | undefined;
      if (product.type === 'variable') {
        try {
          const variationsResponse = await axios.get<WooCommerceVariation[]>(
            this.getApiUrl(`products/${productId}/variations`),
            {
              params: {
                ...this.getAuthParams(),
                per_page: 100,
              },
              timeout: 15000,
            }
          );
          
          variations = variationsResponse.data.map(v => ({
            id: v.id,
            price: parseFloat(v.price) || 0,
            regularPrice: parseFloat(v.regular_price) || 0,
            salePrice: v.sale_price ? parseFloat(v.sale_price) : null,
            onSale: v.on_sale,
            stockStatus: v.stock_status,
            stockQuantity: v.stock_quantity,
            sku: v.sku || '',
            imageUrl: v.image?.src || null,
            attributes: v.attributes.map(a => ({ name: a.name, option: a.option })),
            rolePricing: extractRolePricing(v.meta_data),
          }));
        } catch (varError) {
          console.log('Could not fetch variations:', varError);
        }
      }
      
      return {
        id: product.id,
        woocommerceId: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.short_description,
        price: parseFloat(product.price) || 0,
        regularPrice: parseFloat(product.regular_price) || parseFloat(product.price) || 0,
        salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
        onSale: product.on_sale,
        stockStatus: product.stock_status,
        stockQuantity: product.stock_quantity,
        productType: product.type || 'simple',
        sku: product.sku || '',
        category: product.categories[0]?.name || 'Uncategorized',
        categorySlug: product.categories[0]?.slug || 'uncategorized',
        categorySlugs: product.categories?.map(c => c.slug) || ['uncategorized'],
        brand: brandName,
        brandSlug: brandSlug,
        imageUrl: product.images[0]?.src || null,
        images: product.images.map(img => ({ id: img.id, src: img.src, alt: img.alt || img.name })),
        rating: parseFloat(product.average_rating) || 0,
        reviewCount: product.rating_count || 0,
        attributes,
        shipping: {
          weight: product.weight || '',
          dimensions: product.dimensions || { length: '', width: '', height: '' },
          shippingClass: product.shipping_class || '',
        },
        rolePricing,
        restrictedRoles: extractRestrictedRoles(product.meta_data),
        variations,
        syncedAt: new Date(),
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch product: ${error.response?.data?.message || error.message}`);
    }
  }

  async getCategories(): Promise<Array<{ id: number; name: string; slug: string; count: number }>> {
    try {
      const response = await axios.get(
        this.getApiUrl('products/categories'),
        {
          params: {
            ...this.getAuthParams(),
            per_page: 100,
          },
          timeout: 10000,
        }
      );

      return response.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch categories: ${error.response?.data?.message || error.message}`);
    }
  }

  async getBrands(): Promise<Array<{ id: number; name: string; slug: string; count: number; image?: string }>> {
    // First try the official WooCommerce Brands plugin endpoint
    try {
      const response = await axios.get(
        this.getApiUrl('products/brands'),
        {
          params: {
            ...this.getAuthParams(),
            per_page: 100,
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.length > 0) {
        return response.data.map((brand: any) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          count: brand.count,
          image: brand.image?.src || null,
        }));
      }
    } catch (error: any) {
      // If brands endpoint doesn't exist (404), fall through to attribute-based approach
      if (error.response?.status !== 404) {
        console.log('Brands plugin not available, trying attributes...');
      }
    }

    // Fallback: Look for a "Brand" attribute and get its terms
    try {
      const attributesResponse = await axios.get(
        this.getApiUrl('products/attributes'),
        {
          params: this.getAuthParams(),
          timeout: 10000,
        }
      );

      const brandAttr = attributesResponse.data.find((attr: any) => 
        attr.name.toLowerCase() === 'brand' || 
        attr.name.toLowerCase() === 'brands' ||
        attr.slug === 'pa_brand' ||
        attr.slug === 'brand'
      );

      if (brandAttr) {
        // Fetch the terms for this attribute
        const termsResponse = await axios.get(
          this.getApiUrl(`products/attributes/${brandAttr.id}/terms`),
          {
            params: {
              ...this.getAuthParams(),
              per_page: 100,
            },
            timeout: 10000,
          }
        );

        return termsResponse.data.map((term: any) => ({
          id: term.id,
          name: term.name,
          slug: term.slug,
          count: term.count || 0,
          image: null,
        }));
      }
    } catch (error: any) {
      console.log('Could not fetch brand attributes:', error.message);
    }

    // Last resort: Extract unique brands from products
    try {
      const { products } = await this.getProducts(1, 100);
      const brandMap = new Map<string, { name: string; slug: string; count: number }>();
      
      for (const product of products) {
        if (product.brand && product.brandSlug) {
          const existing = brandMap.get(product.brandSlug);
          if (existing) {
            existing.count++;
          } else {
            brandMap.set(product.brandSlug, {
              name: product.brand,
              slug: product.brandSlug,
              count: 1,
            });
          }
        }
      }

      return Array.from(brandMap.values()).map((brand, index) => ({
        id: index + 1,
        ...brand,
        image: undefined,
      }));
    } catch (error: any) {
      console.log('Could not extract brands from products:', error.message);
      return [];
    }
  }

  async getProductAttributes(): Promise<Array<{ id: number; name: string; slug: string; type: string }>> {
    try {
      const response = await axios.get(
        this.getApiUrl('products/attributes'),
        {
          params: this.getAuthParams(),
          timeout: 10000,
        }
      );

      return response.data.map((attr: any) => ({
        id: attr.id,
        name: attr.name,
        slug: attr.slug,
        type: attr.type,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch attributes: ${error.response?.data?.message || error.message}`);
    }
  }

  async syncAllProducts(): Promise<{
    success: boolean;
    synced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let allProducts: ProductListItem[] = [];
    let page = 1;
    let hasMore = true;
    let savedCount = 0;

    try {
      while (hasMore) {
        const result = await this.getProducts(page, 100);
        allProducts = allProducts.concat(result.products);
        hasMore = page < result.totalPages;
        page++;
      }

      for (const product of allProducts) {
        try {
          const existingProduct = await db.query.products.findFirst({
            where: (p, { eq }) => eq(p.wcProductId, product.woocommerceId)
          });

          if (existingProduct) {
            await db.update(products)
              .set({
                name: product.name,
                description: product.description,
                retailPrice: product.price.toString(),
                wholesalePrice: product.salePrice?.toString() || null,
                imageUrl: product.imageUrl,
                inStock: product.stockStatus === 'instock',
              })
              .where(eq(products.wcProductId, product.woocommerceId));
          } else {
            await db.insert(products).values({
              name: product.name,
              slug: `wc-${product.woocommerceId}-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)}`,
              description: product.description,
              retailPrice: product.price.toString(),
              wholesalePrice: product.salePrice?.toString() || null,
              imageUrl: product.imageUrl,
              inStock: product.stockStatus === 'instock',
              wcProductId: product.woocommerceId,
              requiresMembership: true,
            });
          }
          savedCount++;
        } catch (err: any) {
          errors.push(`Product ${product.woocommerceId}: ${err.message}`);
        }
      }

      return {
        success: true,
        synced: savedCount,
        errors,
      };
    } catch (error: any) {
      return {
        success: false,
        synced: savedCount,
        errors: [error.message],
      };
    }
  }

  async getOrders(params: { 
    page?: number; 
    perPage?: number; 
    status?: string;
    after?: string;
  } = {}): Promise<{
    orders: any[];
    total: number;
    totalPages: number;
  }> {
    const { page = 1, perPage = 20, status, after } = params;
    
    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      return { orders: [], total: 0, totalPages: 0 };
    }

    try {
      const queryParams: any = {
        ...this.getAuthParams(),
        page,
        per_page: perPage,
        orderby: 'date',
        order: 'desc',
      };
      
      if (status) queryParams.status = status;
      if (after) queryParams.after = after;

      const response = await axios.get(this.getApiUrl('orders'), {
        params: queryParams,
        timeout: 15000,
      });

      const total = parseInt(response.headers['x-wp-total'] || '0', 10);
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '0', 10);

      const orders = response.data.map((order: any) => ({
        id: order.id,
        orderNumber: order.number,
        status: order.status,
        total: order.total,
        currency: order.currency,
        customerName: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
        customerEmail: order.billing?.email,
        dateCreated: order.date_created,
        dateModified: order.date_modified,
        lineItemsCount: order.line_items?.length || 0,
        paymentMethod: order.payment_method_title,
        shippingTotal: order.shipping_total,
        lineItems: order.line_items?.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          total: item.total,
          productId: item.product_id,
        })),
      }));

      return { orders, total, totalPages };
    } catch (error: any) {
      console.error('[WooCommerce] Error fetching orders:', error.message);
      return { orders: [], total: 0, totalPages: 0 };
    }
  }

  async getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    completedOrders: number;
    recentRevenue: number;
  }> {
    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      return { totalOrders: 0, pendingOrders: 0, processingOrders: 0, completedOrders: 0, recentRevenue: 0 };
    }

    try {
      // Get order counts by status
      const [pending, processing, completed] = await Promise.all([
        axios.get(this.getApiUrl('orders'), {
          params: { ...this.getAuthParams(), status: 'pending', per_page: 1 },
          timeout: 10000,
        }),
        axios.get(this.getApiUrl('orders'), {
          params: { ...this.getAuthParams(), status: 'processing', per_page: 1 },
          timeout: 10000,
        }),
        axios.get(this.getApiUrl('orders'), {
          params: { ...this.getAuthParams(), status: 'completed', per_page: 1 },
          timeout: 10000,
        }),
      ]);

      const pendingCount = parseInt(pending.headers['x-wp-total'] || '0', 10);
      const processingCount = parseInt(processing.headers['x-wp-total'] || '0', 10);
      const completedCount = parseInt(completed.headers['x-wp-total'] || '0', 10);

      // Get recent orders for revenue calculation (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentOrdersResponse = await axios.get(this.getApiUrl('orders'), {
        params: {
          ...this.getAuthParams(),
          status: 'completed',
          after: thirtyDaysAgo.toISOString(),
          per_page: 100,
        },
        timeout: 15000,
      });

      const recentRevenue = recentOrdersResponse.data.reduce((sum: number, order: any) => {
        return sum + parseFloat(order.total || '0');
      }, 0);

      return {
        totalOrders: pendingCount + processingCount + completedCount,
        pendingOrders: pendingCount,
        processingOrders: processingCount,
        completedOrders: completedCount,
        recentRevenue: Math.round(recentRevenue * 100) / 100,
      };
    } catch (error: any) {
      console.error('[WooCommerce] Error fetching order stats:', error.message);
      return { totalOrders: 0, pendingOrders: 0, processingOrders: 0, completedOrders: 0, recentRevenue: 0 };
    }
  }
  async createOrder(orderData: {
    billing: {
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
      address_1?: string;
      city?: string;
      state?: string;
      postcode?: string;
      country?: string;
    };
    line_items: Array<{
      product_id: number;
      quantity: number;
      variation_id?: number;
    }>;
    meta_data?: Array<{ key: string; value: string }>;
    set_paid?: boolean;
  }): Promise<{
    id: number;
    order_key: string;
    status: string;
    total: string;
    checkout_url: string;
  }> {
    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      throw new Error('WooCommerce credentials not configured');
    }

    try {
      const response = await axios.post(
        this.getApiUrl('orders'),
        {
          ...orderData,
          billing: {
            ...orderData.billing,
            country: orderData.billing.country || 'US',
          },
          status: orderData.set_paid ? 'processing' : 'pending',
          payment_method: '',
          payment_method_title: '',
        },
        {
          params: this.getAuthParams(),
          timeout: 30000,
        }
      );

      const order = response.data;
      const checkoutUrl = `${this.baseUrl}/checkout/order-pay/${order.id}/?pay_for_order=true&key=${order.order_key}`;

      return {
        id: order.id,
        order_key: order.order_key,
        status: order.status,
        total: order.total,
        checkout_url: checkoutUrl,
      };
    } catch (error: any) {
      console.error('[WooCommerce] Error creating order:', error.response?.data || error.message);
      throw new Error(`Failed to create WooCommerce order: ${error.response?.data?.message || error.message}`);
    }
  }

  async getOrderById(orderId: number): Promise<any | null> {
    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      return null;
    }

    try {
      const response = await axios.get(
        this.getApiUrl(`orders/${orderId}`),
        {
          params: this.getAuthParams(),
          timeout: 15000,
        }
      );

      const order = response.data;
      return {
        id: order.id,
        order_key: order.order_key,
        status: order.status,
        total: order.total,
        currency: order.currency,
        date_created: order.date_created,
        billing: order.billing,
        payment_method: order.payment_method_title,
        line_items: order.line_items?.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          total: item.total,
          product_id: item.product_id,
        })),
      };
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw new Error(`Failed to fetch order: ${error.response?.data?.message || error.message}`);
    }
  }
}

export const wooCommerceService = new WooCommerceService();
