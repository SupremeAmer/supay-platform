export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  bscRpcUrl: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
  nftContractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!,
  nftAbi: process.env.NEXT_PUBLIC_NFT_ABI!,
  privateKey: process.env.PRIVATE_KEY!,
  platformWalletAddress: process.env.PLATFORM_WALLET_ADDRESS!,

  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY!,
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY!,
  paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET!,

  coinbaseWebhookSecret: process.env.COINBASE_WEBHOOK_SECRET!,
  adsterraApiKey: process.env.ADSTERRA_API_KEY!,
  jwtSecret: process.env.JWT_SECRET!,
}
