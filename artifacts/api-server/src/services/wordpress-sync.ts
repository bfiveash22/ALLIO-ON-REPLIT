import { db } from "../db";
import { products, categories, libraryItems, memberProfiles, productVariations, productRolePrices, wpRoleMappings, userWpRoles, clinics } from "@shared/schema";
import { users } from "@shared/models/auth";
import { eq, desc, sql } from "drizzle-orm";
import crypto from "crypto";

interface WCProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  description: string;
  short_description: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  images: Array<{ id: number; src: string; alt: string }>;
  status: string;
  type: string;
  stock_status: string;
  stock_quantity?: number;
  sku?: string;
  attributes?: Array<{ id: number; name: string; options: string[] }>;
  meta_data?: Array<{ key: string; value: any }>;
}

interface WCVariation {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  sku: string;
  stock_status: string;
  stock_quantity: number | null;
  image: { src: string } | null;
  attributes: Array<{ id: number; name: string; option: string }>;
  meta_data?: Array<{ key: string; value: any }>;
}

interface WCCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  description: string;
  image: { src: string } | null;
}

interface WPPost {
  id: number;
  slug: string;
  status: string;
  type: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: Array<{ name: string }>;
    "wp:featuredmedia"?: Array<{ source_url: string }>;
    "wp:term"?: Array<Array<{ slug: string; name: string }>>;
  };
}

const rawWpUrl = process.env.WP_SITE_URL || "https://www.forgottenformula.com";
const WP_SITE_URL = rawWpUrl.startsWith("http") ? rawWpUrl : `https://${rawWpUrl}`;
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

async function wcApiFetch<T>(endpoint: string): Promise<T> {
  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    throw new Error("WooCommerce API credentials not configured");
  }
  
  const url = `${WP_SITE_URL}/wp-json/wc/v3/${endpoint}`;
  const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function wpApiFetch<T>(endpoint: string): Promise<T> {
  const WP_USERNAME = process.env.WP_USERNAME;
  const WP_PASSWORD = process.env.WP_PASSWORD || process.env.WP_APPLICATION_PASSWORD;
  
  const url = `${WP_SITE_URL}/wp-json/wp/v2/${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (WP_USERNAME && WP_PASSWORD) {
    headers.Authorization = `Basic ${Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString("base64")}`;
  }
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

export async function syncCategories(): Promise<void> {
  console.log("Syncing categories from WooCommerce...");
  
  const wcCategories = await wcApiFetch<WCCategory[]>("products/categories?per_page=100");
  
  for (const wcCat of wcCategories) {
    if (wcCat.slug === "uncategorized" || wcCat.count === 0) continue;
    
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, wcCat.slug))
      .limit(1);
    
    if (existingCategory.length === 0) {
      await db.insert(categories).values({
        name: wcCat.name,
        slug: wcCat.slug,
        description: wcCat.description || `${wcCat.name} products`,
        imageUrl: wcCat.image?.src || null,
        wcCategoryId: wcCat.id,
      });
      console.log(`Added category: ${wcCat.name}`);
    } else {
      await db
        .update(categories)
        .set({
          name: wcCat.name,
          description: wcCat.description || existingCategory[0].description,
          imageUrl: wcCat.image?.src || existingCategory[0].imageUrl,
          wcCategoryId: wcCat.id,
        })
        .where(eq(categories.slug, wcCat.slug));
    }
  }
  
  console.log(`Synced ${wcCategories.length} categories`);
}

// Extract role-based pricing from WooCommerce meta_data
function extractRolePricing(metaData: Array<{ key: string; value: any }> | undefined): Record<string, { price: string; visible: boolean }> {
  const rolePricing: Record<string, { price: string; visible: boolean }> = {};
  
  if (!metaData) return rolePricing;
  
  for (const meta of metaData) {
    // WPFactory "Price by User Role for WooCommerce" plugin format
    // Keys: _alg_wc_price_by_user_role_regular_price_{role}, _alg_wc_price_by_user_role_sale_price_{role}
    const algRegularMatch = meta.key.match(/^_alg_wc_price_by_user_role_regular_price_(.+)$/);
    if (algRegularMatch && meta.value && meta.value !== '') {
      const role = algRegularMatch[1];
      rolePricing[role] = { price: String(meta.value), visible: true };
    }
    
    // Sale price overrides regular price if set
    const algSaleMatch = meta.key.match(/^_alg_wc_price_by_user_role_sale_price_(.+)$/);
    if (algSaleMatch && meta.value && meta.value !== '') {
      const role = algSaleMatch[1];
      rolePricing[role] = { price: String(meta.value), visible: true };
    }
    
    // Empty price visibility check from alg plugin
    const algEmptyMatch = meta.key.match(/^_alg_wc_price_by_user_role_empty_price_(.+)$/);
    if (algEmptyMatch && meta.value === 'yes') {
      const role = algEmptyMatch[1];
      if (!rolePricing[role]) {
        rolePricing[role] = { price: '0', visible: false };
      } else {
        rolePricing[role].visible = false;
      }
    }
    
    // Legacy formats for other plugins
    if (meta.key === '_role_based_price' && typeof meta.value === 'object') {
      for (const [role, price] of Object.entries(meta.value)) {
        if (typeof price === 'string' || typeof price === 'number') {
          rolePricing[role] = { price: String(price), visible: true };
        }
      }
    }
    
    // WooCommerce Wholesale Prices plugin format
    if (meta.key.includes('wholesale') && meta.key.includes('price')) {
      const roleMatch = meta.key.match(/_([a-z_]+)_wholesale_price$/);
      if (roleMatch && meta.value) {
        rolePricing[roleMatch[1]] = { price: String(meta.value), visible: true };
      }
    }
  }
  
  return rolePricing;
}

// Map WooCommerce roles to app roles
// Cache for role mappings - loaded from database
let cachedRoleMappings: Map<string, string> | null = null;

async function loadRoleMappings(): Promise<Map<string, string>> {
  if (cachedRoleMappings) return cachedRoleMappings;
  
  const mappings = await db.select({
    wpRoleSlug: wpRoleMappings.wpRoleSlug,
    priceTier: wpRoleMappings.priceTier
  }).from(wpRoleMappings);
  
  cachedRoleMappings = new Map();
  for (const m of mappings) {
    cachedRoleMappings.set(m.wpRoleSlug.toLowerCase(), m.priceTier);
  }
  return cachedRoleMappings;
}

async function mapWcRoleToPriceTier(wcRole: string): Promise<string> {
  const mappings = await loadRoleMappings();
  return mappings.get(wcRole.toLowerCase()) || wcRole.toLowerCase();
}

// Legacy sync function for backward compatibility
function mapWcRoleToAppRole(wcRole: string): string {
  const roleMap: Record<string, string> = {
    'administrator': 'admin',
    'ff_doctor': 'doctor',
    'doctor': 'doctor',
    'ff_clinic': 'clinic',
    'clinic_owner': 'clinic',
    'wholesale_customer': 'wholesale',
    'holtorf': 'holtorf',
    'tricia': 'tricia',
    'customer': 'retail',
    'subscriber': 'retail',
    'member': 'retail',
  };
  return roleMap[wcRole.toLowerCase()] || wcRole.toLowerCase();
}

export async function syncProducts(): Promise<void> {
  console.log("Syncing products from WooCommerce...");
  
  let page = 1;
  let totalSynced = 0;
  let variationsSynced = 0;
  
  while (true) {
    const wcProducts = await wcApiFetch<WCProduct[]>(`products?per_page=100&page=${page}`);
    
    if (wcProducts.length === 0) break;
    
    for (const wcProduct of wcProducts) {
      if (wcProduct.status !== "publish") continue;
      
      const categorySlug = wcProduct.categories[0]?.slug || null;
      let categoryId: string | null = null;
      
      if (categorySlug) {
        const category = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, categorySlug))
          .limit(1);
        categoryId = category[0]?.id || null;
      }
      
      const existingProduct = await db
        .select()
        .from(products)
        .where(eq(products.slug, wcProduct.slug))
        .limit(1);
      
      const retailPrice = wcProduct.regular_price ? wcProduct.regular_price : wcProduct.price || "0";
      const basePrice = parseFloat(wcProduct.price) || parseFloat(retailPrice);
      
      // Extract role-based pricing from meta_data
      const rolePricing = extractRolePricing(wcProduct.meta_data);
      
      // Use role-based prices if available, otherwise calculate defaults
      const doctorPrice = rolePricing['doctor']?.price || 
                          rolePricing['ff_doctor']?.price || 
                          (basePrice ? String(basePrice * 0.6) : null);
      const wholesalePrice = rolePricing['wholesale_customer']?.price || 
                             rolePricing['clinic']?.price || 
                             (basePrice ? String(basePrice * 0.8) : null);
      
      const productData = {
        name: wcProduct.name,
        slug: wcProduct.slug,
        description: wcProduct.description || wcProduct.short_description || "",
        shortDescription: wcProduct.short_description || "",
        retailPrice: retailPrice,
        wholesalePrice: wholesalePrice,
        doctorPrice: doctorPrice,
        imageUrl: wcProduct.images[0]?.src || null,
        images: wcProduct.images.map((img) => img.src),
        categoryId: categoryId || undefined,
        inStock: wcProduct.stock_status === "instock",
        stockQuantity: wcProduct.stock_quantity || 0,
        sku: wcProduct.sku || null,
        productType: wcProduct.type,
        requiresMembership: true,
        wcProductId: wcProduct.id,
      };
      
      let productId: string;
      
      if (existingProduct.length === 0) {
        const [newProduct] = await db.insert(products).values(productData).returning({ id: products.id });
        productId = newProduct.id;
        console.log(`Added product: ${wcProduct.name}`);
      } else {
        productId = existingProduct[0].id;
        await db
          .update(products)
          .set(productData)
          .where(eq(products.slug, wcProduct.slug));
      }
      
      // Store role-based pricing in product_role_prices table
      if (Object.keys(rolePricing).length > 0) {
        // Clear existing role prices for this product
        await db.delete(productRolePrices).where(eq(productRolePrices.productId, productId));
        
        for (const [wcRole, priceData] of Object.entries(rolePricing)) {
          const appRole = mapWcRoleToAppRole(wcRole);
          await db.insert(productRolePrices).values({
            productId,
            role: appRole,
            price: priceData.price,
            priceVisible: priceData.visible,
          });
        }
      }
      
      // Sync variations for variable products
      if (wcProduct.type === "variable") {
        try {
          const variations = await wcApiFetch<WCVariation[]>(`products/${wcProduct.id}/variations?per_page=100`);
          
          // Clear existing variations for this product
          await db.delete(productVariations).where(eq(productVariations.productId, productId));
          
          for (const variation of variations) {
            const variationName = variation.attributes
              .map(attr => `${attr.name}: ${attr.option}`)
              .join(", ") || `Variation ${variation.id}`;
            
            const varRetailPrice = variation.regular_price || variation.price || retailPrice;
            const varBasePrice = parseFloat(variation.price) || parseFloat(varRetailPrice);
            
            // Extract variation-specific role pricing
            const varRolePricing = extractRolePricing(variation.meta_data);
            const varDoctorPrice = varRolePricing['doctor']?.price || 
                                   varRolePricing['ff_doctor']?.price || 
                                   (varBasePrice ? String(varBasePrice * 0.6) : null);
            const varWholesalePrice = varRolePricing['wholesale_customer']?.price || 
                                      varRolePricing['clinic']?.price || 
                                      (varBasePrice ? String(varBasePrice * 0.8) : null);
            
            const [newVariation] = await db.insert(productVariations).values({
              productId,
              wcVariationId: variation.id,
              name: variationName,
              sku: variation.sku || null,
              retailPrice: varRetailPrice,
              wholesalePrice: varWholesalePrice,
              doctorPrice: varDoctorPrice,
              attributes: JSON.stringify(variation.attributes),
              imageUrl: variation.image?.src || null,
              inStock: variation.stock_status === "instock",
              stockQuantity: variation.stock_quantity || 0,
            }).returning({ id: productVariations.id });
            
            // Store variation-specific role prices
            if (Object.keys(varRolePricing).length > 0) {
              for (const [wcRole, priceData] of Object.entries(varRolePricing)) {
                const appRole = mapWcRoleToAppRole(wcRole);
                await db.insert(productRolePrices).values({
                  productId,
                  variationId: newVariation.id,
                  role: appRole,
                  price: priceData.price,
                  priceVisible: priceData.visible,
                });
              }
            }
            
            variationsSynced++;
          }
          
          console.log(`  Synced ${variations.length} variations for: ${wcProduct.name}`);
        } catch (err) {
          console.error(`  Failed to sync variations for ${wcProduct.name}:`, err);
        }
      }
      
      totalSynced++;
    }
    
    page++;
  }
  
  console.log(`Synced ${totalSynced} products and ${variationsSynced} variations from WooCommerce`);
}

function determineContentType(post: WPPost): "document" | "protocol" | "training" | "video" | "article" {
  const title = post.title.rendered.toLowerCase();
  const content = post.content.rendered.toLowerCase();
  
  if (title.includes("protocol") || content.includes("protocol")) return "protocol";
  if (title.includes("training") || title.includes("course") || title.includes("lesson")) return "training";
  if (title.includes("video") || content.includes("youtube") || content.includes("vimeo")) return "video";
  if (title.includes("document") || title.includes("pdf") || title.includes("guide")) return "document";
  return "article";
}

export async function syncLibraryContent(): Promise<number> {
  console.log("Syncing library content from WordPress...");
  
  let page = 1;
  let totalSynced = 0;
  
  while (true) {
    try {
      const wpPosts = await wpApiFetch<WPPost[]>(
        `posts?per_page=100&page=${page}&_embed=author,wp:featuredmedia,wp:term`
      );
      
      if (wpPosts.length === 0) break;
      
      for (const post of wpPosts) {
        if (post.status !== "publish") continue;
        
        const authorName = post._embedded?.author?.[0]?.name || null;
        const imageUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
        const categorySlug = post._embedded?.["wp:term"]?.[0]?.[0]?.slug || null;
        const tags = post._embedded?.["wp:term"]?.[1]?.map(t => t.name) || [];
        
        const existingItem = await db
          .select()
          .from(libraryItems)
          .where(eq(libraryItems.slug, post.slug))
          .limit(1);
        
        const itemData = {
          title: post.title.rendered.replace(/&#8211;/g, "-").replace(/&amp;/g, "&"),
          slug: post.slug,
          contentType: determineContentType(post),
          content: post.content.rendered,
          excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, "").trim(),
          imageUrl,
          categorySlug,
          tags,
          authorName,
          wpPostId: post.id,
          isActive: true,
          requiresMembership: true,
        };
        
        if (existingItem.length === 0) {
          await db.insert(libraryItems).values(itemData);
          console.log(`Added library item: ${post.title.rendered}`);
        } else {
          await db
            .update(libraryItems)
            .set({ ...itemData, updatedAt: new Date() })
            .where(eq(libraryItems.slug, post.slug));
        }
        
        totalSynced++;
      }
      
      page++;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('400')) {
        console.log(`WordPress returned 400 on page ${page} — no more posts available.`);
      } else {
        console.log(`WordPress sync stopped at page ${page}: ${errMsg}`);
      }
      break;
    }
  }
  
  console.log(`Synced ${totalSynced} library items from WordPress`);
  return totalSynced;
}

export async function syncFromWordPress(): Promise<{ categories: number; products: number; libraryItems: number }> {
  await syncCategories();
  await syncProducts();
  const libraryCount = await syncLibraryContent();
  
  const [categoryCount] = await db.select({ count: categories.id }).from(categories);
  const [productCount] = await db.select({ count: products.id }).from(products);
  
  return {
    categories: categoryCount ? 1 : 0,
    products: productCount ? 1 : 0,
    libraryItems: libraryCount,
  };
}

interface WPUser {
  id: number;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  avatar_urls?: { [key: string]: string };
  // Ultimate Member specific fields that may be present
  meta?: Record<string, any>;
  capabilities?: Record<string, boolean>;
  um_user_roles?: string[];
}

// Collect all roles from WordPress response including Ultimate Member roles
function collectAllRolesFromWPUser(wpUser: WPUser): string[] {
  const roles = new Set<string>();
  
  // 1. Standard WordPress roles
  if (wpUser.roles && Array.isArray(wpUser.roles)) {
    wpUser.roles.forEach(r => roles.add(r.toLowerCase()));
  }
  
  // 2. Ultimate Member roles from um_user_roles field
  if (wpUser.um_user_roles && Array.isArray(wpUser.um_user_roles)) {
    wpUser.um_user_roles.forEach(r => roles.add(r.toLowerCase()));
  }
  
  // 3. Check capabilities for role-like entries
  if (wpUser.capabilities && typeof wpUser.capabilities === 'object') {
    Object.keys(wpUser.capabilities).forEach(cap => {
      if (wpUser.capabilities![cap] === true) {
        const lowerCap = cap.toLowerCase();
        if (lowerCap.startsWith('um_') || 
            lowerCap.includes('doctor') || 
            lowerCap.includes('healer') || 
            lowerCap.includes('clinic') ||
            lowerCap.includes('practitioner') ||
            lowerCap.includes('wholesale')) {
          roles.add(lowerCap);
        }
      }
    });
  }
  
  // 4. Check meta for Ultimate Member community role
  if (wpUser.meta && typeof wpUser.meta === 'object') {
    const umRole = wpUser.meta.um_user_role || wpUser.meta.community_role;
    if (umRole) {
      if (Array.isArray(umRole)) {
        umRole.forEach(r => roles.add(String(r).toLowerCase()));
      } else {
        roles.add(String(umRole).toLowerCase());
      }
    }
  }
  
  return Array.from(roles);
}

function mapWpRoleToAppRole(wpRoles: string[]): "admin" | "doctor" | "clinic" | "member" {
  // Check for admin roles
  if (wpRoles.some(r => r === "administrator" || r === "admin")) {
    return "admin";
  }
  
  // Check for doctor/healer/practitioner roles (including Ultimate Member)
  const doctorPatterns = [
    "ff_doctor", "doctor", "ff_healer", "healer", 
    "um_doctor", "um_healer", "practitioner", "um_practitioner",
    "wellness_practitioner", "healthcare_provider"
    // Note: "holtorf" and "tricia" are NOT doctor roles - they're custom user categories
  ];
  if (wpRoles.some(r => doctorPatterns.includes(r) || r.includes("doctor") || r.includes("healer"))) {
    return "doctor";
  }
  
  // Check for clinic/wholesale roles (including Ultimate Member)
  const clinicPatterns = [
    "ff_clinic", "clinic_owner", "clinic", 
    "um_clinic", "clinic_manager", "wholesale_customer",
    "wholesaler", "wholesale" // Wholesale users are clinics
  ];
  if (wpRoles.some(r => clinicPatterns.includes(r) || r.includes("clinic") || r.includes("wholesale"))) {
    return "clinic";
  }
  
  return "member";
}

// Function to fix member profiles based on existing wpRoles data
export async function fixMemberProfileRoles(): Promise<{ updated: number; details: string[] }> {
  console.log("Fixing member profile roles based on wpRoles...");
  
  const result = { updated: 0, details: [] as string[] };
  
  // Get all users with wpRoles set
  const allUsers = await db
    .select()
    .from(users)
    .where(sql`wp_roles IS NOT NULL AND wp_roles != ''`);
  
  for (const user of allUsers) {
    const wpRolesArray = (user.wpRoles || "").split(",").map((r: string) => r.trim().toLowerCase()).filter(Boolean);
    const correctRole = mapWpRoleToAppRole(wpRolesArray);
    
    // Get current member profile
    const profile = await db
      .select()
      .from(memberProfiles)
      .where(eq(memberProfiles.userId, user.id))
      .limit(1);
    
    if (profile.length > 0 && profile[0].role !== correctRole) {
      await db
        .update(memberProfiles)
        .set({ role: correctRole })
        .where(eq(memberProfiles.userId, user.id));
      
      result.updated++;
      result.details.push(`${user.email}: ${profile[0].role} -> ${correctRole} (wpRoles: ${user.wpRoles})`);
    }
  }
  
  console.log(`Fixed ${result.updated} member profile roles`);
  return result;
}

// Collect roles from WooCommerce customer data including meta_data
function collectRolesFromWooCommerceCustomer(customer: {
  role: string;
  meta_data?: Array<{ id: number; key: string; value: any }>;
}): string[] {
  const roles = new Set<string>();
  
  // 1. Add the primary WooCommerce role
  if (customer.role) {
    roles.add(customer.role.toLowerCase());
  }
  
  // 2. Check meta_data for role-related fields
  if (customer.meta_data && Array.isArray(customer.meta_data)) {
    for (const meta of customer.meta_data) {
      const key = meta.key?.toLowerCase() || "";
      
      // Ultimate Member role fields
      if (key === "um_user_role" || key === "um_role" || key === "community_role" || 
          key === "um_member_type" || key === "account_status") {
        if (Array.isArray(meta.value)) {
          meta.value.forEach((v: any) => roles.add(String(v).toLowerCase()));
        } else if (meta.value) {
          roles.add(String(meta.value).toLowerCase());
        }
      }
      
      // Price by User Roles plugin fields
      if (key === "wc_price_by_role_roles" || key === "price_by_role" || 
          key === "_price_by_role" || key === "products_by_role") {
        if (Array.isArray(meta.value)) {
          meta.value.forEach((v: any) => roles.add(String(v).toLowerCase()));
        } else if (typeof meta.value === "object" && meta.value !== null) {
          Object.keys(meta.value).forEach(k => roles.add(k.toLowerCase()));
        } else if (meta.value) {
          roles.add(String(meta.value).toLowerCase());
        }
      }
      
      // WordPress capabilities stored in meta
      if (key === "wp_capabilities" || key.includes("capabilities")) {
        if (typeof meta.value === "object" && meta.value !== null) {
          Object.keys(meta.value).forEach(cap => {
            if (meta.value[cap] === true || meta.value[cap] === "1") {
              const lowerCap = cap.toLowerCase();
              // Check for role-like capabilities
              if (lowerCap.includes("doctor") || lowerCap.includes("healer") ||
                  lowerCap.includes("clinic") || lowerCap.includes("admin") ||
                  lowerCap.includes("member") || lowerCap.includes("practitioner") ||
                  lowerCap.startsWith("um_") || lowerCap.startsWith("ff_")) {
                roles.add(lowerCap);
              }
            }
          });
        }
      }
      
      // Check for role-like meta keys with "role" in name
      if (key.includes("role") && meta.value) {
        if (Array.isArray(meta.value)) {
          meta.value.forEach((v: any) => roles.add(String(v).toLowerCase()));
        } else if (typeof meta.value === "string") {
          roles.add(meta.value.toLowerCase());
        }
      }
    }
  }
  
  return Array.from(roles);
}

// Save individual roles to userWpRoles table for normalized access
async function saveUserWpRoles(userId: string, roles: string[]): Promise<void> {
  try {
    // Delete existing roles for this user
    await db.delete(userWpRoles).where(eq(userWpRoles.userId, userId));
    
    // Insert new roles
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      await db.insert(userWpRoles).values({
        userId,
        wpRoleSlug: role,
        isPrimary: i === 0, // First role is primary
        syncedAt: new Date(),
      });
    }
  } catch (error) {
    console.error(`Error saving userWpRoles for user ${userId}:`, error);
  }
}

export interface UserSyncResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  details: Array<{
    email: string;
    wpUsername: string;
    role: string;
    status: "imported" | "updated" | "skipped" | "error";
    reason?: string;
  }>;
}

export async function syncUsers(): Promise<UserSyncResult> {
  console.log("Syncing users from WordPress/WooCommerce...");
  
  const result: UserSyncResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    details: [],
  };
  
  // Try WooCommerce customers first (more reliable with WC credentials)
  const wcSuccess = await syncWooCommerceCustomers(result);
  
  // If WC worked, also try WordPress users API for non-customer users
  if (wcSuccess) {
    await syncWordPressUsers(result);
  }
  
  return result;
}

async function syncWooCommerceCustomers(result: UserSyncResult): Promise<boolean> {
  console.log("Syncing customers from WooCommerce...");
  
  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    console.log("WooCommerce credentials not configured, skipping customer sync");
    return false;
  }
  
  const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");
  let page = 1;
  
  while (true) {
    try {
      const url = `${WP_SITE_URL}/wp-json/wc/v3/customers?per_page=100&page=${page}&role=all`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        if (response.status === 400) break;
        console.error(`WooCommerce customers API error: ${response.status}`);
        return false;
      }
      
      const customers: Array<{
        id: number;
        email: string;
        first_name: string;
        last_name: string;
        username: string;
        role: string;
        avatar_url: string;
        meta_data?: Array<{ id: number; key: string; value: any }>;
      }> = await response.json();
      
      if (customers.length === 0) break;
      
      for (const customer of customers) {
        try {
          if (!customer.email) {
            result.skipped++;
            result.details.push({
              email: "(no email)",
              wpUsername: customer.username || `customer_${customer.id}`,
              role: "member",
              status: "skipped",
              reason: "No email address",
            });
            continue;
          }
          
          // Collect all roles from customer data including meta_data
          const allRoles = collectRolesFromWooCommerceCustomer(customer);
          const rolesString = allRoles.join(",");
          
          console.log(`WC Sync: Customer ${customer.username} (${customer.email}) roles:`, {
            wcRole: customer.role,
            metaData: customer.meta_data?.slice(0, 5), // Log first 5 meta entries
            collectedRoles: allRoles,
          });
          
          // Map collected roles to app role
          const appRole = mapWpRoleToAppRole(allRoles);
          
          // Check if user already exists by WP ID
          const existingByWpId = await db
            .select()
            .from(users)
            .where(eq(users.wpUserId, String(customer.id)))
            .limit(1);
          
          if (existingByWpId.length > 0) {
            await db
              .update(users)
              .set({
                email: customer.email,
                firstName: customer.first_name || null,
                lastName: customer.last_name || null,
                profileImageUrl: customer.avatar_url || null,
                wpUsername: customer.username,
                wpRoles: rolesString,
                authProvider: "wordpress",
                updatedAt: new Date(),
              })
              .where(eq(users.wpUserId, String(customer.id)));
            
            // Also update the member profile role
            await db
              .update(memberProfiles)
              .set({ role: appRole })
              .where(eq(memberProfiles.userId, existingByWpId[0].id));
            
            // Save roles to normalized table
            await saveUserWpRoles(existingByWpId[0].id, allRoles);
            
            result.updated++;
            result.details.push({
              email: customer.email,
              wpUsername: customer.username,
              role: appRole,
              status: "updated",
            });
            continue;
          }
          
          // Check by email
          const existingByEmail = await db
            .select()
            .from(users)
            .where(eq(users.email, customer.email))
            .limit(1);
          
          if (existingByEmail.length > 0) {
            await db
              .update(users)
              .set({
                wpUserId: String(customer.id),
                wpUsername: customer.username,
                wpRoles: rolesString,
                firstName: customer.first_name || existingByEmail[0].firstName,
                lastName: customer.last_name || existingByEmail[0].lastName,
                profileImageUrl: customer.avatar_url || existingByEmail[0].profileImageUrl,
                authProvider: "wordpress",
                updatedAt: new Date(),
              })
              .where(eq(users.email, customer.email));
            
            // Also update or create member profile with detected role
            const existingProfile = await db
              .select()
              .from(memberProfiles)
              .where(eq(memberProfiles.userId, existingByEmail[0].id))
              .limit(1);
            
            if (existingProfile.length > 0) {
              await db
                .update(memberProfiles)
                .set({ role: appRole })
                .where(eq(memberProfiles.userId, existingByEmail[0].id));
            } else {
              await db.insert(memberProfiles).values({
                userId: existingByEmail[0].id,
                role: appRole,
                isActive: true,
              });
            }
            
            // Save roles to normalized table
            await saveUserWpRoles(existingByEmail[0].id, allRoles);
            
            result.updated++;
            result.details.push({
              email: customer.email,
              wpUsername: customer.username,
              role: appRole,
              status: "updated",
              reason: "Linked existing email",
            });
            continue;
          }
          
          // Create new user
          const [newUser] = await db
            .insert(users)
            .values({
              email: customer.email,
              firstName: customer.first_name || null,
              lastName: customer.last_name || null,
              profileImageUrl: customer.avatar_url || null,
              wpUserId: String(customer.id),
              wpUsername: customer.username,
              wpRoles: rolesString,
              authProvider: "wordpress",
            })
            .returning();
          
          // Create member profile with detected role
          await db.insert(memberProfiles).values({
            userId: newUser.id,
            role: appRole,
            isActive: true,
          });
          
          // Save roles to normalized table
          await saveUserWpRoles(newUser.id, allRoles);
          
          result.imported++;
          result.details.push({
            email: customer.email,
            wpUsername: customer.username,
            role: appRole,
            status: "imported",
          });
          
        } catch (userError) {
          result.errors.push(`Error processing customer ${customer.email}: ${userError}`);
          result.details.push({
            email: customer.email || "(unknown)",
            wpUsername: customer.username || "",
            role: "member",
            status: "error",
            reason: String(userError),
          });
        }
      }
      
      page++;
    } catch (error) {
      console.error("Error fetching WooCommerce customers:", error);
      return false;
    }
  }
  
  console.log(`WooCommerce customer sync complete: ${result.imported} imported, ${result.updated} updated`);
  return true;
}

async function syncWordPressUsers(result: UserSyncResult): Promise<void | UserSyncResult> {
  console.log("Syncing additional users from WordPress REST API...");
  
  const WP_USERNAME = process.env.WP_USERNAME || 'blake';
  const WP_PASSWORD = process.env.WP_PASSWORD || process.env.WP_APPLICATION_PASSWORD;
  
  if (!WP_PASSWORD) {
    console.log("WordPress password not configured, skipping WP user sync");
    return;
  }
  
  const auth = Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString("base64");
  let page = 1;
  
  while (true) {
    try {
      // Try context=edit first, fall back to context=view
      let url = `${WP_SITE_URL}/wp-json/wp/v2/users?per_page=100&page=${page}&context=edit`;
      
      let response = await fetch(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });
      
      // If edit context fails, try view context (has less data but lower permission requirements)
      if (response.status === 401 || response.status === 403) {
        console.log("WordPress edit context denied, trying view context...");
        url = `${WP_SITE_URL}/wp-json/wp/v2/users?per_page=100&page=${page}`;
        response = await fetch(url, {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        });
      }
      
      if (!response.ok) {
        if (response.status === 400) break;
        console.log(`WordPress users API returned ${response.status}, skipping WP sync`);
        return;
      }
      
      const wpUsers: WPUser[] = await response.json();
      
      if (wpUsers.length === 0) break;
      
      for (const wpUser of wpUsers) {
        try {
          // Collect all roles including Ultimate Member roles
          const allRoles = collectAllRolesFromWPUser(wpUser);
          const rolesString = allRoles.join(",");
          
          console.log(`Sync: User ${wpUser.username} roles:`, {
            standardRoles: wpUser.roles,
            collectedRoles: allRoles,
          });
          
          if (!wpUser.email) {
            result.skipped++;
            result.details.push({
              email: "(no email)",
              wpUsername: wpUser.username,
              role: mapWpRoleToAppRole(allRoles),
              status: "skipped",
              reason: "No email address",
            });
            continue;
          }
          
          const appRole = mapWpRoleToAppRole(allRoles);
          
          const existingByWpId = await db
            .select()
            .from(users)
            .where(eq(users.wpUserId, String(wpUser.id)))
            .limit(1);
          
          if (existingByWpId.length > 0) {
            await db
              .update(users)
              .set({
                email: wpUser.email,
                firstName: wpUser.first_name || wpUser.name?.split(" ")[0] || null,
                lastName: wpUser.last_name || wpUser.name?.split(" ").slice(1).join(" ") || null,
                profileImageUrl: wpUser.avatar_urls?.["96"] || null,
                wpUsername: wpUser.username,
                wpRoles: rolesString,
                authProvider: "wordpress",
                updatedAt: new Date(),
              })
              .where(eq(users.wpUserId, String(wpUser.id)));
            
            await db
              .update(memberProfiles)
              .set({ role: appRole })
              .where(eq(memberProfiles.userId, existingByWpId[0].id));
            
            result.updated++;
            result.details.push({
              email: wpUser.email,
              wpUsername: wpUser.username,
              role: appRole,
              status: "updated",
            });
            continue;
          }
          
          const existingByEmail = await db
            .select()
            .from(users)
            .where(eq(users.email, wpUser.email))
            .limit(1);
          
          if (existingByEmail.length > 0) {
            await db
              .update(users)
              .set({
                wpUserId: String(wpUser.id),
                wpUsername: wpUser.username,
                wpRoles: rolesString,
                firstName: wpUser.first_name || existingByEmail[0].firstName,
                lastName: wpUser.last_name || existingByEmail[0].lastName,
                profileImageUrl: wpUser.avatar_urls?.["96"] || existingByEmail[0].profileImageUrl,
                authProvider: "wordpress",
                updatedAt: new Date(),
              })
              .where(eq(users.email, wpUser.email));
            
            const existingProfile = await db
              .select()
              .from(memberProfiles)
              .where(eq(memberProfiles.userId, existingByEmail[0].id))
              .limit(1);
            
            if (existingProfile.length > 0) {
              await db
                .update(memberProfiles)
                .set({ role: appRole })
                .where(eq(memberProfiles.userId, existingByEmail[0].id));
            } else {
              await db.insert(memberProfiles).values({
                userId: existingByEmail[0].id,
                role: appRole,
                isActive: true,
              });
            }
            
            result.updated++;
            result.details.push({
              email: wpUser.email,
              wpUsername: wpUser.username,
              role: appRole,
              status: "updated",
            });
            continue;
          }
          
          const [newUser] = await db
            .insert(users)
            .values({
              email: wpUser.email,
              firstName: wpUser.first_name || wpUser.name?.split(" ")[0] || null,
              lastName: wpUser.last_name || wpUser.name?.split(" ").slice(1).join(" ") || null,
              profileImageUrl: wpUser.avatar_urls?.["96"] || null,
              wpUserId: String(wpUser.id),
              wpUsername: wpUser.username,
              wpRoles: rolesString,
              authProvider: "wordpress",
            })
            .returning();
          
          await db.insert(memberProfiles).values({
            userId: newUser.id,
            role: appRole,
            isActive: true,
          });
          
          result.imported++;
          result.details.push({
            email: wpUser.email,
            wpUsername: wpUser.username,
            role: appRole,
            status: "imported",
          });
          
        } catch (userError: any) {
          result.errors.push(`User ${wpUser.username}: ${userError.message}`);
          result.details.push({
            email: wpUser.email || "(unknown)",
            wpUsername: wpUser.username,
            role: "member",
            status: "error",
            reason: userError.message,
          });
        }
      }
      
      page++;
    } catch (error: any) {
      if (page > 1) {
        console.log(`Finished syncing users at page ${page}`);
        break;
      }
      throw error;
    }
  }
  
  console.log(`User sync complete: ${result.imported} imported, ${result.updated} updated, ${result.skipped} skipped`);
  return result;
}

// Resolve app role from WP roles using database mappings (with fallback to hardcoded logic)
async function resolveAppRoleFromWpRoles(wpRoles: string[]): Promise<"admin" | "doctor" | "clinic" | "member"> {
  // Get role mappings from database, ordered by priority
  const mappings = await db.select().from(wpRoleMappings).orderBy(desc(wpRoleMappings.priority));
  
  // Check each WP role against mappings
  for (const wpRole of wpRoles) {
    const roleLower = wpRole.toLowerCase();
    const mapping = mappings.find((m: typeof wpRoleMappings.$inferSelect) => m.wpRoleSlug.toLowerCase() === roleLower);
    if (mapping) {
      return mapping.appRole as "admin" | "doctor" | "clinic" | "member";
    }
  }
  
  // Fallback to hardcoded logic if no mappings found
  const rolesLower = wpRoles.map(r => r.toLowerCase());
  if (rolesLower.some(r => r === "administrator" || r === "admin")) return "admin";
  if (rolesLower.some(r => r.includes("doctor") || r.includes("healer"))) return "doctor";
  if (rolesLower.some(r => r.includes("clinic"))) return "clinic";
  
  return "member";
}

// Persist user's WP roles to user_wp_roles table
async function persistUserWpRoles(userId: string, wpRoles: string[]): Promise<void> {
  // Delete existing roles for this user
  await db.delete(userWpRoles).where(eq(userWpRoles.userId, userId));
  
  // Insert new roles
  for (let i = 0; i < wpRoles.length; i++) {
    await db.insert(userWpRoles).values({
      userId,
      wpRoleSlug: wpRoles[i],
      isPrimary: i === 0
    });
  }
}

// Validate WooCommerce webhook signature
export function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64");
    
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    
    // Handle different length buffers safely
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (error) {
    console.error("Signature validation error:", error);
    return false;
  }
}

// Sync a single user (for webhook updates)
export async function syncSingleUser(userData: any): Promise<{ success: boolean; message: string }> {
  if (!userData || (!userData.email && !userData.id)) {
    return { success: false, message: "No user data provided" };
  }

  try {
    const wpUserId = String(userData.id);
    const email = userData.email || userData.billing?.email;
    const wpUsername = userData.username || userData.billing?.first_name;
    
    // Normalize roles from various formats
    let roles: string[] = [];
    if (userData.roles) {
      if (Array.isArray(userData.roles)) {
        roles = userData.roles;
      } else if (typeof userData.roles === "object") {
        roles = Object.keys(userData.roles);
      } else {
        roles = [String(userData.roles)];
      }
    } else if (userData.role) {
      roles = [userData.role];
    }
    
    // Resolve app role using database mappings
    const appRole = await resolveAppRoleFromWpRoles(roles);
    
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.wpUserId, wpUserId));
    
    if (existingUser) {
      // Update existing user
      await db.update(users).set({
        email,
        firstName: userData.first_name || userData.billing?.first_name,
        lastName: userData.last_name || userData.billing?.last_name,
        wpRoles: roles.join(","),
        updatedAt: new Date(),
      }).where(eq(users.id, existingUser.id));
      
      // Persist WP roles to user_wp_roles table
      await persistUserWpRoles(existingUser.id, roles);
      
      // Update profile
      await db.update(memberProfiles).set({
        role: appRole,
        lastSyncedAt: new Date(),
      }).where(eq(memberProfiles.userId, existingUser.id));
      
      return { success: true, message: `Updated user ${email}` };
    } else {
      // Create new user
      const [newUser] = await db.insert(users).values({
        email,
        firstName: userData.first_name || userData.billing?.first_name,
        lastName: userData.last_name || userData.billing?.last_name,
        profileImageUrl: userData.avatar_url || null,
        wpUserId,
        wpUsername,
        wpRoles: roles.join(","),
        authProvider: "wordpress",
      }).returning();
      
      // Persist WP roles to user_wp_roles table
      await persistUserWpRoles(newUser.id, roles);
      
      await db.insert(memberProfiles).values({
        userId: newUser.id,
        role: appRole,
        isActive: true,
        lastSyncedAt: new Date(),
      });
      
      return { success: true, message: `Created user ${email}` };
    }
  } catch (error: any) {
    console.error("syncSingleUser error:", error);
    return { success: false, message: error.message };
  }
}

// Update product role prices (delete old + insert new)
async function updateProductRolePrices(productId: string, metaData: any[] | undefined): Promise<void> {
  // Delete existing role prices for this product
  await db.delete(productRolePrices).where(eq(productRolePrices.productId, productId));
  
  if (!metaData) return;
  
  // Extract and insert role-specific prices
  const rolePrices: { role: string; price: string }[] = [];
  
  // Check for doctor price
  const doctorPrice = extractMetaPrice(metaData, "doctor");
  if (doctorPrice) {
    rolePrices.push({ role: "doctor", price: doctorPrice });
  }
  
  // Check for wholesale/clinic price
  const wholesalePrice = extractMetaPrice(metaData, "wholesale");
  if (wholesalePrice) {
    rolePrices.push({ role: "clinic", price: wholesalePrice });
  }
  
  // Insert new role prices
  for (const rp of rolePrices) {
    await db.insert(productRolePrices).values({
      productId,
      role: rp.role,
      price: rp.price,
    });
  }
}

// Sync a single product (for webhook updates)
export async function syncSingleProduct(productData: any): Promise<{ success: boolean; message: string }> {
  if (!productData || !productData.id) {
    return { success: false, message: "No product data provided" };
  }

  try {
    const wcProductId = productData.id;
    
    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.wcProductId, wcProductId));
    
    const productValues = {
      name: productData.name,
      slug: productData.slug,
      description: productData.description || "",
      shortDescription: productData.short_description || "",
      retailPrice: productData.regular_price || productData.price || "0",
      wholesalePrice: extractMetaPrice(productData.meta_data, "wholesale") || null,
      doctorPrice: extractMetaPrice(productData.meta_data, "doctor") || null,
      imageUrl: productData.images?.[0]?.src || null,
      images: productData.images?.map((img: any) => img.src) || [],
      sku: productData.sku || null,
      stockQuantity: productData.stock_quantity || 0,
      inStock: productData.stock_status === "instock",
      isActive: productData.status === "publish",
      productType: productData.type,
      wcProductId,
    };
    
    if (existingProduct) {
      // Update product
      await db.update(products).set(productValues).where(eq(products.id, existingProduct.id));
      
      // Update role prices
      await updateProductRolePrices(existingProduct.id, productData.meta_data);
      
      return { success: true, message: `Updated product ${productData.name}` };
    } else {
      // Need category ID - try to find matching category
      let categoryId = null;
      if (productData.categories?.length > 0) {
        const catSlug = productData.categories[0].slug;
        const [cat] = await db.select().from(categories).where(eq(categories.slug, catSlug));
        categoryId = cat?.id || null;
      }
      
      const [newProduct] = await db.insert(products).values({
        ...productValues,
        categoryId,
      }).returning();
      
      // Insert role prices for new product
      await updateProductRolePrices(newProduct.id, productData.meta_data);
      
      return { success: true, message: `Created product ${productData.name}` };
    }
  } catch (error: any) {
    console.error("syncSingleProduct error:", error);
    return { success: false, message: error.message };
  }
}

function extractMetaPrice(metaData: any[] | undefined, priceTier: string): string | null {
  if (!metaData) return null;
  
  const tierKeys: Record<string, string[]> = {
    wholesale: ["wholesale_price", "wholesaleprice", "_wholesale_price", "member_price"],
    doctor: ["doctor_price", "doctorprice", "_doctor_price", "healer_price"],
  };
  
  const keys = tierKeys[priceTier] || [];
  for (const key of keys) {
    const meta = metaData.find(m => m.key?.toLowerCase() === key);
    if (meta?.value) return String(meta.value);
  }
  return null;
}

// ===== BIDIRECTIONAL SYNC: Push users to WordPress =====

interface WPUserCreateData {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  password?: string;
}

interface WPUserCreateResult {
  success: boolean;
  wpUserId?: number;
  wpUsername?: string;
  message: string;
}

// Map app role to WordPress role
function mapAppRoleToWpRole(appRole: "admin" | "doctor" | "clinic" | "member"): string {
  const roleMap: Record<string, string> = {
    admin: "administrator",
    doctor: "ff_doctor",
    clinic: "ff_clinic",
    member: "customer",
  };
  return roleMap[appRole] || "customer";
}

// Create a user in WordPress
// Note: WordPress handles password hashing server-side. We generate a random password
// that WordPress will hash. Users should use "Forgot Password" to set their own password.
export async function createWordPressUser(userData: WPUserCreateData): Promise<WPUserCreateResult> {
  const WP_USERNAME = process.env.WP_USERNAME || 'blake';
  const WP_PASSWORD = process.env.WP_PASSWORD || process.env.WP_APPLICATION_PASSWORD;
  
  if (!WP_PASSWORD) {
    console.log("WordPress password not configured, cannot push user to WordPress");
    return { success: false, message: "WordPress password not configured" };
  }
  
  const auth = Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString("base64");
  
  // Generate username from email (before @ sign)
  const username = userData.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
  
  // WordPress requires a password but will hash it server-side.
  // Generate a cryptographically random temporary password that user won't know.
  // They must use "Forgot Password" on WordPress to set their own password.
  const tempPassword = crypto.randomBytes(32).toString("base64");
  
  try {
    const response = await fetch(`${WP_SITE_URL}/wp-json/wp/v2/users`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email: userData.email,
        password: tempPassword, // WordPress hashes this - user must reset via "Forgot Password"
        first_name: userData.firstName,
        last_name: userData.lastName,
        name: `${userData.firstName} ${userData.lastName}`,
        roles: [userData.role || "customer"],
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      if (errorData?.code === "existing_user_email") {
        console.log(`WordPress user already exists with email: ${userData.email} - fetching WP user ID`);
        try {
          const lookupRes = await fetch(`${WP_SITE_URL}/wp-json/wp/v2/users?search=${encodeURIComponent(userData.email)}`, {
            headers: { Authorization: `Basic ${auth}` },
          });
          if (lookupRes.ok) {
            const wpUsers = await lookupRes.json() as any[];
            const match = wpUsers.find((u: any) => u.email === userData.email);
            if (match) {
              return {
                success: true,
                message: `Linked to existing WordPress user (ID: ${match.id})`,
                wpUserId: match.id,
                wpUsername: match.username,
              };
            }
          }
        } catch (lookupErr) {
          console.error("Failed to look up existing WP user:", lookupErr);
        }
        return { 
          success: false, 
          message: "User already exists in WordPress with this email",
        };
      }
      if (errorData?.code === "existing_user_login") {
        // Try with a different username
        return createWordPressUserWithUniqueUsername(userData, auth);
      }
      
      console.error("WordPress user creation failed:", errorData);
      return { 
        success: false, 
        message: errorData?.message || `WordPress API error: ${response.status}`,
      };
    }
    
    const wpUser = await response.json();
    console.log(`Created WordPress user: ${wpUser.username} (ID: ${wpUser.id})`);
    
    return {
      success: true,
      wpUserId: wpUser.id,
      wpUsername: wpUser.username,
      message: `Created WordPress user ${wpUser.username}`,
    };
  } catch (error: any) {
    console.error("Error creating WordPress user:", error);
    return { success: false, message: error.message };
  }
}

// Retry with unique username if first attempt fails due to duplicate username
async function createWordPressUserWithUniqueUsername(
  userData: WPUserCreateData, 
  auth: string
): Promise<WPUserCreateResult> {
  const timestamp = Date.now().toString(36);
  const baseUsername = userData.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
  const username = `${baseUsername}_${timestamp}`;
  const tempPassword = crypto.randomBytes(32).toString("base64");
  
  try {
    const response = await fetch(`${WP_SITE_URL}/wp-json/wp/v2/users`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email: userData.email,
        password: tempPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        name: `${userData.firstName} ${userData.lastName}`,
        roles: [userData.role || "customer"],
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return { 
        success: false, 
        message: errorData?.message || `WordPress API error: ${response.status}`,
      };
    }
    
    const wpUser = await response.json();
    return {
      success: true,
      wpUserId: wpUser.id,
      wpUsername: wpUser.username,
      message: `Created WordPress user ${wpUser.username}`,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Create WordPress user and update local user record with WP ID
export async function pushUserToWordPress(userId: string): Promise<WPUserCreateResult> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    return { success: false, message: "User not found" };
  }
  
  const [profile] = await db.select().from(memberProfiles).where(eq(memberProfiles.userId, userId));
  const appRole = (profile?.role || "member") as "admin" | "doctor" | "clinic" | "member";
  const wpRole = mapAppRoleToWpRole(appRole);

  const localData = {
    email: user.email, firstName: user.firstName, lastName: user.lastName, role: wpRole,
  };

  if (user.wpUserId) {
    const wpApiUrl = process.env.WP_API_URL || process.env.WORDPRESS_API_URL || "";
    const wpKey = process.env.WP_CONSUMER_KEY || process.env.WORDPRESS_CONSUMER_KEY || "";
    const wpSecret = process.env.WP_CONSUMER_SECRET || process.env.WORDPRESS_CONSUMER_SECRET || "";

    if (!wpApiUrl || !wpKey || !wpSecret) {
      return { success: false, message: "WordPress API credentials not configured" };
    }

    try {
      const auth = Buffer.from(`${wpKey}:${wpSecret}`).toString("base64");
      const response = await fetch(`${wpApiUrl}/wp/v2/users/${user.wpUserId}`, {
        method: "PUT",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: user.firstName || "",
          last_name: user.lastName || "",
          roles: [wpRole],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `WP API error: ${response.status} - ${errorText}` };
      }

      const wpUser = await response.json() as any;
      await db.update(users).set({
        wpRoles: wpRole,
        updatedAt: new Date(),
      }).where(eq(users.id, userId));

      if (profile) {
        await db.update(memberProfiles).set({ lastSyncedAt: new Date() }).where(eq(memberProfiles.userId, userId));
      }

      const remoteData = { email: wpUser.email, firstName: wpUser.first_name, lastName: wpUser.last_name, role: wpUser.roles?.[0] };
      await updateSyncTracking("user", userId, String(user.wpUserId), "push", localData, remoteData);

      return { success: true, message: `Updated existing WP user ${user.wpUserId}`, wpUserId: Number(user.wpUserId), wpUsername: wpUser.username };
    } catch (err: any) {
      return { success: false, message: `Failed to update WP user: ${err.message}` };
    }
  }
  
  const result = await createWordPressUser({
    email: user.email || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    role: wpRole,
  });
  
  if (result.success && result.wpUserId) {
    await db.update(users).set({
      wpUserId: String(result.wpUserId),
      wpUsername: result.wpUsername,
      wpRoles: wpRole,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    
    if (profile) {
      await db.update(memberProfiles).set({ lastSyncedAt: new Date() }).where(eq(memberProfiles.userId, userId));
    }

    await updateSyncTracking("user", userId, String(result.wpUserId), "push", localData);
  }
  
  return result;
}

// Push all unsynced users to WordPress
export async function pushAllUsersToWordPress(): Promise<{ 
  success: number; 
  failed: number; 
  skipped: number;
  details: Array<{ email: string; status: string; message: string }>;
}> {
  const result = { 
    success: 0, 
    failed: 0, 
    skipped: 0, 
    details: [] as Array<{ email: string; status: string; message: string }>,
  };
  
  // Get all users without WordPress ID
  const unsyncedUsers = await db
    .select()
    .from(users)
    .where(sql`wp_user_id IS NULL OR wp_user_id = ''`);
  
  console.log(`Found ${unsyncedUsers.length} users to push to WordPress`);
  
  for (const user of unsyncedUsers) {
    if (!user.email) {
      result.skipped++;
      result.details.push({ 
        email: "(no email)", 
        status: "skipped", 
        message: "No email address",
      });
      continue;
    }
    
    const pushResult = await pushUserToWordPress(user.id);
    
    if (pushResult.success) {
      result.success++;
      result.details.push({
        email: user.email,
        status: "success",
        message: pushResult.message,
      });
    } else if (pushResult.message.includes("already exists")) {
      result.skipped++;
      result.details.push({
        email: user.email,
        status: "skipped",
        message: pushResult.message,
      });
    } else {
      result.failed++;
      result.details.push({
        email: user.email,
        status: "failed",
        message: pushResult.message,
      });
    }
  }
  
  console.log(`Push to WordPress complete: ${result.success} success, ${result.failed} failed, ${result.skipped} skipped`);
  return result;
}

// ===== CLINIC SYNC: Sync clinics from WordPress including SignNow links =====

interface WPClinic {
  id: number;
  title: { rendered: string };
  slug: string;
  acf?: {
    signnow_member_link?: string;
    signnow_doctor_link?: string;
    signnow_template_id?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    phone?: string;
    email?: string;
    website?: string;
    practice_type?: string;
    onboarded_by?: string;
    on_map?: boolean;
    description?: string;
    logo_url?: string;
    wc_membership_product_id?: number;
    wc_doctor_product_id?: number;
  };
  meta?: {
    signnow_member_link?: string;
    signnow_doctor_link?: string;
    signnow_template_id?: string;
  };
}

export interface ClinicSyncResult {
  synced: number;
  updated: number;
  created: number;
  errors: string[];
}

// Sync clinics from WordPress - pulls SignNow links from ACF fields
export async function syncClinics(): Promise<ClinicSyncResult> {
  console.log("Syncing clinics from WordPress...");
  
  const result: ClinicSyncResult = {
    synced: 0,
    updated: 0,
    created: 0,
    errors: [],
  };
  
  const WP_USERNAME = process.env.WP_USERNAME || 'blake';
  const WP_PASSWORD = process.env.WP_PASSWORD || process.env.WP_APPLICATION_PASSWORD;
  
  if (!WP_PASSWORD) {
    console.log("WordPress password not configured, skipping clinic sync");
    result.errors.push("WordPress password not configured");
    return result;
  }
  
  const auth = Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString("base64");
  let page = 1;
  
  while (true) {
    try {
      // Try to fetch clinics as a custom post type
      // Common WordPress CPT endpoints: /wp/v2/clinics, /wp/v2/clinic, /acf/v3/clinics
      let wpClinics: WPClinic[] = [];
      
      // Try custom post type "clinic" or "clinics"
      for (const endpoint of ["clinics", "clinic"]) {
        try {
          const url = `${WP_SITE_URL}/wp-json/wp/v2/${endpoint}?per_page=100&page=${page}&_fields=id,title,slug,acf,meta`;
          const response = await fetch(url, {
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
            },
          });
          
          if (response.ok) {
            wpClinics = await response.json();
            if (wpClinics.length > 0) {
              console.log(`Found clinics via /wp/v2/${endpoint}`);
              break;
            }
          }
        } catch (e) {
          // Try next endpoint
        }
      }
      
      // If no custom post type, try ACF REST API directly
      if (wpClinics.length === 0 && page === 1) {
        console.log("No clinic custom post type found. Clinics may be stored differently in WordPress.");
        console.log("Will sync existing clinic records in database with any WP updates.");
        break;
      }
      
      if (wpClinics.length === 0) break;
      
      for (const wpClinic of wpClinics) {
        try {
          // Extract SignNow links from ACF or meta
          const signNowMemberLink = wpClinic.acf?.signnow_member_link || wpClinic.meta?.signnow_member_link || null;
          const signNowDoctorLink = wpClinic.acf?.signnow_doctor_link || wpClinic.meta?.signnow_doctor_link || null;
          const signNowTemplateId = wpClinic.acf?.signnow_template_id || wpClinic.meta?.signnow_template_id || null;
          
          // Check if clinic exists by wpClinicId
          const existingClinic = await db
            .select()
            .from(clinics)
            .where(eq(clinics.wpClinicId, wpClinic.id))
            .limit(1);
          
          const clinicData = {
            name: wpClinic.title?.rendered?.replace(/&#8211;/g, "-").replace(/&amp;/g, "&") || `Clinic ${wpClinic.id}`,
            slug: wpClinic.slug || null,
            signNowMemberLink: signNowMemberLink,
            signNowDoctorLink: signNowDoctorLink,
            signNowTemplateId: signNowTemplateId,
            address: wpClinic.acf?.address || null,
            city: wpClinic.acf?.city || null,
            state: wpClinic.acf?.state || null,
            zipCode: wpClinic.acf?.zip_code || null,
            phone: wpClinic.acf?.phone || null,
            email: wpClinic.acf?.email || null,
            website: wpClinic.acf?.website || null,
            practiceType: wpClinic.acf?.practice_type || null,
            onboardedBy: wpClinic.acf?.onboarded_by || null,
            onMap: wpClinic.acf?.on_map ?? false,
            description: wpClinic.acf?.description || null,
            logoUrl: wpClinic.acf?.logo_url || null,
            wcMembershipProductId: wpClinic.acf?.wc_membership_product_id || null,
            wcDoctorProductId: wpClinic.acf?.wc_doctor_product_id || null,
          };
          
          if (existingClinic.length > 0) {
            // Update existing clinic - only update SignNow fields if they're set in WP
            const updateData: Record<string, any> = { ...clinicData };
            
            // Don't overwrite SignNow links with null if they're already set locally
            if (!signNowMemberLink && existingClinic[0].signNowMemberLink) {
              delete updateData.signNowMemberLink;
            }
            if (!signNowDoctorLink && existingClinic[0].signNowDoctorLink) {
              delete updateData.signNowDoctorLink;
            }
            if (!signNowTemplateId && existingClinic[0].signNowTemplateId) {
              delete updateData.signNowTemplateId;
            }
            
            await db
              .update(clinics)
              .set(updateData)
              .where(eq(clinics.wpClinicId, wpClinic.id));
            
            result.updated++;
          } else {
            // Create new clinic
            await db.insert(clinics).values({
              wpClinicId: wpClinic.id,
              ...clinicData,
              signupUrl: `https://forgottenformula.com/member-signup-clinic?clinic_id=${wpClinic.id}`,
            });
            result.created++;
          }
          
          result.synced++;
        } catch (clinicError: any) {
          result.errors.push(`Clinic ${wpClinic.id}: ${clinicError.message}`);
        }
      }
      
      page++;
    } catch (error: any) {
      if (page > 1) {
        console.log(`Finished syncing clinics at page ${page}`);
        break;
      }
      result.errors.push(`Clinic sync error: ${error.message}`);
      break;
    }
  }
  
  console.log(`Clinic sync complete: ${result.synced} synced (${result.created} created, ${result.updated} updated)`);
  return result;
}

// Update a single clinic's SignNow links (for manual updates via Trustee dashboard)
export async function updateClinicSignNowLinks(
  clinicId: string,
  updates: { signNowMemberLink?: string; signNowDoctorLink?: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
    
    if (!clinic) {
      return { success: false, message: "Clinic not found" };
    }
    
    const updateData: Record<string, string | null> = {};
    if (updates.signNowMemberLink !== undefined) {
      updateData.signNowMemberLink = updates.signNowMemberLink || null;
    }
    if (updates.signNowDoctorLink !== undefined) {
      updateData.signNowDoctorLink = updates.signNowDoctorLink || null;
    }
    
    if (Object.keys(updateData).length === 0) {
      return { success: false, message: "No updates provided" };
    }
    
    await db.update(clinics).set(updateData).where(eq(clinics.id, clinicId));
    
    return { success: true, message: `Updated clinic ${clinic.name}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ===== PUSH FUNCTIONS: Push data back to WordPress/WooCommerce =====

export async function pushProductToWordPress(productId: string): Promise<{ success: boolean; message: string }> {
  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) {
    return { success: false, message: "Product not found" };
  }

  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    return { success: false, message: "WooCommerce API credentials not configured" };
  }

  const wcProductId = product.wcProductId;
  if (!wcProductId) {
    return { success: false, message: "Product has no WooCommerce ID - cannot push" };
  }

  const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");

  try {
    const response = await fetch(`${WP_SITE_URL}/wp-json/wc/v3/products/${wcProductId}`, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: product.name,
        regular_price: String(product.retailPrice || ""),
        sale_price: String(product.wholesalePrice || ""),
        description: product.description || "",
        short_description: product.shortDescription || "",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `WooCommerce API error: ${response.status} - ${errorText}` };
    }

    const wcData = await response.json() as any;
    const localData = { name: product.name, retailPrice: String(product.retailPrice), description: product.description };
    const remoteData = { name: wcData.name, retailPrice: wcData.regular_price, description: wcData.description };
    await updateSyncTracking("product", productId, String(wcProductId), "push", localData, remoteData);
    return { success: true, message: `Product "${product.name}" pushed to WooCommerce` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function pushAllProductsToWordPress(): Promise<{
  success: number;
  failed: number;
  skipped: number;
  details: Array<{ name: string; status: string; message: string }>;
}> {
  const result = {
    success: 0,
    failed: 0,
    skipped: 0,
    details: [] as Array<{ name: string; status: string; message: string }>,
  };

  const allProducts = await db.select().from(products);

  for (const product of allProducts) {
    if (!product.wcProductId) {
      result.skipped++;
      result.details.push({ name: product.name, status: "skipped", message: "No WooCommerce ID" });
      continue;
    }

    const pushResult = await pushProductToWordPress(product.id);
    if (pushResult.success) {
      result.success++;
      result.details.push({ name: product.name, status: "success", message: pushResult.message });
    } else {
      result.failed++;
      result.details.push({ name: product.name, status: "failed", message: pushResult.message });
    }
  }

  return result;
}

export async function pushClinicToWordPress(clinicId: string): Promise<{ success: boolean; message: string }> {
  const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId));
  if (!clinic) {
    return { success: false, message: "Clinic not found" };
  }

  const wpApiUrl = process.env.WP_API_URL || process.env.WORDPRESS_API_URL || "";
  const wpKey = process.env.WP_CONSUMER_KEY || process.env.WORDPRESS_CONSUMER_KEY || "";
  const wpSecret = process.env.WP_CONSUMER_SECRET || process.env.WORDPRESS_CONSUMER_SECRET || "";

  if (!wpApiUrl || !wpKey || !wpSecret) {
    return { success: false, message: "WordPress API credentials not configured" };
  }

  const auth = Buffer.from(`${wpKey}:${wpSecret}`).toString("base64");
  const clinicData = {
    title: clinic.name,
    content: clinic.description || "",
    status: clinic.isActive ? "publish" : "draft",
    meta: {
      clinic_address: clinic.address || "",
      clinic_city: clinic.city || "",
      clinic_state: clinic.state || "",
      clinic_zip: clinic.zipCode || "",
      clinic_phone: clinic.phone || "",
      clinic_email: clinic.email || "",
      clinic_doctor: clinic.doctorName || "",
      clinic_practice_type: clinic.practiceType || "",
    },
  };

  try {
    const wpClinicId = clinic.wpClinicId;
    const endpoint = wpClinicId
      ? `${wpApiUrl}/wp/v2/clinics/${wpClinicId}`
      : `${wpApiUrl}/wp/v2/clinics`;
    const method = wpClinicId ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify(clinicData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `WP API error: ${response.status} - ${errorText}` };
    }

    const wpData = await response.json() as any;
    if (!wpClinicId && wpData.id) {
      await db.update(clinics).set({ wpClinicId: wpData.id }).where(eq(clinics.id, clinicId));
    }

    const localData = { name: clinic.name, city: clinic.city, state: clinic.state, doctor: clinic.doctorName };
    await updateSyncTracking("clinic", clinicId, String(wpData.id || wpClinicId), "push", localData);
    return { success: true, message: `Clinic "${clinic.name}" pushed to WordPress` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function pushAllClinicsToWordPress(): Promise<{
  success: number;
  failed: number;
  skipped: number;
  details: Array<{ name: string; status: string; message: string }>;
}> {
  const result = {
    success: 0,
    failed: 0,
    skipped: 0,
    details: [] as Array<{ name: string; status: string; message: string }>,
  };

  const allClinics = await db.select().from(clinics).where(eq(clinics.isActive, true));

  for (const clinic of allClinics) {
    const pushResult = await pushClinicToWordPress(clinic.id);
    if (pushResult.success) {
      result.success++;
      result.details.push({ name: clinic.name, status: "success", message: pushResult.message });
    } else {
      result.failed++;
      result.details.push({ name: clinic.name, status: "failed", message: pushResult.message });
    }
  }

  return result;
}

export async function pushContentToWordPress(
  title: string,
  content: string,
  wpPostId?: number
): Promise<{ success: boolean; message: string; wpPostId?: number }> {
  const wpApiUrl = process.env.WP_API_URL || process.env.WORDPRESS_API_URL || "";
  const wpKey = process.env.WP_CONSUMER_KEY || process.env.WORDPRESS_CONSUMER_KEY || "";
  const wpSecret = process.env.WP_CONSUMER_SECRET || process.env.WORDPRESS_CONSUMER_SECRET || "";

  if (!wpApiUrl || !wpKey || !wpSecret) {
    return { success: false, message: "WordPress API credentials not configured" };
  }

  const auth = Buffer.from(`${wpKey}:${wpSecret}`).toString("base64");

  try {
    const endpoint = wpPostId
      ? `${wpApiUrl}/wp/v2/posts/${wpPostId}`
      : `${wpApiUrl}/wp/v2/posts`;
    const method = wpPostId ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, status: "publish" }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `WP API error: ${response.status} - ${errorText}` };
    }

    const wpData = await response.json() as any;
    const localData = { title, contentLength: content.length };
    await updateSyncTracking("content", String(wpData.id), String(wpData.id), "push", localData);
    return { success: true, message: `Content "${title}" pushed to WordPress`, wpPostId: wpData.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ===== SYNC TRACKING =====

async function updateSyncTracking(
  entityType: string,
  entityId: string,
  wpEntityId: string,
  direction: "pull" | "push",
  localData?: Record<string, any>,
  remoteData?: Record<string, any>
): Promise<void> {
  try {
    const { wpSyncTracking } = await import("@shared/schema");

    const existing = await db
      .select()
      .from(wpSyncTracking)
      .where(sql`entity_type = ${entityType} AND entity_id = ${entityId}`)
      .limit(1);

    const now = new Date();
    const localChecksum = localData ? computeChecksum(localData) : null;
    const remoteChecksum = remoteData ? computeChecksum(remoteData) : null;

    let isConflict = false;
    let conflictDetails: string | null = null;

    if (existing.length > 0 && localChecksum && remoteChecksum) {
      const prev = existing[0];
      if (prev.localChecksum && prev.remoteChecksum &&
          localChecksum !== prev.localChecksum && remoteChecksum !== prev.remoteChecksum &&
          localChecksum !== remoteChecksum) {
        isConflict = true;
        conflictDetails = JSON.stringify({
          reason: "Both local and remote data changed since last sync",
          localPrevChecksum: prev.localChecksum,
          localNewChecksum: localChecksum,
          remotePrevChecksum: prev.remoteChecksum,
          remoteNewChecksum: remoteChecksum,
          detectedAt: now.toISOString(),
        });
      }
    }

    if (existing.length > 0) {
      const updateData: Record<string, any> = {
        wpEntityId,
        updatedAt: now,
        syncDirection: direction,
      };
      if (direction === "pull") {
        updateData.lastPulledAt = now;
      } else {
        updateData.lastPushedAt = now;
      }
      if (localChecksum) updateData.localChecksum = localChecksum;
      if (remoteChecksum) updateData.remoteChecksum = remoteChecksum;

      if (isConflict) {
        updateData.isConflict = true;
        updateData.conflictDetails = conflictDetails;
      } else {
        updateData.isConflict = false;
        updateData.conflictDetails = null;
        updateData.resolvedAt = null;
      }

      await db
        .update(wpSyncTracking)
        .set(updateData)
        .where(eq(wpSyncTracking.id, existing[0].id));
    } else {
      await db.insert(wpSyncTracking).values({
        entityType,
        entityId,
        wpEntityId,
        syncDirection: direction,
        lastPulledAt: direction === "pull" ? now : null,
        lastPushedAt: direction === "push" ? now : null,
        localChecksum,
        remoteChecksum,
        isConflict,
        conflictDetails,
      });
    }
  } catch (error) {
    console.error("[SyncTracking] Error updating sync tracking:", error);
  }
}

export async function getSyncTrackingSummary(): Promise<{
  users: { lastPulled: string | null; lastPushed: string | null; conflicts: number; total: number };
  products: { lastPulled: string | null; lastPushed: string | null; conflicts: number; total: number };
  categories: { lastPulled: string | null; lastPushed: string | null; conflicts: number; total: number };
  clinics: { lastPulled: string | null; lastPushed: string | null; conflicts: number; total: number };
  content: { lastPulled: string | null; lastPushed: string | null; conflicts: number; total: number };
}> {
  const { wpSyncTracking } = await import("@shared/schema");

  const summaryForType = async (entityType: string) => {
    const records = await db
      .select()
      .from(wpSyncTracking)
      .where(eq(wpSyncTracking.entityType, entityType));

    const conflicts = records.filter(r => r.isConflict).length;
    const lastPulled = records
      .filter(r => r.lastPulledAt)
      .sort((a, b) => (b.lastPulledAt!.getTime() - a.lastPulledAt!.getTime()))[0]?.lastPulledAt;
    const lastPushed = records
      .filter(r => r.lastPushedAt)
      .sort((a, b) => (b.lastPushedAt!.getTime() - a.lastPushedAt!.getTime()))[0]?.lastPushedAt;

    return {
      lastPulled: lastPulled?.toISOString() || null,
      lastPushed: lastPushed?.toISOString() || null,
      conflicts,
      total: records.length,
    };
  };

  return {
    users: await summaryForType("user"),
    products: await summaryForType("product"),
    categories: await summaryForType("category"),
    clinics: await summaryForType("clinic"),
    content: await summaryForType("content"),
  };
}

export async function getSyncConflicts(): Promise<Array<{
  id: string;
  entityType: string;
  entityId: string | null;
  wpEntityId: string | null;
  conflictDetails: string | null;
  createdAt: Date | null;
}>> {
  const { wpSyncTracking } = await import("@shared/schema");

  return db
    .select()
    .from(wpSyncTracking)
    .where(eq(wpSyncTracking.isConflict, true));
}

export async function resolveConflict(trackingId: string, resolvedBy: string): Promise<{ success: boolean; message: string }> {
  const { wpSyncTracking } = await import("@shared/schema");

  const [record] = await db.select().from(wpSyncTracking).where(eq(wpSyncTracking.id, trackingId));
  if (!record) {
    return { success: false, message: "Sync tracking record not found" };
  }

  await db
    .update(wpSyncTracking)
    .set({
      isConflict: false,
      resolvedAt: new Date(),
      resolvedBy,
      updatedAt: new Date(),
    })
    .where(eq(wpSyncTracking.id, trackingId));

  return { success: true, message: "Conflict resolved" };
}

// ===== WEBHOOK HANDLER =====

export async function handleWordPressWebhook(
  topic: string,
  payload: any,
  signature?: string
): Promise<{ success: boolean; message: string; action?: string }> {
  console.log(`[WP Webhook] Received webhook: ${topic}`);

  try {
    switch (topic) {
      case "customer.created":
      case "customer.updated": {
        const wpUserId = payload.id;
        const email = payload.email;
        if (!email) {
          return { success: false, message: "No email in payload" };
        }

        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser.length > 0) {
          const localData = { email: existingUser[0].email, firstName: existingUser[0].firstName, lastName: existingUser[0].lastName };
          const remoteData = { email: payload.email, firstName: payload.first_name, lastName: payload.last_name };

          await db
            .update(users)
            .set({
              wpUserId: String(wpUserId),
              firstName: payload.first_name || existingUser[0].firstName,
              lastName: payload.last_name || existingUser[0].lastName,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser[0].id));

          await updateSyncTracking("user", existingUser[0].id, String(wpUserId), "pull", localData, remoteData);
          return { success: true, message: `Updated existing user ${email}`, action: "updated" };
        } else {
          return { success: true, message: `User ${email} not in local DB - will be included in next full sync pull`, action: "skipped" };
        }
      }

      case "product.created":
      case "product.updated": {
        const wcProductId = payload.id;
        if (!wcProductId) {
          return { success: false, message: "No product ID in payload" };
        }

        const existingProduct = await db
          .select()
          .from(products)
          .where(eq(products.wcProductId, wcProductId))
          .limit(1);

        if (existingProduct.length > 0) {
          const localData = { name: existingProduct[0].name, retailPrice: String(existingProduct[0].retailPrice), description: existingProduct[0].description };
          const remoteData = { name: payload.name, retailPrice: payload.regular_price, description: payload.description };

          await db
            .update(products)
            .set({
              name: payload.name || existingProduct[0].name,
              retailPrice: payload.regular_price || String(existingProduct[0].retailPrice),
              description: payload.description || existingProduct[0].description,
            })
            .where(eq(products.id, existingProduct[0].id));

          await updateSyncTracking("product", existingProduct[0].id, String(wcProductId), "pull", localData, remoteData);
          return { success: true, message: `Updated product ${payload.name}`, action: "updated" };
        }

        return { success: true, message: `Product ${wcProductId} not in local DB - will be included in next full sync pull`, action: "skipped" };
      }

      case "order.created":
      case "order.updated": {
        await updateSyncTracking("order", String(payload.id), String(payload.id), "pull");
        return { success: true, message: `Order webhook received - order ${payload.id}`, action: "logged" };
      }

      case "post.created":
      case "post.updated":
      case "post.published": {
        const postId = payload.id || payload.ID;
        const title = payload.title?.rendered || payload.post_title || payload.title || "";
        console.log(`[WP Webhook] Content update received: post ${postId} - "${title}"`);
        await updateSyncTracking("content", String(postId), String(postId), "pull",
          undefined,
          { id: postId, title, status: payload.status, modified: payload.modified }
        );
        return { success: true, message: `Content webhook received - post ${postId}: "${title}"`, action: "logged" };
      }

      default:
        console.log(`[WP Webhook] Unhandled topic: ${topic}`);
        return { success: true, message: `Unhandled topic: ${topic}`, action: "ignored" };
    }
  } catch (error: any) {
    console.error(`[WP Webhook] Error processing ${topic}:`, error);
    return { success: false, message: error.message };
  }
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const computed = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64");
    const computedBuf = Buffer.from(computed);
    const signatureBuf = Buffer.from(signature);
    if (computedBuf.length !== signatureBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(computedBuf, signatureBuf);
  } catch {
    return false;
  }
}

function computeChecksum(data: Record<string, any>): string {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}
