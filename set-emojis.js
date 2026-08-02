const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setEmojis() {
  const updates = [
    { name: '사이다', image_url: '🥤' },
    { name: '생수 500ml', image_url: '💧' },
  ];

  for (const item of updates) {
    const { data, error } = await supabase
      .from('menus')
      .update({ image_url: item.image_url })
      .eq('name', item.name)
      .select();

    if (error) {
      console.error(`Failed to update ${item.name}:`, error.message);
    } else {
      console.log(`Updated ${item.name}:`, data);
    }
  }
}

setEmojis();
