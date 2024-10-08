import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export async function uploadRecording(file: File): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(`recordings/${file.name}`, file);

    if (error) throw error;

    // Get the public URL of the uploaded recording
    const { data: publicData } = supabase.storage
      .from('recordings')
      .getPublicUrl(`recordings/${file.name}`);

    return publicData?.publicUrl || null;
  } catch (error) {
    console.error('Error uploading recording:', error);
    return null;
  }
}
