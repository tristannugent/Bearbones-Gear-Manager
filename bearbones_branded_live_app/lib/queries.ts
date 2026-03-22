import { supabase } from '@/lib/supabase';
import type { CheckoutRecord, CheckoutWithGear, GearItem, GearPackage, PackageItem, PackageWithItems, Profile } from '@/lib/types';

function assertClient() {
  if (!supabase) throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  return supabase;
}

export async function signIn(email: string, password: string) {
  const client = assertClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string, fullName: string) {
  const client = assertClient();
  const { error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
}

export async function signOut() {
  const client = assertClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const client = assertClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getProfile(userId: string) {
  const client = assertClient();
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).single<Profile>();
  if (error) throw error;
  return data;
}

export async function listGear(search?: string) {
  const client = assertClient();
  let query = client.from('gear_items').select('*').order('created_at', { ascending: false });
  if (search) query = query.ilike('name', `%${search}%`);
  const { data, error } = await query.returns<GearItem[]>();
  if (error) throw error;
  return data ?? [];
}

export async function upsertGear(payload: Partial<GearItem>) {
  const client = assertClient();

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in.');

  const { data, error } = await client
    .from('gear_items')
    .upsert({
      ...payload,
      owner_id: user.id,
    })
    .select()
    .single<GearItem>();

  if (error) throw error;
  return data;
}

export async function deleteGear(id: string) {
  const client = assertClient();
  const { error } = await client.from('gear_items').delete().eq('id', id);
  if (error) throw error;
}

export async function listPackages() {
  const client = assertClient();
  const { data, error } = await client
    .from('gear_packages')
    .select('*, package_items(*, gear_items(*))')
    .order('created_at', { ascending: false })
    .returns<PackageWithItems[]>();
  if (error) throw error;
  return data ?? [];
}

export async function upsertPackage(payload: Partial<GearPackage>) {
  const client = assertClient();

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in.');

  const { data, error } = await client
    .from('gear_packages')
    .upsert({
      ...payload,
      owner_id: user.id,
    })
    .select()
    .single<GearPackage>();

  if (error) throw error;
  return data;
}

export async function savePackageItems(packageId: string, gearItemIds: string[]) {
  const client = assertClient();
  const { error: deleteError } = await client.from('package_items').delete().eq('package_id', packageId);
  if (deleteError) throw deleteError;
  if (!gearItemIds.length) return;
  const rows = gearItemIds.map((gear_item_id) => ({ package_id: packageId, gear_item_id }));
  const { error } = await client.from('package_items').insert(rows satisfies Partial<PackageItem>[]);
  if (error) throw error;
}

export async function deletePackage(id: string) {
  const client = assertClient();
  const { error } = await client.from('gear_packages').delete().eq('id', id);
  if (error) throw error;
}

export async function listCheckouts() {
  const client = assertClient();
  const { data, error } = await client
    .from('checkouts')
    .select('*, gear_items(id, name, category, location, status)')
    .order('checked_out_at', { ascending: false })
    .returns<CheckoutWithGear[]>();
  if (error) throw error;
  return data ?? [];
}

export async function checkoutItems(params: {
  gearItemIds: string[];
  packageId?: string | null;
  assigneeName?: string | null;
  projectName?: string | null;
  dueBack?: string | null;
  notes?: string | null;
}) {
  const client = assertClient();
  const {
  data: { user },
  error: userError,
} = await client.auth.getUser();

if (userError) throw userError;
if (!user) throw new Error('You must be signed in.');

const rows = params.gearItemIds.map((gear_item_id) => ({
  owner_id: user.id,
  gear_item_id,
  package_id: params.packageId ?? null,
  assignee_name: params.assigneeName ?? null,
  project_name: params.projectName ?? null,
  due_back: params.dueBack ?? null,
  notes: params.notes ?? null,
}));
  const { error } = await client.from('checkouts').insert(rows satisfies Partial<CheckoutRecord>[]);
  if (error) throw error;
  const { error: gearError } = await client.from('gear_items').update({ status: 'Checked Out' }).in('id', params.gearItemIds);
  if (gearError) throw gearError;
  if (params.packageId) {
    const { error: packageError } = await client.from('gear_packages').update({ status: 'Checked Out' }).eq('id', params.packageId);
    if (packageError) throw packageError;
}
}
export async function returnCheckout(checkoutId: string, gearItemId: string, packageId?: string | null) {
  const client = assertClient();
  const { error } = await client.from('checkouts').update({ returned_at: new Date().toISOString() }).eq('id', checkoutId);
  if (error) throw error;
  const { error: gearError } = await client.from('gear_items').update({ status: 'Available' }).eq('id', gearItemId);
  if (gearError) throw gearError;
  if (packageId) {
    const { data: remaining, error: remainingError } = await client
      .from('checkouts')
      .select('id')
      .eq('package_id', packageId)
      .is('returned_at', null)
      .neq('id', checkoutId);
    if (remainingError) throw remainingError;
    if (!remaining?.length) {
      const { error: packageError } = await client.from('gear_packages').update({ status: 'Returned' }).eq('id', packageId);
      if (packageError) throw packageError;
    }
  }
}
