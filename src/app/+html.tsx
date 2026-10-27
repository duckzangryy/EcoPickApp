import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Custom root HTML template for Expo Web
 * Cung cấp typography hiện đại, font Plus Jakarta Sans & Inter chất lượng cao,
 * hỗ trợ đầy đủ tiếng Việt không bị lỗi dấu/lệch font.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1, user-scalable=no" />
        <title>EcoPick — Ứng dụng Giám định & Thu gom Rác thải</title>

        {/* Expo ScrollView Reset */}
        <ScrollViewStyleReset />

        {/* Google Fonts: Plus Jakarta Sans & Inter (Hỗ trợ tiếng Việt tuyệt đối) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Global Web Typography Styles */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Reset and base font */
              html, body, #root, input, textarea, select, button {
                height: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
                font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
              }

              /* Áp dụng cho text thường, loại trừ icon fonts */
              [dir="auto"]:not([style*="Ionicons" i]):not([style*="ionicons" i]):not([style*="Material" i]):not([style*="FontAwesome" i]):not([style*="Feather" i]):not([style*="Entypo" i]):not([style*="Octicons" i]):not([style*="AntDesign" i]):not([style*="SimpleLineIcons" i]) {
                font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }

              /* Map các tên font expo sang Plus Jakarta Sans & Inter để chuẩn nét */
              @font-face {
                font-family: 'Inter_400Regular';
                font-style: normal;
                font-weight: 400;
                src: local('Plus Jakarta Sans Regular'), local('Inter Regular');
              }
              @font-face {
                font-family: 'Inter_500Medium';
                font-style: normal;
                font-weight: 500;
                src: local('Plus Jakarta Sans Medium'), local('Inter Medium');
              }
              @font-face {
                font-family: 'Inter_600SemiBold';
                font-style: normal;
                font-weight: 600;
                src: local('Plus Jakarta Sans SemiBold'), local('Inter SemiBold');
              }
              @font-face {
                font-family: 'Inter_700Bold';
                font-style: normal;
                font-weight: 700;
                src: local('Plus Jakarta Sans Bold'), local('Inter Bold');
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
