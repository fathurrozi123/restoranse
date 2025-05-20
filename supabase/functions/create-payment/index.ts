import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface RequestPayload {
  order_id: string;
  amount: number;
  customer_name: string;
  items: OrderItem[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const { order_id, amount, customer_name, items } = await req.json() as RequestPayload;

    if (!order_id || !amount || !customer_name || !items) {
      throw new Error('Missing required parameters');
    }

    // Initialize Midtrans client
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    if (!midtransServerKey) {
      throw new Error('Midtrans server key not configured');
    }

    // Create basic auth for Midtrans
    const auth = btoa(`${midtransServerKey}:`);

    // Format items for Midtrans
    const formattedItems = items.map(item => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      name: item.name,
    }));

    // Create Midtrans payload
    const midtransPayload = {
      transaction_details: {
        order_id: `ORDER-${order_id}`,
        gross_amount: amount,
      },
      item_details: formattedItems,
      customer_details: {
        first_name: customer_name,
      },
      enabled_payments: [
        'credit_card',
        'gopay',
        'shopeepay',
        'bank_transfer'
      ],
      credit_card: {
        secure: true,
      },
    };

    // Call Midtrans API
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(midtransPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Midtrans API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Return the Midtrans snap token and redirect URL
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }
});