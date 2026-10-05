const env = (name: string, fallback = '') => process.env[name] ?? fallback

export const config = {
  appUrl: env('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),

  supabaseUrl: env('NEXT_PUBLIC_SUPABASE_URL', 'https://your-project.supabase.co'),
  supabaseAnonKey: env('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'your-anon-key'),
  supabaseServiceRoleKey: env('SUPABASE_SERVICE_ROLE_KEY', 'your-service-role-key'),

  bscRpcUrl: env('NEXT_PUBLIC_BSC_RPC_URL', 'https://bsc-dataseed.binance.org/'),
  nftContractAddress: env('NEXT_PUBLIC_NFT_CONTRACT_ADDRESS', '0x0000000000000000000000000000000000000000'),
  nftAbi: env('NEXT_PUBLIC_NFT_ABI', '[]'),
  privateKey: env('PRIVATE_KEY', '0x0000000000000000000000000000000000000000'),
  platformWalletAddress: env('PLATFORM_WALLET_ADDRESS', '0x0000000000000000000000000000000000000000'),

  paystackPublicKey: env('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY', 'pk_test_your_public_key'),
  paystackSecretKey: env('PAYSTACK_SECRET_KEY', 'sk_test_your_secret_key'),
  paystackWebhookSecret: env('PAYSTACK_WEBHOOK_SECRET', 'your-paystack-webhook-secret'),

  coinbaseWebhookSecret: env('COINBASE_WEBHOOK_SECRET', 'your-coinbase-webhook-secret'),
  adsterraApiKey: env('ADSTERRA_API_KEY', 'your-adsterra-api-key'),
  jwtSecret: env('JWT_SECRET', 'change-me-in-production'),
}
