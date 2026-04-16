package test.demo.util;
import jakarta.servlet.http.HttpServletRequest;

public class IpUtil {
    public static String getClientIpAddress(HttpServletRequest request) {
        String ip = null;

        // 仅信任来自可信代理的头部（如有需要可配置代理IP白名单）
        ip = request.getHeader("X-Forwarded-For");
        if (ip != null && ip.length() != 0 && !"unknown".equalsIgnoreCase(ip)) {
            // 多级代理时取第一个IP
            ip = ip.split(",")[0].trim();
        } else {
            ip = request.getRemoteAddr();
        }

        // 校验IP格式，防止注入
        if (!isValidIp(ip)) {
            ip = "0.0.0.0";
        }
        return ip;
    }

    /**
     * 校验IP地址格式（IPv4）
     */
    private static boolean isValidIp(String ip) {
        if (ip == null) return false;
        // 简单正则校验IPv4
        return ip.matches("^(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)){3}$");
    }
}