import { supabase } from './supabaseClient';

export type ImageKind = 'avatar' | 'storefront' | 'listing';

export const uploadService = {
  async image(file: File, kind: ImageKind): Promise<{ url: string; path: string }> {
    try {
      const fileExt = file.name.split('.').pop() || 'webp';
      const fileName = `${kind}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('fashionhub-media')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('fashionhub-media')
        .getPublicUrl(filePath);

      return {
        url: publicUrlData.publicUrl,
        path: filePath
      };
    } catch (storageErr) {
      console.warn('Supabase storage upload restricted by RLS, falling back to local Base64 data URL:', storageErr);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            url: reader.result as string,
            path: file.name
          });
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }
  },

  async uploadFiles(files: FileList | File[]): Promise<Array<{ url: string; path: string }>> {
    const results = [];
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      const uploaded = await this.image(file, 'listing');
      results.push(uploaded);
    }
    return results;
  }
};
