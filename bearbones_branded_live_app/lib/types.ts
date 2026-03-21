export const CATEGORIES = ['lenses', 'cameras', 'lighting', 'audio', 'grip', 'props', 'miscellaneous'] as const;
export const LOCATIONS = ['Office', 'Studio', 'On Set'] as const;
export const STATUSES = ['Available', 'Checked Out', 'Maintenance', 'Missing'] as const;
export const PACKAGE_STATUSES = ['Draft', 'Prepped', 'Checked Out', 'Returned'] as const;

export type Category = (typeof CATEGORIES)[number];
export type LocationType = (typeof LOCATIONS)[number];
export type GearStatus = (typeof STATUSES)[number];
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'owner' | 'crew';
  created_at: string;
}

export interface GearItem {
  id: string;
  name: string;
  category: Category;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  barcode: string | null;
  location: LocationType;
  status: GearStatus;
  notes: string | null;
  image_url: string | null;
  replacement_value: number | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface GearPackage {
  id: string;
  name: string;
  project_name: string | null;
  prep_date: string | null;
  notes: string | null;
  status: PackageStatus;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export interface PackageItem {
  id: string;
  package_id: string;
  gear_item_id: string;
  created_at: string;
}

export interface CheckoutRecord {
  id: string;
  gear_item_id: string;
  package_id: string | null;
  assignee_name: string | null;
  project_name: string | null;
  due_back: string | null;
  checked_out_at: string;
  returned_at: string | null;
  notes: string | null;
  owner_id: string;
}

export interface CheckoutWithGear extends CheckoutRecord {
  gear_items?: Pick<GearItem, 'id' | 'name' | 'category' | 'location' | 'status'> | null;
}

export interface PackageWithItems extends GearPackage {
  package_items?: Array<PackageItem & { gear_items?: GearItem | null }>;
}
