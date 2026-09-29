import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许通过局域网 IP 访问 dev 服务器（手机/其他设备联调用）。
  // IP 变了记得同步更新；该配置只影响 npm run dev，不影响生产环境。
  allowedDevOrigins: ["192.168.1.136"],
};

export default nextConfig;
